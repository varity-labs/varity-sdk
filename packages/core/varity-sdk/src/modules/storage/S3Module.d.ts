/**
 * Varity SDK - S3-Compatible Storage Module
 *
 * Provides S3-compatible methods backed by Filecoin/IPFS via S3 Gateway.
 * Developers can use familiar S3 APIs (putObject, getObject, etc.) while
 * benefiting from decentralized storage.
 *
 * @example
 * ```typescript
 * const sdk = new VaritySDK({
 *   network: 'arbitrum-sepolia',
 *   s3Config: {
 *     endpoint: 'http://localhost:3001',
 *     accessKeyId: 'test-key',
 *     secretAccessKey: 'test-secret',
 *     bucket: 'my-bucket',
 *     region: 'us-east-1'
 *   }
 * })
 *
 * // Upload object
 * const result = await sdk.s3.putObject({
 *   Bucket: 'my-bucket',
 *   Key: 'document.txt',
 *   Body: 'Hello, World!'
 * })
 *
 * // Download object
 * const data = await sdk.s3.getObject({
 *   Bucket: 'my-bucket',
 *   Key: 'document.txt'
 * })
 * ```
 */
import type { VaritySDK } from '../../core/VaritySDK';
import { type S3CompatibleConfig, type S3UploadResult, type S3ListObjectsResult, type S3PresignedUrl, type S3PresignedUrlOptions, type S3MultipartUpload, type S3MultipartUploadOptions, type S3UploadPart, type S3StorageClass } from '@varity-labs/types';
/**
 * S3 putObject parameters (S3-compatible API)
 */
export interface S3PutObjectParams {
    /** Bucket name */
    Bucket: string;
    /** Object key */
    Key: string;
    /** Object content (Buffer, string, or Blob) */
    Body: Buffer | string | Blob;
    /** Content type */
    ContentType?: string;
    /** Content encoding */
    ContentEncoding?: string;
    /** Content language */
    ContentLanguage?: string;
    /** Cache control */
    CacheControl?: string;
    /** Content disposition */
    ContentDisposition?: string;
    /** Metadata */
    Metadata?: Record<string, string>;
    /** Tags */
    Tagging?: string;
    /** Storage class */
    StorageClass?: S3StorageClass;
    /** ACL */
    ACL?: string;
    /** Server-side encryption */
    ServerSideEncryption?: 'AES256' | 'aws:kms';
    /** KMS key ID */
    SSEKMSKeyId?: string;
}
/**
 * S3 getObject parameters (S3-compatible API)
 */
export interface S3GetObjectParams {
    /** Bucket name */
    Bucket: string;
    /** Object key */
    Key: string;
    /** Range (e.g., 'bytes=0-1023') */
    Range?: string;
    /** Version ID */
    VersionId?: string;
    /** If-Match condition */
    IfMatch?: string;
    /** If-None-Match condition */
    IfNoneMatch?: string;
    /** If-Modified-Since condition */
    IfModifiedSince?: Date;
    /** If-Unmodified-Since condition */
    IfUnmodifiedSince?: Date;
}
/**
 * S3 getObject response (S3-compatible API)
 */
export interface S3GetObjectResponse {
    /** Object body */
    Body: Buffer;
    /** Content type */
    ContentType: string;
    /** Content length */
    ContentLength: number;
    /** ETag */
    ETag: string;
    /** Last modified */
    LastModified: Date;
    /** Metadata */
    Metadata?: Record<string, string>;
    /** Version ID */
    VersionId?: string;
    /** Storage class */
    StorageClass?: S3StorageClass;
}
/**
 * S3 deleteObject parameters (S3-compatible API)
 */
export interface S3DeleteObjectParams {
    /** Bucket name */
    Bucket: string;
    /** Object key */
    Key: string;
    /** Version ID */
    VersionId?: string;
}
/**
 * S3 listObjects parameters (S3-compatible API)
 */
export interface S3ListObjectsParams {
    /** Bucket name */
    Bucket: string;
    /** Prefix filter */
    Prefix?: string;
    /** Delimiter */
    Delimiter?: string;
    /** Max keys to return */
    MaxKeys?: number;
    /** Continuation token */
    ContinuationToken?: string;
    /** Start after key */
    StartAfter?: string;
}
/**
 * S3 headObject parameters (S3-compatible API)
 */
export interface S3HeadObjectParams {
    /** Bucket name */
    Bucket: string;
    /** Object key */
    Key: string;
    /** Version ID */
    VersionId?: string;
}
/**
 * S3 headObject response (S3-compatible API)
 */
export interface S3HeadObjectResponse {
    /** Content type */
    ContentType: string;
    /** Content length */
    ContentLength: number;
    /** ETag */
    ETag: string;
    /** Last modified */
    LastModified: Date;
    /** Metadata */
    Metadata?: Record<string, string>;
    /** Version ID */
    VersionId?: string;
    /** Storage class */
    StorageClass?: S3StorageClass;
}
/**
 * S3Module - S3-Compatible Storage Interface
 *
 * Provides familiar S3 API methods backed by Filecoin/IPFS via S3 Gateway (Agent 2).
 */
