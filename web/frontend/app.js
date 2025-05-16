// Game state
const gameState = {
  roomId: null,
  playerId: null,
  playerMark: null,
  board: Array(3)
    .fill()
    .map(() => Array(3).fill(null)),
  currentTurn: null,
  gameStatus: "waiting",
  winner: null,
  moveDeadline: null,
  timerInterval: null,
};

// Backend API URL
const API_URL = "http://localhost:8000";

// DOM elements
const lobbyView = document.getElementById("lobby-view");
const gameView = document.getElementById("game-view");
const createRoomBtn = document.getElementById("create-room-btn");
const joinRoomBtn = document.getElementById("join-room-btn");
const autoMatchBtn = document.getElementById("auto-match-btn");
const roomIdInput = document.getElementById("room-id-input");
const lobbyMessage = document.getElementById("lobby-message");
const roomIdDisplay = document.getElementById("room-id-display");
const copyRoomIdBtn = document.getElementById("copy-room-id");
const gameStatus = document.getElementById("game-status");
const gameBoard = document.getElementById("game-board");
const playerMark = document.getElementById("player-mark");
const timer = document.getElementById("timer");
const timeLeft = document.getElementById("time-left");
const newGameBtn = document.getElementById("new-game-btn");
const backToLobbyBtn = document.getElementById("back-to-lobby-btn");
const boardCells = document.querySelectorAll(".board-cell");

// WebSocket connection
let socket = null;

// Initialize the game
function init() {
  // Attach event listeners
  createRoomBtn.addEventListener("click", createRoom);
  joinRoomBtn.addEventListener("click", joinRoom);
  autoMatchBtn.addEventListener("click", findQuickMatch);
  copyRoomIdBtn.addEventListener("click", copyRoomId);
  backToLobbyBtn.addEventListener("click", goToLobby);
  newGameBtn.addEventListener("click", createRoom);

  // Fix for input field focus issues
  roomIdInput.addEventListener("focus", function (e) {
    // Ensure the cursor is positioned at the end of any existing text
    const value = e.target.value;
    e.target.value = "";
    e.target.value = value;
  });

  // Add keypress event to submit on Enter key
  roomIdInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      joinRoom();
    }
  });

  // Add click listeners to board cells
  boardCells.forEach((cell) => {
    cell.addEventListener("click", () => {
      const x = parseInt(cell.getAttribute("data-x"));
      const y = parseInt(cell.getAttribute("data-y"));
      makeMove(x, y);
    });
  });

  // Add hover effects to cells for better UX
  boardCells.forEach((cell) => {
    cell.addEventListener("mouseenter", () => {
      if (
        gameState.gameStatus === "active" &&
        gameState.currentTurn === gameState.playerId &&
        !cell.classList.contains("x") &&
        !cell.classList.contains("o")
      ) {
        cell.style.opacity = "0.8";
        if (gameState.playerMark === "X") {
          cell.style.backgroundColor = "rgba(231, 76, 60, 0.2)";
        } else {
          cell.style.backgroundColor = "rgba(52, 152, 219, 0.2)";
        }
      }
    });

    cell.addEventListener("mouseleave", () => {
      cell.style.opacity = "1";
      if (
        !cell.classList.contains("x") &&
        !cell.classList.contains("o") &&
        !cell.classList.contains("highlight")
      ) {
        cell.style.backgroundColor = "";
      }
    });
  });
}

// Function to ensure state is in sync with server
function forceSyncGameState() {
  if (!gameState.roomId) return;

  // Fetch current state directly using REST API (more reliable than WebSocket)
  fetch(`${API_URL}/rooms/${gameState.roomId}/state`)
    .then((response) => response.json())
    .then((data) => {
      console.log("Forced state sync:", data.state);
      updateGameState(data.state);
      updateUI();
    })
    .catch((error) => {
      console.error("Error syncing state:", error);
    });
}

