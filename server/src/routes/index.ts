/**
 * PURPOSE: Mounts all feature routers under /api. Single place to see
 * the entire public API surface.
 */
import { Router } from 'express';
import authRoutes from './auth.routes';
import jobRoutes from './job.routes';
import workerRoutes from './worker.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/workers', workerRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
