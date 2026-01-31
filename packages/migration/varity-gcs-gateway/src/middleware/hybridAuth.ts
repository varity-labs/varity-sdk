/**
 * Hybrid Authentication Middleware
 * Supports three authentication modes:
 * 1. Google OAuth2 (preserve existing)
 * 2. Web3 Wallet signatures (new)
 * 3. Hybrid mode (either method)
 */

import { Request, Response, NextFunction } from 'express';
import { OAuth2Verifier } from '../auth/oauth2';
import { SIWEAuth } from '../auth/siwe';
import { ServiceAccountAuth } from '../auth/service-account';
import { PermissionManager, GCSPermission } from '../auth/permissions';

export type AuthMode = 'oauth' | 'wallet' | 'hybrid';
export type AuthMethod = 'oauth2' | 'service-account' | 'wallet';

export interface AuthConfig {
  mode: AuthMode;
  walletAuthEnabled: boolean;
  serviceAccount?: ServiceAccountAuth;
  permissionManager?: PermissionManager;
}

export interface AuthenticatedUser {
  method: AuthMethod;
  email?: string;
  userId?: string;
  address?: string;
  chainId?: number;
  permissions?: GCSPermission[];
  scopes?: string[];
}

/**
 * Create hybrid authentication middleware
 */
export function createHybridAuthMiddleware(config: AuthConfig) {
  const siweAuth = new SIWEAuth();
  const permissionManager = config.permissionManager || new PermissionManager();

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: {
          code: 401,
          message: 'Unauthorized',
          errors: [{
            domain: 'global',
            reason: 'required',
            message: 'Authorization header required'
          }]
        }
      });
      return;
    }

    // Extract Bearer token
    const token = OAuth2Verifier.extractToken(authHeader);

    if (!token) {
      res.status(401).json({
        error: {
          code: 401,
          message: 'Invalid authorization header format',
          errors: [{
            domain: 'global',
            reason: 'authError',
            message: 'Authorization header must be in format: Bearer <token>'
          }]
        }
      });
      return;
    }

    let authenticated = false;
    let user: AuthenticatedUser | null = null;
    const errors: string[] = [];

    // Mode 1: Try OAuth2 authentication
    if (config.mode === 'oauth' || config.mode === 'hybrid') {
      const oauth2Result = await OAuth2Verifier.verify(token);

      if (oauth2Result.valid) {
        user = {
          method: 'oauth2',
          email: oauth2Result.email,
          userId: oauth2Result.userId,
          scopes: oauth2Result.scopes
        };
        authenticated = true;
      } else if (config.mode === 'oauth') {
        // OAuth-only mode, fail here
        res.status(401).json({
          error: {
            code: 401,
            message: 'Invalid credentials',
            errors: [{
              domain: 'global',
              reason: 'authError',
              message: oauth2Result.error || 'OAuth2 authentication failed'
            }]
          }
        });
        return;
      } else {
        errors.push(`OAuth2: ${oauth2Result.error}`);
      }
    }

    // Mode 2: Try service account authentication
    if (!authenticated && config.serviceAccount && (config.mode === 'oauth' || config.mode === 'hybrid')) {
      const saResult = await config.serviceAccount.verifyToken(token);

      if (saResult.valid) {
        user = {
          method: 'service-account',
          email: saResult.email,
          scopes: ['https://www.googleapis.com/auth/devstorage.full_control']
        };
        authenticated = true;
      } else {
        errors.push(`Service Account: ${saResult.error}`);
      }
    }

    // Mode 3: Try wallet authentication
    if (!authenticated && config.walletAuthEnabled && (config.mode === 'wallet' || config.mode === 'hybrid')) {
      const walletAuth = siweAuth.verifyJWT(token);

      if (walletAuth) {
        user = {
          method: 'wallet',
          address: walletAuth.address,
          chainId: walletAuth.chainId,
          permissions: walletAuth.permissions
        };
        authenticated = true;
      } else if (config.mode === 'wallet') {
        // Wallet-only mode, fail here
        res.status(401).json({
          error: {
            code: 401,
            message: 'Invalid credentials',
            errors: [{
              domain: 'global',
              reason: 'authError',
              message: 'Wallet authentication failed'
            }]
          }
        });
        return;
      } else {
        errors.push('Wallet: Invalid or expired token');
      }
    }

    // If no authentication method succeeded
    if (!authenticated || !user) {
      res.status(401).json({
        error: {
          code: 401,
          message: 'Authentication failed',
          errors: [{
            domain: 'global',
            reason: 'authError',
            message: `All authentication methods failed: ${errors.join('; ')}`
          }]
        }
      });
      return;
    }

    // Attach user info to request
    (req as any).auth = user;

    // Attach permission manager for wallet auth
    if (user.method === 'wallet' && user.address) {
      (req as any).permissionManager = permissionManager;
      (req as any).checkPermission = (bucket: string, operation: GCSPermission) => {
        return permissionManager.checkBucketPermission(user.address!, bucket, operation);
      };
    }

    next();
  };
}

/**
 * Permission checking middleware for specific operations
 */
export function requirePermission(operation: GCSPermission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = (req as any).auth as AuthenticatedUser;

    if (!auth) {
      res.status(401).json({
        error: {
          code: 401,
          message: 'Unauthorized',
          errors: [{
            domain: 'global',
            reason: 'required',
            message: 'Authentication required'
          }]
        }
      });
      return;
    }

    // OAuth2 and service account users have full access
    if (auth.method === 'oauth2' || auth.method === 'service-account') {
      next();
      return;
    }

    // Wallet users need permission check
    if (auth.method === 'wallet') {
      const checkPermission = (req as any).checkPermission;
      const bucket = req.params.bucket;

      if (!checkPermission || !bucket) {
        next();
        return;
      }

      const permissionCheck = checkPermission(bucket, operation);

      if (!permissionCheck.allowed) {
        res.status(403).json({
          error: {
            code: 403,
            message: 'Permission denied',
            errors: [{
              domain: 'global',
              reason: 'forbidden',
              message: permissionCheck.reason || `Operation '${operation}' not allowed`
            }]
          }
        });
        return;
      }

      // Attach storage layer info
      (req as any).storageLayer = permissionCheck.storageLayer;
    }

    next();
  };
}

/**
 * Get authentication mode from environment
 */
export function getAuthMode(): AuthMode {
  const mode = process.env.AUTH_MODE?.toLowerCase();

  if (mode === 'oauth' || mode === 'wallet' || mode === 'hybrid') {
    return mode;
  }

  // Default to hybrid mode
  return 'hybrid';
}

/**
 * Check if wallet authentication is enabled
 */
export function isWalletAuthEnabled(): boolean {
  return process.env.WALLET_AUTH_ENABLED !== 'false';
}

/**
 * Log authentication info
 */
export function logAuth(req: Request): void {
  const auth = (req as any).auth as AuthenticatedUser;

  if (!auth) {
    return;
  }

  const info: any = {
    method: auth.method,
    timestamp: new Date().toISOString(),
    path: req.path,
    ip: req.ip
  };

  switch (auth.method) {
    case 'oauth2':
      info.email = auth.email;
      info.userId = auth.userId;
      break;
    case 'service-account':
      info.email = auth.email;
      break;
    case 'wallet':
      info.address = auth.address;
      info.chainId = auth.chainId;
      break;
  }

  console.log('[Auth]', JSON.stringify(info));
}

/**
 * Authentication logging middleware
 */
export function authLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  logAuth(req);
  next();
}

export default createHybridAuthMiddleware;
