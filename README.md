# Multiplayer Tic-Tac-Toe with Temporal Workflows

A multiplayer Tic-Tac-Toe game implementation using Temporal for state management and synchronization across devices. Inspired by the [4-hour multiplayer game challenge](https://youtu.be/ftYmXoH0V5I).

[![Tic-Tac-Toe Gameplay](https://github.com/user-attachments/assets/f179e6d1-2a11-4df8-9fc9-203d76703080)](https://github.com/user-attachments/assets/f179e6d1-2a11-4df8-9fc9-203d76703080)

## Features

*   Room-based multiplayer gameplay
*   Real-time updates via WebSockets
*   30-second move timer
*   Automatic win/draw detection
*   State persistence with Temporal workflows

## Setup Requirements

*   Python 3.10+
*   Temporal Server

## Quick Start

1.  **Start Temporal Server**:
    ```bash
    temporal server start-dev --db-filename your_temporal.db --ui-port 8080
    ```

2.  **Run Backend**:
    ```bash
    cd services/backend
    pip install -r requirements.txt 
    python server.py
    ```
    
    In a separate terminal:
    ```bash
    cd services/backend
    python worker.py
    ```

3.  **Start Frontend**:
    ```bash
    cd web/frontend
    python3 -m http.server 8000
    ```

4.  **Play**:
    - Open `http://localhost:8000` in your browser
    - Create a game room and share the ID
    - Second player joins using the room ID

## Technical Overview

The application uses Temporal workflows to manage game state and ensure consistency across player sessions. WebSocket connections provide real-time updates between the backend and frontend clients.

## License

MIT License

---

*Inspired by the "Build a multiplayer game in 4 hours" challenge: [https://youtu.be/ftYmXoH0V5I](https://youtu.be/ftYmXoH0V5I)* 