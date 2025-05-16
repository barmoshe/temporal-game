import unittest
from datetime import timedelta
from unittest import mock
from uuid import uuid4

from temporalio.client import Client
from temporalio.common import RetryPolicy
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from activities import Board, CheckGameStateInput, CheckMoveInput, check_game_state, validate_move
from workflows import CreateRoomInput, GameRoomWorkflow, JoinRoomInput, MoveInput


class TestGameWorkflow(unittest.TestCase):
    """Test suite for the Tic-Tac-Toe game workflow"""

    @classmethod
    async def setUpClass(cls):
        """Set up the test environment once for all tests"""
        # Create and start the workflow environment
        cls.env = await WorkflowEnvironment.start_local()
        # Get workflow client
        cls.client = cls.env.client

    @classmethod
    async def tearDownClass(cls):
        """Tear down the test environment after all tests are done"""
        await cls.env.shutdown()

    async def setUp(self):
        """Set up test case - create a worker for each test"""
        self.worker = Worker(
            self.client,
            task_queue="test-task-queue",
            workflows=[GameRoomWorkflow],
            activities=[validate_move, check_game_state],
        )
        await self.worker.start()

    async def tearDown(self):
        """Tear down the test case - shut down the worker"""
        await self.worker.shutdown()

    async def test_create_room(self):
        """Test creating a new game room"""
        # Start the workflow
        creator_id = "player-123"
        result = await self.client.execute_workflow(
            GameRoomWorkflow.run,
            CreateRoomInput(creator_id=creator_id),
            id=f"test-workflow-{uuid4()}",
            task_queue="test-task-queue",
        )
        
        # Validate the result
        self.assertIn("room_id", result)
        self.assertIn("state", result)
        self.assertIn("players", result["state"])
        self.assertIn(creator_id, result["state"]["players"])
        self.assertEqual(result["state"]["players"][creator_id], "X")

    @mock.patch("workflows.validate_move")
    @mock.patch("workflows.check_game_state")
    async def test_game_flow(self, mock_check_game_state, mock_validate_move):
        """Test a complete game flow with mocked activities"""
        # Configure mocks
        mock_validate_move.return_value = True
        mock_check_game_state.side_effect = ["ongoing", "win"]
        
        # Start the workflow
        creator_id = "player-1"
        handle = await self.client.start_workflow(
            GameRoomWorkflow.run,
            CreateRoomInput(creator_id=creator_id),
            id=f"test-workflow-{uuid4()}",
            task_queue="test-task-queue",
        )
        
        # Let player 2 join
        joiner_id = "player-2"
        await handle.signal(GameRoomWorkflow.join_game, JoinRoomInput(room_id="test", player_id=joiner_id))
        
        # Query the state - game should be active now
        state = await handle.query(GameRoomWorkflow.get_state)
        self.assertEqual(state.game_status, "active")
        self.assertTrue(state.current_turn in [creator_id, joiner_id])
        
        # Make moves until completion
        current_player = state.current_turn
        
        # First move
        await handle.signal(
            GameRoomWorkflow.make_move, 
            MoveInput(room_id="test", player_id=current_player, x=0, y=0)
        )
        
        # Query state
        state = await handle.query(GameRoomWorkflow.get_state)
        self.assertEqual(state.game_status, "active")
        self.assertNotEqual(state.current_turn, current_player)  # Turn should have changed
        
        # Second player's move (winning move)
        second_player = state.current_turn
        await handle.signal(
            GameRoomWorkflow.make_move, 
            MoveInput(room_id="test", player_id=second_player, x=1, y=1)
        )
        
        # Query final state
        state = await handle.query(GameRoomWorkflow.get_state)
        self.assertEqual(state.game_status, "finished")
        self.assertEqual(state.winner, second_player)
        
        # Wait for workflow to complete
        result = await handle.result()
        self.assertEqual(result["final_result"], "win")

    async def test_invalid_moves(self):
        """Test handling of invalid moves"""
        # Mocking isn't necessary here since we're not testing the activities directly
        
        # Start the workflow
        creator_id = "player-1"
        handle = await self.client.start_workflow(
            GameRoomWorkflow.run,
            CreateRoomInput(creator_id=creator_id),
            id=f"test-workflow-{uuid4()}",
            task_queue="test-task-queue",
        )
        
        # Let player 2 join
        joiner_id = "player-2"
        await handle.signal(GameRoomWorkflow.join_game, JoinRoomInput(room_id="test", player_id=joiner_id))
        
        # Query the state to determine whose turn it is
        state = await handle.query(GameRoomWorkflow.get_state)
        current_player = state.current_turn
        other_player = creator_id if current_player == joiner_id else joiner_id
        
        # Try to make a move as the wrong player
        await handle.signal(
            GameRoomWorkflow.make_move, 
            MoveInput(room_id="test", player_id=other_player, x=0, y=0)
        )
        
        # State should be unchanged, still the same player's turn
        state_after = await handle.query(GameRoomWorkflow.get_state)
        self.assertEqual(state_after.current_turn, current_player)
        self.assertIsNone(state_after.board.grid[0][0])  # Move should not have been applied


if __name__ == "__main__":
    unittest.main() 