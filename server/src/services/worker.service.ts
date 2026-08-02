/**
 * PURPOSE: Handles worker heartbeats (called by worker processes over
 * HTTP or directly if colocated) and staleness detection for the
 * dashboard's "Workers Online" panel.
 */
import { workerRepository } from '../repositories/worker.repository';
import { WorkerHeartbeatInput } from '../interfaces';
import { emitWorkerUpdated } from '../events/socket';

const STALE_THRESHOLD_MS = 15_000; // no heartbeat in 15s -> considered offline

export const workerService = {
  async heartbeat(input: WorkerHeartbeatInput) {
    const worker = await workerRepository.upsertHeartbeat(input);
    emitWorkerUpdated(worker);
    return worker;
  },

  async listWorkers() {
    await workerRepository.markStaleWorkersOffline(STALE_THRESHOLD_MS);
    return workerRepository.findAll();
  },
};
