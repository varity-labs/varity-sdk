import { Request, Response, NextFunction } from 'express';
import { SiweAuthService } from './siwe';
import { AccessControlService, S3Permission } from './acl';
import { buildXMLErrorResponse } from '../utils/xml-builder';

/**
 * Authentication mode configuration
 */
export enum AuthMode {
  IAM_ONLY = 'iam',        // Traditional AWS IAM only
  WALLET_ONLY = 'wallet',  // Web3 wallet only
  HYBRID = 'hybrid'        // Both IAM and wallet (default)
}

/**
 * Extended Request with wallet authentication info
 */
export interface WalletAuthenticatedRequest extends Request {
  walletAuth?: {
    address: string;
    chainId: number;
    authenticated: boolean;
    method: 'wallet' | 'iam';
  };
}

/**
 * Get authentication mode from environment
 */
function getAuthMode(): AuthMode {
  const mode = (process.env.AUTH_MODE || 'hybrid').toLowerCase();

  switch (mode) {
    case 'iam':
      return AuthMode.IAM_ONLY;
    case 'wallet':
      return AuthMode.WALLET_ONLY;
    case 'hybrid':
    default:
      return AuthMode.HYBRID;
  }
}

/**
 * Check if wallet authentication is enabled
 */
export function isWalletAuthEnabled(): boolean {
  const mode = getAuthMode();
  return mode === AuthMode.WALLET_ONLY || mode === AuthMode.HYBRID;
}

/**
 * Check if IAM authentication is enabled
 */
export function isIamAuthEnabled(): boolean {
  const mode = getAuthMode();
  return mode === AuthMode.IAM_ONLY || mode === AuthMode.HYBRID;
}

/**
 * Wallet authentication middleware
 * Supports both Bearer token (JWT) and wallet signature verification
 */
export function walletAuthMiddleware(
  req: WalletAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Check if wallet auth is enabled
    if (!isWalletAuthEnabled()) {
      // Wallet auth disabled, skip
      next();
      return;
    }

    const authHeader = req.headers['authorization'] as string;

    if (!authHeader) {
      // No auth header
      if (getAuthMode() === AuthMode.WALLET_ONLY) {
        res.status(403).send(
          buildXMLErrorResponse(
            'AccessDenied',
            'Wallet authentication required',
            req.path
          )
        );
        return;
      }

      // Hybrid mode, allow to proceed (IAM might handle it)
      next();
      return;
    }

    // Check for Bearer token (JWT)
    if (authHeader.startsWith('Bearer ')) {
      const token = SiweAuthService.extractBearerToken(authHeader);

      if (!token) {
        res.status(403).send(
          buildXMLErrorResponse(
            'InvalidToken',
            'Invalid Bearer token format',
            req.path
          )
        );
        return;
      }

      // Verify JWT token
      const result = SiweAuthService.verifyJwtToken(token);

      if (!result.valid) {
        res.status(403).send(
          buildXMLErrorResponse(
            'InvalidToken',
            result.error || 'Token verification failed',
            req.path
          )
        );
        return;
      }

      // Attach wallet auth info
      req.walletAuth = {
        address: result.address!,
        chainId: result.chainId!,
        authenticated: true,
        method: 'wallet'
      };

      next();
      return;
    }

    // Check for AWS Signature V4 (will be handled by IAM middleware if enabled)
    if (authHeader.startsWith('AWS4-HMAC-SHA256')) {
      if (getAuthMode() === AuthMode.WALLET_ONLY) {
        res.status(403).send(
          buildXMLErrorResponse(
            'AccessDenied',
            'Only wallet authentication is supported in wallet-only mode',
            req.path
          )
        );
        return;
      }

      // Hybrid mode, let IAM middleware handle it
      next();
      return;
    }

    // Unknown auth method
    res.status(403).send(
      buildXMLErrorResponse(
        'InvalidAuthMethod',
        'Unsupported authentication method. Use Bearer token or AWS Signature V4',
        req.path
      )
    );
  } catch (error) {
    console.error('Wallet auth middleware error:', error);
    res.status(500).send(
      buildXMLErrorResponse(
        'InternalError',
        'Authentication error occurred',
        req.path
      )
    );
  }
}

/**
 * Optional wallet authentication middleware
 * Allows unauthenticated requests
 */
