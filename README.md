# Cooking Frenzy

A multi-device cooking game built with Temporal workflows as part of the Web Dev Challenge!

![Cooking Frenzy Game](frontend/src/assets/logo.png)

## 🎮 Game Description

**Cooking Frenzy** is a fast-paced rhythm-based cooking game where players must complete recipe steps in sequence before time runs out. Each recipe has different steps that must be completed by pressing the corresponding key at the right time.

The game can be played across multiple devices:
- One device can display the main game board/kitchen
- Other devices can join as players to perform cooking actions

### Game Features

- **Multi-device gameplay** - Play together on different devices
- **Beautiful, Modern UI** with smooth animations and transitions
- **Multiple Recipe Options** with varying difficulty levels
- **Combo System** for consecutive successful actions
- **Sound Effects** for immersive gameplay
- **Score and Performance Summary** after each round

## 🧠 Project Inspiration

This project was created as part of the Web Dev Challenge, inspired by [this YouTube video](https://www.youtube.com/watch?v=ftYmXoH0V5I) where developers had 30 minutes to plan and 4 hours to build a multi-device game using Temporal.

The challenge requirements were:
- Build a game that's played on at least 2 devices
- Use Temporal's workflow tools to manage sending information between devices

## 🛠️ Technical Implementation

The game is built using:

- **Frontend**: React with Framer Motion for animations, Tailwind CSS for styling
- **Backend**: Node.js with Express and Socket.io for real-time communication
- **Workflow Engine**: Temporal for reliable game progression, state management, and timing

### How Temporal is Used

This game leverages Temporal workflows to:
- Manage game state and progression across multiple devices
- Handle timing for recipe steps with different difficulty levels
- Ensure reliability even if components fail or players disconnect
- Orchestrate the game's business logic

The main workflow components:
- **Worker**: Processes tasks from the "cooking-queue"
- **Workflows**: Define the game logic and recipe progression
- **Activities**: Execute individual game actions like validating steps and finishing orders
- **Signals**: Allow real-time communication between the game and workflow

## 📋 Prerequisites

Before running the game, ensure you have the following installed:
- Node.js (v14 or higher)
- npm (v6 or higher)
- Temporal CLI (for running the Temporal server)

## 🚀 Running the Game

### 1. Start the Temporal Server

```bash
temporal server start-dev --db-filename your_temporal.db --ui-port 8080
```

This will start the Temporal server with:
- Server endpoint: localhost:7233
- Web UI: http://localhost:8080
- Metrics: http://localhost:52331/metrics

### 2. Start the Backend Server

```bash
cd backend
npm install
npm run start:server
```

### 3. Start the Temporal Worker

In a separate terminal:
```bash
cd backend
npm run start:worker
```

### 4. Start the Frontend

In a third terminal:
```bash
cd frontend
npm install
npm start
```

### 5. Play the Game

Open your browser to `http://localhost:3000` to play!

For multi-device gameplay:
1. Open the game on one device to act as the main display
2. Other players can join by opening the game on their devices and entering the game code

## 🎮 How to Play

1. Press Enter on the splash screen to start
2. Select a recipe to cook
3. When a step appears, press the corresponding key (first letter of the step)
4. Complete all steps before time runs out!

### Game Controls

- **C**: Chop
- **S**: Stir
- **P**: Plate
- And more, depending on the recipe!

## 🧪 Project Structure

```
cooking-frenzy/
├── backend/
│   ├── activities/     # Temporal activities
│   ├── workflows/      # Temporal workflows
│   ├── server.ts       # Express server with Socket.io
│   └── worker.ts       # Temporal worker
└── frontend/
    ├── public/
    └── src/
        ├── components/ # React components
        ├── contexts/   # React contexts
        ├── hooks/      # Custom React hooks
        ├── pages/      # Page components
        └── utils/      # Utility functions
```

## 📚 Learning Resources

If you're interested in learning more about Temporal, check out these resources:

- [Getting Started with Temporal](https://learn.temporal.io/getting_started/)
- [Message Passing Documentation](https://docs.temporal.io/develop/typescript/message-passing)
- [Interacting with Temporal Workflows](https://learn.temporal.io/courses/interactive_workflows/)
- [Temporal's Code Exchange](https://temporal.io/code-exchange)

## 🙏 Acknowledgements

This project was built as part of the Web Dev Challenge inspired by the [YouTube video](https://www.youtube.com/watch?v=ftYmXoH0V5I) featuring Adam Argyle, Lane Wagner, Sarah Shook, Nikki Meyers, Shashi Lo, and Nick Taylor.

Special thanks to Temporal for sponsoring the challenge and providing the workflow tools that make this game possible.

Enjoy cooking! 