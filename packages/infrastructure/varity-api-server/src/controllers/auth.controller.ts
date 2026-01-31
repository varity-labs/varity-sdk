import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ValidationError } from '../middleware/error.middleware';
import { authService } from '../services/auth.service';
import { logger } from '../config/logger.config';

/**
 * Authentication Controller
 * Handles SIWE authentication and JWT token management
 */
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

    const message = authService.createSiweMessage(address, chainId);

    res.status(200).json({
      success: true,
      data: {
        message,
        nonce: message.nonce,
      },
    });
  });

  /**
   * Login with SIWE signature
   * POST /api/v1/auth/login
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

    // Generate JWT tokens
    const accessToken = authService.generateToken(message.address, message.chainId);
    const refreshToken = authService.generateRefreshToken(message.address);

    logger.info(`User logged in: ${message.address}`);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          address: message.address,
          chainId: message.chainId,
        },
      },
    });
  });

  /**
   * Logout
   * POST /api/v1/auth/logout
   */
  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const token = req.token;

    if (token) {
      await authService.logout(token);
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
   */
  getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  });

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    const newAccessToken = await authService.refreshAccessToken(refreshToken);

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
   */
  verify = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('Token is required');
    }

    const decoded = authService.verifyToken(token);

    if (!decoded) {
      throw new ValidationError('Invalid token');
    }

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        user: decoded,
      },
    });
  });
}

export const authController = new AuthController();
export default authController;
