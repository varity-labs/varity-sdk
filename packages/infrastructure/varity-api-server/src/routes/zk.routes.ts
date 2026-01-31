import { Router, type Router as RouterType } from 'express';
import { zkController } from '../controllers/zk.controller';
import { authenticate } from '../middleware/auth.middleware';
import { strictRateLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';

const router: RouterType = Router();

router.post(
  '/generate',
  authenticate,
  strictRateLimiter,
  validate({
    body: {
      data: { type: 'object', required: true },
      proofType: { type: 'string', required: true, enum: ['storage', 'compute', 'transaction'] },
    },
  }),
  zkController.generateProof
);

router.post(
  '/verify',
  validate({
    body: {
      proofId: { type: 'string', required: true },
      proof: { type: 'string', required: true },
    },
  }),
  zkController.verifyProof
);

export default router;
