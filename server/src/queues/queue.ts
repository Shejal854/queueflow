/**
 * PURPOSE: Defines and exports the single BullMQ Queue instance the API
 * uses to enqueue jobs. This is the "producer" side of the
 * producer-consumer pattern; worker/src/worker.ts is the "consumer".
 *
 * WHY ONE QUEUE INSTEAD OF THREE (high/medium/low)
 * A common beginner mistake is creating separate BullMQ queues per
 * priority. That actually makes priority WORSE, not better: three
 * independent queues have no shared ordering, so a worker consuming
 * "round robin" across them can still process a low-priority job before
 * an older high-priority one. BullMQ instead supports a native numeric
 * `priority` option on a SINGLE queue -- lower number = dequeued first.
 * We map our HIGH/MEDIUM/LOW labels to numbers (see constants.ts) and
 * let BullMQ's internal sorted-set do the ordering correctly.
 *
 * WHY DELAYED JOBS use BullMQ's built-in `delay` option
 * BullMQ stores delayed jobs in a Redis sorted set keyed by "ready
 * timestamp" and moves them to the active wait list automatically when
 * that timestamp passes -- no polling/cron needed on our side.
 *
 * WHY RETRY + EXPONENTIAL BACKOFF are configured PER JOB (attempts +
 * backoff options), not hand-rolled with try/catch loops in the worker
 * BullMQ already implements the retry state machine correctly
 * (attemptsMade tracking, backoff delay scheduling, moving to `failed`
 * after the last attempt). Reimplementing that ourselves would be
 * reinventing a well-tested wheel and is a common interview red flag
 * ("why didn't you just use the queue's built-in retry?").
 *
 * DEAD LETTER QUEUE (DLQ)
 * BullMQ doesn't have a first-class "DLQ" concept, so we implement it
 * explicitly: when a job exhausts all attempts, the worker's `failed`
 * event handler (see worker/src/worker.ts) moves it to our own
 * `dead_letter` status in Mongo and logs it, rather than letting it
 * silently disappear into BullMQ's internal `failed` set. This is the
 * standard way to build a DLQ on top of a queue that doesn't natively
 * ship one (same idea as SQS's separate DLQ, implemented manually here).
 */
import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { QUEUE_NAMES, PRIORITY_WEIGHT, DEFAULT_MAX_ATTEMPTS, BACKOFF_BASE_DELAY_MS, JobPriority } from '../constants';

export const jobsQueue = new Queue(QUEUE_NAMES.JOBS, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { age: 60 * 60 * 24, count: 1000 }, // keep Redis lean; Mongo is history of record
    removeOnFail: false, // keep failed jobs in BullMQ until DLQ handling reads them
  },
});

interface EnqueueParams {
  jobDocId: string; // Mongo Job _id, so the worker can look up/update the record
  type: string;
  payload: Record<string, unknown>;
  priority: JobPriority;
  delayMs?: number;
  maxAttempts?: number;
}

export async function enqueueJob({
  jobDocId,
  type,
  payload,
  priority,
  delayMs,
  maxAttempts,
}: EnqueueParams) {
  const bullJob = await jobsQueue.add(
    type,
    { jobDocId, payload },
    {
      priority: PRIORITY_WEIGHT[priority],
      delay: delayMs,
      attempts: maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      backoff: { type: 'exponential', delay: BACKOFF_BASE_DELAY_MS },
    }
  );
  return bullJob.id as string;
}

export async function removeQueuedJob(bullJobId: string) {
  const bullJob = await jobsQueue.getJob(bullJobId);
  if (bullJob) await bullJob.remove();
}

export async function retryQueuedJob({
  jobDocId,
  type,
  payload,
  priority,
  maxAttempts,
}: EnqueueParams) {
  // Retrying manually (from the dashboard) re-enqueues as a brand-new
  // BullMQ job rather than reusing the old bullJobId, because a job that
  // reached 'failed' with attempts exhausted cannot be resumed in place.
  return enqueueJob({ jobDocId, type, payload, priority, maxAttempts });
}
