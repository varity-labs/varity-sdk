/**
 * Authentication Controller
 * Handles wallet authentication endpoints (SIWE)
 */

import { Request, Response } from 'express';
import { SIWEAuth } from '../auth/siwe';
import { PermissionManager } from '../auth/permissions';
import { SIWEAuthRequest, SIWEAuthResponse } from '../types';

export class AuthController {
  private siweAuth: SIWEAuth;
  private permissionManager: PermissionManager;

  constructor(permissionManager?: PermissionManager) {
    this.siweAuth = new SIWEAuth();
    this.permissionManager = permissionManager || new PermissionManager();
  }

  /**
   * Generate nonce for SIWE
   * GET /auth/nonce?address={address}
   */
  getNonce = (req: Request, res: Response): void => {
    try {
      const address = req.query.address as string;

      if (!address) {
        res.status(400).json({
          error: {
            code: 400,
            message: 'Bad request',
            errors: [{
              domain: 'global',
              reason: 'invalidParameter',
              message: 'address parameter is required'
            }]
          }
        });
        return;
      }

      const nonce = this.siweAuth.generateNonce(address);

      res.json({
        nonce,
        address: address.toLowerCase(),
        chainId: 33529
      });
    } catch (error: any) {
      console.error('Error generating nonce:', error);
      res.status(500).json({
        error: {
          code: 500,
          message: 'Internal server error',
          errors: [{
            domain: 'global',
            reason: 'internalError',
            message: 'Failed to generate nonce'
          }]
        }
      });
    }
  };

  /**
   * Generate SIWE message
   * POST /auth/message
   */
  generateMessage = (req: Request, res: Response): void => {
    try {
      const { address, resources } = req.body;

      if (!address) {
        res.status(400).json({
          error: {
            code: 400,
            message: 'Bad request',
            errors: [{
              domain: 'global',
              reason: 'invalidParameter',
              message: 'address is required'
            }]
          }
        });
        return;
      }

      const domain = req.get('host') || 'gcs.varity.dev';
      const uri = `${req.protocol}://${domain}`;

      const message = this.siweAuth.generateSIWEMessage(
        address,
        domain,
        uri,
        resources
      );

      const formattedMessage = this.siweAuth.formatSIWEMessage(message);

      res.json({
        message,
        formattedMessage
      });
    } catch (error: any) {
      console.error('Error generating SIWE message:', error);
      res.status(500).json({
        error: {
          code: 500,
          message: 'Internal server error',
          errors: [{
            domain: 'global',
            reason: 'internalError',
            message: 'Failed to generate SIWE message'
          }]
        }
      });
    }
  };

