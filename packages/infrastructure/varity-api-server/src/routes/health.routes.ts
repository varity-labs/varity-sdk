import { Router, type Router as RouterType } from 'express';
import { healthController } from '../controllers/health.controller';

const router: RouterType = Router();

/**
 * Health Check Routes
 * No authentication required
 */

// Basic health check
router.get('/', healthController.check);

// Detailed health check
router.get('/detailed', healthController.detailed);

// Kubernetes readiness probe
router.get('/ready', healthController.ready);

// Kubernetes liveness probe
router.get('/live', healthController.live);

export default router;
