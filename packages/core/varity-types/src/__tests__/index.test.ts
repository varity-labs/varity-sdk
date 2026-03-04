/**
 * MVP Export Tests for @varity-labs/types
 *
 * Tests verify:
 * 1. All MVP-relevant exports are accessible
 * 2. Runtime functions work correctly
 * 3. Package metadata is accurate
 * 4. Blockchain types are properly hidden
 * 5. Storage/auth infrastructure types are accessible (needed by SDK)
 */

import * as VarityTypes from '../index'

// ============================================================================
// Common Types & Runtime Functions (MVP-critical — used by UI-Kit)
// ============================================================================

describe('Common Types & Runtime Functions', () => {
  test('getErrorMessage extracts message from Error object', () => {
    const error = new Error('test error')
    expect(VarityTypes.getErrorMessage(error)).toBe('test error')
  })

  test('getErrorMessage JSON-stringifies non-Error values', () => {
    // getErrorMessage uses JSON.stringify for non-Error/non-message values
    expect(VarityTypes.getErrorMessage('string error')).toBe('"string error"')
    expect(VarityTypes.getErrorMessage(42)).toBe('42')
    expect(VarityTypes.getErrorMessage(null)).toBe('null')
  })

  test('getErrorMessage handles object with message property', () => {
    expect(VarityTypes.getErrorMessage({ message: 'obj error' })).toBe('obj error')
  })

  test('isErrorWithMessage identifies Error objects', () => {
    expect(VarityTypes.isErrorWithMessage(new Error('test'))).toBe(true)
    expect(VarityTypes.isErrorWithMessage({ message: 'test' })).toBe(true)
  })

  test('isErrorWithMessage rejects non-error values', () => {
    expect(VarityTypes.isErrorWithMessage('string')).toBe(false)
    expect(VarityTypes.isErrorWithMessage(42)).toBe(false)
    expect(VarityTypes.isErrorWithMessage(null)).toBe(false)
  })

  test('toError converts any value to Error', () => {
    const err = VarityTypes.toError('test')
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('"test"') // JSON.stringify wraps strings in quotes
  })

  test('toError passes through existing Error', () => {
    const original = new Error('original')
    const result = VarityTypes.toError(original)
    expect(result).toBe(original)
  })
})

// ============================================================================
// Package Metadata
// ============================================================================

describe('Package Metadata', () => {
  test('VERSION matches package.json', () => {
    expect(VarityTypes.VERSION).toBe('2.0.0-alpha.1')
  })

  test('PACKAGE_NAME is correct', () => {
    expect(VarityTypes.PACKAGE_NAME).toBe('@varity-labs/types')
  })

  test('SUPPORTED_STORAGE_BACKENDS is not exported (hidden for MVP)', () => {
    expect((VarityTypes as any).SUPPORTED_STORAGE_BACKENDS).toBeUndefined()
  })

  test('SUPPORTED_MIGRATION_SOURCES is not exported (hidden for MVP)', () => {
    expect((VarityTypes as any).SUPPORTED_MIGRATION_SOURCES).toBeUndefined()
  })
})

// ============================================================================
// Storage Enums (needed by SDK at compile time)
// ============================================================================

describe('Storage Enums', () => {
  test('StorageBackend enum is accessible', () => {
    expect(VarityTypes.StorageBackend).toBeDefined()
    expect(VarityTypes.StorageBackend.S3_COMPATIBLE).toBe('s3-compatible')
    expect(VarityTypes.StorageBackend.GCS_COMPATIBLE).toBe('gcs-compatible')
    expect(VarityTypes.StorageBackend.MULTI_TIER).toBe('multi-tier')
  })

  test('StorageTier enum is accessible', () => {
    expect(VarityTypes.StorageTier).toBeDefined()
    expect(VarityTypes.StorageTier.HOT).toBe('hot')
    expect(VarityTypes.StorageTier.COLD).toBe('cold')
  })

  test('StorageLayer enum is accessible', () => {
    expect(VarityTypes.StorageLayer).toBeDefined()
  })

  test('TieringPolicy enum is accessible', () => {
    expect(VarityTypes.TieringPolicy).toBeDefined()
  })
})

