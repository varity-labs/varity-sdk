import { Request, Response, NextFunction } from 'express';
import { PrivyClient } from '@privy-io/server-auth';
import { UnauthorizedError, ForbiddenError } from './error.middleware';
import { logger } from '../config/logger.config';

/**
 * Extended Request with Privy User
 */
export interface PrivyAuthRequest extends Request {
  privyUser?: {
    id: string;
    email?: string;
    wallet?: string;
    google?: string;
    twitter?: string;
    discord?: string;
    github?: string;
    phone?: string;
    createdAt: number;
  };
  userId?: string;
  token?: string;
}

/**
 * Initialize Privy Client
 * Requires environment variables:
 * - PRIVY_APP_ID
 * - PRIVY_APP_SECRET
 */
const initializePrivyClient = (): PrivyClient | null => {
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;

  if (!appId || !appSecret) {
    logger.warn(
      'Privy credentials not configured. Set PRIVY_APP_ID and PRIVY_APP_SECRET environment variables.'
    );
    return null;
  }

  return new PrivyClient(appId, appSecret);
};

// Singleton Privy client instance
let privyClient: PrivyClient | null = null;

export const getPrivyClient = (): PrivyClient => {
  if (!privyClient) {
    privyClient = initializePrivyClient();
    if (!privyClient) {
      throw new Error('Privy client not initialized. Check environment variables.');
    }
  }
  return privyClient;
};

/**
 * Privy Authentication Middleware
 * Verifies Privy access token and adds user to request
 *
 * Usage:
 * ```typescript
 * router.get('/protected', authenticatePrivy, (req, res) => {
 *   const user = (req as PrivyAuthRequest).privyUser;
 *   res.json({ user });
 * });
 * ```
 */
export const authenticatePrivy = async (
  req: PrivyAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    // Verify Privy access token
    const client = getPrivyClient();
    const verifiedClaims = await client.verifyAuthToken(token);

    if (!verifiedClaims) {
      throw new UnauthorizedError('Invalid or expired Privy token');
    }

    // Extract user ID from claims
    const userId = verifiedClaims.userId;

    // Fetch full user data from Privy
    const privyUser = await client.getUser(userId);

    if (!privyUser) {
      throw new UnauthorizedError('User not found');
    }

    // Extract relevant user information
    const userInfo: PrivyAuthRequest['privyUser'] = {
      id: privyUser.id,
      createdAt: privyUser.createdAt instanceof Date ? privyUser.createdAt.getTime() : privyUser.createdAt,
    };

    // Add email if available
    if (privyUser.email?.address) {
      userInfo.email = privyUser.email.address;
    }

    // Add wallet if available
    if (privyUser.wallet?.address) {
      userInfo.wallet = privyUser.wallet.address;
    }

    // Add Google if available
    if (privyUser.google?.email) {
      userInfo.google = privyUser.google.email;
    }

    // Add Twitter if available
    if (privyUser.twitter?.username) {
      userInfo.twitter = privyUser.twitter.username;
    }

    // Add Discord if available
    if (privyUser.discord?.username) {
      userInfo.discord = privyUser.discord.username;
    }

    // Add GitHub if available
    if (privyUser.github?.username) {
      userInfo.github = privyUser.github.username;
    }

    // Add phone if available
    if (privyUser.phone?.number) {
      userInfo.phone = privyUser.phone.number;
    }

    // Add user to request
    req.privyUser = userInfo;
    req.userId = userId;
    req.token = token;

    logger.debug(`Authenticated Privy user: ${userId} (${userInfo.email || userInfo.wallet})`);
    next();
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      logger.error('Privy authentication error:', error);
      next(new UnauthorizedError('Authentication failed'));
    }
  }
};

/**
 * Optional Privy Authentication Middleware
 * Adds user to request if token is present, but doesn't fail if missing
 */
export const optionalAuthenticatePrivy = async (
  req: PrivyAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    try {
      const client = getPrivyClient();
      const verifiedClaims = await client.verifyAuthToken(token);

      if (verifiedClaims) {
        const userId = verifiedClaims.userId;
        const privyUser = await client.getUser(userId);

        if (privyUser) {
          req.privyUser = {
            id: privyUser.id,
            email: privyUser.email?.address ?? undefined,
            wallet: privyUser.wallet?.address ?? undefined,
            google: privyUser.google?.email ?? undefined,
            twitter: privyUser.twitter?.username ?? undefined,
            discord: privyUser.discord?.username ?? undefined,
            github: privyUser.github?.username ?? undefined,
            phone: privyUser.phone?.number ?? undefined,
            createdAt: privyUser.createdAt instanceof Date ? privyUser.createdAt.getTime() : privyUser.createdAt,
          };
          req.userId = userId;
          req.token = token;

          logger.debug(`Optionally authenticated Privy user: ${userId}`);
        }
      }
    } catch (error) {
      // Silently fail for optional authentication
      logger.debug('Optional Privy authentication failed (non-critical)');
    }

    next();
  } catch (error) {
    // Silently fail for optional authentication
    next();
  }
};

/**
 * Verify Email Ownership
 * Ensures the authenticated user owns the specified email
 */
export const verifyEmailOwnership = (emailParam: string = 'email') => {
  return (req: PrivyAuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.privyUser) {
        throw new UnauthorizedError('Authentication required');
      }

      const email = req.params[emailParam] || req.body[emailParam];

      if (!email) {
        throw new ForbiddenError(`Email parameter '${emailParam}' is required`);
      }

      if (!req.privyUser.email) {
        throw new ForbiddenError('User does not have an email address');
      }

      // Normalize emails for comparison (case-insensitive)
      const normalizedUserEmail = req.privyUser.email.toLowerCase();
      const normalizedEmail = email.toLowerCase();

      if (normalizedUserEmail !== normalizedEmail) {
        throw new ForbiddenError('You do not own this email');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Verify Wallet Ownership (for Privy users with wallets)
 * Ensures the authenticated user owns the specified wallet
 */
export const verifyPrivyWalletOwnership = (walletParam: string = 'address') => {
  return (req: PrivyAuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.privyUser) {
        throw new UnauthorizedError('Authentication required');
      }

      const walletAddress = req.params[walletParam] || req.body[walletParam];

      if (!walletAddress) {
        throw new ForbiddenError(`Wallet address parameter '${walletParam}' is required`);
      }

      if (!req.privyUser.wallet) {
        throw new ForbiddenError('User does not have a wallet');
      }

      // Normalize addresses for comparison (case-insensitive)
      const normalizedUserAddress = req.privyUser.wallet.toLowerCase();
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

export default authenticatePrivy;
