/**
 * Varity SDK - Multi-Tier Storage Adapter
 *
 * Implements intelligent hot/cold storage tiering with automatic promotion/demotion
 * based on access patterns. Optimizes costs while maintaining performance.
 */
import { StorageBackend, StorageLayer, StorageTier } from '@varity/types';
import { BaseStorageAdapter } from './IStorageAdapter';
import { FilecoinAdapter } from './FilecoinAdapter';
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
export class MultiTierAdapter extends BaseStorageAdapter {
    sdk;
    hotTierAdapter;
    coldTierAdapter;
    config;
    tieringMetadata;
    autoTieringInterval = null;
    constructor(sdk, config) {
        super(StorageBackend.MULTI_TIER);
        this.sdk = sdk;
        this.config = config;
        this.hotTierAdapter = new FilecoinAdapter(sdk);
        this.coldTierAdapter = new FilecoinAdapter(sdk);
        this.tieringMetadata = new Map();
        // Start auto-tiering background process if enabled
        if (this.config.autoTiering.enabled) {
            this.startAutoTiering();
        }
    }
    /**
     * Upload to appropriate tier based on options or auto-tiering rules
     *
     * @param data - Data to upload
     * @param options - Upload options
     * @returns Storage result with tier information
     */
    async upload(data, options) {
        const targetTier = options.tier || this.determineInitialTier(data, options);
        const adapter = this.getAdapterForTier(targetTier);
        const result = await adapter.upload(data, {
            ...options,
            tier: targetTier
        });
        // Store tiering metadata
        this.tieringMetadata.set(result.identifier, {
            tier: targetTier,
            lastAccessed: new Date(),
            accessCount: 1,
            createdAt: new Date(),
            size: result.size,
            layer: options.layer
        });
        // Persist metadata to storage (optional, for cross-instance consistency)
        await this.persistMetadata(result.identifier);
        return {
            ...result,
            tier: targetTier
        };
    }
    /**
     * Download from appropriate tier, update access metadata
     *
     * @param identifier - Storage identifier
     * @returns Downloaded data
     */
    async download(identifier) {
        const metadata = await this.loadMetadata(identifier);
        const currentTier = metadata?.tier || StorageTier.COLD;
        const adapter = this.getAdapterForTier(currentTier);
        const data = await adapter.download(identifier);
        // Update access metadata
        if (metadata) {
            metadata.lastAccessed = new Date();
            metadata.accessCount++;
            // Consider promoting to hot tier if access threshold exceeded
            if (this.config.autoTiering.enabled &&
                currentTier === StorageTier.COLD &&
                this.shouldPromote(metadata)) {
                // Schedule promotion (don't block download)
                this.schedulePromotion(identifier, StorageTier.HOT);
            }
            await this.persistMetadata(identifier);
        }
        return data;
    }
    /**
     * Delete from all tiers
     *
     * @param identifier - Storage identifier
     */
    async delete(identifier) {
        const metadata = await this.loadMetadata(identifier);
        const currentTier = metadata?.tier || StorageTier.COLD;
        const adapter = this.getAdapterForTier(currentTier);
        await adapter.delete(identifier);
        // Clean up metadata
        this.tieringMetadata.delete(identifier);
        await this.deleteMetadata(identifier);
    }
    /**
     * Check if object exists in any tier
     *
     * @param identifier - Storage identifier
     * @returns True if exists
     */
    async exists(identifier) {
        // Check hot tier first (faster)
        const hotExists = await this.hotTierAdapter.exists(identifier);
        if (hotExists)
            return true;
        // Check cold tier
        return await this.coldTierAdapter.exists(identifier);
    }
    /**
     * List objects across all tiers
     *
     * @param options - List options
     * @returns Array of storage items
     */
    async list(options) {
        // Combine results from all tiers
        const [hotItems, coldItems] = await Promise.all([
            this.hotTierAdapter.list(options),
            this.coldTierAdapter.list(options)
        ]);
        // Deduplicate and merge
        const itemMap = new Map();
        for (const item of [...hotItems, ...coldItems]) {
            if (!itemMap.has(item.key)) {
                itemMap.set(item.key, item);
            }
        }
        return Array.from(itemMap.values());
    }
    /**
     * Get metadata for an object
     *
     * @param identifier - Storage identifier
     * @returns Storage metadata
     */
    async getMetadata(identifier) {
        const metadata = await this.loadMetadata(identifier);
        const currentTier = metadata?.tier || StorageTier.COLD;
        const adapter = this.getAdapterForTier(currentTier);
        const storageMetadata = await adapter.getMetadata(identifier);
        return {
            ...storageMetadata,
            tier: currentTier,
            accessCount: metadata?.accessCount,
            lastAccessed: metadata?.lastAccessed
        };
    }
    /**
     * Promote object to a hotter tier
     *
     * @param identifier - Storage identifier
     * @param targetTier - Target tier
     */
    async promoteTier(identifier, targetTier) {
        const metadata = await this.loadMetadata(identifier);
        if (!metadata || metadata.tier === targetTier)
            return;
        // Download from current tier
        const data = await this.download(identifier);
        // Upload to target tier
        const targetAdapter = this.getAdapterForTier(targetTier);
        await targetAdapter.upload(data, {
            layer: metadata.layer,
            tier: targetTier
        });
        // Delete from old tier
        const oldAdapter = this.getAdapterForTier(metadata.tier);
        await oldAdapter.delete(identifier);
        // Update metadata
        metadata.tier = targetTier;
        this.tieringMetadata.set(identifier, metadata);
        await this.persistMetadata(identifier);
    }
    /**
     * Demote object to a colder tier (for cost optimization)
     *
     * @param identifier - Storage identifier
     * @param targetTier - Target tier
     */
    async demoteTier(identifier, targetTier) {
        await this.promoteTier(identifier, targetTier); // Same logic
    }
    /**
     * Get access URL for an object
     *
     * @param identifier - Storage identifier
     * @param expiresIn - Expiration time in seconds
     * @returns Gateway URL
     */
    async getAccessUrl(identifier, expiresIn) {
        const metadata = await this.loadMetadata(identifier);
        const currentTier = metadata?.tier || StorageTier.COLD;
        const adapter = this.getAdapterForTier(currentTier);
        return adapter.getAccessUrl(identifier, expiresIn);
    }
    /**
     * Health check for multi-tier backend
     *
     * @returns Combined health status
     */
    async healthCheck() {
        const startTime = Date.now();
        try {
            const [hotHealth, coldHealth] = await Promise.all([
                this.hotTierAdapter.healthCheck(),
                this.coldTierAdapter.healthCheck()
            ]);
            const healthy = hotHealth.healthy && coldHealth.healthy;
            const latencyMs = Date.now() - startTime;
            return {
                healthy,
                latencyMs,
                error: !healthy
                    ? `Hot tier: ${hotHealth.error || 'OK'}, Cold tier: ${coldHealth.error || 'OK'}`
                    : undefined
            };
        }
        catch (error) {
            return {
                healthy: false,
                latencyMs: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Determine initial tier based on data size and options
     *
     * @param data - Data to upload
     * @param options - Upload options
     * @returns Recommended tier
     */
    determineInitialTier(data, options) {
        let size = 0;
        if (data instanceof Buffer) {
            size = data.length;
        }
        else if (data instanceof Blob) {
            size = data.size;
        }
        else if (typeof data === 'string') {
            size = Buffer.from(data).length;
        }
        // Small files go to hot tier by default
        const sizeThresholdMB = 1; // 1MB threshold
        if (size < sizeThresholdMB * 1024 * 1024) {
            return StorageTier.HOT;
        }
        // Large files go to cold tier
        return StorageTier.COLD;
    }
    /**
     * Get adapter for a specific tier
     *
     * @param tier - Storage tier
     * @returns Adapter instance
     */
    getAdapterForTier(tier) {
        return tier === StorageTier.HOT ? this.hotTierAdapter : this.coldTierAdapter;
    }
    /**
     * Check if object should be promoted to hot tier
     *
     * @param metadata - Tiering metadata
     * @returns True if should promote
     */
    shouldPromote(metadata) {
        const accessThreshold = 5; // Configurable threshold
        return metadata.accessCount >= accessThreshold;
    }
    /**
     * Check if object should be demoted to cold tier
     *
     * @param metadata - Tiering metadata
     * @returns True if should demote
     */
    shouldDemote(metadata) {
        const daysSinceAccess = (Date.now() - metadata.lastAccessed.getTime()) / (24 * 60 * 60 * 1000);
        const threshold = 30; // 30 days without access
        return daysSinceAccess >= threshold;
    }
    /**
     * Schedule promotion for an object
     *
     * @param identifier - Storage identifier
     * @param targetTier - Target tier
     */
    async schedulePromotion(identifier, targetTier) {
        // In a production system, this would use a job queue
        // For now, we'll do it synchronously in the background
        setTimeout(async () => {
            try {
                await this.promoteTier(identifier, targetTier);
            }
            catch (error) {
                console.error(`Failed to promote ${identifier} to ${targetTier}:`, error);
            }
        }, 0);
    }
    /**
     * Start auto-tiering background process
     */
    startAutoTiering() {
        const checkIntervalHours = this.config.autoTiering.checkInterval || 24;
        const intervalMs = checkIntervalHours * 60 * 60 * 1000;
        this.autoTieringInterval = setInterval(() => {
            this.runAutoTiering();
        }, intervalMs);
    }
    /**
     * Stop auto-tiering background process
     */
    stopAutoTiering() {
        if (this.autoTieringInterval) {
            clearInterval(this.autoTieringInterval);
            this.autoTieringInterval = null;
        }
    }
    /**
     * Run auto-tiering checks for all objects
     */
    async runAutoTiering() {
        for (const [identifier, metadata] of this.tieringMetadata.entries()) {
            try {
                // Check for demotion (hot -> cold)
                if (metadata.tier === StorageTier.HOT && this.shouldDemote(metadata)) {
                    await this.demoteTier(identifier, StorageTier.COLD);
                }
                // Promotion is handled on-demand during download
            }
            catch (error) {
                console.error(`Auto-tiering failed for ${identifier}:`, error);
            }
        }
    }
    /**
     * Persist metadata to storage
     *
     * @param identifier - Storage identifier
     */
    async persistMetadata(identifier) {
        const metadata = this.tieringMetadata.get(identifier);
        if (!metadata)
            return;
        // Store metadata in a special metadata layer
        const metadataKey = `metadata:${identifier}`;
        try {
            await this.hotTierAdapter.upload(Buffer.from(JSON.stringify(metadata)), {
                layer: StorageLayer.VARITY_INTERNAL,
                tier: StorageTier.HOT,
                metadata: { type: 'tiering-metadata' }
            });
        }
        catch (error) {
            console.error(`Failed to persist metadata for ${identifier}:`, error);
        }
    }
    /**
     * Load metadata from storage
     *
     * @param identifier - Storage identifier
     * @returns Tiering metadata or null
     */
    async loadMetadata(identifier) {
        // Check in-memory cache first
        let metadata = this.tieringMetadata.get(identifier);
        if (metadata)
            return metadata;
        // Load from storage
        const metadataKey = `metadata:${identifier}`;
        try {
            const data = await this.hotTierAdapter.download(metadataKey);
            metadata = JSON.parse(data.toString());
            if (metadata) {
                // Convert date strings back to Date objects
                metadata.lastAccessed = new Date(metadata.lastAccessed);
                metadata.createdAt = new Date(metadata.createdAt);
                this.tieringMetadata.set(identifier, metadata);
                return metadata;
            }
        }
        catch (error) {
            // Metadata not found, object might be in cold tier
        }
        return null;
    }
    /**
     * Delete metadata from storage
     *
     * @param identifier - Storage identifier
     */
    async deleteMetadata(identifier) {
        const metadataKey = `metadata:${identifier}`;
        try {
            await this.hotTierAdapter.delete(metadataKey);
        }
        catch (error) {
            // Ignore errors
        }
    }
    /**
     * Clean up resources
     */
    destroy() {
        this.stopAutoTiering();
        this.tieringMetadata.clear();
    }
}
//# sourceMappingURL=MultiTierAdapter.js.map