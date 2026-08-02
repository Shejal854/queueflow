/**
 * PURPOSE: The core domain entity -- a unit of work submitted by a user.
 *
 * WHY MONGO IS THE SOURCE OF TRUTH, NOT REDIS/BULLMQ
 * BullMQ's job data lives in Redis and is optimized for queueing
 * (ephemeral, fast, gets trimmed/removed after completion). It is NOT a
 * good system of record for "show me every job a user ever submitted,
 * filterable and paginated" -- that's a query workload Mongo is built
 * for. So: BullMQ owns SCHEDULING, Mongo owns HISTORY/STATE. The Job
 * document's `bullJobId` field links the two.
 *
 * WHY DENORMALIZE priority/status here (also present in BullMQ)
 * Reads (dashboard, filters, analytics) vastly outnumber writes, and
 * they hit Mongo, not Redis. Keeping status in Mongo means the dashboard
 * never needs to query Redis directly.
 *
 * INDEXES
 * - { user: 1, status: 1 } supports "my jobs filtered by status" (the
 *   most common dashboard query) as a single index scan.
 * - { createdAt: -1 } supports default recency sorting.
 * - { type: 1 }, { priority: 1 } support filter dropdowns.
 */
import { Schema, model, Document, Types } from 'mongoose';
import { JOB_PRIORITY, JOB_STATUS, JobPriority, JobStatus } from '../constants';

export interface IJob extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: string;
  payload: Record<string, unknown>;
  priority: JobPriority;
  status: JobStatus;
  bullJobId?: string;
  attemptsMade: number;
  maxAttempts: number;
  result?: unknown;
  failReason?: string;
  runAt?: Date; // for delayed jobs
  startedAt?: Date;
  completedAt?: Date;
  workerId?: string;
  processingTimeMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, trim: true, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    priority: {
      type: String,
      enum: Object.values(JOB_PRIORITY),
      default: JOB_PRIORITY.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(JOB_STATUS),
      default: JOB_STATUS.PENDING,
      index: true,
    },
    bullJobId: { type: String, index: true },
    attemptsMade: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    result: { type: Schema.Types.Mixed },
    failReason: { type: String },
    runAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    workerId: { type: String },
    processingTimeMs: { type: Number },
  },
  { timestamps: true }
);

jobSchema.index({ user: 1, status: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ type: 'text' }); // enables $text search by job type

export const Job = model<IJob>('Job', jobSchema);