export declare class S3Module {
    private sdk;
    private config;
    constructor(sdk: VaritySDK, config: S3CompatibleConfig);
    /**
     * PUT object - S3-compatible upload
     *
     * @param params - PutObject parameters
     * @returns Upload result with S3 metadata
     *
     * @example
     * ```typescript
     * const result = await sdk.s3.putObject({
     *   Bucket: 'my-bucket',
     *   Key: 'document.txt',
     *   Body: 'Hello, World!',
     *   ContentType: 'text/plain'
     * })
     * console.log(result.ETag)
     * ```
     */
    putObject(params: S3PutObjectParams): Promise<S3UploadResult>;
    /**
     * GET object - S3-compatible download
     *
     * @param params - GetObject parameters
     * @returns Object data and metadata
     *
     * @example
     * ```typescript
     * const result = await sdk.s3.getObject({
     *   Bucket: 'my-bucket',
     *   Key: 'document.txt'
     * })
     * console.log(result.Body.toString())
     * ```
     */
    getObject(params: S3GetObjectParams): Promise<S3GetObjectResponse>;
    /**
     * DELETE object - S3-compatible deletion
     *
     * @param params - DeleteObject parameters
     *
     * @example
     * ```typescript
     * await sdk.s3.deleteObject({
     *   Bucket: 'my-bucket',
     *   Key: 'document.txt'
     * })
     * ```
     */
    deleteObject(params: S3DeleteObjectParams): Promise<void>;
    /**
     * LIST objects - S3-compatible list operation
     *
     * @param params - ListObjects parameters
     * @returns List of objects
     *
     * @example
     * ```typescript
     * const result = await sdk.s3.listObjects({
     *   Bucket: 'my-bucket',
     *   Prefix: 'documents/'
     * })
     * console.log(result.objects.length)
     * ```
     */
    listObjects(params: S3ListObjectsParams): Promise<S3ListObjectsResult>;
    /**
     * HEAD object - Get object metadata without downloading
     *
     * @param params - HeadObject parameters
     * @returns Object metadata
     *
     * @example
     * ```typescript
     * const metadata = await sdk.s3.headObject({
     *   Bucket: 'my-bucket',
     *   Key: 'document.txt'
     * })
     * console.log(metadata.ContentLength)
     * ```
     */
    headObject(params: S3HeadObjectParams): Promise<S3HeadObjectResponse>;
    /**
     * Generate presigned URL for object access
     *
     * @param bucket - Bucket name
     * @param key - Object key
     * @param options - Presigned URL options
     * @returns Presigned URL
     *
     * @example
     * ```typescript
     * const presignedUrl = await sdk.s3.getPresignedUrl(
     *   'my-bucket',
     *   'document.txt',
     *   { expiresIn: 3600, method: 'GET' }
     * )
     * console.log(presignedUrl.url)
     * ```
     */
    getPresignedUrl(bucket: string, key: string, options: S3PresignedUrlOptions): Promise<S3PresignedUrl>;
    /**
     * Initiate multipart upload
     *
     * @param bucket - Bucket name
     * @param key - Object key
     * @param options - Multipart upload options
     * @returns Upload session
     */
    createMultipartUpload(bucket: string, key: string, options?: S3MultipartUploadOptions): Promise<S3MultipartUpload>;
    /**
     * Upload part for multipart upload
     *
     * @param bucket - Bucket name
     * @param key - Object key
     * @param uploadId - Upload ID
     * @param partNumber - Part number (1-10000)
     * @param body - Part data
     * @returns Upload part result
     */
    uploadPart(bucket: string, key: string, uploadId: string, partNumber: number, body: Buffer): Promise<S3UploadPart>;
    /**
     * Complete multipart upload
     *
     * @param bucket - Bucket name
     * @param key - Object key
     * @param uploadId - Upload ID
     * @param parts - Uploaded parts
     * @returns Upload result
     */
    completeMultipartUpload(bucket: string, key: string, uploadId: string, parts: S3UploadPart[]): Promise<S3UploadResult>;
    /**
     * Abort multipart upload
     *
     * @param bucket - Bucket name
     * @param key - Object key
     * @param uploadId - Upload ID
     */
    abortMultipartUpload(bucket: string, key: string, uploadId: string): Promise<void>;
    /**
     * Build endpoint URL
     */
    private buildEndpoint;
    /**
     * Build AWS Signature V4 headers
     */
    private buildAuthHeaders;
    /**
     * Get AMZ date (ISO 8601 format)
     */
    private getAmzDate;
    /**
     * Get credential scope
     */
    private getCredentialScope;
    /**
     * Build string to sign for presigned URL
     */
    private buildStringToSign;
    /**
     * Sign string using AWS Signature V4
     */
    private signString;
    /**
     * Get AWS Signature V4 signing key
     */
    private getSignatureKey;
    /**
     * Calculate SHA256 hash
     */
    private sha256;
    /**
     * Calculate SHA256 hash of buffer
     */
    private calculateSHA256;
    /**
     * Build metadata headers (x-amz-meta-*)
     */
    private buildMetadataHeaders;
    /**
     * Extract metadata from response headers
     */
    private extractMetadata;
    /**
     * Parse S3 ListObjectsV2 XML response
     */
    private parseListObjectsResponse;
    /**
     * Extract value from XML string
     */
    private extractXMLValue;
    /**
     * Extract upload ID from XML response
     */
    private extractUploadId;
    /**
     * Build CompleteMultipartUpload XML body
     */
    private buildCompleteMultipartUploadXML;
}
//# sourceMappingURL=S3Module.d.ts.map