/**
 * Service Account Authentication for GCS Gateway
 * Supports Google Cloud service account JWT authentication
 */

import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { ServiceAccountCredentials } from '../types';

export class ServiceAccountAuth {
  private credentials: ServiceAccountCredentials | null = null;

  constructor(credentialsJson?: string | ServiceAccountCredentials) {
    if (credentialsJson) {
      this.loadCredentials(credentialsJson);
    }
  }

  /**
   * Load service account credentials
   */
  loadCredentials(credentialsJson: string | ServiceAccountCredentials): void {
    try {
      if (typeof credentialsJson === 'string') {
        this.credentials = JSON.parse(credentialsJson);
      } else {
        this.credentials = credentialsJson;
      }

      if (!this.validateCredentials(this.credentials)) {
        throw new Error('Invalid service account credentials format');
      }
    } catch (error: any) {
      throw new Error(`Failed to load service account credentials: ${error.message}`);
    }
  }

  /**
   * Validate service account credentials structure
   */
  private validateCredentials(creds: any): creds is ServiceAccountCredentials {
    return (
      creds &&
      typeof creds === 'object' &&
      creds.type === 'service_account' &&
      creds.project_id &&
      creds.private_key &&
      creds.client_email
    );
  }

  /**
   * Verify service account JWT token
   */
  async verifyToken(token: string): Promise<{
    valid: boolean;
    email?: string;
    error?: string;
  }> {
    if (!this.credentials) {
      return {
        valid: false,
        error: 'Service account credentials not loaded'
      };
    }

    try {
      // Decode without verification first to get the header
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded) {
        return {
          valid: false,
          error: 'Invalid token format'
        };
      }

      // Verify the token signature
      const verified = jwt.verify(token, this.credentials.private_key, {
        algorithms: ['RS256'],
        audience: this.credentials.token_uri
      }) as any;

      // Validate claims
      if (verified.iss !== this.credentials.client_email) {
        return {
          valid: false,
          error: 'Invalid issuer'
        };
      }

      return {
        valid: true,
        email: verified.iss
      };
    } catch (error: any) {
      console.error('Service account token verification error:', error.message);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a signed JWT token for service account
   * This is useful for testing or client-side usage
   */
  generateToken(scopes: string[] = [], expiresIn: number = 3600): string {
    if (!this.credentials) {
      throw new Error('Service account credentials not loaded');
    }

    const now = Math.floor(Date.now() / 1000);

    const payload = {
      iss: this.credentials.client_email,
      sub: this.credentials.client_email,
      aud: this.credentials.token_uri,
      iat: now,
      exp: now + expiresIn,
      scope: scopes.join(' ')
    };

    return jwt.sign(payload, this.credentials.private_key, {
      algorithm: 'RS256',
      keyid: this.credentials.private_key_id
    });
  }

  /**
   * Get service account email
   */
  getEmail(): string | null {
    return this.credentials?.client_email || null;
  }

  /**
   * Get project ID
   */
  getProjectId(): string | null {
    return this.credentials?.project_id || null;
  }
}

/**
 * Service Account Middleware for Express
 */
export function createServiceAccountMiddleware(serviceAccount: ServiceAccountAuth) {
  return async (req: any, res: any, next: any): Promise<void> => {
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
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
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

    const token = match[1];
    const verification = await serviceAccount.verifyToken(token);

    if (!verification.valid) {
      res.status(401).json({
        error: {
          code: 401,
          message: 'Invalid credentials',
          errors: [{
            domain: 'global',
            reason: 'authError',
            message: verification.error || 'Service account authentication failed'
          }]
        }
      });
      return;
    }

    // Attach service account info to request
    req.serviceAccount = {
      email: verification.email
    };

    next();
  };
}
