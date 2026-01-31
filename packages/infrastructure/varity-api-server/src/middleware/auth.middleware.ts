import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from './error.middleware';
import { logger } from '../config/logger.config';

/**
 * Extended Request with User
 */
export interface AuthRequest extends Request {
  user?: {
    address: string;
    chainId?: number;
    role?: string;
  };
  token?: string;
}

/**
 * Mock JWT verification (will be replaced with actual implementation)
 * This is a placeholder until we integrate proper SIWE authentication
 */
const verifyToken = (token: string): { address: string; chainId?: number } | null => {
  // TODO: Implement actual JWT verification with SIWE
  // For now, accept any token that looks like an Ethereum address
  if (token.startsWith('0x') && token.length === 42) {
    return { address: token };
  }
  return null;
};

/**
 * Authentication Middleware
 * Verifies JWT token and adds user to request
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization token provided');
    }

    // Check for Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedError('Invalid authorization format. Use: Bearer <token>');
    }

    const token = parts[1];

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Add user to request
    req.user = decoded;
    req.token = token;

    logger.debug(`Authenticated user: ${decoded.address}`);
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Authentication failed'));
    }
  }
};

/**
 * Optional Authentication Middleware
 * Adds user to request if token is present, but doesn't fail if missing
 */
export const optionalAuthenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];
    const decoded = verifyToken(token);

    if (decoded) {
      req.user = decoded;
      req.token = token;
      logger.debug(`Optionally authenticated user: ${decoded.address}`);
    }

    next();
  } catch (error) {
    // Silently fail for optional authentication
    next();
  }
};

/**
 * Role-Based Authorization Middleware
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userRole = req.user.role || 'user';

      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Wallet Ownership Verification
 * Ensures the authenticated user owns the specified wallet
 */
export const verifyWalletOwnership = (walletParam: string = 'address') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const walletAddress = req.params[walletParam] || req.body[walletParam];

      if (!walletAddress) {
        throw new ForbiddenError(`Wallet address parameter '${walletParam}' is required`);
      }

      // Normalize addresses for comparison (case-insensitive)
      const normalizedUserAddress = req.user.address.toLowerCase();
      const normalizedWalletAddress = walletAddress.toLowerCase();

      if (normalizedUserAddress !== normalizedWalletAddress) {
        throw new ForbiddenError('You do not own this wallet');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authenticate;
