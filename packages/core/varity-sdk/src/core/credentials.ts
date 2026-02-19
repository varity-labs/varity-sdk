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
   * Pre-signed JWT for development database access
   * - Grants access to `app_varity_dev` schema only (schema isolation)
   * - 10-year expiry (development convenience)
   * - Rate limited: 100 req/min per IP
   * Override: NEXT_PUBLIC_VARITY_APP_TOKEN environment variable
   */
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6InZhcml0eV9kZXYiLCJpc3MiOiJ2YXJpdHkuc28iLCJpYXQiOjE3NzA4MzI5MzIsImV4cCI6MjA4NjE5MjkzMn0.Kj4fijAhZJ5CihFj0Vf5YLMmPzEBtCKKyxdNWUNdRWs',
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
Deploy with \`varitykit app deploy\` to use production credentials automatically.`;
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
      'Auth credentials are not configured. Deploy with `varitykit app deploy` to set up credentials automatically.'
    );
  }

  if (!clientId || clientId.trim() === '') {
    throw new Error(
      'Infrastructure credentials are not configured. Deploy with `varitykit app deploy` to set up credentials automatically.'
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
- Discord: https://discord.gg/varity
- Support: support@varity.so
`;
}
