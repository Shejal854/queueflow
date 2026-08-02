import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { jobService } from '../services/job.service';

export const jobController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.createJob(req.user!.userId, req.body);
    sendSuccess(res, 201, 'Job created', job);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const isAdmin = req.user!.role === 'admin';
    const result = await jobService.listJobs({
      ...req.query,
      userId: isAdmin ? (req.query.userId as string | undefined) : req.user!.userId,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    } as any);
    sendSuccess(res, 200, 'Jobs fetched', result);
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const result = await jobService.getJobWithLogs(req.params.id, req.user!.userId, req.user!.role === 'admin');
    sendSuccess(res, 200, 'Job fetched', result);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.updateJob(req.params.id, req.user!.userId, req.body);
    sendSuccess(res, 200, 'Job updated', job);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.cancelJob(req.params.id, req.user!.userId);
    sendSuccess(res, 200, 'Job cancelled', job);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await jobService.deleteJob(req.params.id, req.user!.userId);
    sendSuccess(res, 200, 'Job deleted', result);
  }),

  retry: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.retryJob(req.params.id, req.user!.userId);
    sendSuccess(res, 200, 'Job requeued for retry', job);
  }),
};
