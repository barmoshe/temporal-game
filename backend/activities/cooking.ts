// Validates a cooking step (you could add real logic here)
export async function validateStep({
  orderId,
  step,
}: {
  orderId: string;
  step: string;
}): Promise<boolean> {
  console.log(`[Activity] Validating step="${step}" for order=${orderId}`);
  return true; // always valid in this demo
}

// Called once the workflow finishes (success or fail)
export async function finishOrder({
  orderId,
  success,
  successLevel = "basic",
  stats = { completedSteps: 0, totalSteps: 0, perfectSteps: 0, mistakes: 0 },
}: {
  orderId: string;
  success: boolean;
  successLevel?: "none" | "basic" | "good" | "excellent";
  stats?: {
    completedSteps: number;
    totalSteps: number;
    perfectSteps: number;
    mistakes: number;
  };
}): Promise<void> {
  console.log(`[Activity] Order=${orderId} finished: ${success ? "✅" : "❌"}`);
  if (success) {
    console.log(`[Activity] Success level: ${successLevel}`);
    console.log(`[Activity] Stats: ${JSON.stringify(stats)}`);
  }
}
