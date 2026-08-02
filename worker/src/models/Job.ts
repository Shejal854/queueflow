/**
 * Minimal Job schema mirror used by the worker process to read/write job
 * state directly in Mongo (same collection the API's Job model writes
 * to -- schemas must stay in sync; see README "Possible Improvements"
 * for promoting this to a real shared package).
 */
import { Schema, model, models, Document } from 'mongoose';

export interface IJob extends Document {
  user: Schema.Types.ObjectId;
  type: string;
  payload: Record<string, unknown>;
  priority: string;
  status: string;
  bullJobId?: string;
  attemptsMade: number;
  maxAttempts: number;
  result?: unknown;
  failReason?: string;
  startedAt?: Date;
  completedAt?: Date;
  workerId?: string;
  processingTimeMs?: number;
}

const jobSchema = new Schema<IJob>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    priority: { type: String, default: 'medium' },
    status: { type: String, default: 'pending' },
    bullJobId: { type: String },
    attemptsMade: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    result: { type: Schema.Types.Mixed },
    failReason: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
    workerId: { type: String },
    processingTimeMs: { type: Number },
  },
  { timestamps: true }
);

// `models.Job ||` guards against OverwriteModelError if this module is
// ever hot-reloaded (tsx watch) within the same process.
export const Job = models.Job || model<IJob>('Job', jobSchema);
