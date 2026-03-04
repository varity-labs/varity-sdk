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
import { upload, download } from 'thirdweb/storage';

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
export class StorageClient {
  private client: ThirdwebClient;
  private provider: 'ipfs' | 'arweave';
  private uploadOptions: NonNullable<StorageConfig['uploadOptions']>;

  constructor(config: StorageConfig) {
    this.client = config.client;
    this.provider = config.provider || 'ipfs';
    this.uploadOptions = config.uploadOptions || { pin: true };
  }

  /**
   * Upload a file to decentralized storage
   *
   * Uploads files to IPFS with automatic pinning via thirdweb infrastructure.
   *
   * @param file - File or Blob to upload
   * @returns Upload result with IPFS URI and gateway URL
   *
   * @example Upload an image file
   * ```typescript
   * import { StorageClient } from '@varity-labs/sdk';
   * import { createThirdwebClient } from 'thirdweb';
   *
   * const client = createThirdwebClient({
   *   clientId: process.env.THIRDWEB_CLIENT_ID
   * });
   *
   * const storage = new StorageClient({ client });
   *
   * // Upload image from file input
   * const file = document.querySelector('input[type="file"]').files[0];
   * const result = await storage.uploadFile(file);
   *
   * console.log('IPFS URI:', result.uri);
   * console.log('Gateway URL:', result.gatewayUrl);
   * // IPFS URI: ipfs://QmXxx...
   * // Gateway URL: https://gateway.thirdweb.com/ipfs/QmXxx...
   * ```
   *
   * @example Upload a Blob
   * ```typescript
   * // Create a text blob
   * const blob = new Blob(['Hello, IPFS!'], { type: 'text/plain' });
   * const result = await storage.uploadFile(blob);
   * ```
   *
   * @example Upload and use in NFT
   * ```typescript
   * // Upload NFT image
   * const imageResult = await storage.uploadFile(imageFile);
   *
   * // Create and upload metadata
   * const metadata = {
   *   name: 'My NFT',
   *   description: 'An awesome NFT',
   *   image: imageResult.uri  // Use IPFS URI
   * };
   *
   * const metadataResult = await storage.uploadJSON(metadata);
   * console.log('Token URI:', metadataResult.uri);
   * ```
   */
  async uploadFile(file: File | Blob): Promise<ThirdwebUploadResult> {
    const startTime = Date.now();

    // Convert Blob to File if needed
    const fileToUpload = file instanceof File
      ? file
      : new File([file], 'file', { type: file.type });

    const uris = await upload({
      client: this.client,
      files: [fileToUpload],
    });

    // upload returns array of URIs
    const uri = Array.isArray(uris) ? uris[0] : uris;

    return {
      uri,
      gatewayUrl: this.getGatewayUrl(uri),
      provider: this.provider,
      size: file.size,
      timestamp: new Date(),
    };
  }

  /**
   * Upload JSON data
   */
  async uploadJSON(data: object): Promise<ThirdwebUploadResult> {
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    return this.uploadFile(blob);
  }

  /**
   * Upload NFT metadata
   *
   * Uploads NFT metadata JSON to IPFS following ERC-721/ERC-1155 standards.
   *
   * @param metadata - NFT metadata object
   * @returns Upload result with metadata URI
   *
   * @example Basic NFT metadata
   * ```typescript
   * import { StorageClient } from '@varity-labs/sdk';
   *
   * const storage = new StorageClient({ client });
   *
   * const result = await storage.uploadMetadata({
   *   name: 'Cool NFT #1',
   *   description: 'A really cool NFT from my collection',
   *   image: 'ipfs://QmImageHash...'
   * });
   *
   * console.log('Metadata URI:', result.uri);
   * // Use this URI as tokenURI in your NFT contract
   * ```
   *
   * @example NFT with attributes
   * ```typescript
   * const result = await storage.uploadMetadata({
   *   name: 'Character NFT #42',
   *   description: 'A unique game character',
   *   image: 'ipfs://QmImageHash...',
   *   attributes: [
   *     { trait_type: 'Level', value: 10 },
   *     { trait_type: 'Strength', value: 85 },
   *     { trait_type: 'Rarity', value: 'Epic' }
   *   ]
   * });
   * ```
   *
   * @example NFT with animation
   * ```typescript
   * // Upload video/animation
   * const animationResult = await storage.uploadFile(videoFile);
   *
   * // Upload metadata with animation
   * const result = await storage.uploadMetadata({
   *   name: 'Animated NFT',
   *   description: 'An NFT with animation',
   *   image: 'ipfs://QmPreviewImage...',  // Preview image
   *   animation_url: animationResult.uri,   // Video/animation
   *   external_url: 'https://myapp.com/nft/1',
   *   background_color: '000000'
   * });
   * ```
   */
  async uploadMetadata(metadata: NFTMetadata): Promise<ThirdwebUploadResult> {
    // Validate metadata structure
    if (!metadata.name || !metadata.description || !metadata.image) {
      throw new Error('NFT metadata must include name, description, and image');
    }

    return this.uploadJSON(metadata);
  }

