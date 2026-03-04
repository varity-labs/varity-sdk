/**
 * Varity Storage Migration Types
 *
 * Type definitions for migrating data from traditional cloud storage
 * (AWS S3, GCP GCS, Azure Blob) to Varity's decentralized storage architecture.
 *
 * Supports:
 * - Batch migration jobs
 * - Progress tracking
 * - Error handling and retry logic
 * - Integrity verification
 * - Migration from multiple sources
 */
import { StorageLayer, StorageTier } from './storage';
/**
 * Migration job lifecycle status
 */
export declare enum MigrationStatus {
    /** Job created but not started */
    PENDING = "pending",
    /** Job is currently running */
    RUNNING = "running",
    /** Job is temporarily paused */
    PAUSED = "paused",
    /** Job completed successfully */
    COMPLETED = "completed",
    /** Job failed with errors */
    FAILED = "failed",
    /** Job was cancelled by user */
    CANCELLED = "cancelled",
    /** Job is being validated */
    VALIDATING = "validating",
    /** Job is in retry state */
    RETRYING = "retrying"
}
/**
 * Migration phase
 */
export declare enum MigrationPhase {
    /** Discovering objects to migrate */
    DISCOVERY = "discovery",
    /** Transferring data */
    TRANSFER = "transfer",
    /** Verifying integrity */
    VERIFICATION = "verification",
    /** Cleaning up source (if configured) */
    CLEANUP = "cleanup",
    /** Completed */
    DONE = "done"
}
/**
 * Migration source types
 */
export declare enum MigrationSource {
    /** AWS S3 */
    AWS_S3 = "aws-s3",
    /** Google Cloud Storage */
    GCP_GCS = "gcp-gcs",
    /** Azure Blob Storage */
    AZURE_BLOB = "azure-blob",
    /** Local filesystem */
    LOCAL_FILESYSTEM = "local-filesystem",
    /** HTTP/HTTPS URLs */
    HTTP = "http",
    /** FTP/SFTP */
    FTP = "ftp",
    /** Another Varity storage layer */
    VARITY = "varity"
}
/**
 * Migration target (always Varity)
 */
export declare enum MigrationTarget {
    /** Varity Filecoin/IPFS storage */
    VARITY_FILECOIN = "varity-filecoin",
    /** Varity S3-compatible storage */
    VARITY_S3_COMPATIBLE = "varity-s3-compatible",
    /** Varity GCS-compatible storage */
    VARITY_GCS_COMPATIBLE = "varity-gcs-compatible"
}
/**
 * Migration job
 */
export interface MigrationJob {
    /** Unique job ID */
    id: string;
    /** Job name */
    name: string;
    /** Job description */
    description?: string;
    /** Source configuration */
    source: MigrationSourceConfig;
    /** Target configuration */
    target: MigrationTargetConfig;
    /** Current status */
    status: MigrationStatus;
    /** Current phase */
    phase: MigrationPhase;
    /** Created timestamp */
    createdAt: Date;
    /** Started timestamp */
    startedAt?: Date;
    /** Completed timestamp */
    completedAt?: Date;
    /** Last updated timestamp */
    lastUpdated: Date;
    /** Progress information */
    progress: MigrationProgress;
    /** Configuration options */
    config: MigrationConfig;
    /** Errors encountered */
    errors: MigrationError[];
    /** Warnings */
    warnings: MigrationWarning[];
    /** Created by user */
    createdBy?: string;
    /** Scheduled start time */
    scheduledAt?: Date;
    /** Parent job ID (for sub-jobs) */
    parentJobId?: string;
    /** Tags for organization */
    tags?: Record<string, string>;
    /** Metadata */
    metadata?: Record<string, any>;
}
/**
 * Migration source configuration
 */
export interface MigrationSourceConfig {
    /** Source type */
    type: MigrationSource;
    /** Bucket/container name */
    bucket: string;
    /** Region (for cloud providers) */
    region?: string;
    /** Credentials */
    credentials: MigrationCredentials;
    /** Prefix filter (e.g., 'folder/subfolder/') */
    prefix?: string;
    /** Filters for selective migration */
    filters?: MigrationFilter[];
    /** Custom endpoint (for S3-compatible) */
    endpoint?: string;
    /** Additional source-specific config */
    sourceConfig?: Record<string, any>;
}
/**
 * Migration target configuration
 */
export interface MigrationTargetConfig {
    /** Target type */
    type: MigrationTarget;
    /** Varity storage layer */
    layer: StorageLayer;
    /** Storage tier */
    tier?: StorageTier;
    /** Target bucket (if using S3/GCS compatible) */
    bucket?: string;
    /** Enable encryption */
    encrypt: boolean;
    /** Wallet address for encryption */
    walletAddress?: string;
    /** Namespace prefix */
    namespacePrefix?: string;
    /** Pin to IPFS (for Filecoin backend) */
    pin?: boolean;
    /** Additional target-specific config */
    targetConfig?: Record<string, any>;
}
/**
 * Migration credentials
 */
