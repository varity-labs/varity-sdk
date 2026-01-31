/**
 * Varity SDK - Storage Module
 *
 * Universal decentralized storage on IPFS/Filecoin/Celestia.
 * Works across all templates (ISO, Healthcare, Retail, etc.)
 *
 * REFACTORED: Now uses adapter pattern for multi-backend support
 */
import type { VaritySDK } from '../../core/VaritySDK';
import type { StorageResult, StorageOptions } from '../../core/types';
export interface UploadResult extends StorageResult {
}
export interface DataPointer {
    pointerId: string;
    cid: string;
    owner: string;
    metadata: string;
    timestamp: number;
}
export interface Pin {
    cid: string;
    name?: string;
    size: number;
    timestamp: number;
}
export interface PinFilters {
    status?: 'pinned' | 'unpinned';
    limit?: number;
    offset?: number;
}
export interface CelestiaReceipt {
    height: number;
    commitment: string;
    namespace: string;
    blobId: string;
}
/**
 * StorageModule - Universal decentralized storage
 *
 * @example
 * ```typescript
 * // Upload encrypted data
 * const result = await sdk.storage.uploadEncrypted({
 *   businessName: 'Acme Corp',
 *   data: {...}
 * })
 *
 * // Retrieve encrypted data
 * const data = await sdk.storage.retrieveEncrypted(result.cid)
 *
 * // Submit to Celestia for data availability
 * const receipt = await sdk.storage.submitToCelestia(data, 'iso-merchants')
 * ```
 */
export declare class StorageModule {
    private sdk;
    private adapter;
    private dataProofContract;
    constructor(sdk: VaritySDK);
    /**
     * Initialize DataProofRegistry contract
     */
    private getDataProofContract;
    /**
     * Derive encryption key from wallet address
     */
    private deriveKey;
    /**
     * Encrypt data with AES-256-GCM
     */
    private encrypt;
    /**
     * Decrypt data
     */
    private decrypt;
    /**
     * Upload encrypted data to IPFS/Filecoin
     *
     * @param data - Data to upload
     * @param options - Storage options
     * @returns Upload result with CID
     */
    uploadEncrypted(data: any, options?: StorageOptions): Promise<UploadResult>;
    /**
     * Retrieve and decrypt data from IPFS
     *
     * @param cid - Content identifier
     * @returns Decrypted data
     */
    retrieveEncrypted(cid: string): Promise<any>;
    /**
     * Upload file to IPFS
     *
     * @param file - File blob
     * @param options - Storage options
     * @returns Upload result
     */
    uploadFile(file: Blob, options?: StorageOptions): Promise<UploadResult>;
    /**
     * Retrieve file from IPFS
     *
     * @param cid - Content identifier
     * @returns File blob
     */
    retrieveFile(cid: string): Promise<Blob>;
    /**
     * Record data pointer on-chain
     *
     * @param cid - Content identifier
     * @param metadata - Data metadata
     * @returns Transaction hash
     */
    recordDataPointer(cid: string, metadata: any): Promise<string>;
    /**
     * Get data pointer from on-chain registry
     *
     * @param cid - Content identifier
     * @returns Data pointer
     */
    getDataPointer(cid: string): Promise<DataPointer>;
    /**
     * Pin content to ensure persistence
     *
     * @param cid - Content identifier
     */
    pin(cid: string): Promise<void>;
    /**
     * Unpin content
     *
     * @param cid - Content identifier
     */
    unpin(cid: string): Promise<void>;
    /**
     * List pinned content
     *
     * @param filters - Pin filters
     * @returns Array of pins
     */
    listPins(filters?: PinFilters): Promise<Pin[]>;
    /**
     * Submit data to Celestia for data availability
     *
     * @param data - Data to submit
     * @param namespace - Celestia namespace
     * @returns Celestia receipt
     */
    submitToCelestia(data: any, namespace: string): Promise<CelestiaReceipt>;
    /**
     * Retrieve data from Celestia
     *
     * @param height - Block height
     * @param blobId - Blob identifier
     * @returns Decrypted data
     */
    retrieveFromCelestia(height: number, blobId: string): Promise<any>;
}
//# sourceMappingURL=StorageModule.d.ts.map