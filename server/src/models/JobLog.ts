/**
 * PURPOSE: Append-only audit trail of every lifecycle event a job goes
 * through (created -> queued -> started -> retry -> completed/failed).
 *
 * WHY A SEPARATE COLLECTION INSTEAD OF AN ARRAY FIELD ON Job
 * Two reasons:
 * 1. Unbounded growth: a job that retries 20 times would make the Job
 *    document grow indefinitely if logs were embedded, hurting the
 *    performance of every read of that job (Mongo loads whole documents).
 * 2. Write concurrency: workers append logs from a different process
 *    than the API updates Job fields from. Separate collections avoid
 *    write contention / document-level lock conflicts on the same doc.
 *
 * This is a classic "one-to-many, unbounded, high write frequency"
 * modeling decision -> reference, don't embed.
 */
import { Schema, model, Document, Types } from 'mongoose';
import { JobLogEvent, JOB_LOG_EVENT } from '../constants';

export interface IJobLog extends Document {
  _id: Types.ObjectId;
  job: Types.ObjectId;
  event: JobLogEvent;
  message?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const jobLogSchema = new Schema<IJobLog>({
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  event: { type: String, enum: Object.values(JOB_LOG_EVENT), required: true },
  message: { type: String },
  meta: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

jobLogSchema.index({ job: 1, createdAt: 1 });

export const JobLog = model<IJobLog>('JobLog', jobLogSchema);
