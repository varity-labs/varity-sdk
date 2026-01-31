import { Router, type Router as RouterType } from 'express';
import { computeController } from '../controllers/compute.controller';
import { authenticate } from '../middleware/auth.middleware';
import { strictRateLimiter } from '../middleware/rateLimit.middleware';

const router: RouterType = Router();

router.post('/deploy', authenticate, strictRateLimiter, computeController.deployToAkash);
router.get('/deployment/:id', authenticate, computeController.getDeploymentStatus);

export default router;
