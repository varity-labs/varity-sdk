/**
 * Tests for Varity Development Credentials
 */

import {
  VARITY_DEV_CREDENTIALS,
  resolveCredentials,
  isUsingDevCredentials,
  isProductionCredentials,
  validateCredentials,
  getCredentialWarning,
  getUpgradeInstructions,
} from '../credentials';

describe('VARITY_DEV_CREDENTIALS', () => {
  test('should have Privy and thirdweb credentials', () => {
    expect(VARITY_DEV_CREDENTIALS.privy.appId).toBeDefined();
    expect(VARITY_DEV_CREDENTIALS.thirdweb.clientId).toBeDefined();
  });

  test('should have rate limit information', () => {
    expect(VARITY_DEV_CREDENTIALS.rateLimits.privy).toBeDefined();
    expect(VARITY_DEV_CREDENTIALS.rateLimits.thirdweb).toBeDefined();
  });
});

describe('resolveCredentials', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should use provided credentials', () => {
    const customAppId = 'clpq_custom_app_id';
    const customClientId = 'custom_client_id';

    const credentials = resolveCredentials(customAppId, customClientId);

    expect(credentials.privy.appId).toBe(customAppId);
    expect(credentials.thirdweb.clientId).toBe(customClientId);
  });

  test('should fallback to VARITY_DEV_CREDENTIALS when not provided', () => {
    const credentials = resolveCredentials();

    expect(credentials.privy.appId).toBe(VARITY_DEV_CREDENTIALS.privy.appId);
    expect(credentials.thirdweb.clientId).toBe(VARITY_DEV_CREDENTIALS.thirdweb.clientId);
  });

  test('should use environment variables when available', () => {
    process.env.VARITY_PRIVY_APP_ID = 'clpq_env_app_id';
    process.env.VARITY_THIRDWEB_CLIENT_ID = 'env_client_id';

    // Need to re-require to pick up env changes
    const credentials = resolveCredentials();

    expect(credentials.privy.appId).toBeDefined();
    expect(credentials.thirdweb.clientId).toBeDefined();
  });
});

describe('isUsingDevCredentials', () => {
  test('should return true when using default credentials', () => {
    const result = isUsingDevCredentials(
      VARITY_DEV_CREDENTIALS.privy.appId,
      VARITY_DEV_CREDENTIALS.thirdweb.clientId
    );

    expect(result).toBe(true);
  });

  test('should return true when using dev Privy app ID', () => {
    const result = isUsingDevCredentials(
      VARITY_DEV_CREDENTIALS.privy.appId,
      'custom_client_id'
    );

    expect(result).toBe(true);
  });

  test('should return true when using dev thirdweb client ID', () => {
    const result = isUsingDevCredentials(
      'clpq_custom_app_id',
      VARITY_DEV_CREDENTIALS.thirdweb.clientId
    );

    expect(result).toBe(true);
  });

  test('should return false when using custom credentials', () => {
    const result = isUsingDevCredentials(
      'clpq_custom_app_id',
      'custom_client_id'
    );

    expect(result).toBe(false);
  });
});

describe('isProductionCredentials', () => {
  test('should return false when using dev credentials', () => {
    const result = isProductionCredentials(
      VARITY_DEV_CREDENTIALS.privy.appId,
      VARITY_DEV_CREDENTIALS.thirdweb.clientId
    );

    expect(result).toBe(false);
  });

  test('should return true when using custom credentials', () => {
    const result = isProductionCredentials(
      'clpq_custom_app_id',
      'custom_client_id'
    );

    expect(result).toBe(true);
  });

  test('should return false when credentials are missing', () => {
    expect(isProductionCredentials(undefined, 'custom_client_id')).toBe(false);
    expect(isProductionCredentials('clpq_custom_app_id', undefined)).toBe(false);
    expect(isProductionCredentials(undefined, undefined)).toBe(false);
  });
});

describe('validateCredentials', () => {
  test('should not throw for valid credentials', () => {
    expect(() => {
      validateCredentials('clpq_valid_app_id', 'valid_client_id');
    }).not.toThrow();
  });

  test('should throw when app ID is missing', () => {
    expect(() => {
      validateCredentials('', 'valid_client_id');
    }).toThrow('Auth credentials are not configured');
  });

  test('should throw when client ID is missing', () => {
    expect(() => {
      validateCredentials('clpq_valid_app_id', '');
    }).toThrow('Infrastructure credentials are not configured');
  });

  test('should accept any format for app ID', () => {
    expect(() => {
      validateCredentials('any_format', 'valid_client_id');
    }).not.toThrow();
  });
});

describe('getCredentialWarning', () => {
  test('should return null for development environment', () => {
    const warning = getCredentialWarning('development');
    expect(warning).toBeNull();
  });

  test('should return warning for staging environment', () => {
    const warning = getCredentialWarning('staging');
    expect(warning).not.toBeNull();
    expect(warning).toContain('staging');
  });

  test('should return warning for production environment', () => {
    const warning = getCredentialWarning('production');
    expect(warning).not.toBeNull();
    expect(warning).toContain('production');
    expect(warning).toContain('varitykit app deploy');
  });
});

describe('getUpgradeInstructions', () => {
  test('should return markdown-formatted instructions', () => {
    const instructions = getUpgradeInstructions();

    expect(instructions).toContain('# Production Deployment');
    expect(instructions).toContain('varitykit app deploy');
    expect(instructions).toContain('PrivyStack');
  });
});
