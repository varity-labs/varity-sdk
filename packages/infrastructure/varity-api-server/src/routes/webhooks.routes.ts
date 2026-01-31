import { Router, type Router as RouterType } from 'express';
import { webhooksController } from '../controllers/webhooks.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router: RouterType = Router();

router.post(
  '/register',
  authenticate,
  validate({
    body: {
      url: { type: 'url', required: true },
      events: { type: 'array', required: true },
    },
  }),
  webhooksController.register
);

router.get('/list', authenticate, webhooksController.list);
router.delete('/:id', authenticate, webhooksController.delete);

export default router;