// Create a new room
function createRoom() {
  // Show loading state
  createRoomBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Creating...';
  createRoomBtn.disabled = true;

  // Generate random playerId if not exists
  if (!gameState.playerId) {
    gameState.playerId = generatePlayerId();
  }

  // Attempt to create a room using the API
  fetch(`${API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ player_id: gameState.playerId }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Reset button state
      createRoomBtn.innerHTML =
        '<i class="fas fa-plus-circle"></i> Create New Room';
      createRoomBtn.disabled = false;

      // Update game state
      gameState.roomId = data.room_id;
      gameState.playerId = data.player_id;

      // Connect to WebSocket for real-time updates
      connectToWebSocket(gameState.roomId);

      // Show game view
      showGameView();
      updateUI();

      // Set up periodic state syncs to catch any player joins
      const syncInterval = setInterval(() => {
        if (gameState.gameStatus === "active") {
          clearInterval(syncInterval);
        } else {
          forceSyncGameState();
        }
      }, 2000);

      // Auto-clear after 30 seconds in any case
      setTimeout(() => clearInterval(syncInterval), 30000);
    })
    .catch((error) => {
      console.error("Error creating room:", error);
      createRoomBtn.innerHTML =
        '<i class="fas fa-plus-circle"></i> Create New Room';
      createRoomBtn.disabled = false;
      lobbyMessage.textContent = "Failed to create room. Please try again.";

      // Add animation to error message
      lobbyMessage.style.animation = "none";
      setTimeout(() => {
        lobbyMessage.style.animation = "fadeIn 0.5s ease";
      }, 10);
    });
}

// Join an existing room
function joinRoom() {
  const roomIdToJoin = roomIdInput.value.trim();

  if (!roomIdToJoin) {
    lobbyMessage.textContent = "Please enter a valid Room ID";
    lobbyMessage.style.animation = "none";
    setTimeout(() => {
      lobbyMessage.style.animation = "fadeIn 0.5s ease";
    }, 10);

    // Add shake animation to the input
    roomIdInput.style.animation = "shake 0.5s ease";
    setTimeout(() => {
      roomIdInput.style.animation = "";
    }, 500);

    return;
  }

  // Show loading state
  joinRoomBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
  joinRoomBtn.disabled = true;

  // Generate random playerId if not exists
  if (!gameState.playerId) {
    gameState.playerId = generatePlayerId();
  }

  // Attempt to join the room
  fetch(`${API_URL}/rooms/${roomIdToJoin}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ player_id: gameState.playerId }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Room not found or full");
      }
      return response.json();
    })
    .then((data) => {
      // Reset button state
      joinRoomBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Join';
      joinRoomBtn.disabled = false;

      // Update game state
      gameState.roomId = data.room_id;
      gameState.playerId = data.player_id;

      // Get initial state from response
      console.log("Initial state after joining:", data.state);
      updateGameState(data.state);

      // Connect to WebSocket for real-time updates
      connectToWebSocket(gameState.roomId);

      // Show game view
      showGameView();
      updateUI();

      // Multiple sync attempts to ensure we get correct state
      setTimeout(forceSyncGameState, 500);
      setTimeout(forceSyncGameState, 1500);
      setTimeout(forceSyncGameState, 3000);
    })
    .catch((error) => {
      console.error("Error joining room:", error);
      joinRoomBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Join';
      joinRoomBtn.disabled = false;

      lobbyMessage.textContent =
        error.message || "Failed to join room. Please check the Room ID.";

      // Add animation to error message
      lobbyMessage.style.animation = "none";
      setTimeout(() => {
        lobbyMessage.style.animation = "fadeIn 0.5s ease";
      }, 10);

      // Add shake animation to the input
      roomIdInput.style.animation = "shake 0.5s ease";
      setTimeout(() => {
        roomIdInput.style.animation = "";
      }, 500);
    });
}

// Find a quick match (auto-join any available room or create one)
function findQuickMatch() {
  // Generate random playerId if not exists
  if (!gameState.playerId) {
    gameState.playerId = generatePlayerId();
  }

  // TODO: Implement matchmaking through the server
  // For now just create a room
  createRoom();
}

// Connect to the WebSocket for a specific room
function connectToWebSocket(roomId) {
  // Close existing connection if any
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }

  // Determine WebSocket URL
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//localhost:8000/ws/rooms/${roomId}`;

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log("WebSocket connection established");
    // Request latest state immediately after connection is established
    socket.send(JSON.stringify({ action: "get_state" }));
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log("WebSocket message received:", message);

    // Always process state updates immediately
    if (message.state) {
      console.log("State from message:", message.state);
      updateGameState(message.state);
      updateUI();
    }

    // Additional message type handling
    handleWebSocketMessage(message);
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
    clearInterval(gameState.timerInterval);

    // Try to reconnect in case of unexpected disconnection
    if (gameState.roomId && gameState.gameStatus !== "finished") {
      console.log("Attempting to reconnect...");
      setTimeout(() => connectToWebSocket(gameState.roomId), 2000);
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    gameStatus.textContent = "Connection error. Please try again.";
  };
}

