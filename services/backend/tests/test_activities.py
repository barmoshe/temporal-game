import unittest
from activities import Board, CheckMoveInput, CheckGameStateInput, validate_move, check_game_state


class TestActivities(unittest.TestCase):
    """Test suite for Tic-Tac-Toe activities"""
    
    async def test_validate_move(self):
        """Test that move validation works correctly"""
        # Create an empty board
        board = Board.new_board()
        
        # Test valid move
        result = await validate_move(CheckMoveInput(board=board, player="X", x=0, y=0))
        self.assertTrue(result)
        
        # Make a move and test that the cell is no longer valid
        board.grid[0][0] = "X"
        result = await validate_move(CheckMoveInput(board=board, player="O", x=0, y=0))
        self.assertFalse(result)
        
        # Test out of bounds move
        result = await validate_move(CheckMoveInput(board=board, player="X", x=3, y=3))
        self.assertFalse(result)
    
    async def test_check_game_state_rows(self):
        """Test winning by completing a row"""
        board = Board.new_board()
        
        # Set up a winning row for X
        board.grid[0][0] = "X"
        board.grid[0][1] = "X"
        board.grid[0][2] = "X"
        
        result = await check_game_state(CheckGameStateInput(
            board=board, 
            last_move_x=2, 
            last_move_y=0, 
            last_move_player="X"
        ))
        
        self.assertEqual(result, "win")
    
    async def test_check_game_state_columns(self):
        """Test winning by completing a column"""
        board = Board.new_board()
        
        # Set up a winning column for O
        board.grid[0][1] = "O"
        board.grid[1][1] = "O"
        board.grid[2][1] = "O"
        
        result = await check_game_state(CheckGameStateInput(
            board=board, 
            last_move_x=1, 
            last_move_y=2, 
            last_move_player="O"
        ))
        
        self.assertEqual(result, "win")
    
    async def test_check_game_state_diagonal(self):
        """Test winning by completing a diagonal"""
        board = Board.new_board()
        
        # Set up a winning diagonal for X
        board.grid[0][0] = "X"
        board.grid[1][1] = "X"
        board.grid[2][2] = "X"
        
        result = await check_game_state(CheckGameStateInput(
            board=board, 
            last_move_x=2, 
            last_move_y=2, 
            last_move_player="X"
        ))
        
        self.assertEqual(result, "win")
    
    async def test_check_game_state_draw(self):
        """Test detecting a draw"""
        board = Board.new_board()
        
        # Set up a board with a draw
        board.grid[0] = ["X", "O", "X"]
        board.grid[1] = ["O", "X", "X"]
        board.grid[2] = ["O", "X", "O"]
        
        result = await check_game_state(CheckGameStateInput(
            board=board, 
            last_move_x=2, 
            last_move_y=1, 
            last_move_player="X"
        ))
        
        self.assertEqual(result, "draw")
    
    async def test_check_game_state_ongoing(self):
        """Test detecting an ongoing game"""
        board = Board.new_board()
        
        # Make some moves but no win yet
        board.grid[0][0] = "X"
        board.grid[1][1] = "O"
        
        result = await check_game_state(CheckGameStateInput(
            board=board, 
            last_move_x=1, 
            last_move_y=1, 
            last_move_player="O"
        ))
        
        self.assertEqual(result, "ongoing")


if __name__ == "__main__":
    unittest.main() 