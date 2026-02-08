/**
 * Varity Types - Main Export File
 *
 * This package provides comprehensive type definitions for the Varity SDK,
 * including storage backends, API integration, and AI/ML.
 *
 * @packageDocumentation
 */

// ============================================================================
// Common Types (Type-safe alternatives to `any`)
// ============================================================================

export type {
  JSONValue,
  JSONObject,
  JSONArray,
  StringRecord,
  Metadata,
  ErrorWithMessage,
  Callback,
  AsyncCallback,
  EventHandler,
  AsyncEventHandler,
  Constructor,
  AbstractConstructor,
  AnyFunction,
  MaybePromise,
  Nullable,
  Optional,
  Maybe,
  DeepPartial,
  DeepReadonly,
  RequireAtLeastOne,
  RequireExactlyOne
} from './common';

export {
  isErrorWithMessage,
  toError,
  getErrorMessage
} from './common';

// ============================================================================
// API Types (Request/Response patterns)
// ============================================================================

export type {
  APIResponse,
  APIError,
  PaginatedResponse,
  APIRequestConfig,
  HTTPMethod,
  UserProfile,
  LoginResponse,
  AuthToken,
  WebhookPayload,
  OracleData,
  PriceData,
  KPI,
  KPIResult,
  TimeSeriesDataPoint,
  TrendResponse,
  DashboardConfig,
  DashboardWidget,
  DashboardLayout,
  DashboardTheme,
  AnalyticsPeriod,
  EventData,
  UploadData,
  UploadResponse
} from './api';

// ============================================================================
// Storage Types (NEW - S3/GCS Compatible Storage)
// ============================================================================

// Export all storage types and interfaces
export type {
  IStorageAdapter,
  UploadOptions,
  StorageResult,
  StorageItem,
  ListOptions,
  StorageMetadata,
  MultiTierStorageConfig,
  TierConfig,
  AutoTieringConfig,
  TieringRule,
  TieringCondition,
  TieringAction,
  AccessPattern,
  StorageStats,
  TierStats,
  LayerStats,
  StorageOperationResult,
  EncryptionOptions,
  EncryptionMetadata,
  StorageMetrics,
  LayerMetrics,
  TierMetrics,
  BackendMetrics,
  LatencyMetrics,
  StorageCosts,
  CostComparison,
  BandwidthMetrics
} from './storage'

// Export storage enums
export {
  StorageBackend,
  StorageTier,
  StorageLayer,
  TieringPolicy
} from './storage'

// ============================================================================
// S3-Compatible Storage Types
// ============================================================================

export type {
  S3CompatibleConfig,
  S3UploadResult,
  S3MultipartUpload,
  S3UploadPart,
  S3MultipartUploadOptions,
  S3ListObjectsResult,
  S3Object,
  S3RestoreStatus,
  S3Bucket,
  S3BucketVersioning,
  S3LifecycleRule,
  S3Transition,
  S3Expiration,
  S3NoncurrentVersionTransition,
  S3NoncurrentVersionExpiration,
  S3BucketPolicy,
  S3PolicyStatement,
  S3CORSConfiguration,
  S3CORSRule,
  S3PresignedUrlOptions,
  S3PresignedUrl,
  S3ServerSideEncryption,
  S3ObjectLock,
  S3ReplicationConfiguration,
  S3ReplicationRule,
  S3ReplicationDestination
} from './s3-compatible'

export {
  S3StorageClass,
  S3ACL
} from './s3-compatible'

// ============================================================================
// GCS-Compatible Storage Types
// ============================================================================

export type {
  GCSCompatibleConfig,
  GCSCredentials,
  GCSExternalAccountConfig,
  GCSUploadResult,
  GCSResumableUpload,
  GCSResumableUploadOptions,
  GCSListObjectsResult,
  GCSObject,
  GCSObjectAccessControl,
  GCSBucket,
  GCSBucketLifecycle,
  GCSLifecycleRule,
  GCSRetentionPolicy,
  GCSBucketAccessControl,
  GCSCORSConfiguration,
  GCSSignedUrlOptions,
  GCSSignedUrl,
  GCSNotification,
  GCSCustomerEncryption,
  GCSKMSEncryption
} from './gcs-compatible'

