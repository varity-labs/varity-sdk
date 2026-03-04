/**
 * Varity Storage Types - Core Storage Infrastructure
 *
 * This module defines the complete type system for Varity's multi-backend storage architecture,
 * supporting Filecoin/IPFS, S3-compatible, GCS-compatible, and multi-tier storage strategies.
 *
 * Part of Varity's 3-layer encrypted storage architecture:
 * - Layer 1: Varity Internal (company docs, internal knowledge)
 * - Layer 2: Industry RAG (shared industry knowledge)
 * - Layer 3: Customer Data (private business data)
 */
/**
 * Storage layer for Varity's 3-layer architecture
 */
export declare enum StorageLayer {
    /** Varity company documents and internal knowledge */
    VARITY_INTERNAL = "varity-internal",
    /** Industry-specific RAG knowledge (shared across customers) */
    INDUSTRY_RAG = "industry-rag",
    /** Customer-specific private data */
    CUSTOMER_DATA = "customer-data"
}
/**
 * Storage backend types supported by Varity
 */
export declare enum StorageBackend {
    /** Filecoin/IPFS via Pinata API (current default) */
    FILECOIN_IPFS = "filecoin-ipfs",
    /** Celestia Data Availability Layer */
    CELESTIA = "celestia",
    /** S3-compatible storage (MinIO, AWS S3, etc.) */
    S3_COMPATIBLE = "s3-compatible",
    /** Google Cloud Storage compatible */
    GCS_COMPATIBLE = "gcs-compatible",
    /** Multi-tier storage with automatic tiering */
    MULTI_TIER = "multi-tier"
}
/**
 * Storage tier for multi-tier architecture
 * Balances access speed vs cost optimization
 */
export declare enum StorageTier {
    /** Fast access, higher cost (IPFS pinned, in-memory cache) */
    HOT = "hot",
    /** Moderate access, moderate cost (standard storage) */
    WARM = "warm",
    /** Infrequent access, lower cost (archive storage) */
    COLD = "cold",
    /** Long-term archive, lowest cost (deep archive) */
    GLACIER = "glacier"
}
/**
 * Base storage adapter interface - ALL storage backends must implement this
 *
 * This interface ensures consistent behavior across all storage backends,
 * whether Filecoin, S3, GCS, or multi-tier strategies.
 */
export interface IStorageAdapter {
    /**
     * Upload data to storage
     * @param data - Data to upload (Buffer, string, Blob, or any binary data)
     * @param options - Upload configuration options
     * @returns Storage result with identifier and metadata
     */
    upload(data: any, options: UploadOptions): Promise<StorageResult>;
    /**
     * Download data from storage
     * @param identifier - Storage identifier (CID, S3 key, etc.)
     * @returns Downloaded data (Buffer, Blob, or binary data)
     */
    download(identifier: string): Promise<any>;
    /**
     * Delete data from storage
     * @param identifier - Storage identifier to delete
     */
    delete(identifier: string): Promise<void>;
    /**
     * List stored objects matching criteria
     * @param options - List filtering and pagination options
     * @returns Array of storage items
     */
    list(options?: ListOptions): Promise<StorageItem[]>;
    /**
     * Check if object exists in storage
     * @param identifier - Storage identifier to check
     * @returns True if exists, false otherwise
     */
    exists(identifier: string): Promise<boolean>;
    /**
     * Get object metadata without downloading content
     * @param identifier - Storage identifier
     * @returns Object metadata
     */
    getMetadata(identifier: string): Promise<StorageMetadata>;
    /**
     * Get the storage backend type
     */
    getBackendType(): StorageBackend;
}
/**
 * Upload options for storage operations
 */
export interface UploadOptions {
    /** Storage layer (Varity Internal, Industry RAG, Customer Data) */
    layer: StorageLayer;
    /** Storage tier (hot, warm, cold, glacier) */
    tier?: StorageTier;
    /** Custom metadata to attach to object */
    metadata?: Record<string, any>;
    /** Pin to IPFS (for Filecoin backend) */
    pin?: boolean;
    /** Enable Lit Protocol encryption */
    encrypt?: boolean;
    /** Storage namespace (layer-specific prefix) */
    namespace?: string;
    /** Content type (MIME type) */
    contentType?: string;
    /** Cache control header */
    cacheControl?: string;
    /** ACL/permissions (backend-specific) */
    acl?: string;
    /** Tags for organization */
    tags?: Record<string, string>;
}
/**
 * Storage result returned after upload operation
 */
