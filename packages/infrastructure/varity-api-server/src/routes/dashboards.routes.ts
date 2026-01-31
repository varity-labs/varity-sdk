import { Router, type Router as RouterType } from 'express';
import { dashboardsController } from '../controllers/dashboards.controller';
import { authenticate } from '../middleware/auth.middleware';
import { strictRateLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';

const router: RouterType = Router();

/**
 * Dashboard Routes
 * Manages deployed customer dashboards
 * All routes require authentication
 */

// List all dashboards (admin only)
router.get(
  '/',
  authenticate,
  validate({
    query: {
      status: {
        type: 'string',
        required: false,
        enum: ['active', 'inactive', 'deactivated', 'suspended'],
      },
      industry: {
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
  dashboardsController.list
);

// Get specific dashboard
router.get(
  '/:customerId',
  authenticate,
  validate({
    params: {
      customerId: {
        type: 'ethereum_address',
        required: true,
      },
    },
  }),
  dashboardsController.getDashboard
);

// Update dashboard config
router.put(
  '/:customerId/config',
  authenticate,
  validate({
    params: {
      customerId: {
        type: 'ethereum_address',
        required: true,
      },
    },
    body: {
      config: {
        type: 'object',
        required: true,
      },
    },
  }),
  dashboardsController.updateConfig
);

// Get dashboard metrics
router.get(
  '/:customerId/metrics',
  authenticate,
  validate({
    params: {
      customerId: {
        type: 'ethereum_address',
        required: true,
      },
    },
  }),
  dashboardsController.getMetrics
);

// Get dashboard logs
router.get(
  '/:customerId/logs',
  authenticate,
  validate({
    params: {
      customerId: {
        type: 'ethereum_address',
        required: true,
      },
    },
    query: {
      level: {
        type: 'string',
        required: false,
        enum: ['error', 'warn', 'info', 'debug'],
      },
      startDate: {
        type: 'string',
        required: false,
      },
      endDate: {
        type: 'string',
        required: false,
      },
      limit: {
        type: 'number',
        required: false,
        min: 1,
        max: 1000,
      },
    },
  }),
  dashboardsController.getLogs
);

// Restart dashboard
router.post(
  '/:customerId/restart',
  authenticate,
  strictRateLimiter,
  validate({
    params: {
      customerId: {
        type: 'ethereum_address',
        required: true,
      },
    },
  }),
  dashboardsController.restart
);

// Scale dashboard
router.post(
  '/:customerId/scale',
  authenticate,
  strictRateLimiter,
  validate({
    params: {
      customerId: {
        type: 'ethereum_address',
        required: true,
      },
    },
    body: {
      tier: {
        type: 'string',
        required: true,
        enum: ['basic', 'standard', 'professional', 'enterprise'],
      },
    },
  }),
  dashboardsController.scale
);

// Deactivate dashboard
router.delete(
  '/:customerId',
  authenticate,
  strictRateLimiter,
  validate({
    params: {
      customerId: {
        type: 'ethereum_address',
        required: true,
      },
    },
  }),
  dashboardsController.deactivate
);

export default router;
