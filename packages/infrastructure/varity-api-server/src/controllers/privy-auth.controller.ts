import { Response } from 'express';
import { PrivyAuthRequest, getPrivyClient } from '../middleware/privy-auth.middleware';
import { asyncHandler, ValidationError } from '../middleware/error.middleware';
import { logger } from '../config/logger.config';

/**
 * Privy Authentication Controller
 * Handles Privy user authentication and verification
 *
 * Privy provides email/social authentication without requiring crypto wallets.
 * Perfect for non-crypto native users migrating from cloud or building on Varity.
 */
export class PrivyAuthController {
  /**
   * Get current Privy user
   * GET /api/v1/auth/privy/me
   *
   * Returns the authenticated user's information
   */
  getCurrentUser = asyncHandler(async (req: PrivyAuthRequest, res: Response) => {
    if (!req.privyUser) {
      throw new ValidationError('User not authenticated');
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.privyUser,
      },
    });
  });

  /**
   * Verify Privy access token
   * POST /api/v1/auth/privy/verify
   *
   * Verifies a Privy access token and returns user information
   */
  verifyToken = asyncHandler(async (req: PrivyAuthRequest, res: Response) => {
    const { accessToken } = req.body;

    if (!accessToken) {
      throw new ValidationError('Access token is required');
    }

    try {
      const client = getPrivyClient();
      const verifiedClaims = await client.verifyAuthToken(accessToken);

      if (!verifiedClaims) {
        throw new ValidationError('Invalid or expired token');
      }

      const userId = verifiedClaims.userId;
      const user = await client.getUser(userId);

      if (!user) {
        throw new ValidationError('User not found');
      }

      res.status(200).json({
        success: true,
        data: {
          valid: true,
          user: {
            id: user.id,
            email: user.email?.address,
            wallet: user.wallet?.address,
            google: user.google?.email,
            twitter: user.twitter?.username,
            discord: user.discord?.username,
            github: user.github?.username,
            phone: user.phone?.number,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error: any) {
      logger.error('Token verification error:', error);
      throw new ValidationError('Token verification failed');
    }
  });

  /**
   * Get user by ID (admin only)
   * GET /api/v1/auth/privy/users/:userId
   *
   * Retrieves a user by their Privy user ID
   */
  getUserById = asyncHandler(async (req: PrivyAuthRequest, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    try {
      const client = getPrivyClient();
      const user = await client.getUser(userId);

      if (!user) {
        throw new ValidationError('User not found');
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email?.address,
            wallet: user.wallet?.address,
            google: user.google?.email,
            twitter: user.twitter?.username,
            discord: user.discord?.username,
            github: user.github?.username,
            phone: user.phone?.number,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error: any) {
      logger.error('Get user error:', error);
      throw new ValidationError('Failed to retrieve user');
    }
  });

  /**
   * Delete user (admin only or self-deletion)
   * DELETE /api/v1/auth/privy/users/:userId
   *
   * Deletes a Privy user account
   */
  deleteUser = asyncHandler(async (req: PrivyAuthRequest, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Ensure user can only delete their own account (unless admin)
    if (req.userId !== userId) {
      throw new ValidationError('Cannot delete another user\'s account');
    }

    try {
      const client = getPrivyClient();
      await client.deleteUser(userId);

      logger.info(`User deleted: ${userId}`);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete user error:', error);
      throw new ValidationError('Failed to delete user');
    }
  });

  /**
   * Link wallet to Privy account
   * POST /api/v1/auth/privy/link-wallet
   *
   * Links an external wallet to the authenticated Privy user
   */
  linkWallet = asyncHandler(async (req: PrivyAuthRequest, res: Response) => {
    const { walletAddress, chainType } = req.body;

    if (!walletAddress) {
      throw new ValidationError('Wallet address is required');
    }

    if (!req.userId) {
      throw new ValidationError('User not authenticated');
    }

    try {
      const client = getPrivyClient();

      // Link wallet to user account
      // Note: This requires the wallet to be verified via signature
      // The actual linking happens client-side via Privy SDK
      // This endpoint is mainly for verification

      const user = await client.getUser(req.userId);

      if (!user) {
        throw new ValidationError('User not found');
      }

      logger.info(`Wallet link requested for user ${req.userId}: ${walletAddress}`);

      res.status(200).json({
        success: true,
        message: 'Wallet link initiated',
        data: {
          userId: req.userId,
          walletAddress,
          chainType: chainType || 'ethereum',
        },
      });
    } catch (error: any) {
      logger.error('Link wallet error:', error);
      throw new ValidationError('Failed to link wallet');
    }
  });

  /**
   * Get user's linked wallets
   * GET /api/v1/auth/privy/wallets
   *
   * Returns all wallets linked to the authenticated user
   */
  getLinkedWallets = asyncHandler(async (req: PrivyAuthRequest, res: Response) => {
    if (!req.userId) {
      throw new ValidationError('User not authenticated');
    }

    try {
      const client = getPrivyClient();
      const user = await client.getUser(req.userId);

      if (!user) {
        throw new ValidationError('User not found');
      }

      const wallets = user.linkedAccounts
        ?.filter((account: any) => account.type === 'wallet')
        .map((wallet: any) => ({
          address: wallet.address,
          chainType: wallet.chainType || 'ethereum',
          verifiedAt: wallet.verifiedAt,
        })) || [];

      res.status(200).json({
        success: true,
        data: {
          wallets,
        },
      });
    } catch (error: any) {
      logger.error('Get wallets error:', error);
      throw new ValidationError('Failed to retrieve wallets');
    }
  });

  /**
   * Health check for Privy integration
   * GET /api/v1/auth/privy/health
   *
   * Verifies that Privy is properly configured
   */
  healthCheck = asyncHandler(async (req: PrivyAuthRequest, res: Response) => {
    try {
      const client = getPrivyClient();

      // Simple health check - verify client is initialized
      const isConfigured = !!process.env.PRIVY_APP_ID && !!process.env.PRIVY_APP_SECRET;

      res.status(200).json({
        success: true,
        data: {
          configured: isConfigured,
          ready: !!client,
        },
      });
    } catch (error: any) {
      res.status(200).json({
        success: false,
        data: {
          configured: false,
          ready: false,
          error: 'Privy not configured',
        },
      });
    }
  });
}

export const privyAuthController = new PrivyAuthController();
export default privyAuthController;
