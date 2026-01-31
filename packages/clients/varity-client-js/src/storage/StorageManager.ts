/**
 * Storage Manager - Handle IPFS storage operations via Thirdweb
 */

import type { ThirdwebClient } from 'thirdweb';
import { upload, download } from 'thirdweb/storage';
import type {
  StorageUploadOptions,
  StorageUploadResult,
  StorageDownloadOptions,
  StorageError,
} from '../types';
import { StorageError as StorageErrorClass } from '../types';

/**
 * StorageManager - Manage IPFS storage operations
 *
 * @example
 * ```typescript
 * // Upload file
 * const result = await storageManager.upload(file);
 * console.log('IPFS CID:', result.cid);
 *
 * // Download file
 * const data = await storageManager.download(result.cid);
 * ```
 */
export class StorageManager {
  private readonly defaultGateway = 'https://ipfs.io/ipfs/';

  constructor(private readonly client: ThirdwebClient) {}

  /**
   * Upload file to IPFS
   * @param file File to upload (File, Blob, or Buffer)
   * @param options Upload options
   * @returns Upload result with CID and URL
   */
  async upload(
    file: File | Blob | Buffer | string,
    options: StorageUploadOptions = {}
  ): Promise<StorageUploadResult> {
    try {
      let uploadData: any;

      // Handle different file types
      if (typeof file === 'string') {
        // String data
        uploadData = new Blob([file], { type: 'text/plain' });
      } else if (Buffer.isBuffer(file)) {
        // Node.js Buffer - convert to Uint8Array for Blob compatibility
        uploadData = new Blob([new Uint8Array(file)]);
      } else {
        // File or Blob
        uploadData = file;
      }

      // Upload to IPFS via Thirdweb
      const uri = await upload({
        client: this.client,
        files: [uploadData],
      });

      // Extract CID from URI (format: ipfs://CID)
      const cid = uri.replace('ipfs://', '');

      return {
        cid,
        url: uri,
        gateway: `${this.defaultGateway}${cid}`,
      };
    } catch (error: any) {
      throw new StorageErrorClass(
        `Failed to upload to IPFS: ${error.message}`,
        { error }
      );
    }
  }

  /**
   * Upload multiple files to IPFS
   * @param files Array of files to upload
   * @param options Upload options
   * @returns Array of upload results
   */
  async uploadBatch(
    files: (File | Blob | Buffer | string)[],
    options: StorageUploadOptions = {}
  ): Promise<StorageUploadResult[]> {
    try {
      const uploadData: File[] = files.map((file) => {
        if (typeof file === 'string') {
          // Convert string to File object
          return new File([file], 'file.txt', { type: 'text/plain' });
        } else if (Buffer.isBuffer(file)) {
          // Convert Buffer to File object
          return new File([new Uint8Array(file)], 'file.bin', { type: 'application/octet-stream' });
        } else {
          return file as File;
        }
      });

      // Upload all files
      const uris = await upload({
        client: this.client,
        files: uploadData,
      });

      // Convert URI to CID format
      const results: StorageUploadResult[] = [];
      const uriArray = Array.isArray(uris) ? uris : [uris];

      for (const uri of uriArray) {
        const cid = uri.replace('ipfs://', '');
        results.push({
          cid,
          url: uri,
          gateway: `${this.defaultGateway}${cid}`,
        });
      }

      return results;
    } catch (error: any) {
      throw new StorageErrorClass(
        `Failed to batch upload to IPFS: ${error.message}`,
        { error }
      );
    }
  }

