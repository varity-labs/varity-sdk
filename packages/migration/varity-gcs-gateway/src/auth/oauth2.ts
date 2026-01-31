/**
 * OAuth2 Authentication for GCS Gateway
 * Verifies OAuth2 tokens against Google's token endpoint
 */

import axios from 'axios';
import { OAuth2ValidationResult, OAuth2Token } from '../types';

export class OAuth2Verifier {
  private static readonly GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
  private static readonly GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

  /**
   * Verify OAuth2 access token with Google
   */
  static async verify(token: string): Promise<OAuth2ValidationResult> {
    try {
      // Verify token with Google's tokeninfo endpoint
      const response = await axios.get(this.GOOGLE_TOKEN_INFO_URL, {
        params: { access_token: token },
        timeout: 5000
      });

      const data = response.data;

      // Check if token is valid and not expired
      if (!data.email || !data.exp) {
        return {
          valid: false,
          error: 'Invalid token response'
        };
      }

      const expiresAt = new Date(parseInt(data.exp) * 1000);
      if (expiresAt < new Date()) {
        return {
          valid: false,
          error: 'Token expired'
        };
      }

      return {
        valid: true,
        email: data.email,
        userId: data.sub,
        scopes: data.scope ? data.scope.split(' ') : [],
        expiresAt
      };
    } catch (error: any) {
      console.error('OAuth2 verification error:', error.message);
      return {
        valid: false,
        error: error.response?.data?.error_description || error.message
      };
    }
  }

  /**
   * Get user information from OAuth2 token
   */
  static async getUserInfo(token: string): Promise<any> {
    try {
      const response = await axios.get(this.GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 5000
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to get user info:', error.message);
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    // Support both "Bearer TOKEN" and "OAuth TOKEN" formats
    const match = authHeader.match(/^(?:Bearer|OAuth)\s+(.+)$/i);
    return match ? match[1] : null;
  }

  /**
   * Validate required scopes
   */
  static validateScopes(
    tokenScopes: string[],
    requiredScopes: string[]
  ): boolean {
    return requiredScopes.every(scope =>
      tokenScopes.some(tokenScope =>
        tokenScope === scope || tokenScope.startsWith(scope)
      )
    );
  }
}

/**
 * OAuth2 Middleware for Express
 */
export async function oauth2Middleware(
  req: any,
  res: any,
  next: any
): Promise<void> {
  const token = OAuth2Verifier.extractToken(req.headers.authorization);

  if (!token) {
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

  const validation = await OAuth2Verifier.verify(token);

  if (!validation.valid) {
    res.status(401).json({
      error: {
        code: 401,
        message: 'Invalid credentials',
        errors: [{
          domain: 'global',
          reason: 'authError',
          message: validation.error || 'Token validation failed'
        }]
      }
    });
    return;
  }

  // Attach user info to request
  req.user = {
    email: validation.email,
    userId: validation.userId,
    scopes: validation.scopes
  };

  next();
}
