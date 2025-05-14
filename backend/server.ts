import express from "express";
import http from "http";
import { Connection, WorkflowClient } from "@temporalio/client";
import { v4 as uuidv4 } from "uuid";
import { Server as IOServer } from "socket.io";
import { cookingWorkflow } from "./workflows/cooking";

async function main() {
  const app = express();
  const server = http.createServer(app);
  const io = new IOServer(server, { cors: { origin: "*" } });

  const connection = await Connection.connect();
  const client = new WorkflowClient({ connection });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on(
      "startOrder",
      async ({
        steps,
        difficulty = "normal",
      }: {
        steps: string[];
        difficulty?: string;
      }) => {
        const orderId = uuidv4();
        // start a new workflow
        const handle = await client.start(cookingWorkflow, {
          args: [orderId, steps],
          taskQueue: "cooking-queue",
          workflowId: orderId,
        });
        socket.join(orderId);

        // Signal the workflow with difficulty level
        await handle.signal("signalDifficulty", difficulty);

        socket.emit("orderStarted", { orderId });

        // When workflow completes, notify all in the room with detailed results
        handle
          .result()
          .then((result) => {
            // In a real implementation, we would get the result from the workflow
            // For now, we'll simulate it with some basic success data
            io.to(orderId).emit("orderFinished", {
              orderId,
              success: true,
              successLevel: "good", // This would come from the workflow result
              stats: {
                completedSteps: steps.length,
                totalSteps: steps.length,
                perfectSteps: Math.floor(steps.length * 0.7),
                mistakes: 0,
              },
            });
          })
          .catch(() => {
            io.to(orderId).emit("orderFinished", {
              orderId,
              success: false,
              successLevel: "none",
              stats: {
                completedSteps: Math.floor(steps.length * 0.7),
                totalSteps: steps.length,
                perfectSteps: 0,
                mistakes: Math.floor(steps.length * 0.3),
              },
            });
          });
      }
    );

    socket.on("stepCompleted", ({ orderId, step, isPerfect = false }) => {
      const handle = client.getHandle(orderId);
      // Add "perfect" marker to the step if it was perfect
      const stepWithQuality = isPerfect ? `${step}:perfect` : step;
      handle.signal("signalStep", stepWithQuality);
    });

    socket.on("orderFailed", ({ orderId }) => {
      // Manually fail the workflow by canceling it
      const handle = client.getHandle(orderId);
      handle.cancel();
    });
  });

  server.listen(3000, () => console.log("🚀 Server listening on :3000"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
