/**
 * Varity SDK - Multi-Tier Storage Adapter
 *
 * Implements intelligent hot/cold storage tiering with automatic promotion/demotion
 * based on access patterns. Optimizes costs while maintaining performance.
 */
import type { VaritySDK } from '../../../core/VaritySDK';
import { StorageTier, type UploadOptions, type StorageResult, type StorageItem, type ListOptions, type StorageMetadata, type MultiTierStorageConfig } from '@varity-labs/types';
import { BaseStorageAdapter } from './IStorageAdapter';
/**
 * Multi-tier storage adapter with automatic cost optimization
 *
 * Features:
 * - Hot/Cold tier management
 * - Automatic tier transitions based on access patterns
 * - Access tracking and analytics
 * - Cost optimization through intelligent tiering
 *
 * @example
 * ```typescript
 * const config: MultiTierStorageConfig = {
 *   hotTier: { backend: StorageBackend.FILECOIN_IPFS, replication: 3 },
 *   coldTier: { backend: StorageBackend.FILECOIN_IPFS, replication: 2 },
 *   autoTiering: {
 *     enabled: true,
 *     policy: TieringPolicy.ACCESS_BASED,
 *     checkInterval: 24
 *   }
 * }
 * const adapter = new MultiTierAdapter(sdk, config)
 * ```
 */
export declare class MultiTierAdapter extends BaseStorageAdapter {
    private sdk;
    private hotTierAdapter;
    private coldTierAdapter;
    private config;
    private tieringMetadata;
    private autoTieringInterval;
    constructor(sdk: VaritySDK, config: MultiTierStorageConfig);
    /**
     * Upload to appropriate tier based on options or auto-tiering rules
     *
     * @param data - Data to upload
     * @param options - Upload options
     * @returns Storage result with tier information
     */
    upload(data: Buffer | string | Blob, options: UploadOptions): Promise<StorageResult>;
    /**
     * Download from appropriate tier, update access metadata
     *
     * @param identifier - Storage identifier
     * @returns Downloaded data
     */
    download(identifier: string): Promise<Buffer>;
    /**
     * Delete from all tiers
     *
     * @param identifier - Storage identifier
     */
    delete(identifier: string): Promise<void>;
    /**
     * Check if object exists in any tier
     *
     * @param identifier - Storage identifier
     * @returns True if exists
     */
    exists(identifier: string): Promise<boolean>;
    /**
     * List objects across all tiers
     *
     * @param options - List options
     * @returns Array of storage items
     */
    list(options?: ListOptions): Promise<StorageItem[]>;
    /**
     * Get metadata for an object
     *
     * @param identifier - Storage identifier
     * @returns Storage metadata
     */
    getMetadata(identifier: string): Promise<StorageMetadata>;
    /**
     * Promote object to a hotter tier
     *
     * @param identifier - Storage identifier
     * @param targetTier - Target tier
     */
    promoteTier(identifier: string, targetTier: StorageTier): Promise<void>;
    /**
     * Demote object to a colder tier (for cost optimization)
     *
     * @param identifier - Storage identifier
     * @param targetTier - Target tier
     */
    demoteTier(identifier: string, targetTier: StorageTier): Promise<void>;
    /**
     * Get access URL for an object
     *
     * @param identifier - Storage identifier
     * @param expiresIn - Expiration time in seconds
     * @returns Gateway URL
     */
    getAccessUrl(identifier: string, expiresIn?: number): Promise<string>;
    /**
     * Health check for multi-tier backend
     *
     * @returns Combined health status
     */
    healthCheck(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
    /**
     * Determine initial tier based on data size and options
     *
     * @param data - Data to upload
     * @param options - Upload options
     * @returns Recommended tier
     */
    private determineInitialTier;
    /**
     * Get adapter for a specific tier
     *
     * @param tier - Storage tier
     * @returns Adapter instance
     */
    private getAdapterForTier;
    /**
     * Check if object should be promoted to hot tier
     *
     * @param metadata - Tiering metadata
     * @returns True if should promote
     */
    private shouldPromote;
    /**
     * Check if object should be demoted to cold tier
     *
     * @param metadata - Tiering metadata
     * @returns True if should demote
     */
    private shouldDemote;
    /**
     * Schedule promotion for an object
     *
     * @param identifier - Storage identifier
     * @param targetTier - Target tier
     */
    private schedulePromotion;
    /**
     * Start auto-tiering background process
     */
    private startAutoTiering;
    /**
     * Stop auto-tiering background process
     */
    private stopAutoTiering;
    /**
     * Run auto-tiering checks for all objects
     */
    private runAutoTiering;
    /**
     * Persist metadata to storage
     *
     * @param identifier - Storage identifier
     */
    private persistMetadata;
    /**
     * Load metadata from storage
     *
     * @param identifier - Storage identifier
     * @returns Tiering metadata or null
     */
    private loadMetadata;
    /**
     * Delete metadata from storage
     *
     * @param identifier - Storage identifier
     */
    private deleteMetadata;
    /**
     * Clean up resources
     */
    destroy(): void;
}
//# sourceMappingURL=MultiTierAdapter.d.ts.map