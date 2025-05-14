import { Worker } from "@temporalio/worker";

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve("./workflows/cooking"),
    activities: require("./activities/cooking"),
    taskQueue: "cooking-queue",
  });
  console.log("🧑‍🍳 Worker started");
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
