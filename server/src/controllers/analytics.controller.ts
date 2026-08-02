import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { analyticsService } from '../services/analytics.service';

export const analyticsController = {
  dashboard: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await analyticsService.getDashboardStats();
    sendSuccess(res, 200, 'Dashboard stats fetched', stats);
  }),

  jobsPerDay: asyncHandler(async (req: Request, res: Response) => {
    const days = req.query.days ? Number(req.query.days) : 14;
    const data = await analyticsService.getJobsPerDay(days);
    sendSuccess(res, 200, 'Jobs per day fetched', data);
  }),

  mostActiveWorker: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.getMostActiveWorker();
    sendSuccess(res, 200, 'Most active worker fetched', data);
  }),
};