export interface StorageResult {
    /** Primary identifier (CID for Filecoin, key for S3, etc.) */
    identifier: string;
    /** Gateway URL for accessing the content */
    gatewayUrl: string;
    /** Size in bytes */
    size: number;
    /** Content hash (SHA256 or backend-specific) */
    hash: string;
    /** Upload timestamp (Unix milliseconds) */
    timestamp: number;
    /** Storage backend used */
    backend: StorageBackend;
    /** Storage tier assigned */
    tier?: StorageTier;
    /** Storage layer used */
    layer?: StorageLayer;
    /** Encryption metadata (if encrypted) */
    encryptionMetadata?: {
        encrypted: boolean;
        walletAddress?: string;
        layer: StorageLayer;
        algorithm?: string;
    };
    /** Additional backend-specific metadata */
    backendMetadata?: Record<string, any>;
}
/**
 * Storage item returned from list operations
 */
export interface StorageItem {
    /** Storage identifier */
    identifier: string;
    /** Object key/name */
    key: string;
    /** Size in bytes */
    size: number;
    /** Last modified timestamp */
    lastModified: Date;
    /** ETag (if supported by backend) */
    etag?: string;
    /** Custom metadata */
    metadata?: Record<string, any>;
    /** Storage tier */
    tier?: StorageTier;
    /** Storage class (backend-specific) */
    storageClass?: string;
    /** Whether object is encrypted */
    encrypted?: boolean;
}
/**
 * List options for querying storage
 */
export interface ListOptions {
    /** Prefix filter (e.g., 'varity-internal/', 'customer-123/') */
    prefix?: string;
    /** Delimiter for hierarchical listing */
    delimiter?: string;
    /** Maximum number of results to return */
    maxResults?: number;
    /** Continuation token for pagination */
    continuationToken?: string;
    /** Filter by storage tier */
    tier?: StorageTier;
    /** Start after this key (for pagination) */
    startAfter?: string;
    /** Include metadata in results */
    includeMetadata?: boolean;
}
/**
 * Storage metadata for objects
 */
export interface StorageMetadata {
    /** Storage identifier */
    identifier: string;
    /** Size in bytes */
    size: number;
    /** Content type */
    contentType?: string;
    /** Last modified timestamp */
    lastModified: Date;
    /** ETag */
    etag?: string;
    /** Custom metadata */
    customMetadata?: Record<string, any>;
    /** Storage tier */
    tier?: StorageTier;
    /** Storage layer */
    layer?: StorageLayer;
    /** Access statistics */
    accessCount?: number;
    /** Last accessed timestamp */
    lastAccessed?: Date;
    /** Whether object is encrypted */
    encrypted?: boolean;
    /** Cache control settings */
    cacheControl?: string;
}
/**
 * Multi-tier storage configuration
 * Enables automatic cost optimization through intelligent tiering
 */
export interface MultiTierStorageConfig {
    /** Hot tier configuration (fast access) */
    hotTier: TierConfig;
    /** Warm tier configuration (moderate access) */
    warmTier?: TierConfig;
    /** Cold tier configuration (infrequent access) */
    coldTier: TierConfig;
    /** Auto-tiering configuration */
    autoTiering: AutoTieringConfig;
}
/**
 * Configuration for a specific storage tier
 */
export interface TierConfig {
    /** Storage backend to use */
    backend: StorageBackend;
    /** Replication factor */
    replication: number;
    /** Cost per GB per month (USD) */
    costPerGB: number;
    /** Expected access latency in milliseconds */
    accessLatency: number;
    /** Minimum object size for this tier */
    minObjectSize?: number;
    /** Maximum object size for this tier */
    maxObjectSize?: number;
}
/**
 * Auto-tiering configuration
 */
export interface AutoTieringConfig {
    /** Enable automatic tiering */
    enabled: boolean;
    /** Tiering policy to use */
    policy: TieringPolicy;
    /** Check interval in hours */
    checkInterval: number;
    /** Tiering rules */
    rules?: TieringRule[];
}
/**
 * Tiering policies
 */
export declare enum TieringPolicy {
    /** Based on object age */
    TIME_BASED = "time-based",
    /** Based on access frequency */
    ACCESS_BASED = "access-based",
    /** Based on object size */
    SIZE_BASED = "size-based",
    /** Cost optimization strategy */
    COST_OPTIMIZED = "cost-optimized",
    /** Custom policy */
    CUSTOM = "custom"
}
/**
 * Tiering rule for automatic tier transitions
 */
