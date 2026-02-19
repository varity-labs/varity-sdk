/**
 * Storage Service - Filecoin/IPFS Backend for GCS Gateway
 * Implements storage operations using Varity SDK and Pinata
 */

import axios from 'axios';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  GCSObject,
  GCSBucket,
  GCSObjectList,
  GCSBucketList,
  FilecoinMetadata,
  StorageBackendConfig
} from '../types';

export interface StorageObject {
  name: string;
  bucket: string;
  data: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
  size: number;
  md5Hash: string;
  cid?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class StorageService {
  private config: StorageBackendConfig;
  private buckets: Map<string, GCSBucket> = new Map();
  private objects: Map<string, StorageObject> = new Map();

  constructor(config: StorageBackendConfig) {
    this.config = config;
    this.initializeDefaultBucket();
  }

  /**
   * Initialize default bucket for testing
   */
  private initializeDefaultBucket(): void {
    const defaultBucket: GCSBucket = {
      kind: 'storage#bucket',
      id: 'varity-default',
      name: 'varity-default',
      timeCreated: new Date().toISOString(),
      updated: new Date().toISOString(),
      location: 'FILECOIN',
      storageClass: 'STANDARD',
      etag: this.generateEtag('varity-default')
    };
    this.buckets.set('varity-default', defaultBucket);
  }

  /**
   * Upload object to Filecoin via Pinata
   */
  async uploadObject(
    bucket: string,
    name: string,
    data: Buffer,
    contentType: string = 'application/octet-stream',
    metadata?: Record<string, string>
  ): Promise<GCSObject> {
    // Validate bucket exists
    if (!this.buckets.has(bucket)) {
      throw new Error(`Bucket not found: ${bucket}`);
    }

    const md5Hash = this.calculateMD5(data);
    const size = data.length;

    try {
      // Upload to Pinata (Filecoin/IPFS)
      const cid = await this.uploadToPinata(data, name, metadata);

      // Create storage object
      const storageObject: StorageObject = {
        name,
        bucket,
        data,
        contentType,
        metadata,
        size,
        md5Hash,
        cid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in memory cache
      const objectKey = `${bucket}/${name}`;
      this.objects.set(objectKey, storageObject);

      // Return GCS-compatible object
      return this.toGCSObject(storageObject);
    } catch (error: any) {
      console.error('Failed to upload object:', error.message);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload data to Pinata (Filecoin/IPFS)
   */
  private async uploadToPinata(
    data: Buffer,
    filename: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    const FormData = require('form-data');
    const formData = new FormData();

    formData.append('file', data, {
      filename,
      contentType: 'application/octet-stream'
    });

    // Add metadata
    const pinataMetadata = {
      name: filename,
      keyvalues: metadata || {}
    };
    formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

    // Add pinata options
    const pinataOptions = {
      cidVersion: 1
    };
    formData.append('pinataOptions', JSON.stringify(pinataOptions));

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
            pinata_api_key: this.config.pinataApiKey,
            pinata_secret_api_key: this.config.pinataSecretKey
          },
          maxBodyLength: Infinity
        }
      );

      return response.data.IpfsHash;
    } catch (error: any) {
      console.error('Pinata upload error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get object from storage
   */
  async getObject(bucket: string, name: string): Promise<StorageObject | null> {
    const objectKey = `${bucket}/${name}`;
    const obj = this.objects.get(objectKey);

    if (!obj) {
      return null;
    }

    // If object is in Filecoin but not in cache, fetch from IPFS
    if (obj.cid && !obj.data) {
      obj.data = await this.fetchFromIPFS(obj.cid);
    }

    return obj;
  }

  /**
   * Fetch data from IPFS gateway
   */
  private async fetchFromIPFS(cid: string): Promise<Buffer> {
    try {
      const response = await axios.get(`${this.config.ipfsGateway}/${cid}`, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('IPFS fetch error:', error.message);
      throw new Error(`Failed to fetch from IPFS: ${error.message}`);
    }
  }

  /**
   * Delete object from storage
   */
  async deleteObject(bucket: string, name: string): Promise<boolean> {
    const objectKey = `${bucket}/${name}`;
    const obj = this.objects.get(objectKey);

    if (!obj) {
      return false;
    }

    // TODO: Implement Pinata unpin if needed
    // For now, just remove from cache
    this.objects.delete(objectKey);

    return true;
  }

  /**
   * List objects in bucket
   */
  async listObjects(
    bucket: string,
    prefix?: string,
    maxResults: number = 1000,
    pageToken?: string
  ): Promise<GCSObjectList> {
    if (!this.buckets.has(bucket)) {
      throw new Error(`Bucket not found: ${bucket}`);
    }

    const objects: GCSObject[] = [];

    for (const [key, obj] of this.objects.entries()) {
      if (!key.startsWith(`${bucket}/`)) {
        continue;
      }

      const objectName = key.substring(`${bucket}/`.length);

      if (prefix && !objectName.startsWith(prefix)) {
        continue;
      }

      objects.push(this.toGCSObject(obj));
    }

    // Sort by name
    objects.sort((a, b) => a.name.localeCompare(b.name));

    // Apply pagination
    const startIndex = pageToken ? parseInt(pageToken) : 0;
    const endIndex = Math.min(startIndex + maxResults, objects.length);
    const items = objects.slice(startIndex, endIndex);

    const result: GCSObjectList = {
      kind: 'storage#objects',
      items
    };

    if (endIndex < objects.length) {
      result.nextPageToken = endIndex.toString();
    }

    return result;
  }

  /**
   * Create bucket
   */
  async createBucket(
    name: string,
    location: string = 'FILECOIN',
    storageClass: string = 'STANDARD'
  ): Promise<GCSBucket> {
    if (this.buckets.has(name)) {
      throw new Error(`Bucket already exists: ${name}`);
    }

    const bucket: GCSBucket = {
      kind: 'storage#bucket',
      id: name,
      name,
      timeCreated: new Date().toISOString(),
      updated: new Date().toISOString(),
      location,
      storageClass,
      etag: this.generateEtag(name)
    };

    this.buckets.set(name, bucket);
    return bucket;
  }

  /**
   * Get bucket
   */
  async getBucket(name: string): Promise<GCSBucket | null> {
    return this.buckets.get(name) || null;
  }

  /**
   * List buckets
   */
  async listBuckets(project?: string, maxResults: number = 1000): Promise<GCSBucketList> {
    const items = Array.from(this.buckets.values());

    return {
      kind: 'storage#buckets',
      items
    };
  }

  /**
   * Delete bucket
   */
  async deleteBucket(name: string): Promise<boolean> {
    if (!this.buckets.has(name)) {
      return false;
    }

    // Check if bucket is empty
    for (const key of this.objects.keys()) {
      if (key.startsWith(`${name}/`)) {
        throw new Error('Bucket is not empty');
      }
    }

    this.buckets.delete(name);
    return true;
  }

  /**
   * Convert StorageObject to GCSObject format
   */
  private toGCSObject(obj: StorageObject): GCSObject {
    const generation = Date.now().toString();
    const etag = this.generateEtag(obj.name);

    return {
      kind: 'storage#object',
      id: `${obj.bucket}/${obj.name}/${generation}`,
      name: obj.name,
      bucket: obj.bucket,
      generation,
      contentType: obj.contentType,
      size: obj.size.toString(),
      md5Hash: obj.md5Hash,
      etag,
      timeCreated: obj.createdAt.toISOString(),
      updated: obj.updatedAt.toISOString(),
      metadata: obj.metadata,
      storageClass: 'STANDARD'
    };
  }

  /**
   * Calculate MD5 hash
   */
  private calculateMD5(data: Buffer): string {
    return crypto.createHash('md5').update(data).digest('base64');
  }

  /**
   * Generate ETag
   */
  private generateEtag(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }
}
