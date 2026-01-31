/**
 * Authentication Routes
 * Wallet authentication endpoints
 */

import { Router } from 'express';
import { AuthController } from '../controllers';
import { PermissionManager } from '../auth/permissions';
import { createHybridAuthMiddleware } from '../middleware';

export function createAuthRoutes(permissionManager?: PermissionManager): Router {
  const router = Router();
  const authController = new AuthController(permissionManager);

  // Public endpoints (no auth required)

  /**
   * Get nonce for SIWE
   * GET /auth/nonce?address={address}
   */
  router.get('/auth/nonce', authController.getNonce);

  /**
   * Generate SIWE message
   * POST /auth/message
   */
  router.post('/auth/message', authController.generateMessage);

  /**
   * Verify SIWE signature and get JWT token
   * POST /auth/verify
   */
  router.post('/auth/verify', authController.verifySignature);

  /**
   * Refresh JWT token
   * POST /auth/refresh
   */
  router.post('/auth/refresh', authController.refreshToken);

  // Protected endpoints (wallet auth required)
  const walletAuthMiddleware = createHybridAuthMiddleware({
    mode: 'wallet',
    walletAuthEnabled: true,
    permissionManager
  });

  /**
   * Get wallet permissions
   * GET /auth/permissions
   */
  router.get('/auth/permissions', walletAuthMiddleware, authController.getPermissions);

  /**
   * Get storage layer access
   * GET /auth/storage-layers
   */
  router.get('/auth/storage-layers', walletAuthMiddleware, authController.getStorageLayers);

  return router;
}

export default createAuthRoutes;
