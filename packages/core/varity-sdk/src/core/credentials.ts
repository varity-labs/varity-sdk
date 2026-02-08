/**
 * Varity SDK - Shared Development Credentials
 *
 * Provides shared development credentials for seamless developer experience.
 * Developers can use Varity packages without manually setting up Privy and thirdweb credentials.
 *
 * **IMPORTANT**: These credentials are for DEVELOPMENT/TESTING ONLY.
 * For production deployments, you MUST use your own credentials.
 *
 * @example Zero-config development
 * ```tsx
 * import { PrivyStack } from '@varity-labs/ui-kit';
 *
 * // Works immediately - uses shared dev credentials
 * <PrivyStack>
 *   <YourApp />
 * </PrivyStack>
 * ```
 *
 * @example Production with custom credentials
 * ```tsx
 * import { PrivyStack } from '@varity-labs/ui-kit';
 *
 * <PrivyStack
 *   appId={process.env.PRIVY_APP_ID}
 *   thirdwebClientId={process.env.THIRDWEB_CLIENT_ID}
 * >
 *   <YourApp />
 * </PrivyStack>
 * ```
 */

/**
 * Shared development credentials configuration
 *
 * These credentials are managed by Varity and shared across all development environments.
 * They enable developers to start building immediately without manual credential setup.
 *
 * **Security Notes**:
 * - Rate limiting is applied to prevent abuse
 * - Only works with Varity L3 Testnet (Chain ID 33529)
 * - Not suitable for production use
 * - May be rotated periodically
 *
 * **When to Upgrade**:
 * - Moving to production
 * - Need custom branding in auth flows
 * - Require higher rate limits
 * - Building on non-Varity chains
 */
export const VARITY_DEV_CREDENTIALS = {
  /**
   * Privy configuration
   *
   * Privy provides authentication (email, social, wallet).
   * Get your own credentials at: https://dashboard.privy.io
   */
  privy: {
    /**
     * Shared Privy App ID for development
     *
     * Environment variable override: VARITY_PRIVY_APP_ID
     * Production: Get your own at https://dashboard.privy.io
     */
    appId: process.env.VARITY_PRIVY_APP_ID || 'cmhwbozxu004fjr0cicfz0tf8',
  },

  /**
   * thirdweb configuration
   *
   * thirdweb provides blockchain infrastructure (chain abstraction, contracts, storage).
   * Get your own credentials at: https://thirdweb.com/dashboard
   */
  thirdweb: {
    /**
     * Shared thirdweb Client ID for development
     *
     * Environment variable override: VARITY_THIRDWEB_CLIENT_ID
     * Production: Get your own at https://thirdweb.com/dashboard
     */
    clientId: process.env.VARITY_THIRDWEB_CLIENT_ID || 'acb17e07e34ab2b8317aa40cbb1b5e1d',
  },

  /**
   * Rate limiting information (informational only)
   */
  rateLimits: {
    privy: {
      monthlyActiveUsers: 1000,
      note: 'Shared across all developers using VARITY_DEV_CREDENTIALS',
    },
    thirdweb: {
      requestsPerSecond: 100,
      note: 'Shared across all developers using VARITY_DEV_CREDENTIALS',
    },
  },
} as const;

/**
 * Type definition for credential configuration
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
 *
 * @param appId - Privy app ID to check
 * @param clientId - thirdweb client ID to check
 * @returns true if using shared development credentials
 *
 * @example
 * ```typescript
 * if (isUsingDevCredentials(appId, clientId)) {
 *   console.warn('Using shared dev credentials - upgrade for production');
 * }
 * ```
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
 * Check if credentials are suitable for production use
 *
 * @param appId - Privy app ID to check
 * @param clientId - thirdweb client ID to check
 * @returns true if credentials are production-ready
 *
 * @example
 * ```typescript
 * if (!isProductionCredentials(appId, clientId)) {
 *   throw new Error('Production requires custom credentials');
 * }
 * ```
 */
export function isProductionCredentials(
  appId?: string,
  clientId?: string
): boolean {
  return !isUsingDevCredentials(appId, clientId) && !!appId && !!clientId;
}

/**
 * Get warning message for development credential usage
 *
 * @param environment - Current environment (development, staging, production)
 * @returns Warning message or null if no warning needed
 *
 * @example
 * ```typescript
 * const warning = getCredentialWarning('production');
 * if (warning) {
 *   console.error(warning);
 * }
 * ```
 */
