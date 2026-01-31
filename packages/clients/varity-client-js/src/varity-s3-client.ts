/**
 * Varity S3-Compatible Client
 *
 * AWS SDK-compatible client for Varity's decentralized storage infrastructure.
 * Supports standard S3 operations with Filecoin/IPFS backend.
 *
 * @module @varity-labs/client-js
 */

import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListBucketsCommand,
  CopyObjectCommand,
  PutObjectCommandInput,
  GetObjectCommandInput,
  DeleteObjectCommandInput,
  ListObjectsV2CommandInput,
  HeadObjectCommandInput,
  CreateBucketCommandInput,
  DeleteBucketCommandInput,
  CopyObjectCommandInput
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface VarityS3ClientConfig extends Omit<S3ClientConfig, 'endpoint'> {
  endpoint?: string;
  gatewayType?: 's3' | 'gcs';
  network?: 'arbitrum-sepolia' | 'arbitrum-one' | 'mainnet';
  storageBackend?: 'filecoin-ipfs' | 'filecoin-lighthouse';
  encryptionEnabled?: boolean;
}

/**
 * Varity S3 Client
 *
 * Extends AWS S3Client with Varity-specific configurations and optimizations
 * for decentralized storage infrastructure.
 *
 * @example
 * ```typescript
 * const client = new VarityS3Client({
 *   credentials: {
 *     accessKeyId: 'YOUR_ACCESS_KEY',
 *     secretAccessKey: 'YOUR_SECRET_KEY'
 *   },
 *   network: 'arbitrum-sepolia'
 * });
 *
 * // Upload object
 * await client.putObject({
 *   Bucket: 'my-bucket',
 *   Key: 'my-file.txt',
 *   Body: 'Hello, Varity!'
 * });
 *
 * // Download object
 * const response = await client.getObject({
 *   Bucket: 'my-bucket',
 *   Key: 'my-file.txt'
 * });
 * ```
 */
export class VarityS3Client extends S3Client {
  private readonly gatewayType: 's3' | 'gcs';
  private readonly network: string;
  private readonly storageBackend: string;
  private readonly encryptionEnabled: boolean;

  constructor(config: VarityS3ClientConfig = {}) {
    const endpoint = config.endpoint || VarityS3Client.getDefaultEndpoint(config.gatewayType);
    const region = config.region || 'us-east-1';

    super({
      ...config,
      endpoint,
      region,
      forcePathStyle: true, // Required for S3-compatible APIs
    });

    this.gatewayType = config.gatewayType || 's3';
    this.network = config.network || 'arbitrum-sepolia';
    this.storageBackend = config.storageBackend || 'filecoin-ipfs';
    this.encryptionEnabled = config.encryptionEnabled ?? true;
  }

  /**
   * Get default endpoint based on gateway type
   */
  private static getDefaultEndpoint(gatewayType?: 's3' | 'gcs'): string {
    return gatewayType === 'gcs'
      ? 'http://localhost:8080'  // GCS gateway default port
      : 'http://localhost:3001'; // S3 gateway default port
  }

  /**
   * Upload object to Varity storage
   */
  async putObject(params: PutObjectCommandInput) {
    const command = new PutObjectCommand(params);
    return this.send(command);
  }

  /**
   * Download object from Varity storage
   */
  async getObject(params: GetObjectCommandInput) {
    const command = new GetObjectCommand(params);
    return this.send(command);
  }

  /**
   * Delete object from Varity storage
   */
  async deleteObject(params: DeleteObjectCommandInput) {
    const command = new DeleteObjectCommand(params);
    return this.send(command);
  }

  /**
   * List objects in bucket
   */
  async listObjects(params: ListObjectsV2CommandInput) {
    const command = new ListObjectsV2Command(params);
    return this.send(command);
  }

  /**
   * Get object metadata
   */
  async headObject(params: HeadObjectCommandInput) {
    const command = new HeadObjectCommand(params);
    return this.send(command);
  }

  /**
   * Create bucket
   */
  async createBucket(params: CreateBucketCommandInput) {
    const command = new CreateBucketCommand(params);
    return this.send(command);
  }

  /**
   * Delete bucket
   */
  async deleteBucket(params: DeleteBucketCommandInput) {
    const command = new DeleteBucketCommand(params);
    return this.send(command);
  }

  /**
   * List all buckets
   */
  async listBuckets() {
    const command = new ListBucketsCommand({});
    return this.send(command);
  }

  /**
   * Copy object
   */
  async copyObject(params: CopyObjectCommandInput) {
    const command = new CopyObjectCommand(params);
    return this.send(command);
  }

  /**
   * Generate presigned URL for object access
   */
  async getSignedUrl(
    command: PutObjectCommand | GetObjectCommand,
    expiresIn: number = 3600
  ): Promise<string> {
    return getSignedUrl(this, command, { expiresIn });
  }

  /**
   * Get client configuration
   */
  getConfig() {
    return {
      gatewayType: this.gatewayType,
      network: this.network,
      storageBackend: this.storageBackend,
      encryptionEnabled: this.encryptionEnabled
    };
  }

  /**
   * Stream upload for large files
   */
  async uploadStream(
    bucket: string,
    key: string,
    stream: ReadableStream | NodeJS.ReadableStream,
    metadata?: Record<string, string>
  ) {
    return this.putObject({
      Bucket: bucket,
      Key: key,
      Body: stream as any,
      Metadata: metadata
    });
  }

  /**
   * Stream download for large files
   */
  async downloadStream(bucket: string, key: string) {
    const response = await this.getObject({
      Bucket: bucket,
      Key: key
    });
    return response.Body;
  }
}

/**
 * Export commonly used types
 */
export {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListBucketsCommand,
  CopyObjectCommand,
  type PutObjectCommandInput,
  type GetObjectCommandInput,
  type DeleteObjectCommandInput,
  type ListObjectsV2CommandInput,
  type HeadObjectCommandInput,
  type CreateBucketCommandInput,
  type DeleteBucketCommandInput,
  type CopyObjectCommandInput
};

export default VarityS3Client;
