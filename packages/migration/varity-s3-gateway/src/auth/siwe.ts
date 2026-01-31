import { SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * SIWE (Sign-In with Ethereum) Authentication Module
 * Provides Web3 wallet authentication using EIP-4361 standard
 */

export interface SiweSession {
  address: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

export interface SiweAuthResult {
  valid: boolean;
  address?: string;
  chainId?: number;
  error?: string;
  session?: SiweSession;
}

export interface JwtPayload {
  address: string;
  chainId: number;
  nonce: string;
  iat: number;
  exp: number;
}

/**
 * SIWE nonce storage (in-memory for now, use Redis in production)
 */
const nonceStore = new Map<string, { createdAt: number; used: boolean }>();
const NONCE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * JWT secret (should be loaded from environment variable)
 */
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h'; // 24 hours default

/**
 * Varity L3 Chain ID
 */
const VARITY_CHAIN_ID = 33529;

/**
 * SIWE Authentication Service
 */
export class SiweAuthService {
  /**
   * Generate a random nonce for SIWE authentication
   */
  static generateNonce(): string {
    const nonce = crypto.randomBytes(16).toString('hex');

    // Store nonce with metadata
    nonceStore.set(nonce, {
      createdAt: Date.now(),
      used: false
    });

    // Cleanup expired nonces
    this.cleanupExpiredNonces();

    return nonce;
  }

  /**
   * Verify nonce is valid and unused
   */
  static verifyNonce(nonce: string): boolean {
    const nonceData = nonceStore.get(nonce);

    if (!nonceData) {
      return false;
    }

    // Check if expired
    if (Date.now() - nonceData.createdAt > NONCE_EXPIRY_MS) {
      nonceStore.delete(nonce);
      return false;
    }

    // Check if already used
    if (nonceData.used) {
      return false;
    }

    // Mark as used
    nonceData.used = true;
    return true;
  }

  /**
   * Generate SIWE message for signing
   */
  static async generateSiweMessage(params: {
    address: string;
    domain: string;
    uri: string;
    chainId?: number;
    statement?: string;
    resources?: string[];
  }): Promise<string> {
    const nonce = this.generateNonce();
    const issuedAt = new Date().toISOString();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const siweMessage = new SiweMessage({
      domain: params.domain,
      address: params.address,
      statement: params.statement || 'Sign in to Varity S3 Gateway',
      uri: params.uri,
      version: '1',
      chainId: params.chainId || VARITY_CHAIN_ID,
      nonce,
      issuedAt,
      expirationTime,
      resources: params.resources
    });

    return siweMessage.prepareMessage();
  }

  /**
   * Verify SIWE signature and create session
   */
  static async verifySiweSignature(
    message: string,
    signature: string
  ): Promise<SiweAuthResult> {
    try {
      // Parse SIWE message
      const siweMessage = new SiweMessage(message);

      // Verify nonce
      if (!this.verifyNonce(siweMessage.nonce)) {
        return {
          valid: false,
          error: 'Invalid or expired nonce'
        };
      }

      // Verify signature
      const verificationResult = await siweMessage.verify({ signature });

      if (!verificationResult.success) {
        return {
          valid: false,
          error: String(verificationResult.error) || 'Signature verification failed'
        };
      }

      // Create session
      const session: SiweSession = {
        address: siweMessage.address,
        chainId: siweMessage.chainId,
        nonce: siweMessage.nonce,
        issuedAt: siweMessage.issuedAt || new Date().toISOString(),
        expirationTime: siweMessage.expirationTime!,
        notBefore: siweMessage.notBefore,
        requestId: siweMessage.requestId,
        resources: siweMessage.resources
      };

      return {
        valid: true,
        address: siweMessage.address,
        chainId: siweMessage.chainId,
        session
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Create JWT token from verified wallet address
   */
  static createJwtToken(address: string, chainId: number, nonce: string): string {
    const payload: JwtPayload = {
      address: address.toLowerCase(),
      chainId,
      nonce,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (typeof JWT_EXPIRY === 'string' ? 24 * 60 * 60 : JWT_EXPIRY)
    };

    return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
  }

  /**
   * Verify JWT token and extract wallet address
   */
  static verifyJwtToken(token: string): { valid: boolean; address?: string; chainId?: number; error?: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

      return {
        valid: true,
        address: decoded.address,
        chainId: decoded.chainId
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Token verification failed'
      };
    }
  }

  /**
   * Extract JWT token from Authorization header
   */
  static extractBearerToken(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  /**
   * Cleanup expired nonces (called periodically)
   */
  private static cleanupExpiredNonces(): void {
    const now = Date.now();

    for (const [nonce, data] of nonceStore.entries()) {
      if (now - data.createdAt > NONCE_EXPIRY_MS) {
        nonceStore.delete(nonce);
      }
    }
  }

  /**
   * Get active nonce count (for monitoring)
   */
  static getActiveNonceCount(): number {
    this.cleanupExpiredNonces();
    return nonceStore.size;
  }
}

/**
 * Periodic nonce cleanup (run every 5 minutes)
 */
setInterval(() => {
  const initialSize = nonceStore.size;
  SiweAuthService['cleanupExpiredNonces']();
  const cleanedCount = initialSize - nonceStore.size;

  if (cleanedCount > 0) {
    console.log(`[SIWE] Cleaned up ${cleanedCount} expired nonces`);
  }
}, 5 * 60 * 1000);