export interface MigrationCredentials {
    /** AWS credentials */
    aws?: {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string;
    };
    /** GCP credentials */
    gcp?: {
        projectId: string;
        clientEmail: string;
        privateKey: string;
    };
    /** Azure credentials */
    azure?: {
        accountName: string;
        accountKey: string;
        sasToken?: string;
    };
    /** HTTP credentials */
    http?: {
        username?: string;
        password?: string;
        headers?: Record<string, string>;
    };
    /** FTP credentials */
    ftp?: {
        host: string;
        port: number;
        username: string;
        password: string;
        secure?: boolean;
    };
}
/**
 * Migration progress tracking
 */
export interface MigrationProgress {
    /** Total objects discovered */
    totalObjects: number;
    /** Objects completed successfully */
    completedObjects: number;
    /** Objects that failed */
    failedObjects: number;
    /** Objects skipped */
    skippedObjects: number;
    /** Objects currently in progress */
    inProgressObjects: number;
    /** Total bytes to transfer */
    totalBytes: number;
    /** Bytes transferred successfully */
    transferredBytes: number;
    /** Bytes failed */
    failedBytes: number;
    /** Overall percentage complete (0-100) */
    percentage: number;
    /** Estimated time remaining (seconds) */
    estimatedTimeRemaining?: number;
    /** Current transfer speed (bytes/second) */
    currentSpeed: number;
    /** Average transfer speed (bytes/second) */
    averageSpeed: number;
    /** Objects per second */
    objectsPerSecond: number;
    /** Start time */
    startTime?: Date;
    /** Time spent in each phase */
    phaseTimings?: Record<MigrationPhase, number>;
}
/**
 * Migration statistics
 */
export interface MigrationStats {
    /** Job ID */
    jobId: string;
    /** Total objects processed */
    totalObjects: number;
    /** Success count */
    successCount: number;
    /** Failure count */
    failureCount: number;
    /** Skip count */
    skipCount: number;
    /** Total bytes transferred */
    totalBytes: number;
    /** Average object size */
    averageObjectSize: number;
    /** Total duration (seconds) */
    totalDuration: number;
    /** Average speed (bytes/second) */
    averageSpeed: number;
    /** Peak speed (bytes/second) */
    peakSpeed: number;
    /** Cost estimate */
    costEstimate?: {
        sourceCost: number;
        targetCost: number;
        transferCost: number;
        currency: string;
    };
}
/**
 * Migration configuration options
 */
export interface MigrationConfig {
    /** Number of concurrent transfers */
    concurrency: number;
    /** Batch size for listing operations */
    batchSize: number;
    /** Verify data integrity after transfer */
    verifyIntegrity: boolean;
    /** Delete source objects after successful transfer */
    deleteSource: boolean;
    /** Dry run (don't actually transfer) */
    dryRun: boolean;
    /** Support resumable transfers */
    resumable: boolean;
    /** Skip objects that already exist in target */
    skipExisting: boolean;
    /** Overwrite existing objects in target */
    overwriteExisting: boolean;
    /** Preserve object metadata */
    preserveMetadata: boolean;
    /** Preserve timestamps */
    preserveTimestamps: boolean;
    /** Retry configuration */
    retry: MigrationRetryConfig;
    /** Bandwidth limit (bytes/second, 0 = unlimited) */
    bandwidthLimit?: number;
    /** Notification configuration */
    notifications?: MigrationNotificationConfig;
    /** Checkpointing interval (seconds) */
    checkpointInterval?: number;
    /** Maximum object size (bytes, 0 = unlimited) */
    maxObjectSize?: number;
    /** Minimum object size (bytes) */
    minObjectSize?: number;
}
/**
 * Retry configuration
 */
export interface MigrationRetryConfig {
    /** Maximum number of retries */
    maxRetries: number;
    /** Initial delay (milliseconds) */
    initialDelayMs: number;
    /** Maximum delay (milliseconds) */
    maxDelayMs: number;
    /** Backoff multiplier */
    backoffMultiplier: number;
    /** Retry only on specific errors */
    retryableErrors?: string[];
}
/**
 * Notification configuration
 */
export interface MigrationNotificationConfig {
    /** Enable notifications */
    enabled: boolean;
    /** Notification channels */
    channels: MigrationNotificationChannel[];
    /** Notify on job start */
    onStart: boolean;
    /** Notify on job completion */
    onComplete: boolean;
    /** Notify on job failure */
    onFailure: boolean;
    /** Notify on warnings */
    onWarning: boolean;
    /** Notification frequency (for progress updates, seconds) */
    progressInterval?: number;
}
/**
 * Notification channel
 */
