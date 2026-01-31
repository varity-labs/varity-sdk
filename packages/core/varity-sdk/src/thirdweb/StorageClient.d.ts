/**
 * thirdweb Storage Client
 *
 * Decentralized storage powered by IPFS and Arweave
 * Seamless integration with thirdweb's storage infrastructure
 *
 * Features:
 * - IPFS storage with automatic pinning
 * - Arweave permanent storage
 * - Metadata management for NFTs
 * - Batch uploads
 * - Gateway URLs for fast access
 * - Image optimization and resizing
 */
import type { ThirdwebClient } from 'thirdweb';
/**
 * Storage configuration
 */
export interface StorageConfig {
    /**
     * thirdweb client instance
     */
    client: ThirdwebClient;
    /**
     * Preferred storage provider
     */
    provider?: 'ipfs' | 'arweave';
    /**
     * Upload options
     */
    uploadOptions?: {
        /**
         * Automatically pin to IPFS
         */
        pin?: boolean;
        /**
         * Upload timeout in milliseconds
         */
        timeout?: number;
    };
}
/**
 * Upload result from thirdweb storage
 */
export interface ThirdwebUploadResult {
    /**
     * IPFS CID or Arweave transaction ID
     */
    uri: string;
    /**
     * Gateway URL for accessing the file
     */
    gatewayUrl: string;
    /**
     * Storage provider used
     */
    provider: 'ipfs' | 'arweave';
    /**
     * File size in bytes
     */
    size: number;
    /**
     * Upload timestamp
     */
    timestamp: Date;
}
/**
 * NFT metadata structure
 */
export interface NFTMetadata {
    /**
     * NFT name
     */
    name: string;
    /**
     * NFT description
     */
    description: string;
    /**
     * Image URI (IPFS or Arweave)
     */
    image: string;
    /**
     * External URL
     */
    external_url?: string;
    /**
     * Attributes/traits
     */
    attributes?: {
        trait_type: string;
        value: string | number;
    }[];
    /**
     * Background color (hex code without #)
     */
    background_color?: string;
    /**
     * Animation URL (for video/audio NFTs)
     */
    animation_url?: string;
    /**
     * Additional properties
     */
    properties?: Record<string, any>;
}
/**
 * Batch upload item
 */
export interface BatchUploadItem {
    /**
     * File data or metadata
     */
    data: File | Blob | object;
    /**
     * Optional filename
     */
    filename?: string;
}
/**
 * Batch upload result
 */
export interface BatchUploadResult {
    /**
     * Individual upload results
     */
    results: ThirdwebUploadResult[];
    /**
     * Base URI for the batch (if applicable)
     */
    baseUri?: string;
    /**
     * Total size uploaded
     */
    totalSize: number;
    /**
     * Upload duration in milliseconds
     */
    duration: number;
}
/**
 * Download options for thirdweb storage
 */
export interface ThirdwebDownloadOptions {
    /**
     * Gateway URL to use (optional)
     */
    gateway?: string;
    /**
     * Request timeout in milliseconds
     */
    timeout?: number;
}
/**
 * Image optimization options
 */
export interface ImageOptimizationOptions {
    /**
     * Target width (maintains aspect ratio)
     */
    width?: number;
    /**
     * Target height (maintains aspect ratio)
     */
    height?: number;
    /**
     * Image quality (1-100)
     */
    quality?: number;
    /**
     * Output format
     */
    format?: 'webp' | 'jpeg' | 'png' | 'avif';
}
/**
 * thirdweb Storage Client
 *
 * Decentralized storage for NFTs, metadata, and files
 */
export declare class StorageClient {
    private client;
    private provider;
    private uploadOptions;
    constructor(config: StorageConfig);
    /**
     * Upload a file to decentralized storage
     */
    uploadFile(file: File | Blob): Promise<ThirdwebUploadResult>;
    /**
     * Upload JSON data
     */
    uploadJSON(data: object): Promise<ThirdwebUploadResult>;
    /**
     * Upload NFT metadata
     */
    uploadMetadata(metadata: NFTMetadata): Promise<ThirdwebUploadResult>;
    /**
     * Upload multiple files in batch
     */
    uploadBatch(items: BatchUploadItem[]): Promise<BatchUploadResult>;
    /**
     * Download a file from decentralized storage
     */
    downloadFile(uri: string, options?: ThirdwebDownloadOptions): Promise<Response>;
    /**
     * Download JSON data
     */
    downloadJSON<T = any>(uri: string, options?: ThirdwebDownloadOptions): Promise<T>;
    /**
     * Get gateway URL for a URI
     */
    getGatewayUrl(uri: string, options?: ImageOptimizationOptions): string;
    /**
     * Pin a file to IPFS (ensure permanent availability)
     */
    pinFile(uri: string): Promise<void>;
    /**
     * Unpin a file from IPFS
     */
    unpinFile(uri: string): Promise<void>;
    /**
     * Get file metadata
     */
    getMetadata(uri: string): Promise<{
        cid: string;
        size?: number;
        pinned: boolean;
    }>;
    /**
     * Upload a directory of files
     */
    uploadDirectory(files: File[]): Promise<BatchUploadResult>;
    /**
     * Create and upload NFT collection metadata
     */
    uploadCollection(metadata: NFTMetadata[]): Promise<{
        metadataUris: string[];
        baseUri: string;
    }>;
    /**
     * Resolve IPFS URI to HTTP gateway URL
     */
    static resolveUri(uri: string): string;
    /**
     * Check if a URI is IPFS
     */
    static isIPFS(uri: string): boolean;
    /**
     * Check if a URI is Arweave
     */
    static isArweave(uri: string): boolean;
}
/**
 * Create Storage client instance
 */
export declare function createStorageClient(config: StorageConfig): StorageClient;
//# sourceMappingURL=StorageClient.d.ts.map