  /**
   * Upload JSON data to IPFS
   * @param data JSON data to upload
   * @param options Upload options
   * @returns Upload result
   */
  async uploadJSON(
    data: any,
    options: StorageUploadOptions = {}
  ): Promise<StorageUploadResult> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      return await this.upload(blob, options);
    } catch (error: any) {
      throw new StorageErrorClass(
        `Failed to upload JSON to IPFS: ${error.message}`,
        { error }
      );
    }
  }

  /**
   * Download file from IPFS
   * @param cid IPFS CID or full URI
   * @param options Download options
   * @returns Downloaded data
   */
  async download(
    cid: string,
    options: StorageDownloadOptions = {}
  ): Promise<any> {
    try {
      // Normalize CID (remove ipfs:// prefix if present)
      const normalizedCid = cid.replace('ipfs://', '');
      const uri = `ipfs://${normalizedCid}`;

      // Download from IPFS via Thirdweb
      const data = await download({
        client: this.client,
        uri,
      });

      return data;
    } catch (error: any) {
      throw new StorageErrorClass(
        `Failed to download from IPFS: ${error.message}`,
        { cid, error }
      );
    }
  }

  /**
   * Download JSON from IPFS
   * @param cid IPFS CID or full URI
   * @param options Download options
   * @returns Parsed JSON data
   */
  async downloadJSON(
    cid: string,
    options: StorageDownloadOptions = {}
  ): Promise<any> {
    try {
      const data = await this.download(cid, options);

      // If data is already parsed JSON, return it
      if (typeof data === 'object') {
        return data;
      }

      // If data is a Response object
      if (data instanceof Response) {
        return await data.json();
      }

      // If data is a string, parse it
      if (typeof data === 'string') {
        return JSON.parse(data);
      }

      // If data is a Blob, read and parse it
      if (data instanceof Blob) {
        const text = await data.text();
        return JSON.parse(text);
      }

      return data;
    } catch (error: any) {
      throw new StorageErrorClass(
        `Failed to download JSON from IPFS: ${error.message}`,
        { cid, error }
      );
    }
  }

  /**
   * Get IPFS gateway URL for CID
   * @param cid IPFS CID
   * @param gateway Custom gateway URL (optional)
   * @returns Gateway URL
   */
  getGatewayUrl(cid: string, gateway?: string): string {
    const normalizedCid = cid.replace('ipfs://', '');
    const baseGateway = gateway || this.defaultGateway;
    return `${baseGateway}${normalizedCid}`;
  }

  /**
   * Get IPFS URI from CID
   * @param cid IPFS CID
   * @returns IPFS URI
   */
  getIPFSUri(cid: string): string {
    const normalizedCid = cid.replace('ipfs://', '');
    return `ipfs://${normalizedCid}`;
  }

  /**
   * Upload metadata for NFT
   * @param metadata NFT metadata object
   * @returns Upload result with metadata URI
   */
  async uploadNFTMetadata(metadata: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{ trait_type: string; value: any }>;
    [key: string]: any;
  }): Promise<StorageUploadResult> {
    try {
      return await this.uploadJSON(metadata);
    } catch (error: any) {
      throw new StorageErrorClass(
        `Failed to upload NFT metadata: ${error.message}`,
        { error }
      );
    }
  }

  /**
   * Upload directory to IPFS
   * @param files Array of files with names
   * @returns Upload result with directory CID
   */
  async uploadDirectory(
    files: Array<{ name: string; content: File | Blob | Buffer | string }>
  ): Promise<StorageUploadResult> {
    try {
      const uploadFiles = files.map((file) => {
        let content: Blob;

        if (typeof file.content === 'string') {
          content = new Blob([file.content], { type: 'text/plain' });
        } else if (Buffer.isBuffer(file.content)) {
          content = new Blob([new Uint8Array(file.content)]);
        } else {
          content = file.content;
        }

        // Add name property to the blob
        return new File([content], file.name);
      });

      const uris = await upload({
        client: this.client,
        files: uploadFiles,
      });

      // upload returns string or string[], handle both cases
      const uri = Array.isArray(uris) ? uris[0] : uris;
      const cid = uri.replace('ipfs://', '');

      return {
        cid,
        url: uri,
        gateway: `${this.defaultGateway}${cid}`,
      };
    } catch (error: any) {
      throw new StorageErrorClass(
        `Failed to upload directory to IPFS: ${error.message}`,
        { error }
      );
    }
  }

  /**
   * Check if CID is valid
   * @param cid CID to validate
   * @returns True if valid
   */
  isValidCID(cid: string): boolean {
    const normalizedCid = cid.replace('ipfs://', '');

    // Basic CID validation (checks for valid characters and length)
    // CIDv0: Qm followed by 44 base58 characters
    // CIDv1: starts with 'b' or 'z' followed by base32/base58 characters

    const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    const cidv1Regex = /^[bz][a-z2-7]{58,}$/;

    return cidv0Regex.test(normalizedCid) || cidv1Regex.test(normalizedCid);
  }

  /**
   * Pin CID to ensure persistence
   * Note: This requires a pinning service integration
   * @param cid CID to pin
   */
  async pin(cid: string): Promise<void> {
    // Thirdweb storage handles pinning automatically
    // This is a placeholder for custom pinning service integration
    console.log(`CID ${cid} is automatically pinned by Thirdweb`);
  }

  /**
   * Unpin CID
   * Note: This requires a pinning service integration
   * @param cid CID to unpin
   */
  async unpin(cid: string): Promise<void> {
    // Placeholder for custom pinning service integration
    console.log(`Unpinning CID ${cid}`);
  }

  /**
   * Get storage statistics
   * @returns Storage statistics
   */
  async getStats(): Promise<{
    totalUploads: number;
    totalSize: number;
  }> {
    // Placeholder - implement actual statistics tracking
    return {
      totalUploads: 0,
      totalSize: 0,
    };
  }
}

export default StorageManager;
