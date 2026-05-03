/**
 * Varity SDK - Managed Credentials
 *
 * Credentials are fully managed by Varity. Developers never need to obtain
 * or configure authentication credentials manually.
 *
 * How it works:
 * 1. During development: Shared credentials are used automatically
 * 2. During deployment: `varitykit app deploy` injects production credentials
 * 3. The Varity Credential Proxy handles all credential provisioning
 *
 * @example
 * ```tsx
 * import { PrivyStack } from '@varity-labs/ui-kit';
 *
 * // Works immediately - no configuration needed
 * <PrivyStack>
 *   <YourApp />
 * </PrivyStack>
 * ```
 */

/**
 * ============================================================================
 * SECURITY: Dev JWT Secret
 * ============================================================================
 *
 * This secret is INTENTIONALLY public. It is used ONLY for development tokens
 * that access the shared `app_varity_dev` schema (sandboxed, rate-limited).
 *
 * CRITICAL: Production tokens MUST be signed with a DIFFERENT, private secret
 * managed by the Varity Credential Proxy. The DB Proxy MUST reject tokens
 * signed with this dev secret when accessed outside the dev schema.
 *
 * Why this matters: If the dev token were signed with the same secret as
 * production tokens, an attacker could brute-force this publicly-known dev
 * secret offline and then forge tokens for ANY app's production database.
 *
 * @internal
 */
export const VARITY_DEV_JWT_SECRET = 'varity-dev-public-key-not-for-production';

/**
 * Base64url encode a string or Uint8Array (no padding, URL-safe).
 * Works in both Node.js and browser environments.
 * @internal
 */
