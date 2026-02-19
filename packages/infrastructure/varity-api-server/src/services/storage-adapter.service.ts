/**
 * Storage Adapter Service
 *
 * This service integrates the Varity SDK storage adapters into the API server.
 * Provides a clean interface for multi-backend storage operations with support for:
 * - Filecoin/IPFS storage (via Pinata API)
 * - Multi-tier storage with automatic tiering
 * - 3-layer encrypted storage architecture
 * - Storage layer isolation (Varity Internal, Industry RAG, Customer Data)
 */

import { logger } from '../config/logger.config';
import { envConfig } from '../config/env.config';
import { ServiceUnavailableError, NotFoundError } from '../middleware/error.middleware';

// Import SDK storage classes and types from Varity packages
import { createVaritySDK, AdapterFactory } from '@varity-labs/sdk';
import type { VaritySDK } from '@varity-labs/sdk';
import {
  StorageBackend,
  StorageLayer,
  StorageTier,
  UploadOptions as AdapterUploadOptions,
  StorageItem,
  ListOptions,
  StorageMetadata,
  IStorageAdapter,
  StorageResult
} from '@varity-labs/types';

/**
 * Upload result returned from storage service
 * Maps StorageResult to a more API-friendly format
 */
export interface UploadResult {
  cid: string;
  gatewayUrl?: string;
  size: number;
  hash?: string;
  timestamp: string;
  encryptionMetadata?: any;
}

/**
 * Upload options for the storage service
 */
export interface StorageServiceUploadOptions {
  layer: StorageLayer;
  tier?: StorageTier;
  metadata?: Record<string, any>;
  encrypt?: boolean;
  namespace?: string;
}

/**
 * Storage Adapter Service
 * Manages all storage operations using the Varity SDK adapter system
 */
export class StorageAdapterService {
  private adapter: IStorageAdapter;
  private sdk: VaritySDK;
  private initialized: boolean = false;

  constructor() {
    // Initialize SDK instance for adapter creation
    this.sdk = createVaritySDK({
      network: (process.env.NETWORK as any) || 'arbitrum-l3-testnet',
      rpcUrl: process.env.RPC_URL || 'https://rpc.varity.network',
      privateKey: process.env.PRIVATE_KEY,
      filecoinConfig: {
        pinataApiKey: envConfig.filecoin.pinataApiKey,
        pinataSecretKey: envConfig.filecoin.pinataSecretKey
      }
    });

    // Initialize adapter based on environment configuration
    this.adapter = this.createAdapter();
  }

  /**
   * Create storage adapter based on environment configuration
   */
  private createAdapter(): IStorageAdapter {
    const backend = (process.env.STORAGE_BACKEND as StorageBackend) || StorageBackend.FILECOIN_IPFS;

    logger.info(`Initializing storage adapter with backend: ${backend}`);

    // Create adapter using AdapterFactory.createAdapter (not .create)
    return AdapterFactory.createAdapter(this.sdk, {
      backend,
      multiTierConfig: backend === StorageBackend.MULTI_TIER ? this.getMultiTierConfig() : undefined
    });
  }

  /**
   * Get multi-tier storage configuration
   */
  private getMultiTierConfig(): any {
    return {
      hotTier: {
        backend: StorageBackend.FILECOIN_IPFS,
        replication: 3,
        costPerGB: 0.02,
        accessLatency: 100
      },
      coldTier: {
        backend: StorageBackend.FILECOIN_IPFS,
        replication: 2,
        costPerGB: 0.01,
        accessLatency: 1000
      },
      autoTiering: {
        enabled: true,
        policy: 'access-based' as any,
        checkInterval: 24,
        rules: [
          {
            name: 'Move to cold tier after 30 days',
            condition: {
              type: 'age',
              operator: 'gt',
              value: 30,
              unit: 'days'
            },
            action: {
              moveTo: StorageTier.COLD
            },
            enabled: true
          }
        ]
      }
    };
  }


