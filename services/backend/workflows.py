import asyncio
import uuid
from dataclasses import dataclass
from datetime import timedelta
from typing import Dict, List, Optional, Tuple

from temporalio import workflow
from temporalio.common import RetryPolicy

from activities import Board, CheckGameStateInput, CheckMoveInput, check_game_state, validate_move


@dataclass
class GameState:
    board: Board
    players: Dict[str, str]  # player_id -> mark (X or O)
    current_turn: Optional[str]  # player_id of whose turn it is
    game_status: str  # "waiting", "active", "finished"
    winner: Optional[str] = None  # player_id of winner, if any
    move_deadline: Optional[str] = None  # ISO format string of deadline time


@dataclass
class CreateRoomInput:
    creator_id: str
    room_id: str  # Add room_id to input parameters


@dataclass
class JoinRoomInput:
    room_id: str
    player_id: str


@dataclass
class MoveInput:
    room_id: str
    player_id: str
    x: int
    y: int


@workflow.defn
class GameRoomWorkflow:
    def __init__(self) -> None:
        self.room_id: str = ""
        self.state = GameState(
            board=Board.new_board(),
            players={},
            current_turn=None,
            game_status="waiting",
            move_deadline=None,
        )
        self._move_queue: asyncio.Queue = asyncio.Queue()
        self._player_joined: asyncio.Event = asyncio.Event()

    @workflow.run
    async def run(self, input: CreateRoomInput) -> Dict:
        """Creates and manages a game room"""
        self.room_id = input.room_id  # Use the room_id from input rather than generating it
        
        # Add creator as first player with mark 'X'
        creator_id = input.creator_id
        self.state.players[creator_id] = "X"
        workflow.logger.info(f"Room created: {self.room_id}, creator: {creator_id}")
        
        # Wait for second player to join
        if not self._player_joined.is_set():
            await self._player_joined.wait()
        
        # The game state (current_turn, game_status, move_deadline) is now set by the join_game signal
        workflow.logger.info(f"Game is now active, {self.state.current_turn}'s turn")
        
        # Main game loop
        while self.state.game_status == "active":
            try:
                # Wait for a move with timeout
                move = await workflow.wait_condition(
                    lambda: not self._move_queue.empty(),
                    timeout=30,
                )
                
                # Process the move from queue
                if not self._move_queue.empty():
                    await self._process_move()
                
            except asyncio.TimeoutError:
                # Player took too long, they lose
                current_player_id = self.state.current_turn
                opponent_id = next(pid for pid in self.state.players if pid != current_player_id)
                self.state.winner = opponent_id
                self.state.game_status = "finished"
                workflow.logger.info(f"Player {current_player_id} timed out, {opponent_id} wins")
        
        # Return final game state
        return {
            "room_id": self.room_id,
            "state": self.state,
            "final_result": "win" if self.state.winner else "draw"
        }

    async def _process_move(self) -> None:
        move: MoveInput = await self._move_queue.get()
        player_id = move.player_id
        x, y = move.x, move.y
        
        # Check if it's this player's turn
        if player_id != self.state.current_turn:
            workflow.logger.info(f"Invalid move: not player's turn. Player: {player_id}")
            return
        
        # Validate move with activity
        is_valid = await workflow.execute_activity(
            validate_move,
            CheckMoveInput(
                board=self.state.board,
                player=self.state.players[player_id],
                x=x, 
                y=y
            ),
            start_to_close_timeout=timedelta(seconds=5),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )
        
        if not is_valid:
            workflow.logger.info(f"Invalid move: {x},{y} by {player_id}")
            return
            
        # Update board
        self.state.board.grid[y][x] = self.state.players[player_id]
        
        # Check game state with activity
        game_state = await workflow.execute_activity(
            check_game_state,
            CheckGameStateInput(
                board=self.state.board,
                last_move_x=x,
                last_move_y=y,
                last_move_player=self.state.players[player_id]
            ),
            start_to_close_timeout=timedelta(seconds=5),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )
        
        # Update game state based on result
        if game_state == "win":
            self.state.game_status = "finished"
            self.state.winner = player_id
            workflow.logger.info(f"Player {player_id} wins!")
        elif game_state == "draw":
            self.state.game_status = "finished"
            workflow.logger.info("Game ended in a draw")
        else:
            # Switch turns
            other_player = next(pid for pid in self.state.players if pid != player_id)
            self.state.current_turn = other_player
            deadline_time = workflow.now() + timedelta(seconds=30)
            self.state.move_deadline = deadline_time.isoformat()  # 30 second deadline
            workflow.logger.info(f"Turn changed to {other_player}")

    @workflow.signal
    async def join_game(self, input: JoinRoomInput) -> None:
        """Signal to join a game room"""
        if len(self.state.players) >= 2 or input.player_id in self.state.players:
            workflow.logger.info(f"Join rejected: room full or player already joined. Player: {input.player_id}")
            return
            
        self.state.players[input.player_id] = "O"  # Second player is O
        workflow.logger.info(f"Player {input.player_id} joined room {self.room_id}")
        
        # Immediately update game state to active and set the first player's turn
        creator_id = next(pid for pid in self.state.players if self.state.players[pid] == "X")
        self.state.current_turn = creator_id
        self.state.game_status = "active"
        deadline_time = workflow.now() + timedelta(seconds=30)
        self.state.move_deadline = deadline_time.isoformat()
        
        # Signal that player has joined
        self._player_joined.set()

    @workflow.signal
    async def make_move(self, input: MoveInput) -> None:
        """Signal to make a move in the game"""
        await self._move_queue.put(input)

    @workflow.query
    def get_state(self) -> GameState:
        """Query the current game state"""
        return self.state 