export interface MigrationNotificationChannel {
    /** Channel type */
    type: 'email' | 'webhook' | 'slack' | 'sns' | 'pubsub';
    /** Channel-specific configuration */
    config: Record<string, any>;
}
/**
 * Migration filter for selective migration
 */
export interface MigrationFilter {
    /** Filter type */
    type: 'include' | 'exclude';
    /** Pattern (glob or regex) */
    pattern: string;
    /** Pattern type */
    patternType?: 'glob' | 'regex';
    /** Case sensitive */
    caseSensitive?: boolean;
    /** Filter field */
    field?: 'key' | 'size' | 'modified' | 'storageClass' | 'contentType';
    /** Operator (for numeric/date filters) */
    operator?: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
    /** Value (for comparison filters) */
    value?: any;
}
/**
 * Migration error
 */
export interface MigrationError {
    /** Object key that failed */
    objectKey: string;
    /** Error code */
    errorCode: string;
    /** Error message */
    error: string;
    /** Stack trace */
    stackTrace?: string;
    /** Timestamp */
    timestamp: Date;
    /** Retryable */
    retryable: boolean;
    /** Retry count */
    retryCount: number;
    /** Phase when error occurred */
    phase: MigrationPhase;
    /** Additional details */
    details?: Record<string, any>;
}
/**
 * Migration warning
 */
export interface MigrationWarning {
    /** Object key */
    objectKey?: string;
    /** Warning type */
    type: 'metadata_loss' | 'permission_change' | 'size_limit' | 'other';
    /** Warning message */
    message: string;
    /** Timestamp */
    timestamp: Date;
    /** Severity */
    severity: 'low' | 'medium' | 'high';
}
/**
 * Migration verification result
 */
export interface MigrationVerification {
    /** Job ID */
    jobId: string;
    /** Verification passed */
    verified: boolean;
    /** Total objects to verify */
    totalObjects: number;
    /** Verified objects */
    verifiedObjects: number;
    /** Failed verification objects */
    failedObjects: number;
    /** Missing objects in target */
    missingObjects: string[];
    /** Corrupted objects (hash mismatch) */
    corruptedObjects: string[];
    /** Verification details */
    details: VerificationDetail[];
    /** Verification started */
    startedAt: Date;
    /** Verification completed */
    completedAt?: Date;
    /** Verification duration (seconds) */
    duration?: number;
}
/**
 * Verification detail for a single object
 */
export interface VerificationDetail {
    /** Object key */
    key: string;
    /** Source hash */
    sourceHash: string;
    /** Target hash */
    targetHash: string;
    /** Hashes match */
    match: boolean;
    /** Source size */
    sourceSize: number;
    /** Target size */
    targetSize: number;
    /** Sizes match */
    sizeMatch: boolean;
    /** Metadata match */
    metadataMatch?: boolean;
    /** Error message (if verification failed) */
    error?: string;
}
/**
 * Migration schedule
 */
export interface MigrationSchedule {
    /** Schedule ID */
    id: string;
    /** Job ID or template */
    jobId: string;
    /** Schedule type */
    type: 'once' | 'recurring' | 'cron';
    /** Start time (for 'once') */
    startTime?: Date;
    /** Cron expression (for 'cron') */
    cronExpression?: string;
    /** Recurrence rule (for 'recurring') */
    recurrenceRule?: MigrationRecurrenceRule;
    /** Schedule enabled */
    enabled: boolean;
    /** Next run time */
    nextRun?: Date;
    /** Last run time */
    lastRun?: Date;
    /** Timezone */
    timezone?: string;
}
/**
 * Recurrence rule
 */
export interface MigrationRecurrenceRule {
    /** Frequency */
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    /** Interval */
    interval: number;
    /** Days of week (for weekly, 0 = Sunday) */
    daysOfWeek?: number[];
    /** Day of month (for monthly) */
    dayOfMonth?: number;
    /** Hour of day */
    hour?: number;
    /** Minute of hour */
    minute?: number;
    /** End date */
    endDate?: Date;
    /** Max occurrences */
    maxOccurrences?: number;
}
/**
 * Migration template for reusable configurations
 */
export interface MigrationTemplate {
    /** Template ID */
    id: string;
    /** Template name */
    name: string;
    /** Template description */
    description?: string;
    /** Source configuration template */
    sourceTemplate: Partial<MigrationSourceConfig>;
    /** Target configuration template */
    targetTemplate: Partial<MigrationTargetConfig>;
    /** Config template */
    configTemplate: Partial<MigrationConfig>;
    /** Template tags */
    tags?: Record<string, string>;
    /** Created by */
    createdBy?: string;
    /** Created at */
    createdAt: Date;
    /** Updated at */
    updatedAt: Date;
}
//# sourceMappingURL=migration.d.ts.map