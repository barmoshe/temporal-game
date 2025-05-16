import asyncio
import json
import uuid
from typing import Dict, List, Optional, Set

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from temporalio.client import Client
from temporalio.exceptions import ApplicationError

from activities import Board
from workflows import CreateRoomInput, GameRoomWorkflow, JoinRoomInput, MoveInput


app = FastAPI(title="Tic-Tac-Toe Game Server")

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active connections by room_id
active_connections: Dict[str, Set[WebSocket]] = {}

# Temporal client - will be initialized on startup
temporal_client = None


class CreateRoomRequest(BaseModel):
    player_id: Optional[str] = None


class JoinRoomRequest(BaseModel):
    player_id: Optional[str] = None


class MoveRequest(BaseModel):
    player_id: str
    x: int
    y: int


@app.on_event("startup")
async def startup_event():
    global temporal_client
    temporal_client = await Client.connect("localhost:7233")


@app.post("/rooms")
async def create_room(request: CreateRoomRequest):
    player_id = request.player_id or str(uuid.uuid4())
    
    # Generate a short room ID
    room_id = str(uuid.uuid4())[:8]
    
    # Start a new game workflow
    handle = await temporal_client.start_workflow(
        GameRoomWorkflow.run,
        CreateRoomInput(creator_id=player_id, room_id=room_id),
        id=f"tic-tac-toe-{room_id}",
        task_queue="tic-tac-toe-task-queue",
    )
    
    # Query to get the room ID
    state = await handle.query(GameRoomWorkflow.get_state)
    
    return {
        "room_id": room_id,
        "player_id": player_id,
        "state": {
            "board": [[cell for cell in row] for row in state.board.grid],
            "players": state.players,
            "current_turn": state.current_turn,
            "game_status": state.game_status,
            "winner": state.winner,
            "move_deadline": state.move_deadline
        }
    }


@app.post("/rooms/{room_id}/join")
async def join_room(room_id: str, request: JoinRoomRequest):
    player_id = request.player_id or str(uuid.uuid4())
    
    try:
        # Get workflow handle with correct syntax
        workflow_id = f"tic-tac-toe-{room_id}"
        print(f"Attempting to get workflow with ID: {workflow_id}")
        
        handle = temporal_client.get_workflow_handle(workflow_id)
        
        # Signal to join
        await handle.signal(GameRoomWorkflow.join_game, JoinRoomInput(room_id=room_id, player_id=player_id))
        
        # Give time for the workflow to process the join
        await asyncio.sleep(0.3)
        
        # Query game state
        state = await handle.query(GameRoomWorkflow.get_state)
        
        # Broadcast updated state to all connected clients in the room
        if room_id in active_connections:
            await broadcast_to_room(room_id, {
                "type": "state_update",
                "state": {
                    "board": [[cell for cell in row] for row in state.board.grid],
                    "players": state.players,
                    "current_turn": state.current_turn,
                    "game_status": state.game_status,
                    "winner": state.winner,
                    "move_deadline": state.move_deadline
                }
            })
        
        # Return details to client
        return {
            "room_id": room_id,
            "player_id": player_id,
            "state": {
                "board": [[cell for cell in row] for row in state.board.grid],
                "players": state.players,
                "current_turn": state.current_turn,
                "game_status": state.game_status,
                "winner": state.winner,
                "move_deadline": state.move_deadline
            }
        }
    except Exception as e:
        print(f"Error joining room {room_id}: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Room not found or full: {str(e)}")