export interface TieringRule {
    /** Rule name */
    name: string;
    /** Rule description */
    description?: string;
    /** Condition to trigger tiering */
    condition: TieringCondition;
    /** Action to take when condition is met */
    action: TieringAction;
    /** Rule priority (higher = evaluated first) */
    priority?: number;
    /** Whether rule is enabled */
    enabled?: boolean;
}
/**
 * Condition for tiering rule
 */
export interface TieringCondition {
    /** Condition type */
    type: 'age' | 'access_count' | 'size' | 'cost' | 'last_accessed';
    /** Comparison operator */
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
    /** Comparison value */
    value: number;
    /** Unit for the value */
    unit?: 'days' | 'mb' | 'gb' | 'usd' | 'accesses';
}
/**
 * Action to take when tiering condition is met
 */
export interface TieringAction {
    /** Target tier to move object to */
    moveTo: StorageTier;
    /** Send notification */
    notify?: boolean;
    /** Notification recipients */
    notifyTo?: string[];
    /** Delete object instead of moving */
    delete?: boolean;
}
/**
 * Access pattern analytics for cost optimization
 */
export interface AccessPattern {
    /** Object identifier */
    identifier: string;
    /** Total access count */
    accessCount: number;
    /** Last accessed timestamp */
    lastAccessed: Date;
    /** Average interval between accesses (days) */
    averageAccessInterval: number;
    /** Total bandwidth consumed (bytes) */
    totalBandwidth: number;
    /** Current storage tier */
    currentTier: StorageTier;
    /** Recommended tier based on access pattern */
    recommendedTier: StorageTier;
    /** Estimated monthly cost savings if moved to recommended tier */
    costSavingsEstimate: number;
    /** Confidence score for recommendation (0-1) */
    recommendationConfidence: number;
}
/**
 * Storage usage statistics
 */
export interface StorageStats {
    /** Total objects stored */
    totalObjects: number;
    /** Total size in bytes */
    totalSize: number;
    /** Breakdown by tier */
    byTier: Record<StorageTier, TierStats>;
    /** Breakdown by layer */
    byLayer: Record<StorageLayer, LayerStats>;
    /** Total monthly cost estimate */
    monthlyCostEstimate: number;
    /** Last updated timestamp */
    lastUpdated: Date;
}
/**
 * Statistics for a specific tier
 */
export interface TierStats {
    /** Number of objects */
    objectCount: number;
    /** Total size in bytes */
    totalSize: number;
    /** Monthly cost */
    monthlyCost: number;
    /** Average object size */
    avgObjectSize: number;
}
/**
 * Statistics for a specific layer
 */
export interface LayerStats {
    /** Number of objects */
    objectCount: number;
    /** Total size in bytes */
    totalSize: number;
    /** Percentage of total storage */
    percentage: number;
}
/**
 * Storage operation result with metrics
 */
export interface StorageOperationResult {
    /** Whether operation succeeded */
    success: boolean;
    /** Operation type */
    operation: 'upload' | 'download' | 'delete' | 'list';
    /** Duration in milliseconds */
    durationMs: number;
    /** Bytes transferred */
    bytesTransferred: number;
    /** Error message (if failed) */
    error?: string;
    /** Additional details */
    details?: Record<string, any>;
}
/**
 * Encryption options for storage operations
 */
export interface EncryptionOptions {
    /** Enable encryption */
    enabled: boolean;
    /** Encryption algorithm */
    algorithm?: 'aes-256-gcm' | 'aes-256-cbc';
    /** Key derivation function */
    keyDerivation?: 'pbkdf2' | 'scrypt';
    /** Use Lit Protocol for access control */
    litProtocol?: boolean;
    /** Custom encryption key (base64) */
    customKey?: string;
}
/**
 * Encryption metadata stored with encrypted objects
 */
export interface EncryptionMetadata {
    /** Whether object is encrypted */
    encrypted: boolean;
    /** Encryption algorithm used */
    algorithm: string;
    /** Wallet address used for encryption */
    walletAddress: string;
    /** Storage layer */
    layer: StorageLayer;
    /** Lit Protocol enabled */
    litProtocolEnabled: boolean;
    /** Key identifier (for Lit Protocol or KMS) */
    keyId?: string;
    /** Initialization vector (for some algorithms) */
    iv?: string;
    /** Authentication tag (for GCM mode) */
    authTag?: string;
}
/**
 * Comprehensive storage metrics and analytics
 */
