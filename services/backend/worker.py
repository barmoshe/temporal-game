import asyncio
import logging

from temporalio.client import Client
from temporalio.worker import Worker

from activities import check_game_state, validate_move
from workflows import GameRoomWorkflow


async def run_worker():
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # Connect to Temporal server
    client = await Client.connect("localhost:7233")
    
    # Run a worker for the workflows and activities
    logging.info("Starting Temporal worker")
    worker = Worker(
        client,
        task_queue="tic-tac-toe-task-queue",
        workflows=[GameRoomWorkflow],
        activities=[validate_move, check_game_state],
    )
    
    await worker.run()


if __name__ == "__main__":
    asyncio.run(run_worker()) 