export {
  GCSStorageClass,
  GCSPredefinedACL
} from './gcs-compatible'

// ============================================================================
// Migration Types
// ============================================================================

export type {
  MigrationJob,
  MigrationSourceConfig,
  MigrationTargetConfig,
  MigrationCredentials,
  MigrationProgress,
  MigrationStats,
  MigrationConfig,
  MigrationRetryConfig,
  MigrationNotificationConfig,
  MigrationNotificationChannel,
  MigrationFilter,
  MigrationError,
  MigrationWarning,
  MigrationVerification,
  VerificationDetail,
  MigrationSchedule,
  MigrationRecurrenceRule,
  MigrationTemplate
} from './migration'

export {
  MigrationStatus,
  MigrationPhase,
  MigrationSource,
  MigrationTarget
} from './migration'

// ============================================================================
// Authentication & Authorization Types
// ============================================================================

export type {
  AccessKey,
  Permission,
  AWSSignatureV4Request,
  AWSSignatureV4Credentials,
  AWSSignatureV4Result,
  S3SignatureV4Components,
  S3CanonicalRequest,
  S3StringToSign,
  GCSOAuth2Token,
  GCSOAuth2ValidationResult,
  GCSServiceAccount,
  GCSServiceAccountToken,
  VarityAPIKey,
  RateLimit,
  // Advanced: Available via direct import from submodule
  // Web3AuthRequest,
  // Web3AuthResult,
  AuthorizationPolicy,
  PolicyStatement,
  PolicyCondition,
  AuthorizationContext,
  AuthorizationResult,
  Session
} from './auth'

export {
  AuthProvider,
  AccessKeyStatus,
  PermissionEffect,
  Action,
  ConditionType,
  PermissionChecker
} from './auth'

// Export type guards
export {
  isAWSSignatureV4Credentials,
  isGCSServiceAccount,
  isGCSOAuth2Token
} from './auth'

// ============================================================================
// Advanced: Thirdweb Integration Types
// Available via direct import: import type { ThirdwebClient } from '@varity/types/thirdweb'
// ============================================================================
// export type {
//   ThirdwebClient,
//   Chain,
//   PreparedTransaction,
//   ThirdwebContract,
//   PrepareContractCallOptions,
//   ReadContractOptions,
//   Hex,
//   Address,
//   VarityChain,
//   VarityChainConstants,
//   VarityWalletConfig,
//   VaritySmartWalletOptions,
//   VarityWalletConnectionResult,
//   VarityContractConfig,
//   VarityDeploymentParams,
//   VarityDeploymentResult,
//   VarityContractReadOptions,
//   VarityContractWriteOptions,
//   SIWEMessage,
//   SIWEVerifyResult,
//   SIWEAuthPayload,
//   VarityGasEstimation,
//   VarityTransactionFeeOptions,
//   VarityEventFilter,
//   VarityContractEvent,
//   USDCAmount,
//   ThirdwebEthersHybrid,
//   ThirdwebWrapperConfig,
//   ContractDeployResponse,
//   ContractCallResponse,
//   SIWEAuthResponse,
//   ChainInfoResponse,
//   WalletBalanceResponse,
//   ThirdwebClientConfig,
//   ThirdwebAuthConfig,
//   ThirdwebStorageConfig
// } from './thirdweb'

// export {
//   isVarityChain,
//   isSIWEMessage,
//   formatUSDC,
//   parseUSDC,
//   VARITY_L3_TESTNET,
//   USDC_DECIMALS
// } from './thirdweb'

// ============================================================================
// Re-export SDK Types (for backward compatibility)
// ============================================================================

// Note: The re-export of SDK types is commented out to avoid cross-package
// compilation issues. SDK types should be imported directly from @varity-labs/sdk
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
export const VERSION = '1.0.0'

/**
 * Package name
 */
export const PACKAGE_NAME = '@varity-labs/types'

/**
 * Supported storage backends
 */
export const SUPPORTED_STORAGE_BACKENDS = [
  'filecoin-ipfs',
  'celestia',
  's3-compatible',
  'gcs-compatible',
  'multi-tier'
] as const

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
] as const