  /**
   * Verify SIWE signature and issue JWT token
   * POST /auth/verify
   */
  verifySignature = async (req: Request, res: Response): Promise<void> => {
    try {
      const authRequest = req.body as SIWEAuthRequest;

      if (!authRequest.message || !authRequest.signature) {
        res.status(400).json({
          error: {
            code: 400,
            message: 'Bad request',
            errors: [{
              domain: 'global',
              reason: 'invalidParameter',
              message: 'message and signature are required'
            }]
          }
        });
        return;
      }

      // Verify SIWE signature
      const verification = await this.siweAuth.verifySIWE(
        authRequest.message,
        authRequest.signature
      );

      if (!verification.valid) {
        res.status(401).json({
          error: {
            code: 401,
            message: 'Invalid signature',
            errors: [{
              domain: 'global',
              reason: 'authError',
              message: verification.error || 'Signature verification failed'
            }]
          }
        });
        return;
      }

      // Get wallet permissions
      const walletPerms = this.permissionManager.getWalletPermissions(verification.address!);

      if (!walletPerms) {
        res.status(403).json({
          error: {
            code: 403,
            message: 'Permission denied',
            errors: [{
              domain: 'global',
              reason: 'forbidden',
              message: 'Wallet not authorized for GCS access. Please contact administrator.'
            }]
          }
        });
        return;
      }

      // Generate JWT token
      const token = this.siweAuth.generateJWT(
        verification.address!,
        walletPerms.globalPermissions
      );

      const response: SIWEAuthResponse = {
        token,
        address: verification.address!,
        chainId: verification.chainId!,
        expiresIn: 86400 // 24 hours
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error verifying signature:', error);
      res.status(500).json({
        error: {
          code: 500,
          message: 'Internal server error',
          errors: [{
            domain: 'global',
            reason: 'internalError',
            message: 'Failed to verify signature'
          }]
        }
      });
    }
  };

  /**
   * Refresh JWT token
   * POST /auth/refresh
   */
  refreshToken = (req: Request, res: Response): void => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          error: {
            code: 400,
            message: 'Bad request',
            errors: [{
              domain: 'global',
              reason: 'invalidParameter',
              message: 'token is required'
            }]
          }
        });
        return;
      }

      const newToken = this.siweAuth.refreshJWT(token);

      if (!newToken) {
        res.status(401).json({
          error: {
            code: 401,
            message: 'Invalid token',
            errors: [{
              domain: 'global',
              reason: 'authError',
              message: 'Token refresh failed'
            }]
          }
        });
        return;
      }

      res.json({
        token: newToken,
        expiresIn: 86400
      });
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      res.status(500).json({
        error: {
          code: 500,
          message: 'Internal server error',
          errors: [{
            domain: 'global',
            reason: 'internalError',
            message: 'Failed to refresh token'
          }]
        }
      });
    }
  };

  /**
   * Get wallet permissions
   * GET /auth/permissions
   */
  getPermissions = (req: Request, res: Response): void => {
    try {
      const auth = (req as any).auth;

      if (!auth || auth.method !== 'wallet' || !auth.address) {
        res.status(401).json({
          error: {
            code: 401,
            message: 'Unauthorized',
            errors: [{
              domain: 'global',
              reason: 'authError',
              message: 'Wallet authentication required'
            }]
          }
        });
        return;
      }

      const permissions = this.permissionManager.getWalletPermissions(auth.address);

      if (!permissions) {
        res.status(404).json({
          error: {
            code: 404,
            message: 'Not found',
            errors: [{
              domain: 'global',
              reason: 'notFound',
              message: 'No permissions found for wallet'
            }]
          }
        });
        return;
      }

      res.json({
        address: permissions.address,
        buckets: permissions.buckets,
        globalPermissions: permissions.globalPermissions,
        industry: permissions.industry,
        customerId: permissions.customerId,
        isAdmin: permissions.isAdmin
      });
    } catch (error: any) {
      console.error('Error getting permissions:', error);
      res.status(500).json({
        error: {
          code: 500,
          message: 'Internal server error',
          errors: [{
            domain: 'global',
            reason: 'internalError',
            message: 'Failed to retrieve permissions'
          }]
        }
      });
    }
  };

  /**
   * Get storage layer access
   * GET /auth/storage-layers
   */
  getStorageLayers = (req: Request, res: Response): void => {
    try {
      const auth = (req as any).auth;

      if (!auth || auth.method !== 'wallet' || !auth.address) {
        res.status(401).json({
          error: {
            code: 401,
            message: 'Unauthorized',
            errors: [{
              domain: 'global',
              reason: 'authError',
              message: 'Wallet authentication required'
            }]
          }
        });
        return;
      }

      const layers = this.permissionManager.getStorageLayerAccess(auth.address);

      res.json({
        address: auth.address,
        storageLayerAccess: {
          varityInternal: layers.varityInternal,
          industryRag: layers.industryRag,
          customerData: layers.customerData
        }
      });
    } catch (error: any) {
      console.error('Error getting storage layers:', error);
      res.status(500).json({
        error: {
          code: 500,
          message: 'Internal server error',
          errors: [{
            domain: 'global',
            reason: 'internalError',
            message: 'Failed to retrieve storage layer access'
          }]
        }
      });
    }
  };
}

export default AuthController;
