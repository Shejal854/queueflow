import { Router } from 'express';
import { jobController } from '../controllers/job.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createJobSchema, updateJobSchema } from '../validators/job.validator';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /api/jobs:
 *   post:
 *     summary: Create (enqueue) a new job
 *     tags: [Jobs]
 *   get:
 *     summary: List jobs with filtering, search, sort, pagination
 *     tags: [Jobs]
 */
router.post('/', validate(createJobSchema), jobController.create);
router.get('/', jobController.list);
router.get('/:id', jobController.getOne);
router.patch('/:id', validate(updateJobSchema), jobController.update);
router.post('/:id/cancel', jobController.cancel);
router.post('/:id/retry', jobController.retry);
router.delete('/:id', jobController.remove);

export default router;
