// Mirrors server/src/constants.ts. In a real monorepo these would live in
// the `shared/` package and be imported by both services (see shared/
// folder + README "Possible Improvements" for why we didn't wire up a
// full TS project-reference monorepo here -- kept simple on purpose for
// an SDE-level project).
export const JOB_STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DEAD_LETTER: 'dead_letter',
  CANCELLED: 'cancelled',
} as const;

export const JOB_LOG_EVENT = {
  CREATED: 'created',
  QUEUED: 'queued',
  STARTED: 'started',
  RETRY: 'retry',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const WORKER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  BUSY: 'busy',
} as const;

export const QUEUE_NAMES = { JOBS: 'jobs-queue' } as const;

export const REALTIME_CHANNEL = 'queueflow:realtime';

export const SOCKET_EVENTS = {
  JOB_UPDATED: 'job:updated',
  WORKER_UPDATED: 'worker:updated',
};
