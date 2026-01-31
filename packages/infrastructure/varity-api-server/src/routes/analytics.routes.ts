import { Router, type Router as RouterType } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router: RouterType = Router();

/**
 * Analytics Routes
 * All analytics endpoints require authentication
 */

// Get KPIs
router.get('/kpis', authenticate, analyticsController.getKPIs);

// Get trends
router.get(
  '/trends',
  authenticate,
  validate({
    query: {
      metric: {
        type: 'string',
        required: true,
      },
      timeframe: {
        type: 'string',
        required: false,
        enum: ['7d', '30d', '90d', '1y'],
      },
    },
  }),
  analyticsController.getTrends
);

// Get leaderboards
router.get(
  '/leaderboards',
  validate({
    query: {
      category: {
        type: 'string',
        required: false,
        enum: ['revenue', 'transactions', 'customers', 'growth'],
      },
      timeframe: {
        type: 'string',
        required: false,
        enum: ['7d', '30d', '90d', '1y', 'all'],
      },
      limit: {
        type: 'number',
        required: false,
        min: 1,
        max: 100,
      },
    },
  }),
  analyticsController.getLeaderboards
);

// Get revenue analytics
router.get(
  '/revenue',
  authenticate,
  validate({
    query: {
      startDate: {
        type: 'string',
        required: false,
      },
      endDate: {
        type: 'string',
        required: false,
      },
      groupBy: {
        type: 'string',
        required: false,
        enum: ['hour', 'day', 'week', 'month'],
      },
    },
  }),
  analyticsController.getRevenue
);

// Get customer analytics
router.get(
  '/customers',
  authenticate,
  validate({
    query: {
      startDate: {
        type: 'string',
        required: false,
      },
      endDate: {
        type: 'string',
        required: false,
      },
      metric: {
        type: 'string',
        required: false,
        enum: ['all', 'active', 'new', 'churn', 'retention'],
      },
    },
  }),
  analyticsController.getCustomers
);

// Get transaction analytics
router.get(
  '/transactions',
  authenticate,
  validate({
    query: {
      startDate: {
        type: 'string',
        required: false,
      },
      endDate: {
        type: 'string',
        required: false,
      },
      status: {
        type: 'string',
        required: false,
        enum: ['all', 'success', 'failed', 'pending'],
      },
    },
  }),
  analyticsController.getTransactions
);

// Get forecast
router.get(
  '/forecast',
  authenticate,
  validate({
    query: {
      metric: {
        type: 'string',
        required: true,
      },
      periods: {
        type: 'number',
        required: false,
        min: 1,
        max: 365,
      },
    },
  }),
  analyticsController.getForecast
);

// Get anomalies
router.get(
  '/anomalies',
  authenticate,
  validate({
    query: {
      metric: {
        type: 'string',
        required: false,
      },
      timeframe: {
        type: 'string',
        required: false,
        enum: ['24h', '7d', '30d'],
      },
    },
  }),
  analyticsController.getAnomalies
);

export default router;
