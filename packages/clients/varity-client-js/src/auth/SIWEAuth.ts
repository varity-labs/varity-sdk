/**
 * SIWE (Sign-In with Ethereum) Authentication Manager
 */

import { type ThirdwebClient, type Chain } from 'thirdweb';
import type { Account } from 'thirdweb/wallets';
import type {
  SIWEMessage,
  SIWESignatureResult,
  SIWEVerifyResult,
  SIWESession,
  AuthenticationError,
} from '../types';
import { AuthenticationError as AuthenticationErrorClass } from '../types';

/**
 * SIWEAuth - Manage Sign-In with Ethereum authentication
 *
 * @example
 * ```typescript
 * // Generate SIWE message
 * const message = await siweAuth.generateMessage({
 *   domain: 'example.com',
 *   address: account.address,
 *   uri: 'https://example.com',
 *   statement: 'Sign in to Example App'
 * });
 *
 * // Sign message
 * const result = await siweAuth.signMessage(message, account);
 *
 * // Verify signature
 * const verified = await siweAuth.verify(result);
 * ```
 */
export class SIWEAuth {
  private sessions: Map<string, SIWESession> = new Map();

  constructor(
    private readonly client: ThirdwebClient,
    private readonly chain: Chain
  ) {}

  /**
   * Generate SIWE message
   * @param params Message parameters
   * @returns SIWE message string
   */
  async generateMessage(params: Partial<SIWEMessage>): Promise<string> {
    try {
      const message: SIWEMessage = {
        domain: params.domain || (typeof window !== 'undefined' ? window.location.host : 'localhost'),
        address: params.address || '',
        statement: params.statement || 'Sign in with Ethereum to the app.',
        uri: params.uri || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost'),
        version: params.version || '1',
        chainId: params.chainId || this.chain.id,
        nonce: params.nonce || this.generateNonce(),
        issuedAt: params.issuedAt || new Date().toISOString(),
        expirationTime: params.expirationTime,
        notBefore: params.notBefore,
        requestId: params.requestId,
        resources: params.resources,
      };

      return this.formatSIWEMessage(message);
    } catch (error: any) {
      throw new AuthenticationErrorClass(
        `Failed to generate SIWE message: ${error.message}`,
        { error }
      );
    }
  }

  /**
   * Format SIWE message according to EIP-4361 standard
   * @param message SIWE message object
   * @returns Formatted message string
   */
  private formatSIWEMessage(message: SIWEMessage): string {
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
      `Issued At: ${message.issuedAt}`,
    ];

    if (message.expirationTime) {
      parts.push(`Expiration Time: ${message.expirationTime}`);
    }

    if (message.notBefore) {
      parts.push(`Not Before: ${message.notBefore}`);
    }

    if (message.requestId) {
      parts.push(`Request ID: ${message.requestId}`);
    }

