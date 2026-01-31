import { Router, type Router as RouterType } from 'express';
import { templatesController } from '../controllers/templates.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { strictRateLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';

const router: RouterType = Router();

/**
 * Template Routes
 * Handles industry template deployment and management
 */

// Deploy template (auth required, strict rate limit)
router.post(
  '/deploy',
  authenticate,
  strictRateLimiter,
  validate({
    body: {
      industry: {
        type: 'string',
        required: true,
        enum: ['iso-merchant', 'finance', 'healthcare', 'retail'],
      },
      customization: {
        type: 'object',
        required: false,
      },
      l3Network: {
        type: 'string',
        required: true,
      },
    },
  }),
  templatesController.deploy
);

// List templates (auth optional)
router.get(
  '/',
  optionalAuthenticate,
  validate({
    query: {
      industry: {
        type: 'string',
        required: false,
        enum: ['iso-merchant', 'finance', 'healthcare', 'retail'],
      },
      featured: {
        type: 'string',
        required: false,
        enum: ['true', 'false'],
      },
    },
  }),
  templatesController.list
);

// Get templates by industry (auth optional)
router.get(
  '/:industry',
  optionalAuthenticate,
  validate({
    params: {
      industry: {
        type: 'string',
        required: true,
      },
    },
  }),
  templatesController.getByIndustry
);

// Get template details (auth optional)
router.get(
  '/details/:id',
  optionalAuthenticate,
  validate({
    params: {
      id: {
        type: 'string',
        required: true,
      },
    },
  }),
  templatesController.getDetails
);

// Customize template (auth required)
router.post(
  '/:id/customize',
  authenticate,
  validate({
    params: {
      id: {
        type: 'string',
        required: true,
      },
    },
    body: {
      branding: {
        type: 'object',
        required: false,
      },
      features: {
        type: 'object',
        required: false,
      },
      settings: {
        type: 'object',
        required: false,
      },
    },
  }),
  templatesController.customize
);

// Get deployment status (auth required)
router.get(
  '/:id/status',
  authenticate,
  validate({
    params: {
      id: {
        type: 'string',
        required: true,
      },
    },
  }),
  templatesController.getDeploymentStatus
);

// Clone template (auth required)
router.post(
  '/:id/clone',
  authenticate,
  validate({
    params: {
      id: {
        type: 'string',
        required: true,
      },
    },
    body: {
      name: {
        type: 'string',
        required: false,
        min: 3,
        max: 100,
      },
    },
  }),
  templatesController.clone
);

export default router;
