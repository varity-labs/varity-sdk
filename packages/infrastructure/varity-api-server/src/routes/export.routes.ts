import { Router, type Router as RouterType } from 'express';
import { exportController } from '../controllers/export.controller';
import { authenticate } from '../middleware/auth.middleware';
import { strictRateLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';

const router: RouterType = Router();

router.post(
  '/pdf',
  authenticate,
  strictRateLimiter,
  validate({
    body: {
      type: { type: 'string', required: true },
      data: { type: 'object', required: true },
    },
  }),
  exportController.exportPDF
);

router.post(
  '/csv',
  authenticate,
  strictRateLimiter,
  validate({
    body: {
      type: { type: 'string', required: true },
      data: { type: 'object', required: true },
    },
  }),
  exportController.exportCSV
);

export default router;
