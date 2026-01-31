import { Router, type Router as RouterType } from 'express';
import { cacheController } from '../controllers/cache.controller';
import { authenticate } from '../middleware/auth.middleware';

const router: RouterType = Router();

router.get('/:key', authenticate, cacheController.get);
router.post('/', authenticate, cacheController.set);
router.delete('/clear', authenticate, cacheController.clear);

export default router;
