/**
 * Varity SDK - Storage Adapter Factory
 *
 * Factory pattern for creating storage adapters based on backend configuration.
 * Supports Filecoin/IPFS, multi-tier, and future S3/GCS backends.
 */
import { FilecoinAdapter } from './FilecoinAdapter';
import { MultiTierAdapter } from './MultiTierAdapter';
/**
 * Factory for creating storage adapters
 *
 * Provides a unified interface for creating different storage backend adapters
 * based on configuration. Handles validation and adapter initialization.
 *
 * @example
 * ```typescript
 * // Create Filecoin adapter
 * const adapter = AdapterFactory.createAdapter(sdk, {
 *   backend: StorageBackend.FILECOIN_IPFS
 * })
 *
 * // Create multi-tier adapter
 * const multiTierAdapter = AdapterFactory.createAdapter(sdk, {
 *   backend: StorageBackend.MULTI_TIER,
 *   multiTierConfig: {
 *     hotTier: { backend: StorageBackend.FILECOIN_IPFS, replication: 3 },
 *     coldTier: { backend: StorageBackend.FILECOIN_IPFS, replication: 2 },
 *     autoTiering: { enabled: true, policy: TieringPolicy.ACCESS_BASED, checkInterval: 24 }
 *   }
 * })
 * ```
 */
export class AdapterFactory {
    /**
     * Create a storage adapter based on backend type and configuration
     *
     * @param sdk - Varity SDK instance
     * @param config - Adapter configuration
     * @returns Storage adapter instance
     * @throws {Error} If backend is unsupported or configuration is invalid
     */
    static createAdapter(sdk, config) {
        switch (config.backend) {
            case 'filecoin-ipfs':
                return new FilecoinAdapter(sdk);
            case 'multi-tier':
                if (!config.multiTierConfig) {
                    throw new Error('MultiTierStorageConfig required for MULTI_TIER backend');
                }
                return new MultiTierAdapter(sdk, config.multiTierConfig);
            case 's3-compatible':
                throw new Error('S3-compatible storage backend not yet implemented. Coming soon!');
            case 'gcs-compatible':
                throw new Error('GCS-compatible storage backend not yet implemented. Coming soon!');
            case 'celestia':
                throw new Error('Celestia storage backend not yet implemented. Coming soon!');
            default:
                throw new Error(`Unsupported storage backend: ${config.backend}`);
        }
    }
    /**
     * Create adapter from SDK configuration
     *
     * Convenience method that extracts storage configuration from SDK config
     * and creates the appropriate adapter.
     *
     * @param sdk - Varity SDK instance
     * @returns Storage adapter instance
     */
    static createFromSDKConfig(sdk) {
        const sdkConfig = sdk.getConfig();
        // Determine backend from config
        const backend = sdkConfig.storageBackend || 'filecoin-ipfs';
        const config = {
            backend,
            multiTierConfig: sdkConfig.multiTierConfig,
            s3Config: sdkConfig.s3Config,
            gcsConfig: sdkConfig.gcsConfig
        };
        return this.createAdapter(sdk, config);
    }
    /**
     * Validate adapter configuration
     *
     * @param config - Adapter configuration
     * @returns True if valid
     * @throws {Error} If configuration is invalid
     */
    static validateConfig(config) {
        if (!config.backend) {
            throw new Error('Storage backend must be specified');
        }
        // Validate multi-tier config
        if (config.backend === 'multi-tier') {
            if (!config.multiTierConfig) {
                throw new Error('MultiTierStorageConfig required for MULTI_TIER backend');
            }
            const mtConfig = config.multiTierConfig;
            if (!mtConfig.hotTier || !mtConfig.coldTier) {
                throw new Error('Both hotTier and coldTier must be configured for multi-tier storage');
            }
            if (!mtConfig.autoTiering) {
                throw new Error('AutoTiering configuration required for multi-tier storage');
            }
        }
        // Validate S3 config
        if (config.backend === 's3-compatible') {
            if (!config.s3Config) {
                throw new Error('S3CompatibleConfig required for S3_COMPATIBLE backend');
            }
            const s3Config = config.s3Config;
            if (!s3Config.endpoint || !s3Config.accessKeyId || !s3Config.secretAccessKey) {
                throw new Error('S3 endpoint, accessKeyId, and secretAccessKey are required');
            }
        }
        // Validate GCS config
        if (config.backend === 'gcs-compatible') {
            if (!config.gcsConfig) {
                throw new Error('GCSCompatibleConfig required for GCS_COMPATIBLE backend');
            }
            const gcsConfig = config.gcsConfig;
            if (!gcsConfig.projectId || !gcsConfig.bucket) {
                throw new Error('GCS projectId and bucket are required');
            }
        }
        return true;
    }
    /**
     * Get supported backends
     *
     * @returns Array of supported storage backends
     */
    static getSupportedBackends() {
        return [
            'filecoin-ipfs',
            'multi-tier'
            // S3 and GCS coming soon
        ];
    }
    /**
     * Check if a backend is supported
     *
     * @param backend - Backend to check
     * @returns True if supported
     */
    static isBackendSupported(backend) {
        return this.getSupportedBackends().includes(backend);
    }
    /**
     * Get backend capabilities
     *
     * @param backend - Storage backend
     * @returns Capabilities object
     */
    static getBackendCapabilities(backend) {
        switch (backend) {
            case 'filecoin-ipfs':
                return {
                    supportsEncryption: true,
                    supportsVersioning: true,
                    supportsMetadata: true,
                    supportsCopy: false,
                    supportsMove: false,
                    supportsPresignedUrls: false,
                    costTier: 'low'
                };
            case 'multi-tier':
                return {
                    supportsEncryption: true,
                    supportsVersioning: true,
                    supportsMetadata: true,
                    supportsCopy: true,
                    supportsMove: true,
                    supportsPresignedUrls: false,
                    costTier: 'low'
                };
            case 's3-compatible':
                return {
                    supportsEncryption: true,
                    supportsVersioning: true,
                    supportsMetadata: true,
                    supportsCopy: true,
                    supportsMove: true,
                    supportsPresignedUrls: true,
                    costTier: 'medium'
                };
            case 'gcs-compatible':
                return {
                    supportsEncryption: true,
                    supportsVersioning: true,
                    supportsMetadata: true,
                    supportsCopy: true,
                    supportsMove: true,
                    supportsPresignedUrls: true,
                    costTier: 'medium'
                };
            default:
                return {
                    supportsEncryption: false,
                    supportsVersioning: false,
                    supportsMetadata: false,
                    supportsCopy: false,
                    supportsMove: false,
                    supportsPresignedUrls: false,
                    costTier: 'high'
                };
        }
    }
}
//# sourceMappingURL=AdapterFactory.js.map