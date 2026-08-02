import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { workerService } from '../services/worker.service';

export const workerController = {
  heartbeat: asyncHandler(async (req: Request, res: Response) => {
    const worker = await workerService.heartbeat(req.body);
    sendSuccess(res, 200, 'Heartbeat received', worker);
  }),

  list: asyncHandler(async (_req: Request, res: Response) => {
    const workers = await workerService.listWorkers();
    sendSuccess(res, 200, 'Workers fetched', workers);
  }),
};