// Handle incoming WebSocket messages
function handleWebSocketMessage(message) {
  console.log("Processing message:", message.type);

  switch (message.type) {
    case "room_created":
      // Room creation confirmed
      gameState.roomId = message.room_id;
      break;

    case "player_joined":
      // Another player joined the room
      console.log("Player joined event received");

      // Force immediate REST API state sync as well for reliability
      forceSyncGameState();
      break;

    case "move_made":
      // A player made a move
      break;

    case "state_update":
      // General state update
      console.log("State update event received");
      break;

    case "error":
      // Error message from server
      gameStatus.textContent = message.message;
      break;

    default:
      console.warn("Unknown message type:", message.type);
  }
}

// Make a move on the board
function makeMove(x, y) {
  // Verify it's player's turn and valid move
  if (
    gameState.gameStatus !== "active" ||
    gameState.currentTurn !== gameState.playerId ||
    gameState.board[y][x] !== null
  ) {
    // If invalid move, add subtle shake animation to the cell
    if (gameState.gameStatus === "active") {
      const cellElement = document.querySelector(
        `.board-cell[data-x="${x}"][data-y="${y}"]`
      );
      cellElement.style.animation = "shake 0.5s ease";
      setTimeout(() => {
        cellElement.style.animation = "";
      }, 500);
    }
    return;
  }

  // Send move to server
  fetch(`${API_URL}/rooms/${gameState.roomId}/move`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      player_id: gameState.playerId,
      x: x,
      y: y,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to make move");
      }
      return response.json();
    })
    .then((data) => {
      // Update game state from response
      updateGameState(data.state);
      updateUI();

      // Add click sound effect
      playSound("move");
    })
    .catch((error) => {
      console.error("Error making move:", error);
      // Show error feedback to user
      gameStatus.textContent = "Error: Failed to make move. Try again.";
      setTimeout(() => updateUI(), 2000);
    });
}

// Update the game state based on server data
function updateGameState(state) {
  // Update the board
  gameState.board = state.board;

  // Update player info
  gameState.players = state.players;
  if (gameState.playerId && state.players) {
    gameState.playerMark = state.players[gameState.playerId];
  }

  // Update game status and current turn
  gameState.gameStatus = state.game_status;
  gameState.currentTurn = state.current_turn;
  gameState.winner = state.winner;
  gameState.moveDeadline = state.move_deadline;

  // Update timer if needed
  updateTimer();
}

// Update the game UI based on current state
function updateUI() {
  // Update room ID display
  roomIdDisplay.textContent = gameState.roomId || "";

  // Update player mark display
  if (gameState.playerMark) {
    const markSymbol = gameState.playerMark === "X" ? "X" : "O";
    const markColor = gameState.playerMark === "X" ? "#e74c3c" : "#3498db";
    playerMark.innerHTML = `You are playing as <span style="color: ${markColor}; font-size: 24px;">${markSymbol}</span>`;
  } else {
    playerMark.textContent = "";
  }

  // Update game status text
  if (gameState.gameStatus === "waiting") {
    gameStatus.textContent = "Waiting for opponent...";
    gameStatus.className = "";
  } else if (gameState.gameStatus === "active") {
    if (gameState.currentTurn === gameState.playerId) {
      gameStatus.textContent = "Your turn";
      gameStatus.className = "your-turn";

      // Add subtle pulsing animation to the board
      gameBoard.style.animation = "pulse 2s infinite";
    } else {
      gameStatus.textContent = "Opponent's turn";
      gameStatus.className = "opponent-turn";

      // Remove pulsing animation
      gameBoard.style.animation = "";
    }
  } else if (gameState.gameStatus === "finished") {
    if (gameState.winner === gameState.playerId) {
      gameStatus.textContent = "You win!";
      gameStatus.className = "your-turn";
      playSound("win");
    } else if (gameState.winner === "draw") {
      gameStatus.textContent = "It's a draw!";
      gameStatus.className = "";
      playSound("draw");
    } else {
      gameStatus.textContent = "You lose!";
      gameStatus.className = "opponent-turn";
      playSound("lose");
    }

    // Show the play again button
    newGameBtn.classList.remove("hidden");
  }

  // Update the game board
  boardCells.forEach((cell) => {
    const x = parseInt(cell.getAttribute("data-x"));
    const y = parseInt(cell.getAttribute("data-y"));
    const cellValue = gameState.board[y][x];

    // Reset cell appearance
    cell.className = "board-cell";
    cell.style.backgroundColor = "";

    // Set cell value if any
    if (cellValue === "X") {
      cell.classList.add("x");
    } else if (cellValue === "O") {
      cell.classList.add("o");
    }

    // Highlight winning cells
    if (
      gameState.gameStatus === "finished" &&
      gameState.winningLine &&
      gameState.winningLine.some((coord) => coord[0] === x && coord[1] === y)
    ) {
      cell.classList.add("highlight");
    }
  });

  // Handle timer display
  if (
    gameState.gameStatus === "active" &&
    gameState.moveDeadline &&
    gameState.currentTurn === gameState.playerId
  ) {
    // Show timer
    timer.classList.remove("hidden");
    updateTimer();
  } else {
    // Hide timer
    timer.classList.add("hidden");
    // Clear timer interval
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
      gameState.timerInterval = null;
    }
  }
}

