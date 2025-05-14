import {
  defineSignal,
  setHandler,
  sleep,
  proxyActivities,
} from "@temporalio/workflow";
import type * as activities from "../activities/cooking";

const { validateStep } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

const signalStep = defineSignal<[string]>("signalStep");
const signalDifficulty = defineSignal<[string]>("signalDifficulty");

export async function cookingWorkflow(
  orderId: string,
  steps: string[]
): Promise<void> {
  let completedCount = 0;
  let perfectSteps = 0;
  let mistakes = 0;
  let difficultyLevel = "normal"; // Default difficulty

  // Handle incoming difficulty signal
  setHandler(signalDifficulty, async ([difficulty]) => {
    difficultyLevel = difficulty;
  });

  // Handle incoming "step" signals
  setHandler(signalStep, async ([step]) => {
    const ok = await validateStep({ orderId, step });
    if (ok) {
      completedCount++;
      // Check if it was a perfect step (in a real implementation,
      // this would be passed in the signal data)
      if (step.includes("perfect")) {
        perfectSteps++;
      }
    } else {
      mistakes++;
    }
  });

  // Calculate timeout based on difficulty
  const getTimeoutDuration = () => {
    const baseTimeout = 10_000; // 10 seconds per step
    switch (difficultyLevel) {
      case "easy":
        return steps.length * baseTimeout * 1.2; // 20% more time
      case "hard":
        return steps.length * baseTimeout * 0.8; // 20% less time
      default:
        return steps.length * baseTimeout; // normal difficulty
    }
  };

  // Wait until either all steps done or time runs out
  const timeout = sleep(getTimeoutDuration());
  await Promise.race([
    timeout,
    (async () => {
      while (completedCount < steps.length) {
        await sleep(500); // poll small interval
      }
    })(),
  ]);

  // Calculate success metrics
  const allStepsCompleted = completedCount === steps.length;
  const highQuality = perfectSteps >= Math.floor(steps.length * 0.5); // At least 50% perfect steps
  const fewMistakes = mistakes <= Math.floor(steps.length * 0.3); // Less than 30% mistakes

  // Different success levels
  let successLevel = "none";
  if (allStepsCompleted) {
    if (highQuality && fewMistakes) {
      successLevel = "excellent";
    } else if (fewMistakes) {
      successLevel = "good";
    } else {
      successLevel = "basic";
    }
  }

  // Call finishOrder with detailed success information
  await proxyActivities<typeof activities>({
    startToCloseTimeout: "1 minute",
  }).finishOrder({
    orderId,
    success: allStepsCompleted,
    successLevel,
    stats: {
      completedSteps: completedCount,
      totalSteps: steps.length,
      perfectSteps,
      mistakes,
    },
  });
}
