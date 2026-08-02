/**
 * PURPOSE: Tracks each worker PROCESS (not each job) -- its liveness,
 * current status, and what it's working on.
 *
 * WHY A HEARTBEAT FIELD (lastHeartbeatAt)
 * There is no reliable way to know a worker process died (crashed, OOM
 * killed, box rebooted) other than "it stopped telling us it's alive."
 * Every worker pings this doc on an interval; the dashboard/service
 * layer treats a worker as OFFLINE if `now - lastHeartbeatAt > threshold`.
 * This is the same idea Kubernetes liveness probes and Redis Sentinel use.
 *
 * INTERVIEW TALKING POINT
 * "How do you detect a dead worker without it announcing its own death?"
 * -> heartbeat + timeout, because you can't rely on a crashing process to
 * run cleanup code.
 */
import { Schema, model, Document } from 'mongoose';
import { WORKER_STATUS, WorkerStatusType } from '../constants';

export interface IWorker extends Document {
  workerId: string; // stable id, e.g. hostname-pid
  status: WorkerStatusType;
  currentJobId?: string | null;
  jobsProcessed: number;
  jobsFailed: number;
  lastHeartbeatAt: Date;
  startedAt: Date;
}

const workerSchema = new Schema<IWorker>({
  workerId: { type: String, required: true, unique: true },
  status: { type: String, enum: Object.values(WORKER_STATUS), default: WORKER_STATUS.OFFLINE },
  currentJobId: { type: String, default: null },
  jobsProcessed: { type: Number, default: 0 },
  jobsFailed: { type: Number, default: 0 },
  lastHeartbeatAt: { type: Date, default: Date.now },
  startedAt: { type: Date, default: Date.now },
});

export const Worker = model<IWorker>('Worker', workerSchema);
