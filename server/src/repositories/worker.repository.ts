import { Worker } from '../models/Worker';
import { WorkerHeartbeatInput } from '../interfaces';
import { WORKER_STATUS } from '../constants';

export const workerRepository = {
  upsertHeartbeat({ workerId, status, currentJobId }: WorkerHeartbeatInput) {
    return Worker.findOneAndUpdate(
      { workerId },
      { status, currentJobId: currentJobId ?? null, lastHeartbeatAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  },
  incrementProcessed(workerId: string, failed: boolean) {
    return Worker.updateOne(
      { workerId },
      { $inc: failed ? { jobsFailed: 1 } : { jobsProcessed: 1 } }
    );
  },
  findAll() {
    return Worker.find().sort({ lastHeartbeatAt: -1 });
  },
  // Marks workers OFFLINE if they haven't sent a heartbeat within
  // `staleMs`. Called periodically by a lightweight interval in the API.
  markStaleWorkersOffline(staleMs: number) {
    const cutoff = new Date(Date.now() - staleMs);
    return Worker.updateMany(
      { lastHeartbeatAt: { $lt: cutoff }, status: { $ne: WORKER_STATUS.OFFLINE } },
      { status: WORKER_STATUS.OFFLINE }
    );
  },
};
