/**
 * Varity SDK - Filecoin/IPFS Storage Adapter
 *
 * Implements IStorageAdapter for Filecoin/IPFS storage via Pinata API.
 * Extracted from StorageModule to enable multi-backend support.
 */
import type { VaritySDK } from '../../../core/VaritySDK';
import { type UploadOptions, type StorageResult, type StorageItem, type ListOptions, type StorageMetadata } from '@varity-labs/types';
import { BaseStorageAdapter } from './IStorageAdapter';
/**
 * Filecoin/IPFS adapter implementation using Pinata API
 *
 * This adapter handles all Filecoin/IPFS operations including:
 * - Pinning content to IPFS
 * - Retrieving content via IPFS gateways
 * - Managing pins (list, delete)
 * - Gateway URL generation
 *
 * @example
 * ```typescript
 * const adapter = new FilecoinAdapter(sdk)
 * const result = await adapter.upload(Buffer.from('Hello World'), {
 *   layer: StorageLayer.CUSTOMER_DATA,
 *   tier: StorageTier.HOT,
 *   pin: true
 * })
 * console.log('CID:', result.identifier)
 * ```
 */
export declare class FilecoinAdapter extends BaseStorageAdapter {
    private sdk;
    constructor(sdk: VaritySDK);
    /**
     * Upload data to Filecoin/IPFS via backend API
     *
     * @param data - Data to upload (Buffer, string, Blob)
     * @param options - Upload options including layer, tier, metadata
     * @returns Storage result with CID and gateway URL
     */
    upload(data: Buffer | string | Blob, options: UploadOptions): Promise<StorageResult>;
    /**
     * Download data from Filecoin/IPFS
     *
     * @param identifier - CID (Content Identifier)
     * @returns Downloaded data as Buffer
     */
    download(identifier: string): Promise<Buffer>;
    /**
     * Delete (unpin) data from Filecoin/IPFS
     *
     * @param identifier - CID to unpin
     */
    delete(identifier: string): Promise<void>;
    /**
     * Check if data exists on Filecoin/IPFS
     *
     * @param identifier - CID to check
     * @returns True if exists, false otherwise
     */
    exists(identifier: string): Promise<boolean>;
    /**
     * List pinned objects
     *
     * @param options - List filtering options
     * @returns Array of storage items
     */
    list(options?: ListOptions): Promise<StorageItem[]>;
    /**
     * Get metadata for a pinned object
     *
     * @param identifier - CID to get metadata for
     * @returns Storage metadata
     */
    getMetadata(identifier: string): Promise<StorageMetadata>;
    /**
     * Get access URL for a CID
     *
     * @param identifier - CID
     * @param expiresIn - Not used for IPFS (always public)
     * @returns Gateway URL
     */
    getAccessUrl(identifier: string, expiresIn?: number): Promise<string>;
    /**
     * Health check for Filecoin/IPFS backend
     *
     * @returns Health status with latency
     */
    healthCheck(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
}
//# sourceMappingURL=FilecoinAdapter.d.ts.map