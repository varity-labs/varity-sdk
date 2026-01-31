/**
 * Sign-In with Ethereum (SIWE) Authentication for GCS Gateway
 * Verifies wallet signatures for GCS access control
 */

import { SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { GCSPermission } from './permissions';

// Varity L3 Chain configuration
const VARITY_L3_CHAIN_ID = 33529;

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface SIWEMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  resources?: string[];
}

export interface SIWEVerificationResult {
  valid: boolean;
  address?: string;
  chainId?: number;
  message?: SIWEMessage;
  error?: string;
}

export interface WalletAuthToken {
  address: string;
  chainId: number;
  permissions: GCSPermission[];
  expiresAt: Date;
}

export class SIWEAuth {
  private nonces: Map<string, { nonce: string; expiresAt: Date }>;

  constructor() {
    // Nonce storage (in production, use Redis)
    this.nonces = new Map();

    // Clean expired nonces every 5 minutes
    setInterval(() => this.cleanExpiredNonces(), 5 * 60 * 1000);
  }

  /**
   * Generate a new nonce for SIWE message
   */
  generateNonce(address: string): string {
    const nonce = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    this.nonces.set(address.toLowerCase(), { nonce, expiresAt });

    return nonce;
  }

  /**
   * Get stored nonce for address
   */
  private getNonce(address: string): string | null {
    const stored = this.nonces.get(address.toLowerCase());

    if (!stored) {
      return null;
    }

    if (stored.expiresAt < new Date()) {
      this.nonces.delete(address.toLowerCase());
      return null;
    }

    return stored.nonce;
  }

  /**
   * Clean expired nonces
   */
  private cleanExpiredNonces(): void {
    const now = new Date();
    for (const [address, data] of this.nonces.entries()) {
      if (data.expiresAt < now) {
        this.nonces.delete(address);
      }
    }
  }

  /**
   * Generate SIWE message for GCS access
   */
  generateSIWEMessage(
    address: string,
    domain: string,
    uri: string,
    resources: string[] = []
  ): SIWEMessage {
    const nonce = this.generateNonce(address);
    const issuedAt = new Date().toISOString();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    return {
      domain,
      address,
      statement: 'Sign in to Varity GCS Gateway to access decentralized storage',
      uri,
      version: '1',
      chainId: VARITY_L3_CHAIN_ID,
      nonce,
      issuedAt,
      expirationTime,
      resources: resources.length > 0 ? resources : undefined
    };
  }

  /**
   * Format SIWE message for signing
   */
  formatSIWEMessage(message: SIWEMessage): string {
    const parts = [
      `${message.domain} wants you to sign in with your Ethereum account:`,
      message.address,
      '',
      message.statement,
      '',
      `URI: ${message.uri}`,
      `Version: ${message.version}`,
      `Chain ID: ${message.chainId}`,
      `Nonce: ${message.nonce}`,
      `Issued At: ${message.issuedAt}`
    ];

    if (message.expirationTime) {
      parts.push(`Expiration Time: ${message.expirationTime}`);
    }

    if (message.resources && message.resources.length > 0) {
      parts.push('Resources:');
      message.resources.forEach(resource => parts.push(`- ${resource}`));
    }

    return parts.join('\n');
  }

  /**
   * Verify SIWE signature
   */
  async verifySIWE(
    message: SIWEMessage,
    signature: string
  ): Promise<SIWEVerificationResult> {
    try {
      // Create SiweMessage instance
      const formattedMessage = this.formatSIWEMessage(message);
      const siweMessage = new SiweMessage(formattedMessage);

      // Validate chain ID
      if (siweMessage.chainId !== VARITY_L3_CHAIN_ID) {
        return {
          valid: false,
          error: `Invalid chain ID. Expected ${VARITY_L3_CHAIN_ID}, got ${siweMessage.chainId}`
        };
      }

      // Validate nonce
      const storedNonce = this.getNonce(siweMessage.address);
      if (!storedNonce || storedNonce !== siweMessage.nonce) {
        return {
          valid: false,
          error: 'Invalid or expired nonce'
        };
      }

      // Verify signature using siwe library
      const verificationResult = await siweMessage.verify({ signature });

      if (!verificationResult.success) {
        return {
          valid: false,
          error: String(verificationResult.error) || 'Signature verification failed'
        };
      }

      // Check if recovered address matches claimed address
      if (siweMessage.address.toLowerCase() !== message.address.toLowerCase()) {
        return {
          valid: false,
          error: 'Signature does not match claimed address'
        };
      }

      // Clear used nonce
      this.nonces.delete(message.address.toLowerCase());

      return {
        valid: true,
        address: message.address,
        chainId: message.chainId,
        message
      };
    } catch (error: any) {
      console.error('SIWE verification error:', error.message);
      return {
        valid: false,
        error: error.message || 'Signature verification failed'
      };
    }
  }

  /**
   * Generate JWT token from verified wallet
   */
  generateJWT(address: string, permissions: GCSPermission[] = []): string {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const payload = {
      address: address.toLowerCase(),
      chainId: VARITY_L3_CHAIN_ID,
      permissions,
      expiresAt: expiresAt.toISOString(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
    };

    return jwt.sign(payload, JWT_SECRET, {
      algorithm: 'HS256'
    });
  }

  /**
   * Verify JWT token
   */
  verifyJWT(token: string): WalletAuthToken | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256']
      }) as WalletAuthToken;

      // Check expiration
      if (decoded.expiresAt && new Date(decoded.expiresAt) < new Date()) {
        return null;
      }

      return decoded;
    } catch (error: any) {
      console.error('JWT verification error:', error.message);
      return null;
    }
  }

  /**
   * Refresh JWT token
   */
  refreshJWT(token: string): string | null {
    const decoded = this.verifyJWT(token);

    if (!decoded) {
      return null;
    }

    // Generate new token with same permissions
    return this.generateJWT(decoded.address, decoded.permissions);
  }

  /**
   * Extract wallet address from JWT token
   */
  extractAddress(token: string): string | null {
    const decoded = this.verifyJWT(token);
    return decoded ? decoded.address : null;
  }

  /**
   * Check if wallet has permission
   */
  hasPermission(token: string, permission: GCSPermission): boolean {
    const decoded = this.verifyJWT(token);

    if (!decoded) {
      return false;
    }

    return decoded.permissions.includes(permission) || decoded.permissions.includes('*');
  }
}

/**
 * SIWE Middleware for Express
 */
export async function siweMiddleware(
  req: any,
  res: any,
  next: any
): Promise<void> {
  const siweAuth = new SIWEAuth();
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
  const walletAuth = siweAuth.verifyJWT(token);

  if (!walletAuth) {
    res.status(401).json({
      error: {
        code: 401,
        message: 'Invalid credentials',
        errors: [{
          domain: 'global',
          reason: 'authError',
          message: 'Invalid or expired wallet authentication token'
        }]
      }
    });
    return;
  }

  // Attach wallet info to request
  req.wallet = {
    address: walletAuth.address,
    chainId: walletAuth.chainId,
    permissions: walletAuth.permissions
  };

  next();
}

export default SIWEAuth;
