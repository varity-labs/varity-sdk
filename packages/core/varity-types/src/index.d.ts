/**
 * Varity Types - Main Export File
 *
 * This package provides comprehensive type definitions for the Varity SDK,
 * including storage backends, blockchain interactions, AI/ML, and more.
 *
 * @packageDocumentation
 */
export type { IStorageAdapter, UploadOptions, StorageResult, StorageItem, ListOptions, StorageMetadata, MultiTierStorageConfig, TierConfig, AutoTieringConfig, TieringRule, TieringCondition, TieringAction, AccessPattern, StorageStats, TierStats, LayerStats, StorageOperationResult, EncryptionOptions, EncryptionMetadata, StorageMetrics, LayerMetrics, TierMetrics, BackendMetrics, LatencyMetrics, StorageCosts, CostComparison, BandwidthMetrics } from './storage';
export { StorageBackend, StorageTier, StorageLayer, TieringPolicy } from './storage';
export type { S3CompatibleConfig, S3UploadResult, S3MultipartUpload, S3UploadPart, S3MultipartUploadOptions, S3ListObjectsResult, S3Object, S3RestoreStatus, S3Bucket, S3BucketVersioning, S3LifecycleRule, S3Transition, S3Expiration, S3NoncurrentVersionTransition, S3NoncurrentVersionExpiration, S3BucketPolicy, S3PolicyStatement, S3CORSConfiguration, S3CORSRule, S3PresignedUrlOptions, S3PresignedUrl, S3ServerSideEncryption, S3ObjectLock, S3ReplicationConfiguration, S3ReplicationRule, S3ReplicationDestination } from './s3-compatible';
export { S3StorageClass, S3ACL } from './s3-compatible';
export type { GCSCompatibleConfig, GCSCredentials, GCSExternalAccountConfig, GCSUploadResult, GCSResumableUpload, GCSResumableUploadOptions, GCSListObjectsResult, GCSObject, GCSObjectAccessControl, GCSBucket, GCSBucketLifecycle, GCSLifecycleRule, GCSRetentionPolicy, GCSBucketAccessControl, GCSCORSConfiguration, GCSSignedUrlOptions, GCSSignedUrl, GCSNotification, GCSCustomerEncryption, GCSKMSEncryption } from './gcs-compatible';
export { GCSStorageClass, GCSPredefinedACL } from './gcs-compatible';
export type { MigrationJob, MigrationSourceConfig, MigrationTargetConfig, MigrationCredentials, MigrationProgress, MigrationStats, MigrationConfig, MigrationRetryConfig, MigrationNotificationConfig, MigrationNotificationChannel, MigrationFilter, MigrationError, MigrationWarning, MigrationVerification, VerificationDetail, MigrationSchedule, MigrationRecurrenceRule, MigrationTemplate } from './migration';
export { MigrationStatus, MigrationPhase, MigrationSource, MigrationTarget } from './migration';
export type { AccessKey, Permission, AWSSignatureV4Request, AWSSignatureV4Credentials, AWSSignatureV4Result, S3SignatureV4Components, S3CanonicalRequest, S3StringToSign, GCSOAuth2Token, GCSOAuth2ValidationResult, GCSServiceAccount, GCSServiceAccountToken, VarityAPIKey, RateLimit, Web3AuthRequest, Web3AuthResult, AuthorizationPolicy, PolicyStatement, PolicyCondition, AuthorizationContext, AuthorizationResult, Session } from './auth';
export { AuthProvider, AccessKeyStatus, PermissionEffect, Action, ConditionType, PermissionChecker } from './auth';
export { isAWSSignatureV4Credentials, isGCSServiceAccount, isGCSOAuth2Token } from './auth';
export type { ThirdwebClient, Chain, PreparedTransaction, ThirdwebContract, PrepareContractCallOptions, ReadContractOptions, Hex, Address, VarityChain, VarityChainConstants, VarityWalletConfig, VaritySmartWalletOptions, VarityWalletConnectionResult, VarityContractConfig, VarityDeploymentParams, VarityDeploymentResult, VarityContractReadOptions, VarityContractWriteOptions, SIWEMessage, SIWEVerifyResult, SIWEAuthPayload, VarityGasEstimation, VarityTransactionFeeOptions, VarityEventFilter, VarityContractEvent, USDCAmount, ThirdwebEthersHybrid, ThirdwebWrapperConfig, ContractDeployResponse, ContractCallResponse, SIWEAuthResponse, ChainInfoResponse, WalletBalanceResponse, ThirdwebClientConfig, ThirdwebAuthConfig, ThirdwebStorageConfig } from './thirdweb';
export { isVarityChain, isSIWEMessage, formatUSDC, parseUSDC, VARITY_L3_TESTNET, USDC_DECIMALS } from './thirdweb';
/**
 * Package version
 */
export declare const VERSION = "1.0.0";
/**
 * Package name
 */
export declare const PACKAGE_NAME = "@varity-labs/types";
/**
 * Supported storage backends
 */
export declare const SUPPORTED_STORAGE_BACKENDS: readonly ["filecoin-ipfs", "celestia", "s3-compatible", "gcs-compatible", "multi-tier"];
/**
 * Supported migration sources
 */
export declare const SUPPORTED_MIGRATION_SOURCES: readonly ["aws-s3", "gcp-gcs", "azure-blob", "local-filesystem", "http", "ftp", "varity"];
//# sourceMappingURL=index.d.ts.map