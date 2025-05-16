from dataclasses import dataclass
from typing import List, Optional

from temporalio import activity


@dataclass
class Board:
    grid: List[List[Optional[str]]]
    
    @classmethod
    def new_board(cls) -> "Board":
        return cls(grid=[[None for _ in range(3)] for _ in range(3)])
    
    def is_valid_move(self, x: int, y: int) -> bool:
        """Check if a move is valid (within bounds and on an empty cell)."""
        if not (0 <= x < 3 and 0 <= y < 3):
            return False
        return self.grid[y][x] is None


@dataclass
class CheckMoveInput:
    board: Board
    player: str
    x: int
    y: int


@dataclass
class CheckGameStateInput:
    board: Board
    last_move_x: int
    last_move_y: int
    last_move_player: str


@activity.defn
async def validate_move(input: CheckMoveInput) -> bool:
    """Validates if a move is legal."""
    activity.logger.info(f"Validating move: player={input.player}, x={input.x}, y={input.y}")
    return input.board.is_valid_move(input.x, input.y)


@activity.defn
async def check_game_state(input: CheckGameStateInput) -> str:
    """
    Check if the game has reached a terminal state after the last move.
    Returns: "ongoing", "win", or "draw"
    """
    board = input.board.grid
    x, y = input.last_move_x, input.last_move_y
    player = input.last_move_player
    
    activity.logger.info(f"Checking game state after move: player={player}, x={x}, y={y}")
    
    # Check row
    if all(board[y][col] == player for col in range(3)):
        return "win"
    
    # Check column
    if all(board[row][x] == player for row in range(3)):
        return "win"
    
    # Check diagonals
    if x == y and all(board[i][i] == player for i in range(3)):
        return "win"
    
    if x + y == 2 and all(board[i][2-i] == player for i in range(3)):
        return "win"
    
    # Check for draw (board is full)
    if all(board[row][col] is not None for row in range(3) for col in range(3)):
        return "draw"
    
    return "ongoing" 