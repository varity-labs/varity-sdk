import { Router, type Router as RouterType } from 'express';
import { privyAuthController } from '../controllers/privy-auth.controller';
import { authenticatePrivy, optionalAuthenticatePrivy } from '../middleware/privy-auth.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';

const router: RouterType = Router();

/**
 * Privy Authentication Routes
 * Handles email/social authentication via Privy
 */

// Health check (no auth required)
router.get('/health', privyAuthController.healthCheck);

// Verify Privy JWT token (no auth required)
router.post('/verify-token', authRateLimiter, privyAuthController.verifyToken);

// Get current authenticated user (auth required)
router.get('/user', authenticatePrivy, privyAuthController.getCurrentUser);

// Get user by ID (auth required, admin only in production)
router.get('/user/:userId', authenticatePrivy, privyAuthController.getUserById);

// Delete user account (auth required)
router.delete('/user/:userId', authenticatePrivy, privyAuthController.deleteUser);

// Link wallet to account (auth required)
router.post('/link-wallet', authenticatePrivy, privyAuthController.linkWallet);

// Get linked wallets (auth required)
router.get('/wallets', authenticatePrivy, privyAuthController.getLinkedWallets);

export default router;
