import { Router, type Router as RouterType } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';

const router: RouterType = Router();

/**
 * Authentication Routes
 * Handles SIWE authentication and JWT token management
 */

// Get nonce for SIWE (no auth required)
router.post(
  '/nonce',
  authRateLimiter,
  validate({
    body: {
      address: {
        type: 'ethereum_address',
        required: true,
      },
      chainId: {
        type: 'number',
        required: false,
      },
    },
  }),
  authController.getNonce
);

// Login with SIWE signature (no auth required)
router.post(
  '/login',
  authRateLimiter,
  validate({
    body: {
      message: {
        type: 'object',
        required: true,
      },
      signature: {
        type: 'string',
        required: true,
        min: 132,
      },
    },
  }),
  authController.login
);

// Logout (auth required)
router.post('/logout', authenticate, authController.logout);

// Get current user (auth required)
router.get('/me', authenticate, authController.getCurrentUser);

// Refresh access token (no auth required)
router.post(
  '/refresh',
  authRateLimiter,
  validate({
    body: {
      refreshToken: {
        type: 'string',
        required: true,
      },
    },
  }),
  authController.refresh
);

// Verify token (no auth required)
router.post(
  '/verify',
  validate({
    body: {
      token: {
        type: 'string',
        required: true,
      },
    },
  }),
  authController.verify
);

export default router;
