import { Schema, model, models, Document } from 'mongoose';

export interface IWorker extends Document {
  workerId: string;
  status: string;
  currentJobId?: string | null;
  jobsProcessed: number;
  jobsFailed: number;
  lastHeartbeatAt: Date;
  startedAt: Date;
}

const workerSchema = new Schema<IWorker>({
  workerId: { type: String, required: true, unique: true },
  status: { type: String, default: 'offline' },
  currentJobId: { type: String, default: null },
  jobsProcessed: { type: Number, default: 0 },
  jobsFailed: { type: Number, default: 0 },
  lastHeartbeatAt: { type: Date, default: Date.now },
  startedAt: { type: Date, default: Date.now },
});

export const Worker = models.Worker || model<IWorker>('Worker', workerSchema);
