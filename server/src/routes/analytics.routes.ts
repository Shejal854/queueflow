import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/dashboard', analyticsController.dashboard);
router.get('/jobs-per-day', analyticsController.jobsPerDay);
router.get('/most-active-worker', analyticsController.mostActiveWorker);

export default router;
