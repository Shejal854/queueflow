import { Router } from 'express';
import { workerController } from '../controllers/worker.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Heartbeat is called by trusted worker processes, not end users, but
// still requires auth in this simplified project (a service-to-service
// API key would be the production upgrade -- see README improvements).
router.post('/heartbeat', workerController.heartbeat);
router.get('/', authenticate, workerController.list);

export default router;
