import { Router, type Router as RouterType } from 'express';
import { notificationsController } from '../controllers/notifications.controller';
import { authenticate } from '../middleware/auth.middleware';
import { strictRateLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';

const router: RouterType = Router();

// Send notification
router.post(
  '/send',
  authenticate,
  strictRateLimiter,
  validate({
    body: {
      recipient: { type: 'ethereum_address', required: true },
      type: { type: 'string', required: true, enum: ['email', 'push', 'sms', 'in-app'] },
      title: { type: 'string', required: false },
      message: { type: 'string', required: true },
      data: { type: 'object', required: false },
    },
  }),
  notificationsController.send
);

// List notifications
router.get('/list', authenticate, notificationsController.list);

// Mark as read
router.put('/:id/read', authenticate, notificationsController.markAsRead);

export default router;
