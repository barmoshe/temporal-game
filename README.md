# Tic-Tac-Toe Reimagined with Temporal

A real-time multiplayer Tic-Tac-Toe game inspired by [this YouTube video](https://youtu.be/ftYmXoH0V5I) sponsored by Temporal.

![Tic-Tac-Toe Game](https://img.shields.io/badge/Game-Tic--Tac--Toe-blue)
![Temporal](https://img.shields.io/badge/Powered%20by-Temporal-orange)

## ✨ What's This All About?

Ever wondered how to build real-time games that don't fall apart when things go wrong? That's where Temporal comes in! This project shows how Temporal's durable execution can make even a simple game like Tic-Tac-Toe more robust.

After watching the [Temporal-sponsored YouTube video](https://youtu.be/ftYmXoH0V5I), I was inspired to build this game that demonstrates how Temporal can handle:

- Managing game state across server restarts
- Coordinating turns between players
- Handling timeouts when players take too long
- All while keeping the gameplay smooth!

## 🎮 Game Features

- **Create or Join Rooms**: Play with friends by sharing a room code
- **Quick Match**: Get paired with a random opponent
- **Timed Turns**: 30 seconds per move to keep things exciting
- **Responsive Design**: Play on any device
- **Real-Time Updates**: See your opponent's moves instantly

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Temporal Server

### Quick Setup

1. **Start Temporal Server**
   ```
   temporal server start-dev --db-filename your_temporal.db --ui-port 8080
   ```

2. **Launch the Backend**
   ```
   cd services/backend
   pip install -r requirements.txt
   python server.py
   ```

3. **In another terminal, start the Temporal Worker**
   ```
   cd services/backend
   python worker.py
   ```

4. **Serve the Frontend**
   ```
   cd web/frontend
   python3 -m http.server 8000
   ```

5. **Play!** Open your browser to http://localhost:8000

## 🏗️ How It's Built

The magic happens through a combination of:

- **Frontend**: Simple HTML, CSS and JavaScript
- **Backend**: Python FastAPI for HTTP and WebSocket endpoints
- **Temporal**: For durable game state management and workflow orchestration

Temporal ensures that even if your server crashes mid-game, the game state is preserved and players can continue right where they left off!

## 🔮 Why Temporal?

Traditional game backends need complex database setups and error-handling logic. With Temporal, the workflow engine handles the hard parts:

- **State Management**: No need for constant database writes
- **Error Handling**: Automatic retries and recovery
- **Timer Management**: Easy implementation of turn timeouts
- **Code Organization**: Clean separation of game logic

## 🤝 Contribute

Feel free to fork this project and add your own features! Some ideas:
- Game statistics
- Customizable player profiles
- More game modes

## 📝 License

MIT 