/**
 * PURPOSE: The worker PROCESS entrypoint. Independent from the API --
 * run `npm start` in worker/ on as many machines/containers as you want
 * for horizontal scaling. Each instance:
 *  1. Registers itself in Mongo and sends a heartbeat every 5s.
 *  2. Pulls jobs off the shared BullMQ queue (Redis) with a concurrency
 *     limit, respecting priority/delay ordering set by the API.
 *  3. Updates Job + JobLog documents in Mongo as it processes.
 *  4. Publishes realtime events over Redis Pub/Sub for the API to relay.
 *  5. On final failure (all attempts exhausted), moves the job to our
 *     `dead_letter` status -- our hand-built Dead Letter Queue.
 *
 * WHY `concurrency` OPTION MATTERS (interview favorite)
 * BullMQ's Worker with `concurrency: N` processes up to N jobs
 * CONCURRENTLY on a single Node event loop by interleaving async
 * work (not real OS threads) -- ideal for I/O-bound job types (API
 * calls, DB writes). For CPU-bound work you'd want multiple worker
 * PROCESSES (horizontal scaling), not just raising concurrency, since
 * Node is single-threaded for CPU-bound code. Explaining this
 * distinction is a strong system-design signal.
 */
import { Worker, Job as BullJob } from 'bullmq';
import { createRedisConnection } from './config/redis';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './config/logger';
import { QUEUE_NAMES, JOB_STATUS, JOB_LOG_EVENT, WORKER_STATUS } from './constants';
import { Job } from './models/Job';
import { JobLog } from './models/JobLog';
import { Worker as WorkerModel } from './models/Worker';
import { processJob } from './processors/job.processor';
import { publishEvent } from './events/publisher';
import os from 'os';
import crypto from 'crypto';

const WORKER_ID = `${os.hostname()}-${process.pid}-${crypto.randomBytes(3).toString('hex')}`;

async function log(jobId: string, event: string, message?: string) {
  await JobLog.create({ job: jobId, event, message });
}

async function sendHeartbeat(status: string, currentJobId: string | null) {
  const worker = await WorkerModel.findOneAndUpdate(
    { workerId: WORKER_ID },
    { status, currentJobId, lastHeartbeatAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await publishEvent('worker:updated', worker);
}

async function main() {
  await connectDB();
  logger.info(`Worker ${WORKER_ID} connected to MongoDB`);

  await sendHeartbeat(WORKER_STATUS.ONLINE, null);
  const heartbeatInterval = setInterval(() => {
    sendHeartbeat(WORKER_STATUS.ONLINE, null).catch((err) => logger.error({ err }, 'Heartbeat failed'));
  }, 5000);

  const worker = new Worker(
    QUEUE_NAMES.JOBS,
    async (bullJob: BullJob) => {
      const { jobDocId, payload } = bullJob.data as { jobDocId: string; payload: Record<string, unknown> };

      await sendHeartbeat(WORKER_STATUS.BUSY, jobDocId);

      const jobDoc = await Job.findById(jobDocId);
      if (!jobDoc) throw new Error(`Job document ${jobDocId} not found in Mongo`);

      jobDoc.status = JOB_STATUS.RUNNING;
      jobDoc.startedAt = new Date();
      jobDoc.workerId = WORKER_ID;
      jobDoc.attemptsMade = bullJob.attemptsMade + 1;
      await jobDoc.save();
      await log(jobDocId, JOB_LOG_EVENT.STARTED, `Attempt ${jobDoc.attemptsMade}/${jobDoc.maxAttempts} on ${WORKER_ID}`);
      await publishEvent('job:updated', jobDoc);

      const result = await processJob(jobDoc.type, payload);
      return result;
    },
    {
      connection: createRedisConnection(),
      concurrency: env.WORKER_CONCURRENCY,
    }
  );

  // WHY listen on 'completed'/'failed' HERE instead of inside the
  // processor function above: the processor's job is ONLY to do the
  // work and return/throw. Persisting final state is a separate
  // concern (single responsibility) and BullMQ's events give us the
  // authoritative attemptsMade/finished state either way.
  worker.on('completed', async (bullJob, result) => {
    const { jobDocId } = bullJob.data as { jobDocId: string };
    const jobDoc = await Job.findById(jobDocId);
    if (!jobDoc) return;

    jobDoc.status = JOB_STATUS.COMPLETED;
    jobDoc.completedAt = new Date();
    jobDoc.result = result;
    jobDoc.processingTimeMs = jobDoc.startedAt ? Date.now() - jobDoc.startedAt.getTime() : undefined;
    await jobDoc.save();
    await log(jobDocId, JOB_LOG_EVENT.COMPLETED, 'Job completed successfully');
    await publishEvent('job:updated', jobDoc);
    await WorkerModel.updateOne({ workerId: WORKER_ID }, { $inc: { jobsProcessed: 1 } });
    await sendHeartbeat(WORKER_STATUS.ONLINE, null);
  });

  worker.on('failed', async (bullJob, err) => {
    if (!bullJob) return;
    const { jobDocId } = bullJob.data as { jobDocId: string };
    const jobDoc = await Job.findById(jobDocId);
    if (!jobDoc) return;

    const exhausted = bullJob.attemptsMade >= (jobDoc.maxAttempts ?? 5);

    if (exhausted) {
      // DEAD LETTER QUEUE: all attempts used up. We do NOT let this job
      // silently vanish -- it's explicitly marked so it shows up in a
      // "Dead Letter" filter on the dashboard for manual inspection or
      // manual retry (see jobService.retryJob).
      jobDoc.status = JOB_STATUS.DEAD_LETTER;
      await log(jobDocId, JOB_LOG_EVENT.FAILED, `Moved to dead-letter after ${bullJob.attemptsMade} attempts: ${err.message}`);
    } else {
      jobDoc.status = JOB_STATUS.FAILED;
      await log(jobDocId, JOB_LOG_EVENT.RETRY, `Attempt ${bullJob.attemptsMade} failed, will retry with backoff: ${err.message}`);
    }

    jobDoc.failReason = err.message;
    jobDoc.attemptsMade = bullJob.attemptsMade;
    await jobDoc.save();
    await publishEvent('job:updated', jobDoc);
    await WorkerModel.updateOne({ workerId: WORKER_ID }, { $inc: { jobsFailed: 1 } });
    await sendHeartbeat(WORKER_STATUS.ONLINE, null);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down worker ${WORKER_ID}`);
    clearInterval(heartbeatInterval);
    await WorkerModel.updateOne({ workerId: WORKER_ID }, { status: WORKER_STATUS.OFFLINE });
    await worker.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info(`Worker ${WORKER_ID} listening for jobs (concurrency=${env.WORKER_CONCURRENCY})`);
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error starting worker');
  process.exit(1);
});
