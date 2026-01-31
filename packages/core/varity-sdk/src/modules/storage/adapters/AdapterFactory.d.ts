/**
 * Varity SDK - Storage Adapter Factory
 *
 * Factory pattern for creating storage adapters based on backend configuration.
 * Supports Filecoin/IPFS, multi-tier, and future S3/GCS backends.
 */
import type { VaritySDK } from '../../../core/VaritySDK';
import type { StorageBackend, MultiTierStorageConfig, S3CompatibleConfig, GCSCompatibleConfig } from '@varity-labs/types';
import { IStorageAdapter } from './IStorageAdapter';
/**
 * Adapter factory configuration
 */
export interface AdapterFactoryConfig {
    backend: StorageBackend;
    multiTierConfig?: MultiTierStorageConfig;
    s3Config?: S3CompatibleConfig;
    gcsConfig?: GCSCompatibleConfig;
}
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
export declare class AdapterFactory {
    /**
     * Create a storage adapter based on backend type and configuration
     *
     * @param sdk - Varity SDK instance
     * @param config - Adapter configuration
     * @returns Storage adapter instance
     * @throws {Error} If backend is unsupported or configuration is invalid
     */
    static createAdapter(sdk: VaritySDK, config: AdapterFactoryConfig): IStorageAdapter;
    /**
     * Create adapter from SDK configuration
     *
     * Convenience method that extracts storage configuration from SDK config
     * and creates the appropriate adapter.
     *
     * @param sdk - Varity SDK instance
     * @returns Storage adapter instance
     */
    static createFromSDKConfig(sdk: VaritySDK): IStorageAdapter;
    /**
     * Validate adapter configuration
     *
     * @param config - Adapter configuration
     * @returns True if valid
     * @throws {Error} If configuration is invalid
     */
    static validateConfig(config: AdapterFactoryConfig): boolean;
    /**
     * Get supported backends
     *
     * @returns Array of supported storage backends
     */
    static getSupportedBackends(): StorageBackend[];
    /**
     * Check if a backend is supported
     *
     * @param backend - Backend to check
     * @returns True if supported
     */
    static isBackendSupported(backend: StorageBackend): boolean;
    /**
     * Get backend capabilities
     *
     * @param backend - Storage backend
     * @returns Capabilities object
     */
    static getBackendCapabilities(backend: StorageBackend): {
        supportsEncryption: boolean;
        supportsVersioning: boolean;
        supportsMetadata: boolean;
        supportsCopy: boolean;
        supportsMove: boolean;
        supportsPresignedUrls: boolean;
        costTier: 'low' | 'medium' | 'high';
    };
}
//# sourceMappingURL=AdapterFactory.d.ts.map