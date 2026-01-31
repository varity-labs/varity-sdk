/**
 * Varity Types - Main Export File
 *
 * This package provides comprehensive type definitions for the Varity SDK,
 * including storage backends, blockchain interactions, AI/ML, and more.
 *
 * @packageDocumentation
 */
// Export storage enums
export { StorageBackend, StorageTier, StorageLayer, TieringPolicy } from './storage';
export { S3StorageClass, S3ACL } from './s3-compatible';
export { GCSStorageClass, GCSPredefinedACL } from './gcs-compatible';
export { MigrationStatus, MigrationPhase, MigrationSource, MigrationTarget } from './migration';
export { AuthProvider, AccessKeyStatus, PermissionEffect, Action, ConditionType, PermissionChecker } from './auth';
// Export type guards
export { isAWSSignatureV4Credentials, isGCSServiceAccount, isGCSOAuth2Token } from './auth';
// Export Thirdweb utility functions
export { isVarityChain, isSIWEMessage, formatUSDC, parseUSDC, VARITY_L3_TESTNET, USDC_DECIMALS } from './thirdweb';
// ============================================================================
// Re-export SDK Types (for backward compatibility)
// ============================================================================
// Note: The re-export of SDK types is commented out to avoid cross-package
// compilation issues. SDK types should be imported directly from @varity/sdk
// when needed in consuming applications.
/*
export type {
  VaritySDKConfig,
  Network,
  NetworkConfig,
  ContractAddresses,
  // ... other SDK types
} from '../../varity-sdk/src/core/types'
*/
// ============================================================================
// Package Metadata
// ============================================================================
/**
 * Package version
 */
export const VERSION = '1.0.0';
/**
 * Package name
 */
export const PACKAGE_NAME = '@varity/types';
/**
 * Supported storage backends
 */
export const SUPPORTED_STORAGE_BACKENDS = [
    'filecoin-ipfs',
    'celestia',
    's3-compatible',
    'gcs-compatible',
    'multi-tier'
];
/**
 * Supported migration sources
 */
export const SUPPORTED_MIGRATION_SOURCES = [
    'aws-s3',
    'gcp-gcs',
    'azure-blob',
    'local-filesystem',
    'http',
    'ftp',
    'varity'
];
//# sourceMappingURL=index.js.map