@app.post("/rooms/{room_id}/move")
async def make_move(room_id: str, request: MoveRequest):
    try:
        # Get workflow handle
        handle = temporal_client.get_workflow_handle(f"tic-tac-toe-{room_id}")
        
        # Send move signal
        await handle.signal(
            GameRoomWorkflow.make_move, 
            MoveInput(room_id=room_id, player_id=request.player_id, x=request.x, y=request.y)
        )
        
        # Query updated game state
        state = await handle.query(GameRoomWorkflow.get_state)
        
        # Broadcast new game state to all connected clients
        if room_id in active_connections:
            await broadcast_to_room(room_id, {
                "type": "state_update",
                "state": {
                    "board": [[cell for cell in row] for row in state.board.grid],
                    "players": state.players,
                    "current_turn": state.current_turn,
                    "game_status": state.game_status,
                    "winner": state.winner,
                    "move_deadline": state.move_deadline
                }
            })
        
        return {
            "success": True,
            "state": {
                "board": [[cell for cell in row] for row in state.board.grid],
                "players": state.players,
                "current_turn": state.current_turn,
                "game_status": state.game_status,
                "winner": state.winner,
                "move_deadline": state.move_deadline
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid move: {str(e)}")


@app.get("/rooms/{room_id}/state")
async def get_state(room_id: str):
    try:
        # Get workflow handle
        handle = temporal_client.get_workflow_handle(f"tic-tac-toe-{room_id}")
        
        # Query game state
        state = await handle.query(GameRoomWorkflow.get_state)
        
        # Return state to client
        return {
            "room_id": room_id,
            "state": {
                "board": [[cell for cell in row] for row in state.board.grid],
                "players": state.players,
                "current_turn": state.current_turn,
                "game_status": state.game_status,
                "winner": state.winner,
                "move_deadline": state.move_deadline
            }
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Room not found: {str(e)}")


@app.websocket("/ws/rooms/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await websocket.accept()
    
    # Add connection to the room
    if room_id not in active_connections:
        active_connections[room_id] = set()
    active_connections[room_id].add(websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Process client message based on action type
            if message["action"] == "create":
                player_id = message.get("player_id", str(uuid.uuid4()))
                handle = await temporal_client.start_workflow(
                    GameRoomWorkflow.run,
                    CreateRoomInput(creator_id=player_id, room_id=room_id),
                    id=f"tic-tac-toe-{room_id}",
                    task_queue="tic-tac-toe-task-queue",
                )
                state = await handle.query(GameRoomWorkflow.get_state)
                await websocket.send_json({
                    "type": "room_created",
                    "room_id": room_id,
                    "player_id": player_id,
                    "state": {
                        "board": [[cell for cell in row] for row in state.board.grid],
                        "players": state.players,
                        "current_turn": state.current_turn,
                        "game_status": state.game_status,
                        "winner": state.winner,
                        "move_deadline": state.move_deadline
                    }
                })
            
            elif message["action"] == "join":
                player_id = message.get("player_id", str(uuid.uuid4()))
                try:
                    handle = temporal_client.get_workflow_handle(f"tic-tac-toe-{room_id}")
                    await handle.signal(
                        GameRoomWorkflow.join_game, 
                        JoinRoomInput(room_id=room_id, player_id=player_id)
                    )
                    
                    # Give the workflow a moment to process the join and update game state
                    await asyncio.sleep(0.5)
                    
                    # Query for updated state after player joined and game possibly became active
                    state = await handle.query(GameRoomWorkflow.get_state)
                    
                    # Broadcast player joined event
                    await broadcast_to_room(room_id, {
                        "type": "player_joined",
                        "player_id": player_id,
                        "state": {
                            "board": [[cell for cell in row] for row in state.board.grid],
                            "players": state.players,
                            "current_turn": state.current_turn,
                            "game_status": state.game_status,
                            "winner": state.winner,
                            "move_deadline": state.move_deadline
                        }
                    })
                    
                    # Send an additional state update with a slight delay to ensure all clients get updated
                    await asyncio.sleep(0.5)
                    
                    # Query again to get the absolute latest state
                    state = await handle.query(GameRoomWorkflow.get_state)
                    
                    # Send explicit state update to ensure everyone is in sync
                    await broadcast_to_room(room_id, {
                        "type": "state_update",
                        "state": {
                            "board": [[cell for cell in row] for row in state.board.grid],
                            "players": state.players,
                            "current_turn": state.current_turn,
                            "game_status": state.game_status,
                            "winner": state.winner,
                            "move_deadline": state.move_deadline
                        }
                    })
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Failed to join room: {str(e)}"
                    })
            
            elif message["action"] == "move":
                player_id = message["player_id"]
                x, y = message["x"], message["y"]
                try:
                    handle = temporal_client.get_workflow_handle(f"tic-tac-toe-{room_id}")
                    await handle.signal(
                        GameRoomWorkflow.make_move,
                        MoveInput(room_id=room_id, player_id=player_id, x=x, y=y)
                    )
                    state = await handle.query(GameRoomWorkflow.get_state)
                    await broadcast_to_room(room_id, {
                        "type": "move_made",
                        "player_id": player_id,
                        "x": x,
                        "y": y,
                        "state": {
                            "board": [[cell for cell in row] for row in state.board.grid],
                            "players": state.players,
                            "current_turn": state.current_turn,
                            "game_status": state.game_status,
                            "winner": state.winner,
                            "move_deadline": state.move_deadline
                        }
                    })
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Invalid move: {str(e)}"
                    })
            
            elif message["action"] == "get_state":
                try:
                    handle = temporal_client.get_workflow_handle(f"tic-tac-toe-{room_id}")
                    state = await handle.query(GameRoomWorkflow.get_state)
                    await websocket.send_json({
                        "type": "state_update",
                        "state": {
                            "board": [[cell for cell in row] for row in state.board.grid],
                            "players": state.players,
                            "current_turn": state.current_turn,
                            "game_status": state.game_status,
                            "winner": state.winner,
                            "move_deadline": state.move_deadline
                        }
                    })
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Failed to get state: {str(e)}"
                    })
    
    except WebSocketDisconnect:
        # Remove connection when client disconnects
        if room_id in active_connections:
            active_connections[room_id].remove(websocket)
            if not active_connections[room_id]:
                del active_connections[room_id]


async def broadcast_to_room(room_id: str, message: dict):
    """Send a message to all WebSocket connections in a room"""
    if room_id in active_connections:
        disconnected = set()
        for connection in active_connections[room_id]:
            try:
                await connection.send_json(message)
            except RuntimeError:  # Connection already closed
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            active_connections[room_id].remove(conn)
        if not active_connections[room_id]:
            del active_connections[room_id]


if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True) 