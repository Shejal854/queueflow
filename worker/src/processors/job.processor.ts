/**
 * PURPOSE: The actual "do the work" function BullMQ calls for every job.
 * In a real system this is where you'd send an email, resize an image,
 * call a third-party API, etc. Here it's a deliberately simple simulated
 * processor so the FOCUS stays on queue mechanics (priority, retry,
 * backoff, DLQ) -- the part that's actually being demonstrated.
 *
 * WHY throw TO SIGNAL FAILURE (not return an error object)
 * BullMQ's retry/backoff machinery is driven by the processor function
 * throwing -- that's the contract the library expects. Returning an
 * error object instead would silently look like "success" to BullMQ and
 * retries would never kick in. This is a common bug in real BullMQ code.
 *
 * SIMULATED FAILURE: ~20% of jobs of type "flaky-task" fail on purpose,
 * so you can actually WATCH the retry/backoff/DLQ pipeline work when
 * demoing this project in an interview.
 */
export async function processJob(type: string, payload: Record<string, unknown>): Promise<unknown> {
  const workMs = 500 + Math.random() * 1500;
  await new Promise((resolve) => setTimeout(resolve, workMs));

  if (type === 'flaky-task' && Math.random() < 0.2) {
    throw new Error('Simulated transient failure (flaky-task)');
  }

  return { processedAt: new Date().toISOString(), echoedPayload: payload };
}
