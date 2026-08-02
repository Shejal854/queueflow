import { Schema, model, models, Document } from 'mongoose';

export interface IJobLog extends Document {
  job: Schema.Types.ObjectId;
  event: string;
  message?: string;
  meta?: Record<string, unknown>;
  createdAt?: Date;
}

const jobLogSchema = new Schema<IJobLog>({
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  event: { type: String, required: true },
  message: { type: String },
  meta: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export const JobLog = models.JobLog || model<IJobLog>('JobLog', jobLogSchema);