export interface StorageMetrics {
    /** Total storage size (bytes) */
    totalSize: number;
    /** Total object count */
    objectCount: number;
    /** Metrics by storage layer */
    byLayer: Record<StorageLayer, LayerMetrics>;
    /** Metrics by storage tier */
    byTier: Record<StorageTier, TierMetrics>;
    /** Metrics by backend */
    byBackend: Record<StorageBackend, BackendMetrics>;
    /** Cost breakdown */
    costs: StorageCosts;
    /** Last updated timestamp */
    lastUpdated: Date;
    /** Bandwidth usage (bytes) */
    bandwidthUsage?: BandwidthMetrics;
}
/**
 * Metrics for a specific storage layer
 */
export interface LayerMetrics {
    /** Number of objects */
    objectCount: number;
    /** Total size (bytes) */
    totalSize: number;
    /** Last updated timestamp */
    lastUpdated: Date;
    /** Encrypted object count */
    encryptedObjects?: number;
    /** Average object size */
    avgObjectSize?: number;
}
/**
 * Metrics for a specific storage tier
 */
export interface TierMetrics {
    /** Number of objects */
    objectCount: number;
    /** Total size (bytes) */
    totalSize: number;
    /** Average access time (milliseconds) */
    averageAccessTime: number;
    /** Cost per GB per month */
    costPerGB: number;
    /** Monthly cost estimate */
    monthlyCost: number;
    /** Average object size */
    avgObjectSize: number;
}
/**
 * Metrics for a specific storage backend
 */
export interface BackendMetrics {
    /** Number of objects */
    objectCount: number;
    /** Total size (bytes) */
    totalSize: number;
    /** Backend availability (percentage 0-100) */
    availability: number;
    /** Latency metrics */
    latency: LatencyMetrics;
    /** Request count */
    requestCount?: number;
    /** Error count */
    errorCount?: number;
    /** Last health check */
    lastHealthCheck?: Date;
}
/**
 * Latency metrics for a backend
 */
export interface LatencyMetrics {
    /** 50th percentile latency (ms) */
    p50: number;
    /** 95th percentile latency (ms) */
    p95: number;
    /** 99th percentile latency (ms) */
    p99: number;
    /** Average latency (ms) */
    avg: number;
    /** Minimum latency (ms) */
    min?: number;
    /** Maximum latency (ms) */
    max?: number;
}
/**
 * Storage cost breakdown
 */
export interface StorageCosts {
    /** Total monthly cost (USD) */
    monthlyTotal: number;
    /** Cost breakdown by category */
    breakdown: {
        /** Storage costs */
        storage: number;
        /** Bandwidth/egress costs */
        bandwidth: number;
        /** API operation costs */
        operations: number;
        /** Replication costs */
        replication?: number;
    };
    /** Comparison to AWS S3 */
    comparisonToAWS: CostComparison;
    /** Comparison to Google Cloud Storage */
    comparisonToGCP: CostComparison;
    /** Monthly savings amount */
    monthlySavings: number;
    /** Savings percentage */
    savingsPercent: number;
}
/**
 * Cost comparison between platforms
 */
export interface CostComparison {
    /** Source platform monthly cost */
    sourceMonthlyCost: number;
    /** Target platform monthly cost */
    targetMonthlyCost: number;
    /** Savings amount */
    savingsAmount: number;
    /** Savings percentage */
    savingsPercent: number;
    /** Storage cost breakdown */
    storageCost: number;
    /** Bandwidth cost breakdown */
    bandwidthCost: number;
    /** Operations cost breakdown */
    operationsCost: number;
}
/**
 * Bandwidth usage metrics
 */
export interface BandwidthMetrics {
    /** Total upload bytes */
    uploadBytes: number;
    /** Total download bytes */
    downloadBytes: number;
    /** Upload requests count */
    uploadRequests: number;
    /** Download requests count */
    downloadRequests: number;
    /** Period start */
    periodStart: Date;
    /** Period end */
    periodEnd: Date;
    /** Average upload speed (bytes/sec) */
    avgUploadSpeed?: number;
    /** Average download speed (bytes/sec) */
    avgDownloadSpeed?: number;
}
//# sourceMappingURL=storage.d.ts.map