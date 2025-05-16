# Tic-Tac-Toe Game Backend

This backend implements a real-time Tic-Tac-Toe game using Python, FastAPI, WebSockets, and Temporal for durable workflow orchestration.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Start a local Temporal server (if not already running):
```bash
# Using Docker
docker run --network host temporalio/temporal:latest server start-dev
```

3. Run the backend services:
```bash
# In one terminal
python3 server.py

# In another terminal
python3 worker.py
```

The server will be available at:
- HTTP API: http://localhost:8000
- WebSocket: ws://localhost:8000/ws/rooms/{room_id}

## API Endpoints

### Create a new room
```
POST /rooms
```
Request:
```json
{
  "player_id": "optional-player-id"  // If not provided, a UUID will be generated
}
```
Response:
```json
{
  "room_id": "abc123",
  "player_id": "player-id",
  "state": {
    "board": [[null, null, null], [null, null, null], [null, null, null]],
    "players": {"player-id": "X"},
    "current_turn": null,
    "game_status": "waiting",
    "winner": null,
    "move_deadline": null
  }
}
```

### Join a room
```
POST /rooms/{room_id}/join
```
Request:
```json
{
  "player_id": "optional-player-id"  // If not provided, a UUID will be generated
}
```
Response:
```json
{
  "room_id": "abc123",
  "player_id": "player-id-2",
  "state": {
    "board": [[null, null, null], [null, null, null], [null, null, null]],
    "players": {"player-id-1": "X", "player-id-2": "O"},
    "current_turn": "player-id-1",
    "game_status": "active",
    "winner": null,
    "move_deadline": 1621234567
  }
}
```

### Make a move
```
POST /rooms/{room_id}/move
```
Request:
```json
{
  "player_id": "player-id",
  "x": 0,
  "y": 0
}
```
Response:
```json
{
  "success": true,
  "state": {
    "board": [["X", null, null], [null, null, null], [null, null, null]],
    "players": {"player-id-1": "X", "player-id-2": "O"},
    "current_turn": "player-id-2",
    "game_status": "active",
    "winner": null,
    "move_deadline": 1621234567
  }
}
```

### Get current game state
```
GET /rooms/{room_id}/state
```
Response:
```json
{
  "room_id": "abc123",
  "state": {
    "board": [["X", null, null], [null, null, null], [null, null, null]],
    "players": {"player-id-1": "X", "player-id-2": "O"},
    "current_turn": "player-id-2",
    "game_status": "active",
    "winner": null,
    "move_deadline": 1621234567
  }
}
```

## WebSocket Protocol

Connect to `ws://localhost:8000/ws/rooms/{room_id}`

### Client messages

Create a room:
```json
{
  "action": "create",
  "player_id": "optional-player-id"
}
```

Join a room:
```json
{
  "action": "join",
  "player_id": "optional-player-id"
}
```

Make a move:
```json
{
  "action": "move",
  "player_id": "player-id",
  "x": 0,
  "y": 0
}
```

Get current state:
```json
{
  "action": "get_state"
}
```

### Server messages

Room created:
```json
{
  "type": "room_created",
  "room_id": "abc123",
  "player_id": "player-id",
  "state": { ... }
}
```

Player joined:
```json
{
  "type": "player_joined",
  "player_id": "player-id-2",
  "state": { ... }
}
```

Move made:
```json
{
  "type": "move_made",
  "player_id": "player-id",
  "x": 0,
  "y": 0,
  "state": { ... }
}
```

State update:
```json
{
  "type": "state_update",
  "state": { ... }
}
```

Error:
```json
{
  "type": "error",
  "message": "Error message"
}
``` 