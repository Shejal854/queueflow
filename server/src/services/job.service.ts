/**
 * PURPOSE: Orchestrates job creation, retry, cancel, update, and delete --
 * the layer that keeps Mongo (system of record) and BullMQ (scheduler)
 * consistent, and emits realtime events on every state change.
 *
 * WHY CREATE THE MONGO DOC *BEFORE* ENQUEUEING IN REDIS
 * We need a Mongo _id to pass into the BullMQ job payload (so the
 * worker knows which document to update). Creating Mongo first, then
 * enqueueing, means: if enqueue fails, we have an orphaned Mongo doc
 * with status=pending (recoverable / re-enqueue-able) rather than a
 * queued Redis job with no Mongo record to update (silently lost).
 * This is a deliberate "prefer a recoverable failure mode" choice --
 * a good interview trade-off to discuss (true exactly-once dual-write
 * is a hard distributed systems problem; this is the pragmatic version).
 */
import { jobRepository } from '../repositories/job.repository';
import { jobLogRepository } from '../repositories/jobLog.repository';
import { enqueueJob, removeQueuedJob, retryQueuedJob } from '../queues/queue';
import { ApiError } from '../utils/ApiError';
import { CreateJobInput, JobFilterQuery } from '../interfaces';
import { JOB_STATUS, JOB_LOG_EVENT } from '../constants';
import { emitJobCreated, emitJobUpdated } from '../events/socket';

export const jobService = {
  async createJob(userId: string, input: CreateJobInput) {
    const job = await jobRepository.create({
      user: userId as any,
      type: input.type,
      payload: input.payload,
      priority: input.priority,
      maxAttempts: input.maxAttempts ?? 5,
      status: JOB_STATUS.PENDING,
      runAt: input.delayMs ? new Date(Date.now() + input.delayMs) : undefined,
    });

    await jobLogRepository.create(job.id, JOB_LOG_EVENT.CREATED, 'Job created');

    const bullJobId = await enqueueJob({
      jobDocId: job.id,
      type: input.type,
      payload: input.payload,
      priority: input.priority,
      delayMs: input.delayMs,
      maxAttempts: input.maxAttempts,
    });

    job.bullJobId = bullJobId;
    job.status = JOB_STATUS.QUEUED;
    await job.save();
    await jobLogRepository.create(job.id, JOB_LOG_EVENT.QUEUED, 'Job enqueued to BullMQ');

    emitJobCreated(job);
    return job;
  },

  async listJobs(filters: JobFilterQuery) {
    return jobRepository.findWithFilters(filters);
  },

  async getJobWithLogs(jobId: string, userId: string, isAdmin: boolean) {
    const job = isAdmin
      ? await jobRepository.findById(jobId)
      : await jobRepository.findByIdForUser(jobId, userId);
    if (!job) throw new ApiError(404, 'Job not found');
    const logs = await jobLogRepository.findByJob(jobId);
    return { job, logs };
  },

  async updateJob(jobId: string, userId: string, update: { payload?: Record<string, unknown>; priority?: string }) {
    const job = await jobRepository.findByIdForUser(jobId, userId);
    if (!job) throw new ApiError(404, 'Job not found');
    if (job.status !== JOB_STATUS.PENDING) {
      throw new ApiError(400, `Cannot edit a job in '${job.status}' status`);
    }
    Object.assign(job, update);
    await job.save();
    emitJobUpdated(job);
    return job;
  },

  async cancelJob(jobId: string, userId: string) {
    const job = await jobRepository.findByIdForUser(jobId, userId);
    if (!job) throw new ApiError(404, 'Job not found');
    if ([JOB_STATUS.COMPLETED, JOB_STATUS.CANCELLED].includes(job.status as any)) {
      throw new ApiError(400, `Cannot cancel a job already in '${job.status}' status`);
    }
    if (job.bullJobId) await removeQueuedJob(job.bullJobId);
    job.status = JOB_STATUS.CANCELLED;
    await job.save();
    await jobLogRepository.create(job.id, JOB_LOG_EVENT.CANCELLED, 'Job cancelled by user');
    emitJobUpdated(job);
    return job;
  },

  async deleteJob(jobId: string, userId: string) {
    const job = await jobRepository.findByIdForUser(jobId, userId);
    if (!job) throw new ApiError(404, 'Job not found');
    if (job.status === JOB_STATUS.RUNNING) {
      throw new ApiError(400, 'Cannot delete a job that is currently running');
    }
    if (job.bullJobId) await removeQueuedJob(job.bullJobId).catch(() => undefined);
    await jobRepository.deleteById(jobId);
    return { id: jobId };
  },

  async retryJob(jobId: string, userId: string) {
    const job = await jobRepository.findByIdForUser(jobId, userId);
    if (!job) throw new ApiError(404, 'Job not found');
    if (![JOB_STATUS.FAILED, JOB_STATUS.DEAD_LETTER].includes(job.status as any)) {
      throw new ApiError(400, `Only failed/dead-letter jobs can be retried (current: ${job.status})`);
    }

    const bullJobId = await retryQueuedJob({
      jobDocId: job.id,
      type: job.type,
      payload: job.payload,
      priority: job.priority,
      maxAttempts: job.maxAttempts,
    });

    job.bullJobId = bullJobId;
    job.status = JOB_STATUS.QUEUED;
    job.attemptsMade = 0;
    job.failReason = undefined;
    await job.save();
    await jobLogRepository.create(job.id, JOB_LOG_EVENT.RETRY, 'Job manually retried');
    emitJobUpdated(job);
    return job;
  },
};