// ============================================================================
// S3 & GCS Enums (needed by SDK)
// ============================================================================

describe('S3 & GCS Enums', () => {
  test('S3StorageClass enum is accessible', () => {
    expect(VarityTypes.S3StorageClass).toBeDefined()
    expect(VarityTypes.S3StorageClass.STANDARD).toBe('STANDARD')
  })

  test('S3ACL enum is accessible', () => {
    expect(VarityTypes.S3ACL).toBeDefined()
    expect(VarityTypes.S3ACL.PRIVATE).toBe('private')
  })

  test('GCSStorageClass enum is accessible', () => {
    expect(VarityTypes.GCSStorageClass).toBeDefined()
    expect(VarityTypes.GCSStorageClass.STANDARD).toBe('STANDARD')
  })

  test('GCSPredefinedACL enum is accessible', () => {
    expect(VarityTypes.GCSPredefinedACL).toBeDefined()
  })
})

// ============================================================================
// Migration Enums
// ============================================================================

describe('Migration Enums', () => {
  test('MigrationStatus enum is accessible', () => {
    expect(VarityTypes.MigrationStatus).toBeDefined()
    expect(VarityTypes.MigrationStatus.PENDING).toBe('pending')
    expect(VarityTypes.MigrationStatus.COMPLETED).toBe('completed')
  })

  test('MigrationPhase enum is accessible', () => {
    expect(VarityTypes.MigrationPhase).toBeDefined()
  })

  test('MigrationSource enum is accessible', () => {
    expect(VarityTypes.MigrationSource).toBeDefined()
  })

  test('MigrationTarget enum is accessible', () => {
    expect(VarityTypes.MigrationTarget).toBeDefined()
  })
})

// ============================================================================
// Auth Enums & Utilities
// ============================================================================

describe('Auth Enums & Utilities', () => {
  test('AuthProvider enum is accessible', () => {
    expect(VarityTypes.AuthProvider).toBeDefined()
  })

  test('AccessKeyStatus enum is accessible', () => {
    expect(VarityTypes.AccessKeyStatus).toBeDefined()
  })

  test('PermissionChecker class is accessible', () => {
    expect(VarityTypes.PermissionChecker).toBeDefined()
    expect(typeof VarityTypes.PermissionChecker.isAllowed).toBe('function')
  })

  test('Auth type guards are accessible', () => {
    expect(typeof VarityTypes.isAWSSignatureV4Credentials).toBe('function')
    expect(typeof VarityTypes.isGCSServiceAccount).toBe('function')
    expect(typeof VarityTypes.isGCSOAuth2Token).toBe('function')
  })
})

// ============================================================================
// Blockchain Abstraction
// ============================================================================

describe('Blockchain Abstraction', () => {
  test('OracleData is NOT exported (crypto concept)', () => {
    // OracleData and PriceData are crypto oracle concepts — hidden for MVP
    const exports = Object.keys(VarityTypes)
    expect(exports).not.toContain('OracleData')
    expect(exports).not.toContain('PriceData')
  })

  test('thirdweb types are NOT exported', () => {
    const exports = Object.keys(VarityTypes)
    expect(exports).not.toContain('ThirdwebClient')
    expect(exports).not.toContain('VARITY_L3_TESTNET')
    expect(exports).not.toContain('USDC_DECIMALS')
    expect(exports).not.toContain('isVarityChain')
    expect(exports).not.toContain('formatUSDC')
  })

  test('no private/internal exports leak', () => {
    const exports = Object.keys(VarityTypes)
    const hasPrivateExports = exports.some(key => key.startsWith('_'))
    expect(hasPrivateExports).toBe(false)
  })
})

// ============================================================================
// Export Count Sanity Check
// ============================================================================

describe('Export Structure', () => {
  test('exports more than 20 items (enums, classes, functions, constants)', () => {
    expect(Object.keys(VarityTypes).length).toBeGreaterThan(20)
  })
})
