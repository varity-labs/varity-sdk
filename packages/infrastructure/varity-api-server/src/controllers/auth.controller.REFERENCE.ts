/**
 * REFERENCE IMPLEMENTATION: Authentication Controller with Real Database
 * This is an example showing how to replace mock data with real database queries
 *
 * To use: Copy this implementation to auth.controller.ts after testing
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ValidationError } from '../middleware/error.middleware';
import { authService } from '../services/auth.service';
import { logger } from '../config/logger.config';

// Import database services
import {
  userDatabaseService,
  sessionDatabaseService,
} from '../database/services';

export class AuthController {
  /**
   * Get nonce for SIWE authentication
   * POST /api/v1/auth/nonce
   */
  getNonce = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { address, chainId } = req.body;

    if (!address) {
      throw new ValidationError('Ethereum address is required');
    }

    // Find or create user in database
    const user = await userDatabaseService.findOrCreate(address, chainId || 1);

    // Create SIWE message
    const message = authService.createSiweMessage(address, chainId);

    logger.info(`Nonce generated for wallet: ${address}`);

    res.status(200).json({
      success: true,
      data: {
        message,
        nonce: message.nonce,
        userId: user.id,
      },
    });
  });

  /**
   * Login with SIWE signature
   * POST /api/v1/auth/login
   *
   * DATABASE OPERATIONS:
   * 1. Find or create user
   * 2. Update last login timestamp
   * 3. Create session record
   */
  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { message, signature } = req.body;

    if (!message || !signature) {
      throw new ValidationError('Message and signature are required');
    }

    // Verify SIWE signature
    const isValid = await authService.verifySiweSignature(message, signature);

    if (!isValid) {
      throw new ValidationError('Invalid signature');
    }

    // Find or create user
    const user = await userDatabaseService.findOrCreate(
      message.address,
      message.chainId || 1
    );

    // Update last login timestamp
    await userDatabaseService.updateLastLogin(message.address);

    // Generate JWT tokens
    const accessToken = authService.generateToken(message.address, message.chainId);
    const refreshToken = authService.generateRefreshToken(message.address);

    // Create session in database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await sessionDatabaseService.create({
      userId: user.id,
      accessToken,
      refreshToken,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Track login event
    // await analyticsDatabaseService.trackEvent({
    //   eventType: 'authentication',
    //   eventName: 'user_login',
    //   userId: user.id,
    //   ipAddress: req.ip,
    //   userAgent: req.get('user-agent'),
    //   properties: {
    //     walletAddress: user.walletAddress,
    //     chainId: message.chainId,
    //   },
    // });

    logger.info(`User logged in: ${message.address}`);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          address: user.walletAddress,
          chainId: user.chainId,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isAdmin: user.isAdmin,
        },
      },
    });
  });

  /**
   * Logout
   * POST /api/v1/auth/logout
   *
   * DATABASE OPERATIONS:
   * 1. Invalidate current session
   */
  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const token = req.token;

    if (token) {
      try {
        await sessionDatabaseService.invalidate(token);
        logger.info(`Session invalidated: ${req.user?.address}`);
      } catch (error) {
        // Session might not exist, log but don't throw error
        logger.warn(`Failed to invalidate session: ${error}`);
      }
    }

    logger.info(`User logged out: ${req.user?.address}`);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  /**
   * Get current user
   * GET /api/v1/auth/me
   *
   * DATABASE OPERATIONS:
   * 1. Fetch user with relations (dashboards, subscriptions, etc.)
   */
  getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // Get user with relations from database
    const user = await userDatabaseService.getUserWithRelations(req.user.id);

    if (!user) {
      throw new ValidationError('User not found');
    }

    // Get user statistics
    const stats = await userDatabaseService.getUserStats(user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          chainId: user.chainId,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          isAdmin: user.isAdmin,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        },
        dashboards: user.dashboards?.slice(0, 5).map(d => ({
          id: d.id,
          name: d.name,
          status: d.status,
          tier: d.tier,
        })),
        subscriptions: user.subscriptions?.map(s => ({
          id: s.id,
          templateId: s.templateId,
          tier: s.tier,
          status: s.status,
          renewalDate: s.renewalDate,
        })),
        stats,
      },
    });
  });

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   *
   * DATABASE OPERATIONS:
   * 1. Validate refresh token from database
   * 2. Generate new access token
   * 3. Update session with new access token
   */
  refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // Find session by refresh token
    const session = await sessionDatabaseService.findByRefreshToken(refreshToken);

    if (!session) {
      throw new ValidationError('Invalid refresh token');
    }

    if (!session.isActive) {
      throw new ValidationError('Session expired');
    }

    // Generate new access token
    const newAccessToken = authService.generateToken(
      session.user.walletAddress,
      session.user.chainId
    );

    // Update session with new access token
    const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await sessionDatabaseService.create({
      userId: session.userId,
      accessToken: newAccessToken,
      refreshToken,
      expiresAt: newExpiresAt,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Invalidate old session
    await sessionDatabaseService.invalidate(session.accessToken);

    logger.info(`Token refreshed for user: ${session.user.walletAddress}`);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  });

  /**
   * Verify token
   * POST /api/v1/auth/verify
   *
   * DATABASE OPERATIONS:
   * 1. Verify token exists in database
   * 2. Check if session is active
   */
  verify = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('Token is required');
    }

    // Verify token signature
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      throw new ValidationError('Invalid token');
    }

    // Check if session exists and is active in database
    const session = await sessionDatabaseService.findByAccessToken(token);

    if (!session || !session.isActive) {
      throw new ValidationError('Session expired or invalid');
    }

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        user: {
          id: session.user.id,
          address: session.user.walletAddress,
          chainId: session.user.chainId,
          email: session.user.email,
          displayName: session.user.displayName,
          isAdmin: session.user.isAdmin,
        },
        session: {
          expiresAt: session.expiresAt,
          createdAt: session.createdAt,
        },
      },
    });
  });
}

export const authController = new AuthController();
export default authController;
