# Ever Wonder How Multiplayer Web Games Stay in Sync? Let's Build One!

Remember those game nights where everyone's trying to play on different devices, and things just… lag or break? We've all been there. This project is a little exploration into making that experience smoother, inspired by a cool [YouTube challenge](https://youtu.be/ftYmXoH0V5I) where developers built a multiplayer game in just 4 hours using Temporal.

[![Tic-Tac-Toe Gameplay](https://github.com/user-attachments/assets/f179e6d1-2a11-4df8-9fc9-203d76703080)](https://github.com/user-attachments/assets/f179e6d1-2a11-4df8-9fc9-203d76703080)

## The Spark: A 4-Hour Game Dev Challenge

The video that kicked this off was all about a speedrun: 30 minutes to plan, 4 hours to build and deploy a multiplayer web game. The secret sauce? Temporal. It's a system that helps manage all the tricky behind-the-scenes stuff (like making sure Player 1's move on their phone shows up correctly for Player 2 on their laptop) reliably, even when things go a bit haywire. It's all about making complex, real-time interactions less of a headache.

This project is my take on that idea, building a classic Tic-Tac-Toe game that you can play with friends across different devices.

## What's Inside? (A Quick Peek)

This isn't just any Tic-Tac-Toe. Here's what makes it tick:

*   **Play Anywhere**: Create a game room, share the ID, and play on desktop or mobile.
*   **Real-Time Fun**: Moves show up instantly, thanks to WebSockets.
*   **Fair Play**: A 30-second timer keeps the game moving, and turns are strictly enforced.
*   **Know Who Won**: The game automatically figures out wins and draws.
*   **Built to Last (Sort Of!)**: Temporal workflows help the game remember what's happening, even if there are hiccups.

## Want to Try It? (The Quick Version)

You'll need a couple of things first:
1.  Python (3.10 or newer should do it).
2.  Temporal Server (check their docs for the [dev server setup](https://docs.temporal.io/dev-guide/typescript/foundations#run-a-development-server)).

Got those? Great!

1.  **Fire up Temporal Server**:
    ```bash
   temporal server start-dev --db-filename your_temporal.db --ui-port 8080
    ```

2.  **Get the Backend Running**:
    Open a terminal, go to the `services/backend` folder, and run:
    ```bash
    pip install -r requirements.txt 
    python server.py 
    ```
    Then, in *another* terminal (still in `services/backend`):
    ```bash
    python worker.py
    ```

3.  **Launch the Frontend**:
    Open a *third* terminal, head to `web/frontend`, and type:
    ```bash
    python3 -m http.server 8000
    ```
    (If `python3` doesn't work, try `python`.)

4.  **Play!**
    Open your web browser and go to `http://localhost:8000`.
    
    Want to play with a friend? Just open another browser window, tab, or use a different device, and go to the same address (`http://localhost:8000`).
    
    One person creates a game room and shares the room ID with the other. The second player joins using that ID, and you're ready to play against each other in real time!

## How the Magic Happens (Simplified)

Basically, the backend (the brain of the game) uses Temporal to keep track of everything – whose turn it is, what the board looks like, and so on. The game you see in your browser talks to this brain using WebSockets, so updates are super fast.


## License

This project is shared under the MIT License. Have fun with it!

---

*Inspired by the "Build a multiplayer game in 4 hours" challenge sponsored by Temporal: [https://youtu.be/ftYmXoH0V5I](https://youtu.be/ftYmXoH0V5I)* 