export function optionalWalletAuthMiddleware(
  req: WalletAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'] as string;

  if (!authHeader || !isWalletAuthEnabled()) {
    // No auth or wallet auth disabled, allow anonymous
    next();
    return;
  }

  // Auth header present, verify it
  walletAuthMiddleware(req, res, next);
}

/**
 * Check bucket permission middleware
 */
export function checkBucketPermission(permission: S3Permission) {
  return (req: WalletAuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Extract bucket name from path
      const pathParts = req.path.split('/').filter(p => p);
      const bucket = pathParts[0];

      if (!bucket) {
        next();
        return;
      }

      // Check if wallet authenticated
      if (!req.walletAuth?.authenticated) {
        // Not wallet authenticated, might be IAM authenticated
        next();
        return;
      }

      const walletAddress = req.walletAuth.address;

      // Check permission
      if (!AccessControlService.hasPermission(bucket, walletAddress, permission)) {
        res.status(403).send(
          buildXMLErrorResponse(
            'AccessDenied',
            `Access Denied: ${permission} permission required for bucket ${bucket}`,
            req.path
          )
        );
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).send(
        buildXMLErrorResponse(
          'InternalError',
          'Permission check failed',
          req.path
        )
      );
    }
  };
}

/**
 * Check if wallet is bucket owner middleware
 */
export function checkBucketOwner(
  req: WalletAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const pathParts = req.path.split('/').filter(p => p);
    const bucket = pathParts[0];

    if (!bucket) {
      next();
      return;
    }

    // Check if wallet authenticated
    if (!req.walletAuth?.authenticated) {
      next();
      return;
    }

    const policy = AccessControlService.getBucketPolicy(bucket);

    if (!policy) {
      res.status(404).send(
        buildXMLErrorResponse(
          'NoSuchBucket',
          `Bucket ${bucket} does not exist`,
          req.path
        )
      );
      return;
    }

    const walletAddress = req.walletAuth.address;

    if (policy.owner.toLowerCase() !== walletAddress.toLowerCase()) {
      res.status(403).send(
        buildXMLErrorResponse(
          'AccessDenied',
          'Only bucket owner can perform this operation',
          req.path
        )
      );
      return;
    }

    next();
  } catch (error) {
    console.error('Owner check error:', error);
    res.status(500).send(
      buildXMLErrorResponse(
        'InternalError',
        'Owner check failed',
        req.path
      )
    );
  }
}

/**
 * Combined authentication middleware (wallet + IAM)
 * Tries wallet auth first, then falls back to IAM if in hybrid mode
 */
export function hybridAuthMiddleware(iamMiddleware: any) {
  return (req: WalletAuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'] as string;

    if (!authHeader) {
      res.status(403).send(
        buildXMLErrorResponse(
          'AccessDenied',
          'Authentication required',
          req.path
        )
      );
      return;
    }

    // Try wallet auth first
    if (authHeader.startsWith('Bearer ') && isWalletAuthEnabled()) {
      walletAuthMiddleware(req, res, next);
      return;
    }

    // Try IAM auth
    if (authHeader.startsWith('AWS4-HMAC-SHA256') && isIamAuthEnabled()) {
      iamMiddleware(req, res, next);
      return;
    }

    // No valid auth method
    res.status(403).send(
      buildXMLErrorResponse(
        'AccessDenied',
        'Invalid authentication method',
        req.path
      )
    );
  };
}

/**
 * Get authenticated address (wallet or IAM)
 */
export function getAuthenticatedAddress(req: WalletAuthenticatedRequest): string | null {
  if (req.walletAuth?.authenticated) {
    return req.walletAuth.address;
  }

  // Check for IAM auth
  const awsAuth = (req as any).awsAuth;
  if (awsAuth?.authenticated) {
    // Return access key ID as identifier for IAM
    return `iam:${awsAuth.accessKeyId}`;
  }

  return null;
}

/**
 * Get authentication method
 */
export function getAuthMethod(req: WalletAuthenticatedRequest): 'wallet' | 'iam' | null {
  if (req.walletAuth?.authenticated) {
    return 'wallet';
  }

  const awsAuth = (req as any).awsAuth;
  if (awsAuth?.authenticated) {
    return 'iam';
  }

  return null;
}