function base64urlEncode(input: string | Uint8Array): string {
  let base64: string;

  if (typeof input === 'string') {
    // In Node.js, use Buffer; in browser, use TextEncoder + btoa
    if (typeof Buffer !== 'undefined') {
      base64 = Buffer.from(input, 'utf-8').toString('base64');
    } else {
      base64 = btoa(input);
    }
  } else {
    // Uint8Array (for HMAC output)
    if (typeof Buffer !== 'undefined') {
      base64 = Buffer.from(input).toString('base64');
    } else {
      // Browser: convert Uint8Array to binary string then btoa
      let binary = '';
      for (let i = 0; i < input.length; i++) {
        binary += String.fromCharCode(input[i]);
      }
      base64 = btoa(binary);
    }
  }

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Compute HMAC-SHA256 and return the raw bytes as Uint8Array.
 * Uses Node.js crypto when available, falls back to Web Crypto API.
 * @internal
 */
async function hmacSha256(key: string, message: string): Promise<Uint8Array> {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    // Web Crypto API (browser + modern Node.js)
    const enc = new TextEncoder();
    const cryptoKey = await globalThis.crypto.subtle.importKey(
      'raw',
      enc.encode(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await globalThis.crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
    return new Uint8Array(sig);
  }

  // Fallback: Node.js crypto module (dynamic import to avoid bundler issues)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createHmac } = await import('crypto');
  const hmac = createHmac('sha256', key);
  hmac.update(message);
  return new Uint8Array(hmac.digest());
}

/**
 * Generate a signed JWT token using HS256.
 *
 * This is a minimal JWT implementation for generating dev tokens at runtime.
 * It avoids adding a `jsonwebtoken` dependency to the SDK.
 *
 * @internal
 */
async function generateJwt(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };

  const headerB64 = base64urlEncode(JSON.stringify(header));
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const signatureBytes = await hmacSha256(secret, signingInput);
  const signatureB64 = base64urlEncode(signatureBytes);

  return `${signingInput}.${signatureB64}`;
}

/**
 * Cached dev token promise (generated once, reused).
 * @internal
 */
let _devTokenPromise: Promise<string> | null = null;

/**
 * Get the development JWT token.
 *
 * The token is generated at runtime using a PUBLICLY-KNOWN dev-only secret.
 * This ensures that even if someone extracts this token, they cannot use the
 * secret to forge production tokens (which use a different, private secret).
 *
 * @internal
 */
export function getDevToken(): Promise<string> {
  if (_devTokenPromise === null) {
    const now = Math.floor(Date.now() / 1000);
    _devTokenPromise = generateJwt(
      {
        appId: 'varity_dev',
        iss: 'varity.so',
        iat: now,
        exp: now + 315360000, // 10 years from generation time
      },
      VARITY_DEV_JWT_SECRET
    );
  }
  return _devTokenPromise;
}

/**
 * Varity Credential Proxy URL
 *
 * The CLI fetches infrastructure credentials from this service during deployment.
 * Developers never need to call this directly.
 *
 * @internal Used by varitykit CLI
 */
export const VARITY_CREDENTIAL_PROXY_URL =
  process.env.VARITY_CREDENTIAL_PROXY_URL ||
  'http://j8t2mv79s9arr5pb6b4nkjmoh4.ingress.akash.tagus.host';

/**
 * Varity-managed credentials
 *
 * These credentials are managed by Varity's Credential Proxy and used automatically.
 * Developers do NOT need to obtain or configure these — they are handled internally
 * by the SDK and CLI.
 *
 * @internal Used by @varity-labs/ui-kit providers
 */
export const VARITY_DEV_CREDENTIALS = {
  /**
   * Authentication provider configuration (managed by Varity)
   */
  privy: {
    /**
     * App ID for authentication
     * Override: VARITY_PRIVY_APP_ID environment variable
     */
    appId: process.env.VARITY_PRIVY_APP_ID || 'cmhwbozxu004fjr0cicfz0tf8',
  },

  /**
   * Infrastructure provider configuration (managed by Varity)
   */
  thirdweb: {
    /**
     * Client ID for infrastructure services
     * Override: VARITY_THIRDWEB_CLIENT_ID environment variable
     */
    clientId: process.env.VARITY_THIRDWEB_CLIENT_ID || 'a35636133eb5ec6f30eb9f4c15fce2f3',
  },

  /**
   * Rate limiting information
   */
  rateLimits: {
    privy: {
      monthlyActiveUsers: 1000,
      note: 'Shared across all developers using Varity dev credentials',
    },
    thirdweb: {
      requestsPerSecond: 100,
      note: 'Shared across all developers using Varity dev credentials',
    },
  },
} as const;

/**
 * Varity-managed database credentials
 *
 * These credentials provide immediate database access during development.
 * The dev token grants access to a shared `app_varity_dev` schema — each
 * developer's data is isolated from production apps.
 *
 * In production, `varitykit app deploy` generates unique per-app credentials.
 *
 * @internal Used by @varity-labs/sdk Database class
 */
export const VARITY_DEV_DB_CREDENTIALS = {
  /**
   * Default app ID for development
   * Override: NEXT_PUBLIC_VARITY_APP_ID or VARITY_APP_ID environment variable
   */
  appId: 'varity_dev',

  /**
   * Get the development JWT token for database access.
   *
   * SECURITY: This token is generated at runtime using a publicly-known
   * dev-only secret (VARITY_DEV_JWT_SECRET). It is NOT signed with the
   * production secret. This prevents brute-force attacks on the dev token
   * from compromising production databases.
   *
   * - Grants access to `app_varity_dev` schema only (schema isolation)
   * - 10-year expiry (development convenience)
   * - Rate limited: 100 req/min per IP
   * Override: NEXT_PUBLIC_VARITY_APP_TOKEN environment variable
   */
  getToken: getDevToken,
} as const;

/**
 * Type definition for credential configuration
 * @internal
 */
export interface CredentialConfig {
  privy: {
    appId: string;
  };
  thirdweb: {
    clientId: string;
  };
}

/**
 * Check if using shared development credentials
 * @internal
 */
export function isUsingDevCredentials(
  appId?: string,
  clientId?: string
): boolean {
  const defaultAppId = VARITY_DEV_CREDENTIALS.privy.appId;
  const defaultClientId = VARITY_DEV_CREDENTIALS.thirdweb.clientId;

  return appId === defaultAppId || clientId === defaultClientId;
}

/**
 * Check if credentials are production-grade
 * @internal
 */
export function isProductionCredentials(
  appId?: string,
  clientId?: string
): boolean {
  return !isUsingDevCredentials(appId, clientId) && !!appId && !!clientId;
}

/**
 * Get warning message for development credential usage
 * @internal
 */
export function getCredentialWarning(
  environment: 'development' | 'staging' | 'production'
): string | null {
  if (environment === 'development') {
    return null;
  }

  return `Using shared Varity development credentials in ${environment} environment.
Deploy your app to use production credentials automatically.`;
}

// Track if the credential warning has already been logged (avoid spam during build)
let _credentialWarningLogged = false;

/**
 * Log development credential usage warning (only once per process)
 * @internal
 */
export function logCredentialUsage(
  appId?: string,
  clientId?: string
): void {
  if (_credentialWarningLogged) return;
  if (!isUsingDevCredentials(appId, clientId)) return;

  _credentialWarningLogged = true;
}

/**
 * Resolve credentials with automatic fallback
 *
 * Returns Varity-managed credentials. Custom values can be passed
 * but are not required — the defaults work out of the box.
 *
 * @internal Used by @varity-labs/ui-kit providers
 */
export function resolveCredentials(
  appId?: string,
  clientId?: string
): CredentialConfig {
  const resolved = {
    privy: {
      appId: appId || VARITY_DEV_CREDENTIALS.privy.appId,
    },
    thirdweb: {
      clientId: clientId || VARITY_DEV_CREDENTIALS.thirdweb.clientId,
    },
  };

  logCredentialUsage(resolved.privy.appId, resolved.thirdweb.clientId);

  return resolved;
}

/**
 * Validate that credential values are not empty
 * @internal
 */
export function validateCredentials(
  appId: string,
  clientId: string
): void {
  if (!appId || appId.trim() === '') {
    throw new Error(
      'Auth credentials are not configured. Deploy your app to set up credentials automatically.'
    );
  }

  if (!clientId || clientId.trim() === '') {
    throw new Error(
      'Infrastructure credentials are not configured. Deploy your app to set up credentials automatically.'
    );
  }
}

/**
 * Get instructions for production deployment
 * @internal
 */
export function getUpgradeInstructions(): string {
  return `
# Production Deployment

## How Credentials Work

Varity manages all credentials automatically. You don't need to create accounts
or configure API keys for any third-party services.

## Development

During development, shared credentials are used automatically:
\`\`\`tsx
import { PrivyStack } from '@varity-labs/ui-kit';

// Works immediately - no setup needed
<PrivyStack>
  <YourApp />
</PrivyStack>
\`\`\`

## Production Deployment

Deploy your app to get production credentials:
\`\`\`bash
varitykit app deploy
\`\`\`

The CLI automatically:
- Generates your app ID and authentication token
- Configures your database connection
- Injects all credentials into your build
- Deploys your app with everything configured

## Need Help?

- Documentation: https://docs.varity.so
- Discord: https://discord.gg/7vWsdwa2Bg
- Support: support@varity.so
`;
}
