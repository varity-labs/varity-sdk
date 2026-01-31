/**
 * Varity SDK - Storage Adapter Interface
 *
 * Base interface that ALL storage backends must implement to ensure
 * consistent behavior across Filecoin, S3, GCS, and multi-tier storage.
 *
 * This interface provides a unified API for storage operations regardless
 * of the underlying backend, enabling seamless migration and multi-backend support.
 *
 * @packageDocumentation
 */
import type { StorageBackend, UploadOptions, StorageResult, StorageItem, ListOptions, StorageMetadata } from '@varity-labs/types';
/**
 * Base storage adapter interface
 *
 * All storage backends (Filecoin/IPFS, S3-compatible, GCS-compatible, Multi-tier)
 * MUST implement this interface to ensure consistent behavior across the SDK.
 *
 * @example
 * ```typescript
 * class FilecoinStorageAdapter implements IStorageAdapter {
 *   async upload(data: Buffer | string, options: UploadOptions): Promise<StorageResult> {
 *     // Implementation for Filecoin/IPFS
 *   }
 *   // ... other methods
 * }
 * ```
 */
export interface IStorageAdapter {
    /**
     * Upload data to storage backend
     *
     * @param data - Data to upload (Buffer for binary, string for text, Blob for files)
     * @param options - Upload configuration including layer, tier, metadata, encryption
     * @returns Storage result with identifier (CID, S3 key, etc.) and metadata
     *
     * @throws {Error} If upload fails due to network, authentication, or size limits
     *
     * @example
     * ```typescript
     * const result = await adapter.upload(Buffer.from('Hello World'), {
     *   layer: StorageLayer.CUSTOMER_DATA,
     *   tier: StorageTier.HOT,
     *   encrypt: true,
     *   metadata: { contentType: 'text/plain' }
     * })
     * console.log('Uploaded:', result.identifier)
     * ```
     */
    upload(data: Buffer | string | Blob, options: UploadOptions): Promise<StorageResult>;
    /**
     * Download data from storage backend
     *
     * @param identifier - Storage identifier (CID for Filecoin, key for S3/GCS)
     * @returns Downloaded data as Buffer
     *
     * @throws {Error} If object not found or download fails
     *
     * @example
     * ```typescript
     * const data = await adapter.download('QmXYZ...')
     * const text = data.toString('utf-8')
     * ```
     */
    download(identifier: string): Promise<Buffer>;
    /**
     * Delete data from storage backend
     *
     * @param identifier - Storage identifier to delete
     *
     * @throws {Error} If deletion fails or object not found
     *
     * @example
     * ```typescript
     * await adapter.delete('QmXYZ...')
     * console.log('Deleted successfully')
     * ```
     */
    delete(identifier: string): Promise<void>;
    /**
     * Check if object exists in storage
     *
     * @param identifier - Storage identifier to check
     * @returns True if object exists, false otherwise
     *
     * @example
     * ```typescript
     * if (await adapter.exists('QmXYZ...')) {
     *   console.log('Object exists')
     * }
     * ```
     */
    exists(identifier: string): Promise<boolean>;
    /**
     * List stored objects matching criteria
     *
     * Supports pagination, prefix filtering, and metadata inclusion.
     *
     * @param options - List filtering and pagination options
     * @returns Array of storage items with metadata
     *
     * @example
     * ```typescript
     * const items = await adapter.list({
     *   prefix: 'customer-123/',
     *   maxResults: 100,
     *   tier: StorageTier.HOT
     * })
     * console.log(`Found ${items.length} objects`)
     * ```
     */
    list(options?: ListOptions): Promise<StorageItem[]>;
    /**
     * Get object metadata without downloading content
     *
     * Useful for checking size, modified time, and custom metadata
     * without incurring bandwidth costs.
     *
     * @param identifier - Storage identifier
     * @returns Object metadata including size, timestamps, tier
     *
     * @throws {Error} If object not found
     *
     * @example
     * ```typescript
     * const metadata = await adapter.getMetadata('QmXYZ...')
     * console.log(`Size: ${metadata.size} bytes`)
     * console.log(`Tier: ${metadata.tier}`)
     * ```
     */
    getMetadata(identifier: string): Promise<StorageMetadata>;
    /**
     * Get the storage backend type
     *
     * @returns Storage backend enum value
     *
     * @example
     * ```typescript
     * const backend = adapter.getBackendType()
     * if (backend === StorageBackend.FILECOIN_IPFS) {
     *   console.log('Using Filecoin/IPFS')
     * }
     * ```
     */
    getBackendType(): StorageBackend;
    /**
     * Copy object from one location to another (optional)
     *
     * Not all backends support efficient server-side copy.
     * If not implemented, will throw UnsupportedOperationError.
     *
     * @param source - Source identifier
     * @param destination - Destination identifier
     *
     * @throws {UnsupportedOperationError} If backend doesn't support copy
     *
     * @example
     * ```typescript
     * try {
     *   await adapter.copy('source-key', 'destination-key')
     * } catch (err) {
     *   if (err.name === 'UnsupportedOperationError') {
     *     // Fallback to download + upload
     *   }
     * }
     * ```
     */
    copy?(source: string, destination: string): Promise<void>;
    /**
     * Move object from one location to another (optional)
     *
     * Not all backends support efficient server-side move.
     * If not implemented, will throw UnsupportedOperationError.
     *
     * @param source - Source identifier
     * @param destination - Destination identifier
     *
     * @throws {UnsupportedOperationError} If backend doesn't support move
     *
     * @example
     * ```typescript
     * await adapter.move('old-key', 'new-key')
     * ```
     */
    move?(source: string, destination: string): Promise<void>;
    /**
     * Get object access URL (optional)
     *
     * Returns a publicly accessible URL for the object.
     * For backends that support presigned URLs, this generates one.
     *
     * @param identifier - Storage identifier
     * @param expiresIn - Expiration time in seconds (for presigned URLs)
     * @returns Gateway URL or presigned URL
     *
     * @example
     * ```typescript
     * const url = await adapter.getAccessUrl('QmXYZ...', 3600)
     * console.log('Download URL:', url)
     * ```
     */
    getAccessUrl?(identifier: string, expiresIn?: number): Promise<string>;
    /**
     * Update object metadata (optional)
     *
     * Not all backends support metadata updates without re-uploading.
     *
     * @param identifier - Storage identifier
     * @param metadata - New metadata to apply
     *
     * @throws {UnsupportedOperationError} If backend doesn't support metadata updates
     *
     * @example
     * ```typescript
     * await adapter.updateMetadata('QmXYZ...', {
     *   contentType: 'application/json',
     *   customKey: 'customValue'
     * })
     * ```
     */
    updateMetadata?(identifier: string, metadata: Record<string, any>): Promise<void>;
    /**
     * Get storage backend health status (optional)
     *
     * @returns Health check result with availability and latency
     *
     * @example
     * ```typescript
     * const health = await adapter.healthCheck()
     * console.log(`Backend ${health.healthy ? 'healthy' : 'unhealthy'}`)
     * console.log(`Latency: ${health.latencyMs}ms`)
     * ```
     */
    healthCheck?(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
}
/**
 * Error thrown when an operation is not supported by the backend
 */
export declare class UnsupportedOperationError extends Error {
    constructor(operation: string, backend: StorageBackend);
}
/**
 * Base abstract class implementing common adapter functionality
 *
 * Adapters can extend this class to inherit common behavior
 * and only implement backend-specific methods.
 */
export declare abstract class BaseStorageAdapter implements IStorageAdapter {
    protected backend: StorageBackend;
    constructor(backend: StorageBackend);
    abstract upload(data: Buffer | string | Blob, options: UploadOptions): Promise<StorageResult>;
    abstract download(identifier: string): Promise<Buffer>;
    abstract delete(identifier: string): Promise<void>;
    abstract exists(identifier: string): Promise<boolean>;
    abstract list(options?: ListOptions): Promise<StorageItem[]>;
    abstract getMetadata(identifier: string): Promise<StorageMetadata>;
    getBackendType(): StorageBackend;
    /**
     * Default copy implementation (download + upload)
     */
    copy(source: string, destination: string): Promise<void>;
    /**
     * Default move implementation (copy + delete)
     */
    move(source: string, destination: string): Promise<void>;
    /**
     * Default getAccessUrl implementation
     */
    getAccessUrl(identifier: string, expiresIn?: number): Promise<string>;
    /**
     * Default updateMetadata implementation
     */
    updateMetadata(identifier: string, metadata: Record<string, any>): Promise<void>;
    /**
     * Default healthCheck implementation
     */
    healthCheck(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
}
//# sourceMappingURL=IStorageAdapter.d.ts.map