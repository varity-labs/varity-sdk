import { Router, type Router as RouterType } from 'express';
import { monitoringController } from '../controllers/monitoring.controller';
import { authenticate } from '../middleware/auth.middleware';

const router: RouterType = Router();

router.get('/metrics', authenticate, monitoringController.getMetrics);
router.get('/alerts', authenticate, monitoringController.getAlerts);

export default router;
