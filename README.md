# Real-Time Tic-Tac-Toe Game with Temporal

A full-stack real-time Tic-Tac-Toe game built with Python, Temporal, FastAPI, WebSockets and vanilla JavaScript.


https://github.com/user-attachments/assets/f179e6d1-2a11-4df8-9fc9-203d76703080


## Project Structure

```
├── services/backend
│   ├── server.py        # HTTP & WebSocket endpoints
│   ├── worker.py        # Temporal worker process
│   ├── workflows.py     # Room lifecycle & turn workflows
│   ├── activities.py    # Win/draw checks, validations
│   ├── tests/           # Unit tests
│   ├── requirements.txt # Dependencies
│   └── README.md        # Backend-specific docs
│
└── web/frontend
    ├── index.html       # Game UI
    ├── styles.css       # Styling
    └── app.js           # Client-side logic
```

## Features

- **Room Management**: Create or join game rooms with unique IDs
- **Real-Time Updates**: WebSocket-based communication for immediate feedback
- **Turn-Based Play**: Enforced turn order with 30-second move timer
- **Win Detection**: Automatic detection of wins and draws
- **Durable State**: Temporal workflows for fault-tolerance and state preservation
- **Responsive UI**: Works on desktop and mobile devices

## Prerequisites

1. Python 3.10 or higher
2. [Temporal Server](https://docs.temporal.io/dev-guide/typescript/foundations#run-a-development-server)

## Quick Start

1. **Start Temporal Server**:
   ```bash
   docker run --network host temporalio/temporal:latest server start-dev
   ```

2. **Set Up Backend**:
   ```bash
   cd services/backend
   pip install -r requirements.txt
   
   # Start the server and worker in separate terminals
   python server.py
   python worker.py
   ```

3. **Start Frontend**:
   ```bash
   cd web/frontend
   python3 -m http.server 8000
   ```

4. **Play the game**:
   Open your browser and navigate to `http://localhost:8000`

## How It Works

- Backend uses Temporal workflows for durable game state management
- FastAPI provides HTTP and WebSocket endpoints
- Frontend connects over WebSockets for real-time updates

## Testing

Run the backend tests:

```bash
cd services/backend
python -m unittest discover tests
```

## License

MIT 
