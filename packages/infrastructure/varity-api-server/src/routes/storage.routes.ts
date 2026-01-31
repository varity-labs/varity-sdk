import { Router, type Router as RouterType } from 'express';
import { storageController } from '../controllers/storage.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { uploadRateLimiter, strictRateLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';

const router: RouterType = Router();

/**
 * Storage Routes
 * Handles Filecoin storage with 3-layer architecture
 */

// Upload data (auth optional, but required for customer-data layer)
router.post(
  '/upload',
  optionalAuthenticate,
  uploadRateLimiter,
  validate({
    body: {
      data: {
        type: 'object',
        required: true,
      },
      layer: {
        type: 'string',
        required: true,
        enum: ['varity-internal', 'industry-rag', 'customer-data'],
      },
      namespace: {
        type: 'string',
        required: true,
        min: 3,
      },
      encryption: {
        type: 'boolean',
        required: false,
      },
    },
  }),
  storageController.upload
);

// Download data (auth optional)
router.get(
  '/download/:cid',
  optionalAuthenticate,
  validate({
    params: {
      cid: {
        type: 'string',
        required: true,
        min: 10,
      },
    },
  }),
  storageController.download
);

// Check if object exists
router.get(
  '/exists/:cid',
  optionalAuthenticate,
  validate({
    params: {
      cid: {
        type: 'string',
        required: true,
        min: 10,
      },
    },
  }),
  storageController.exists
);

// Get object metadata
router.get(
  '/metadata/:cid',
  optionalAuthenticate,
  validate({
    params: {
      cid: {
        type: 'string',
        required: true,
        min: 10,
      },
    },
  }),
  storageController.metadata
);

// List files
router.get(
  '/list',
  authenticate,
  validate({
    query: {
      layer: {
        type: 'string',
        required: false,
      },
      namespace: {
        type: 'string',
        required: false,
      },
      page: {
        type: 'number',
        required: false,
        min: 1,
      },
      limit: {
        type: 'number',
        required: false,
        min: 1,
        max: 100,
      },
    },
  }),
  storageController.list
);

// Get storage statistics
router.get('/stats', authenticate, storageController.stats);

// Storage backend health check
router.get('/health', storageController.health);

// Delete data
router.delete(
  '/:cid',
  authenticate,
  strictRateLimiter,
  validate({
    params: {
      cid: {
        type: 'string',
        required: true,
        min: 10,
      },
    },
  }),
  storageController.delete
);

export default router;