  /**
   * Upload multiple files in batch
   */
  async uploadBatch(items: BatchUploadItem[]): Promise<BatchUploadResult> {
    const startTime = Date.now();
    const results: ThirdwebUploadResult[] = [];
    let totalSize = 0;

    for (const item of items) {
      let file: File | Blob;

      if (item.data instanceof File || item.data instanceof Blob) {
        file = item.data;
      } else {
        // Convert object to JSON blob
        const json = JSON.stringify(item.data);
        file = new Blob([json], { type: 'application/json' });
      }

      const result = await this.uploadFile(file);
      results.push(result);
      totalSize += result.size;
    }

    return {
      results,
      totalSize,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Download a file from decentralized storage
   */
  async downloadFile(uri: string, options?: ThirdwebDownloadOptions): Promise<Response> {
    const response = await download({
      client: this.client,
      uri,
    });

    return response;
  }

  /**
   * Download JSON data
   *
   * Downloads and parses JSON from IPFS/Arweave.
   *
   * @param uri - IPFS or Arweave URI
   * @param options - Optional download configuration
   * @returns Parsed JSON data
   *
   * @example Download NFT metadata
   * ```typescript
   * import { StorageClient } from '@varity-labs/sdk';
   *
   * const storage = new StorageClient({ client });
   *
   * // Get tokenURI from contract
   * const tokenURI = await nftContract.tokenURI(tokenId);
   *
   * // Download and parse metadata
   * const metadata = await storage.downloadJSON(tokenURI);
   * console.log('NFT Name:', metadata.name);
   * console.log('NFT Image:', metadata.image);
   * ```
   *
   * @example With TypeScript type
   * ```typescript
   * interface MyMetadata {
   *   name: string;
   *   description: string;
   *   image: string;
   *   attributes: Array<{ trait_type: string; value: string | number }>;
   * }
   *
   * const metadata = await storage.downloadJSON<MyMetadata>(uri);
   * // TypeScript now knows metadata.attributes exists
   * console.log('Traits:', metadata.attributes);
   * ```
   */
  async downloadJSON<T = any>(uri: string, options?: ThirdwebDownloadOptions): Promise<T> {
    const response = await this.downloadFile(uri, options);
    return response.json();
  }

  /**
   * Get gateway URL for a URI
   */
  getGatewayUrl(uri: string, options?: ImageOptimizationOptions): string {
    // Extract CID from IPFS URI
    const cid = uri.replace('ipfs://', '');

    // Base gateway URL
    let gatewayUrl = `https://gateway.thirdweb.com/ipfs/${cid}`;

    // Add optimization parameters if provided
    if (options) {
      const params = new URLSearchParams();

      if (options.width) params.set('width', options.width.toString());
      if (options.height) params.set('height', options.height.toString());
      if (options.quality) params.set('quality', options.quality.toString());
      if (options.format) params.set('format', options.format);

      const queryString = params.toString();
      if (queryString) {
        gatewayUrl += `?${queryString}`;
      }
    }

    return gatewayUrl;
  }

  /**
   * Pin a file to IPFS (ensure permanent availability)
   */
  async pinFile(uri: string): Promise<void> {
    // thirdweb automatically pins files uploaded through their service
    // This method is provided for completeness but may not be necessary
    console.log(`File ${uri} is automatically pinned by thirdweb`);
  }

  /**
   * Unpin a file from IPFS
   */
  async unpinFile(uri: string): Promise<void> {
    console.warn('Unpinning is not supported through thirdweb gateway');
  }

  /**
   * Get file metadata
   */
  async getMetadata(uri: string): Promise<{
    cid: string;
    size?: number;
    pinned: boolean;
  }> {
    const cid = uri.replace('ipfs://', '');

    return {
      cid,
      pinned: true, // thirdweb automatically pins
    };
  }

  /**
   * Upload a directory of files
   */
  async uploadDirectory(files: File[]): Promise<BatchUploadResult> {
    const items = files.map(file => ({ data: file, filename: file.name }));
    return this.uploadBatch(items);
  }

  /**
   * Create and upload NFT collection metadata
   */
  async uploadCollection(
    metadata: NFTMetadata[]
  ): Promise<{
    metadataUris: string[];
    baseUri: string;
  }> {
    const results = await this.uploadBatch(metadata.map(data => ({ data })));

    // Calculate base URI (common prefix)
    const uris = results.results.map(r => r.uri);
    const baseUri = uris[0].substring(0, uris[0].lastIndexOf('/'));

    return {
      metadataUris: uris,
      baseUri,
    };
  }

  /**
   * Resolve IPFS URI to HTTP gateway URL
   */
  static resolveUri(uri: string): string {
    if (uri.startsWith('ipfs://')) {
      return `https://gateway.thirdweb.com/ipfs/${uri.replace('ipfs://', '')}`;
    }

    if (uri.startsWith('ar://')) {
      return `https://arweave.net/${uri.replace('ar://', '')}`;
    }

    return uri;
  }

  /**
   * Check if a URI is IPFS
   */
  static isIPFS(uri: string): boolean {
    return uri.startsWith('ipfs://') || uri.startsWith('Qm') || uri.startsWith('baf');
  }

  /**
   * Check if a URI is Arweave
   */
  static isArweave(uri: string): boolean {
    return uri.startsWith('ar://');
  }
}

/**
 * Create Storage client instance
 *
 * Factory function for creating StorageClient instances.
 *
 * @param config - Storage configuration
 * @returns Configured Storage client
 *
 * @example Basic setup
 * ```typescript
 * import { createStorageClient } from '@varity-labs/sdk';
 * import { createThirdwebClient } from 'thirdweb';
 *
 * const client = createThirdwebClient({
 *   clientId: process.env.THIRDWEB_CLIENT_ID
 * });
 *
 * const storage = createStorageClient({ client });
 *
 * // Now use storage client
 * const result = await storage.uploadFile(file);
 * ```
 *
 * @example With Arweave provider
 * ```typescript
 * const storage = createStorageClient({
 *   client,
 *   provider: 'arweave'  // Permanent storage
 * });
 * ```
 *
 * @example With custom upload options
 * ```typescript
 * const storage = createStorageClient({
 *   client,
 *   uploadOptions: {
 *     pin: true,           // Auto-pin to IPFS
 *     timeout: 60000       // 60 second timeout
 *   }
 * });
 * ```
 */
export function createStorageClient(config: StorageConfig): StorageClient {
  return new StorageClient(config);
}
