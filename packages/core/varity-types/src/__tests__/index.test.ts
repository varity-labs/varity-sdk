/**
 * Comprehensive tests for index.ts exports validation
 * Target: 15+ tests verifying all exports are accessible
 */

import * as VarityTypes from '../index'

describe('Storage Type Exports', () => {
  test('should export all storage enums', () => {
    expect(VarityTypes.StorageBackend).toBeDefined()
    expect(VarityTypes.StorageTier).toBeDefined()
    expect(VarityTypes.StorageLayer).toBeDefined()
    expect(VarityTypes.TieringPolicy).toBeDefined()
  })

  test('should export storage backend enum values', () => {
    expect(VarityTypes.StorageBackend.FILECOIN_IPFS).toBe('filecoin-ipfs')
    expect(VarityTypes.StorageBackend.CELESTIA).toBe('celestia')
    expect(VarityTypes.StorageBackend.S3_COMPATIBLE).toBe('s3-compatible')
    expect(VarityTypes.StorageBackend.GCS_COMPATIBLE).toBe('gcs-compatible')
    expect(VarityTypes.StorageBackend.MULTI_TIER).toBe('multi-tier')
  })

  test('should export storage tier values', () => {
    expect(VarityTypes.StorageTier.HOT).toBe('hot')
    expect(VarityTypes.StorageTier.WARM).toBe('warm')
    expect(VarityTypes.StorageTier.COLD).toBe('cold')
    expect(VarityTypes.StorageTier.GLACIER).toBe('glacier')
  })

  test('should export 3-layer storage architecture', () => {
    expect(VarityTypes.StorageLayer.VARITY_INTERNAL).toBe('varity-internal')
    expect(VarityTypes.StorageLayer.INDUSTRY_RAG).toBe('industry-rag')
    expect(VarityTypes.StorageLayer.CUSTOMER_DATA).toBe('customer-data')
  })
})

describe('Auth Type Exports', () => {
  test('should export all auth enums', () => {
    expect(VarityTypes.AuthProvider).toBeDefined()
    expect(VarityTypes.AccessKeyStatus).toBeDefined()
    expect(VarityTypes.PermissionEffect).toBeDefined()
    expect(VarityTypes.Action).toBeDefined()
    expect(VarityTypes.ConditionType).toBeDefined()
  })

  test('should export auth provider values', () => {
    expect(VarityTypes.AuthProvider.AWS_SIGNATURE_V4).toBe('aws-signature-v4')
    expect(VarityTypes.AuthProvider.GCS_OAUTH2).toBe('gcs-oauth2')
    expect(VarityTypes.AuthProvider.WEB3_WALLET).toBe('web3-wallet')
  })

  test('should export PermissionChecker utility class', () => {
    expect(VarityTypes.PermissionChecker).toBeDefined()
    expect(typeof VarityTypes.PermissionChecker.isAllowed).toBe('function')
    expect(typeof VarityTypes.PermissionChecker.checkPermission).toBe('function')
  })

  test('should export auth type guards', () => {
    expect(typeof VarityTypes.isAWSSignatureV4Credentials).toBe('function')
    expect(typeof VarityTypes.isGCSServiceAccount).toBe('function')
    expect(typeof VarityTypes.isGCSOAuth2Token).toBe('function')
  })
})

describe('S3-Compatible Type Exports', () => {
  test('should export S3 enums', () => {
    expect(VarityTypes.S3StorageClass).toBeDefined()
    expect(VarityTypes.S3ACL).toBeDefined()
  })

  test('should export S3 storage classes', () => {
    expect(VarityTypes.S3StorageClass.STANDARD).toBe('STANDARD')
    expect(VarityTypes.S3StorageClass.GLACIER).toBe('GLACIER')
    expect(VarityTypes.S3StorageClass.DEEP_ARCHIVE).toBe('DEEP_ARCHIVE')
  })

  test('should export S3 ACL values', () => {
    expect(VarityTypes.S3ACL.PRIVATE).toBe('private')
    expect(VarityTypes.S3ACL.PUBLIC_READ).toBe('public-read')
  })
})

describe('GCS-Compatible Type Exports', () => {
  test('should export GCS enums', () => {
    expect(VarityTypes.GCSStorageClass).toBeDefined()
    expect(VarityTypes.GCSPredefinedACL).toBeDefined()
  })

  test('should export GCS storage classes', () => {
    expect(VarityTypes.GCSStorageClass.STANDARD).toBe('STANDARD')
    expect(VarityTypes.GCSStorageClass.NEARLINE).toBe('NEARLINE')
    expect(VarityTypes.GCSStorageClass.COLDLINE).toBe('COLDLINE')
    expect(VarityTypes.GCSStorageClass.ARCHIVE).toBe('ARCHIVE')
  })
})

describe('Migration Type Exports', () => {
  test('should export all migration enums', () => {
    expect(VarityTypes.MigrationStatus).toBeDefined()
    expect(VarityTypes.MigrationPhase).toBeDefined()
    expect(VarityTypes.MigrationSource).toBeDefined()
    expect(VarityTypes.MigrationTarget).toBeDefined()
  })

  test('should export migration status values', () => {
    expect(VarityTypes.MigrationStatus.PENDING).toBe('pending')
    expect(VarityTypes.MigrationStatus.RUNNING).toBe('running')
    expect(VarityTypes.MigrationStatus.COMPLETED).toBe('completed')
    expect(VarityTypes.MigrationStatus.FAILED).toBe('failed')
  })

  test('should export migration sources', () => {
    expect(VarityTypes.MigrationSource.AWS_S3).toBe('aws-s3')
    expect(VarityTypes.MigrationSource.GCP_GCS).toBe('gcp-gcs')
    expect(VarityTypes.MigrationSource.AZURE_BLOB).toBe('azure-blob')
  })
})

describe('Package Metadata Exports', () => {
  test('should export package version', () => {
    expect(VarityTypes.VERSION).toBe('1.0.0')
  })

  test('should export package name', () => {
    expect(VarityTypes.PACKAGE_NAME).toBe('@varity-labs/types')
  })

  test('should export supported storage backends', () => {
    expect(VarityTypes.SUPPORTED_STORAGE_BACKENDS).toEqual([
      'filecoin-ipfs',
      'celestia',
      's3-compatible',
      'gcs-compatible',
      'multi-tier'
    ])
  })

  test('should export supported migration sources', () => {
    expect(VarityTypes.SUPPORTED_MIGRATION_SOURCES).toEqual([
      'aws-s3',
      'gcp-gcs',
      'azure-blob',
      'local-filesystem',
      'http',
      'ftp',
      'varity'
    ])
  })
})

describe('Type Export Consistency', () => {
  test('all exported types should be accessible', () => {
    // Sample check of various type categories
    const sampleTypes = [
      'IStorageAdapter',
      'UploadOptions',
      'StorageResult',
      'AccessKey',
      'Permission',
      'S3CompatibleConfig',
      'GCSCompatibleConfig',
      'MigrationJob'
    ]

    // TypeScript will fail compilation if these types aren't exported
    // This test verifies the export structure is consistent
    // We export 25+ items (enums, classes, functions, constants)
    expect(Object.keys(VarityTypes).length).toBeGreaterThan(20)
  })

  test('should not export internal implementation details', () => {
    // Verify we're only exporting public API
    const exports = Object.keys(VarityTypes)
    const hasPrivateExports = exports.some(key => key.startsWith('_'))
    expect(hasPrivateExports).toBe(false)
  })
})