export function getCredentialWarning(
  environment: 'development' | 'staging' | 'production'
): string | null {
  if (environment === 'development') {
    return null; // No warning in development
  }

  return `⚠️  WARNING: Using shared VARITY_DEV_CREDENTIALS in ${environment} environment!

Shared credentials are NOT suitable for ${environment} use.

Action Required:
1. Get Privy App ID: https://dashboard.privy.io
2. Get thirdweb Client ID: https://thirdweb.com/dashboard
3. Set environment variables:
   - PRIVY_APP_ID=your-privy-app-id
   - THIRDWEB_CLIENT_ID=your-thirdweb-client-id

Learn more: https://docs.varity.io/credentials
`;
}

// Track if the credential warning has already been logged (avoid spam during build)
let _credentialWarningLogged = false;

/**
 * Log development credential usage warning (only once per process)
 *
 * @param appId - Privy app ID being used
 * @param clientId - thirdweb client ID being used
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
 * Resolve credentials with fallback to dev credentials
 *
 * @param appId - Custom Privy app ID (optional)
 * @param clientId - Custom thirdweb client ID (optional)
 * @returns Resolved credential configuration
 *
 * @example
 * ```typescript
 * const creds = resolveCredentials(customAppId, customClientId);
 * // Falls back to VARITY_DEV_CREDENTIALS if custom credentials not provided
 * ```
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

  // Log usage warning
  logCredentialUsage(resolved.privy.appId, resolved.thirdweb.clientId);

  return resolved;
}

/**
 * Validate credentials are configured correctly
 *
 * @param appId - Privy app ID to validate
 * @param clientId - thirdweb client ID to validate
 * @throws Error if credentials are invalid
 *
 * @example
 * ```typescript
 * try {
 *   validateCredentials(appId, clientId);
 * } catch (error) {
 *   console.error('Invalid credentials:', error.message);
 * }
 * ```
 */
export function validateCredentials(
  appId: string,
  clientId: string
): void {
  if (!appId || appId.trim() === '') {
    throw new Error(
      'Privy App ID is required. Get one at: https://dashboard.privy.io'
    );
  }

  if (!clientId || clientId.trim() === '') {
    throw new Error(
      'thirdweb Client ID is required. Get one at: https://thirdweb.com/dashboard'
    );
  }

  // Validate format (basic checks)
  if (!appId.startsWith('clp')) {
    console.warn(
      `⚠️  Privy App ID should start with 'clp'. Current: ${appId}`
    );
  }
}

/**
 * Get upgrade instructions for production
 *
 * @returns Markdown-formatted upgrade instructions
 *
 * @example
 * ```typescript
 * console.log(getUpgradeInstructions());
 * ```
 */
export function getUpgradeInstructions(): string {
  return `
# Upgrading to Production Credentials

## Why Upgrade?

Shared development credentials (VARITY_DEV_CREDENTIALS) are:
- Rate limited across all developers
- May be rotated periodically
- Not suitable for production use
- Lack custom branding options

## How to Upgrade

### 1. Get Privy App ID

1. Visit https://dashboard.privy.io
2. Sign up or log in
3. Create a new app
4. Copy your App ID (starts with 'clp')
5. Configure login methods (email, social, wallet)

### 2. Get thirdweb Client ID

1. Visit https://thirdweb.com/dashboard
2. Sign up or log in
3. Create a new project
4. Copy your Client ID
5. Configure allowed domains

### 3. Set Environment Variables

\`\`\`bash
# .env.local
PRIVY_APP_ID=your-privy-app-id
THIRDWEB_CLIENT_ID=your-thirdweb-client-id
\`\`\`

### 4. Update Your Code

\`\`\`tsx
import { PrivyStack } from '@varity-labs/ui-kit';

<PrivyStack
  appId={process.env.PRIVY_APP_ID}
  thirdwebClientId={process.env.THIRDWEB_CLIENT_ID}
>
  <YourApp />
</PrivyStack>
\`\`\`

## Benefits

- ✅ Unlimited usage (within your plan limits)
- ✅ Custom branding in auth flows
- ✅ Production support
- ✅ Analytics and monitoring
- ✅ No credential rotation concerns

## Cost

Both Privy and thirdweb offer generous free tiers:
- **Privy**: Free up to 1,000 MAU
- **thirdweb**: Free tier available

## Need Help?

- Documentation: https://docs.varity.io/credentials
- Discord: https://discord.gg/varity
- Support: support@varity.io
`;
}
