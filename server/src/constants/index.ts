/**
 * PURPOSE: Single source of truth for magic strings/numbers used across
 * the codebase (job status, priority, queue names, roles).
 *
 * WHY: Magic strings scattered across files ("pending" typo'd as "Pending"
 * in one place) cause silent bugs that TypeScript's string type can't catch.
 * Using `as const` + derived union types gives compile-time safety: typo a
 * status and TypeScript will refuse to build.
 */

export const JOB_STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DEAD_LETTER: 'dead_letter',
  CANCELLED: 'cancelled',
} as const;
export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const JOB_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
export type JobPriority = (typeof JOB_PRIORITY)[keyof typeof JOB_PRIORITY];

// BullMQ priority is a NUMBER where LOWER = processed FIRST.
// We map our human-friendly priority labels to numeric weights here,
// in exactly one place, so the mapping can't drift between files.
export const PRIORITY_WEIGHT: Record<JobPriority, number> = {
  [JOB_PRIORITY.HIGH]: 1,
  [JOB_PRIORITY.MEDIUM]: 5,
  [JOB_PRIORITY.LOW]: 10,
};

export const JOB_LOG_EVENT = {
  CREATED: 'created',
  QUEUED: 'queued',
  STARTED: 'started',
  RETRY: 'retry',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;
export type JobLogEvent = (typeof JOB_LOG_EVENT)[keyof typeof JOB_LOG_EVENT];

export const WORKER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  BUSY: 'busy',
} as const;
export type WorkerStatusType = (typeof WORKER_STATUS)[keyof typeof WORKER_STATUS];

export const QUEUE_NAMES = {
  JOBS: 'jobs-queue',
} as const;

// Redis Pub/Sub channel the worker process publishes job/worker updates
// to; the API subscribes and relays them over Socket.IO (see
// events/redisSubscriber.ts). Must match worker/src/constants.ts.
export const REALTIME_CHANNEL = 'queueflow:realtime';

export const SOCKET_EVENTS = {
  JOB_UPDATED: 'job:updated',
  JOB_CREATED: 'job:created',
  WORKER_UPDATED: 'worker:updated',
  STATS_UPDATED: 'stats:updated',
} as const;

// Job attempts + exponential backoff base delay (ms). BullMQ multiplies
// this by 2^(attempt-1) when backoff.type = 'exponential'.
export const DEFAULT_MAX_ATTEMPTS = 5;
export const BACKOFF_BASE_DELAY_MS = 2000;

export const ACCESS_TOKEN_COOKIE = 'qf_access_token';
export const REFRESH_TOKEN_COOKIE = 'qf_refresh_token';