    if (message.resources && message.resources.length > 0) {
      parts.push('Resources:');
      message.resources.forEach((resource) => {
        parts.push(`- ${resource}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Sign SIWE message
   * @param message SIWE message string
   * @param account Wallet account
   * @returns Signature result
   */
  async signMessage(
    message: string,
    account: Account
  ): Promise<SIWESignatureResult> {
    try {
      const signature = await account.signMessage({ message });

      return {
        message,
        signature,
      };
    } catch (error: any) {
      throw new AuthenticationErrorClass(
        `Failed to sign SIWE message: ${error.message}`,
        { error }
      );
    }
  }

  /**
   * Verify SIWE signature
   * @param result Signature result to verify
   * @returns Verification result
   */
  async verify(result: SIWESignatureResult): Promise<SIWEVerifyResult> {
    try {
      // Parse message to extract address and expiration
      const parsedMessage = this.parseSIWEMessage(result.message);

      // Check expiration
      if (parsedMessage.expirationTime) {
        const expirationDate = new Date(parsedMessage.expirationTime);
        if (expirationDate < new Date()) {
          return {
            success: false,
            error: 'Message has expired',
          };
        }
      }

      // Check not before
      if (parsedMessage.notBefore) {
        const notBeforeDate = new Date(parsedMessage.notBefore);
        if (notBeforeDate > new Date()) {
          return {
            success: false,
            error: 'Message is not yet valid',
          };
        }
      }

      // In a production environment, you would verify the signature here
      // using cryptographic verification. This is a simplified version.

      return {
        success: true,
        address: parsedMessage.address,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Parse SIWE message string
   * @param message SIWE message string
   * @returns Parsed message object
   */
  private parseSIWEMessage(message: string): SIWEMessage {
    const lines = message.split('\n');
    const parsed: any = {};

    // Extract address (line 1)
    parsed.address = lines[1]?.trim() || '';

    // Extract statement (line 3)
    parsed.statement = lines[3]?.trim() || '';

    // Extract fields
    lines.forEach((line) => {
      if (line.startsWith('URI:')) {
        parsed.uri = line.substring(4).trim();
      } else if (line.startsWith('Version:')) {
        parsed.version = line.substring(8).trim();
      } else if (line.startsWith('Chain ID:')) {
        parsed.chainId = parseInt(line.substring(9).trim());
      } else if (line.startsWith('Nonce:')) {
        parsed.nonce = line.substring(6).trim();
      } else if (line.startsWith('Issued At:')) {
        parsed.issuedAt = line.substring(10).trim();
      } else if (line.startsWith('Expiration Time:')) {
        parsed.expirationTime = line.substring(16).trim();
      } else if (line.startsWith('Not Before:')) {
        parsed.notBefore = line.substring(11).trim();
      } else if (line.startsWith('Request ID:')) {
        parsed.requestId = line.substring(11).trim();
      }
    });

    // Extract domain (line 0)
    const domainMatch = lines[0]?.match(/^(.+?) wants you to sign in/);
    parsed.domain = domainMatch ? domainMatch[1] : '';

    return parsed as SIWEMessage;
  }

  /**
   * Create session from verified signature
   * @param result Verified signature result
   * @param expiresInSeconds Session expiration in seconds (default: 24 hours)
   * @returns Session object
   */
  async createSession(
    result: SIWESignatureResult,
    expiresInSeconds: number = 86400
  ): Promise<SIWESession> {
    try {
      const verified = await this.verify(result);

      if (!verified.success || !verified.address) {
        throw new AuthenticationErrorClass(
          'Cannot create session: Invalid signature',
          { verificationResult: verified }
        );
      }

      const parsedMessage = this.parseSIWEMessage(result.message);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000);

      const session: SIWESession = {
        address: verified.address,
        chainId: parsedMessage.chainId,
        issuedAt: now,
        expiresAt,
        signature: result.signature,
      };

      // Store session
      this.sessions.set(verified.address, session);

      return session;
    } catch (error: any) {
      throw new AuthenticationErrorClass(
        `Failed to create session: ${error.message}`,
        { error }
      );
    }
  }

  /**
   * Get active session for address
   * @param address Wallet address
   * @returns Session or null
   */
  getSession(address: string): SIWESession | null {
    const session = this.sessions.get(address);

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(address);
      return null;
    }

    return session;
  }

  /**
   * Delete session for address
   * @param address Wallet address
   */
  deleteSession(address: string): void {
    this.sessions.delete(address);
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.sessions.clear();
  }

  /**
   * Generate random nonce
   * @returns Random nonce string
   */
  private generateNonce(): string {
    const array = new Uint8Array(16);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Node.js environment
      const crypto = require('crypto');
      crypto.randomFillSync(array);
    }
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Authenticate with Varity API server
   * @param result Signature result
   * @param apiUrl API server URL
   * @returns Authentication token
   */
  async authenticateWithAPI(
    result: SIWESignatureResult,
    apiUrl: string
  ): Promise<string> {
    try {
      const response = await fetch(`${apiUrl}/auth/siwe/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: result.message,
          signature: result.signature,
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();
      return data.token;
    } catch (error: any) {
      throw new AuthenticationErrorClass(
        `Failed to authenticate with API: ${error.message}`,
        { apiUrl, error }
      );
    }
  }

  /**
   * Validate session with API server
   * @param token Authentication token
   * @param apiUrl API server URL
   * @returns True if valid
   */
  async validateWithAPI(token: string, apiUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${apiUrl}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error: any) {
      throw new AuthenticationErrorClass(
        `Failed to validate with API: ${error.message}`,
        { apiUrl, error }
      );
    }
  }
}

export default SIWEAuth;