// Update the move timer
function updateTimer() {
  // Clear any existing timer
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }

  // Don't start a timer if it's not the player's turn or game is not active
  if (
    gameState.gameStatus !== "active" ||
    gameState.currentTurn !== gameState.playerId
  ) {
    return;
  }

  // Calculate time remaining (in seconds)
  if (gameState.moveDeadline) {
    const now = Math.floor(Date.now() / 1000);
    // Parse the ISO format deadline string to timestamp
    const deadlineDate = new Date(gameState.moveDeadline);
    const deadline = Math.floor(deadlineDate.getTime() / 1000);
    const remaining = isNaN(deadline) ? 30 : Math.max(0, deadline - now);

    // Update timer display
    timeLeft.textContent = remaining;

    // Start countdown
    gameState.timerInterval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, deadline - now);

      timeLeft.textContent = remaining;

      // Stop at 0
      if (remaining <= 0) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
      }
    }, 1000);
  }
}

// Switch to game view
function showGameView() {
  lobbyView.classList.add("hidden");
  gameView.classList.remove("hidden");
}

// Switch to lobby view
function goToLobby() {
  // Reset game state
  gameState.roomId = null;
  gameState.board = Array(3)
    .fill()
    .map(() => Array(3).fill(null));
  gameState.currentTurn = null;
  gameState.gameStatus = "waiting";
  gameState.winner = null;

  // Clear any timers
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }

  // Close WebSocket if open
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }

  // Switch views
  gameView.classList.add("hidden");
  lobbyView.classList.remove("hidden");

  // Clear UI elements
  roomIdInput.value = "";
  lobbyMessage.textContent = "";
  newGameBtn.classList.add("hidden");
}

// Copy room ID to clipboard
function copyRoomId() {
  if (!gameState.roomId) return;

  navigator.clipboard
    .writeText(gameState.roomId)
    .then(() => {
      const originalText = copyRoomIdBtn.textContent;
      copyRoomIdBtn.textContent = "Copied!";
      setTimeout(() => {
        copyRoomIdBtn.textContent = originalText;
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy room ID:", err);
    });
}

// Generate a random player ID
function generatePlayerId() {
  return "player-" + Math.random().toString(36).substring(2, 10);
}

// Play sound effects
function playSound(type) {
  // Simple beep sounds for now, could be replaced with actual audio files
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Set sound parameters based on type
    switch (type) {
      case "move":
        oscillator.type = "sine";
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.1;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 100);
        break;
      case "win":
        oscillator.type = "sine";
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        oscillator.start();
        setTimeout(() => {
          oscillator.frequency.value = 1000;
          setTimeout(() => {
            oscillator.frequency.value = 1200;
            setTimeout(() => oscillator.stop(), 150);
          }, 150);
        }, 150);
        break;
      case "lose":
        oscillator.type = "sine";
        oscillator.frequency.value = 300;
        gainNode.gain.value = 0.1;
        oscillator.start();
        setTimeout(() => {
          oscillator.frequency.value = 200;
          setTimeout(() => oscillator.stop(), 300);
        }, 300);
        break;
      case "draw":
        oscillator.type = "sine";
        oscillator.frequency.value = 400;
        gainNode.gain.value = 0.1;
        oscillator.start();
        setTimeout(() => {
          oscillator.frequency.value = 400;
          setTimeout(() => oscillator.stop(), 200);
        }, 200);
        break;
    }
  } catch (e) {
    console.log("Web Audio API not supported or user interaction required");
  }
}

// Add shake animation keyframes to the CSS
function addCssAnimations() {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-5px); }
      40%, 80% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(style);
}

// Initialize when the DOM is loaded
document.addEventListener("DOMContentLoaded", init);

// Initialize the game on page load
window.addEventListener("load", () => {
  init();
  addCssAnimations();
});