  /**
   * Upload data to storage
   *
   * @param data - Data to upload (Buffer, string, Blob, or any object)
   * @param options - Upload options
   * @returns Storage result with identifier and metadata
   */
  async upload(
    data: any,
    options: StorageServiceUploadOptions
  ): Promise<UploadResult> {
    try {
      logger.info(`Uploading data to ${options.layer} layer (tier: ${options.tier || 'hot'})`);

      // Convert data to Buffer if it's an object
      let uploadData = data;
      if (typeof data === 'object' && !(data instanceof Buffer) && !(data instanceof Blob)) {
        uploadData = Buffer.from(JSON.stringify(data));
      }

      // Prepare adapter upload options
      const adapterOptions: AdapterUploadOptions = {
        layer: options.layer,
        tier: options.tier || StorageTier.HOT,
        metadata: {
          uploadedAt: new Date().toISOString(),
          encrypted: options.encrypt !== false, // Default to encrypted
          namespace: options.namespace,
          ...options.metadata
        },
        encrypt: options.encrypt !== false,
        namespace: options.namespace
      };

      // Upload via adapter
      const result = await this.adapter.upload(uploadData, adapterOptions);

      logger.info(`Upload successful: ${result.identifier} (${result.size} bytes)`);

      // Convert adapter result to UploadResult format
      return {
        cid: result.identifier,
        gatewayUrl: result.gatewayUrl,
        size: result.size,
        hash: result.hash,
        timestamp: new Date(result.timestamp).toISOString(),
        encryptionMetadata: result.encryptionMetadata
      };
    } catch (error: any) {
      logger.error('Upload failed', error);
      throw new ServiceUnavailableError(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Download data from storage
   *
   * @param identifier - Storage identifier (CID, key, etc.)
   * @returns Downloaded data
   */
  async download(identifier: string): Promise<any> {
    try {
      logger.info(`Downloading data: ${identifier}`);

      const data = await this.adapter.download(identifier);

      logger.info(`Download successful: ${identifier}`);

      return data;
    } catch (error: any) {
      logger.error(`Download failed for ${identifier}`, error);
      throw new NotFoundError(`Object not found: ${identifier}`);
    }
  }

  /**
   * Delete data from storage
   *
   * @param identifier - Storage identifier to delete
   */
  async delete(identifier: string): Promise<void> {
    try {
      logger.info(`Deleting data: ${identifier}`);

      await this.adapter.delete(identifier);

      logger.info(`Delete successful: ${identifier}`);
    } catch (error: any) {
      logger.error(`Delete failed for ${identifier}`, error);
      throw new ServiceUnavailableError(`Delete failed: ${error.message}`);
    }
  }

  /**
   * List stored objects
   *
   * @param options - List options (layer, prefix, pagination)
   * @returns Array of storage items
   */
  async list(options?: {
    layer?: StorageLayer;
    prefix?: string;
    limit?: number;
    continuationToken?: string;
  }): Promise<StorageItem[]> {
    try {
      logger.info(`Listing objects with options:`, options);

      const listOptions: ListOptions = {
        prefix: options?.prefix,
        maxResults: options?.limit || 100,
        continuationToken: options?.continuationToken,
        includeMetadata: true
      };

      const items = await this.adapter.list(listOptions);

      // Filter by layer if specified
      if (options?.layer) {
        const layer = options.layer; // Extract to satisfy TypeScript
        return items.filter(item =>
          item.metadata?.layer === layer ||
          item.key.startsWith(layer.toString())
        );
      }

      return items;
    } catch (error: any) {
      logger.error('List operation failed', error);
      throw new ServiceUnavailableError(`List failed: ${error.message}`);
    }
  }

  /**
   * Check if object exists in storage
   *
   * @param identifier - Storage identifier
   * @returns True if exists, false otherwise
   */
  async exists(identifier: string): Promise<boolean> {
    try {
      return await this.adapter.exists(identifier);
    } catch (error: any) {
      logger.error(`Exists check failed for ${identifier}`, error);
      return false;
    }
  }

  /**
   * Get object metadata without downloading content
   *
   * @param identifier - Storage identifier
   * @returns Object metadata
   */
  async getMetadata(identifier: string): Promise<StorageMetadata> {
    try {
      logger.info(`Getting metadata for: ${identifier}`);

      const metadata = await this.adapter.getMetadata(identifier);

      return metadata;
    } catch (error: any) {
      logger.error(`Get metadata failed for ${identifier}`, error);
      throw new NotFoundError(`Object not found: ${identifier}`);
    }
  }

  /**
   * Get storage backend type
   */
  getBackendType(): StorageBackend {
    return this.adapter.getBackendType();
  }

  /**
   * Get storage statistics
   */
  async getStats(layer?: StorageLayer): Promise<{
    totalFiles: number;
    totalSize: number;
    byLayer: Record<string, { files: number; size: number }>;
  }> {
    try {
      const items = await this.list({ layer });

      const stats = {
        totalFiles: items.length,
        totalSize: items.reduce((sum, item) => sum + item.size, 0),
        byLayer: {} as Record<string, { files: number; size: number }>
      };

      // Group by layer
      items.forEach(item => {
        const itemLayer = item.metadata?.layer || 'unknown';
        if (!stats.byLayer[itemLayer]) {
          stats.byLayer[itemLayer] = { files: 0, size: 0 };
        }
        stats.byLayer[itemLayer].files++;
        stats.byLayer[itemLayer].size += item.size;
      });

      return stats;
    } catch (error: any) {
      logger.error('Get stats failed', error);
      throw new ServiceUnavailableError(`Get stats failed: ${error.message}`);
    }
  }

  /**
   * Health check for storage backend
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    backend: StorageBackend;
    latency?: number;
  }> {
    try {
      const start = Date.now();

      // Perform a simple operation to check backend health
      await this.adapter.list({ maxResults: 1 });

      const latency = Date.now() - start;

      return {
        status: 'healthy',
        backend: this.adapter.getBackendType(),
        latency
      };
    } catch (error: any) {
      logger.error('Storage health check failed', error);
      return {
        status: 'unhealthy',
        backend: this.adapter.getBackendType()
      };
    }
  }
}

// Export singleton instance
export const storageAdapterService = new StorageAdapterService();
export default storageAdapterService;
