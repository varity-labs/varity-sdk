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

import type { VaritySDK } from '../../core/VaritySDK'
import {
  StorageBackend,
  type S3CompatibleConfig,
  type S3UploadResult,
  type S3ListObjectsResult,
  type S3Object,
  type S3PresignedUrl,
  type S3PresignedUrlOptions,
  type S3MultipartUpload,
  type S3MultipartUploadOptions,
  type S3UploadPart,
  type S3StorageClass
} from '@varity-labs/types'
import { createHmac, createHash } from 'crypto'

/**
 * S3 putObject parameters (S3-compatible API)
 */
export interface S3PutObjectParams {
  /** Bucket name */
  Bucket: string
  /** Object key */
  Key: string
  /** Object content (Buffer, string, or Blob) */
  Body: Buffer | string | Blob
  /** Content type */
  ContentType?: string
  /** Content encoding */
  ContentEncoding?: string
  /** Content language */
  ContentLanguage?: string
  /** Cache control */
  CacheControl?: string
  /** Content disposition */
  ContentDisposition?: string
  /** Metadata */
  Metadata?: Record<string, string>
  /** Tags */
  Tagging?: string
  /** Storage class */
  StorageClass?: S3StorageClass
  /** ACL */
  ACL?: string
  /** Server-side encryption */
  ServerSideEncryption?: 'AES256' | 'aws:kms'
  /** KMS key ID */
  SSEKMSKeyId?: string
}

/**
 * S3 getObject parameters (S3-compatible API)
 */
export interface S3GetObjectParams {
  /** Bucket name */
  Bucket: string
  /** Object key */
  Key: string
  /** Range (e.g., 'bytes=0-1023') */
  Range?: string
  /** Version ID */
  VersionId?: string
  /** If-Match condition */
  IfMatch?: string
  /** If-None-Match condition */
  IfNoneMatch?: string
  /** If-Modified-Since condition */
  IfModifiedSince?: Date
  /** If-Unmodified-Since condition */
  IfUnmodifiedSince?: Date
}

/**
 * S3 getObject response (S3-compatible API)
 */
export interface S3GetObjectResponse {
  /** Object body */
  Body: Buffer
  /** Content type */
  ContentType: string
  /** Content length */
  ContentLength: number
  /** ETag */
  ETag: string
  /** Last modified */
  LastModified: Date
  /** Metadata */
  Metadata?: Record<string, string>
  /** Version ID */
  VersionId?: string
  /** Storage class */
  StorageClass?: S3StorageClass
}

/**
 * S3 deleteObject parameters (S3-compatible API)
 */
export interface S3DeleteObjectParams {
  /** Bucket name */
  Bucket: string
  /** Object key */
  Key: string
  /** Version ID */
  VersionId?: string
}

/**
 * S3 listObjects parameters (S3-compatible API)
 */
export interface S3ListObjectsParams {
  /** Bucket name */
  Bucket: string
  /** Prefix filter */
  Prefix?: string
  /** Delimiter */
  Delimiter?: string
  /** Max keys to return */
  MaxKeys?: number
  /** Continuation token */
  ContinuationToken?: string
  /** Start after key */
  StartAfter?: string
}

/**
 * S3 headObject parameters (S3-compatible API)
 */
export interface S3HeadObjectParams {
  /** Bucket name */
  Bucket: string
  /** Object key */
  Key: string
  /** Version ID */
  VersionId?: string
}

/**
 * S3 headObject response (S3-compatible API)
 */
export interface S3HeadObjectResponse {
  /** Content type */
  ContentType: string
  /** Content length */
  ContentLength: number
  /** ETag */
  ETag: string
  /** Last modified */
  LastModified: Date
  /** Metadata */
  Metadata?: Record<string, string>
  /** Version ID */
  VersionId?: string
  /** Storage class */
  StorageClass?: S3StorageClass
}

/**
 * S3Module - S3-Compatible Storage Interface
 *
 * Provides familiar S3 API methods backed by Filecoin/IPFS via S3 Gateway (Agent 2).
 */
export class S3Module {
  private sdk: VaritySDK
  private config: S3CompatibleConfig

  constructor(sdk: VaritySDK, config: S3CompatibleConfig) {
    this.sdk = sdk
    this.config = config
  }

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
  async putObject(params: S3PutObjectParams): Promise<S3UploadResult> {
    const endpoint = this.buildEndpoint()
    const url = `${endpoint}/${params.Bucket}/${params.Key}`

    // Convert Body to Buffer
    let body: Buffer
    if (Buffer.isBuffer(params.Body)) {
      body = params.Body
    } else if (typeof params.Body === 'string') {
      body = Buffer.from(params.Body, 'utf-8')
    } else {
      // Blob
      body = Buffer.from(await (params.Body as Blob).arrayBuffer())
    }

    // Build headers
    const headers = await this.buildAuthHeaders('PUT', params.Bucket, params.Key, {
      'Content-Type': params.ContentType || 'application/octet-stream',
      'Content-Length': body.length.toString(),
      ...(params.ContentEncoding && { 'Content-Encoding': params.ContentEncoding }),
      ...(params.ContentLanguage && { 'Content-Language': params.ContentLanguage }),
      ...(params.CacheControl && { 'Cache-Control': params.CacheControl }),
      ...(params.ContentDisposition && { 'Content-Disposition': params.ContentDisposition }),
      ...(params.ServerSideEncryption && { 'x-amz-server-side-encryption': params.ServerSideEncryption }),
      ...(params.SSEKMSKeyId && { 'x-amz-server-side-encryption-aws-kms-key-id': params.SSEKMSKeyId }),
      ...(params.StorageClass && { 'x-amz-storage-class': params.StorageClass }),
      ...(params.ACL && { 'x-amz-acl': params.ACL }),
      ...(params.Tagging && { 'x-amz-tagging': params.Tagging }),
      ...(params.Metadata && this.buildMetadataHeaders(params.Metadata))
    })

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: new Blob([new Uint8Array(body)])
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`S3 putObject failed: ${response.statusText} - ${errorText}`)
    }

    const etag = response.headers.get('ETag') || ''
    const versionId = response.headers.get('x-amz-version-id') || undefined

    return {
      backend: StorageBackend.FILECOIN_IPFS,
      identifier: params.Key,
      gatewayUrl: url,
      size: body.length,
      hash: this.calculateSHA256(body),
      timestamp: Date.now(),
      s3Key: params.Key,
      bucket: params.Bucket,
      region: this.config.region,
      etag: etag.replace(/"/g, ''),
      versionId,
      storageClass: params.StorageClass
    }
  }

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
  async getObject(params: S3GetObjectParams): Promise<S3GetObjectResponse> {
    const endpoint = this.buildEndpoint()
    const url = `${endpoint}/${params.Bucket}/${params.Key}${params.VersionId ? `?versionId=${params.VersionId}` : ''}`

    const headers = await this.buildAuthHeaders('GET', params.Bucket, params.Key, {
      ...(params.Range && { 'Range': params.Range }),
      ...(params.IfMatch && { 'If-Match': params.IfMatch }),
      ...(params.IfNoneMatch && { 'If-None-Match': params.IfNoneMatch }),
      ...(params.IfModifiedSince && { 'If-Modified-Since': params.IfModifiedSince.toUTCString() }),
      ...(params.IfUnmodifiedSince && { 'If-Unmodified-Since': params.IfUnmodifiedSince.toUTCString() })
    })

    const response = await fetch(url, { headers })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`S3 getObject failed: ${response.statusText} - ${errorText}`)
    }

    const body = Buffer.from(await response.arrayBuffer())
    const metadata = this.extractMetadata(response.headers)

    return {
      Body: body,
      ContentType: response.headers.get('Content-Type') || 'application/octet-stream',
      ContentLength: parseInt(response.headers.get('Content-Length') || '0', 10),
      ETag: (response.headers.get('ETag') || '').replace(/"/g, ''),
      LastModified: new Date(response.headers.get('Last-Modified') || Date.now()),
      Metadata: metadata,
      VersionId: response.headers.get('x-amz-version-id') || undefined,
      StorageClass: response.headers.get('x-amz-storage-class') as S3StorageClass || undefined
    }
  }

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
  async deleteObject(params: S3DeleteObjectParams): Promise<void> {
    const endpoint = this.buildEndpoint()
    const url = `${endpoint}/${params.Bucket}/${params.Key}${params.VersionId ? `?versionId=${params.VersionId}` : ''}`

    const headers = await this.buildAuthHeaders('DELETE', params.Bucket, params.Key)

    const response = await fetch(url, {
      method: 'DELETE',
      headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`S3 deleteObject failed: ${response.statusText} - ${errorText}`)
    }
  }

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
  async listObjects(params: S3ListObjectsParams): Promise<S3ListObjectsResult> {
    const endpoint = this.buildEndpoint()
    const queryParams = new URLSearchParams()
    queryParams.append('list-type', '2')
    if (params.Prefix) queryParams.append('prefix', params.Prefix)
    if (params.Delimiter) queryParams.append('delimiter', params.Delimiter)
    if (params.MaxKeys) queryParams.append('max-keys', params.MaxKeys.toString())
    if (params.ContinuationToken) queryParams.append('continuation-token', params.ContinuationToken)
    if (params.StartAfter) queryParams.append('start-after', params.StartAfter)

    const url = `${endpoint}/${params.Bucket}?${queryParams}`
    const headers = await this.buildAuthHeaders('GET', params.Bucket, '')

    const response = await fetch(url, { headers })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`S3 listObjects failed: ${response.statusText} - ${errorText}`)
    }

    const xml = await response.text()
    return this.parseListObjectsResponse(xml)
  }

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
  async headObject(params: S3HeadObjectParams): Promise<S3HeadObjectResponse> {
    const endpoint = this.buildEndpoint()
    const url = `${endpoint}/${params.Bucket}/${params.Key}${params.VersionId ? `?versionId=${params.VersionId}` : ''}`

    const headers = await this.buildAuthHeaders('HEAD', params.Bucket, params.Key)

    const response = await fetch(url, {
      method: 'HEAD',
      headers
    })

    if (!response.ok) {
      throw new Error(`S3 headObject failed: ${response.statusText}`)
    }

    const metadata = this.extractMetadata(response.headers)

    return {
      ContentType: response.headers.get('Content-Type') || 'application/octet-stream',
      ContentLength: parseInt(response.headers.get('Content-Length') || '0', 10),
      ETag: (response.headers.get('ETag') || '').replace(/"/g, ''),
      LastModified: new Date(response.headers.get('Last-Modified') || Date.now()),
      Metadata: metadata,
      VersionId: response.headers.get('x-amz-version-id') || undefined,
      StorageClass: response.headers.get('x-amz-storage-class') as S3StorageClass || undefined
    }
  }

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
  async getPresignedUrl(
    bucket: string,
    key: string,
    options: S3PresignedUrlOptions
  ): Promise<S3PresignedUrl> {
    const endpoint = this.buildEndpoint()
    const method = options.method || 'GET'
    const expiresIn = options.expiresIn
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    // Build base URL
    let url = `${endpoint}/${bucket}/${key}`

    // Add query parameters
    const params = new URLSearchParams()
    params.append('X-Amz-Algorithm', 'AWS4-HMAC-SHA256')
    params.append('X-Amz-Credential', `${this.config.accessKeyId}/${this.getCredentialScope()}`)
    params.append('X-Amz-Date', this.getAmzDate())
    params.append('X-Amz-Expires', expiresIn.toString())
    params.append('X-Amz-SignedHeaders', 'host')

    // Add response headers if specified
    if (options.responseHeaders) {
      if (options.responseHeaders.contentType) {
        params.append('response-content-type', options.responseHeaders.contentType)
      }
      if (options.responseHeaders.contentDisposition) {
        params.append('response-content-disposition', options.responseHeaders.contentDisposition)
      }
      if (options.responseHeaders.cacheControl) {
        params.append('response-cache-control', options.responseHeaders.cacheControl)
      }
    }

    // Add version ID if specified
    if (options.versionId) {
      params.append('versionId', options.versionId)
    }

    // Generate signature
    const stringToSign = this.buildStringToSign(method, bucket, key, params)
    const signature = this.signString(stringToSign)
    params.append('X-Amz-Signature', signature)

    url += `?${params}`

    return {
      url,
      expiresAt,
      method,
      headers: options.requestHeaders
    }
  }

  /**
   * Initiate multipart upload
   *
   * @param bucket - Bucket name
   * @param key - Object key
   * @param options - Multipart upload options
   * @returns Upload session
   */
  async createMultipartUpload(
    bucket: string,
    key: string,
    options?: S3MultipartUploadOptions
  ): Promise<S3MultipartUpload> {
    const endpoint = this.buildEndpoint()
    const url = `${endpoint}/${bucket}/${key}?uploads`

    const headers = await this.buildAuthHeaders('POST', bucket, key, {
      ...(options?.serverSideEncryption && { 'x-amz-server-side-encryption': options.serverSideEncryption }),
      ...(options?.kmsKeyId && { 'x-amz-server-side-encryption-aws-kms-key-id': options.kmsKeyId }),
      ...(options?.storageClass && { 'x-amz-storage-class': options.storageClass }),
      ...(options?.metadata && this.buildMetadataHeaders(options.metadata))
    })

    const response = await fetch(url, {
      method: 'POST',
      headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`S3 createMultipartUpload failed: ${response.statusText} - ${errorText}`)
    }

    const xml = await response.text()
    const uploadId = this.extractUploadId(xml)

    return {
      uploadId,
      bucket,
      key,
      parts: [],
      initiated: new Date()
    }
  }

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
  async uploadPart(
    bucket: string,
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer
  ): Promise<S3UploadPart> {
    const endpoint = this.buildEndpoint()
    const url = `${endpoint}/${bucket}/${key}?partNumber=${partNumber}&uploadId=${uploadId}`

    const headers = await this.buildAuthHeaders('PUT', bucket, key, {
      'Content-Length': body.length.toString()
    })

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: new Blob([new Uint8Array(body)])
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`S3 uploadPart failed: ${response.statusText} - ${errorText}`)
    }

    const etag = (response.headers.get('ETag') || '').replace(/"/g, '')

    return {
      partNumber,
      etag,
      size: body.length,
      lastModified: new Date()
    }
  }

  /**
   * Complete multipart upload
   *
   * @param bucket - Bucket name
   * @param key - Object key
   * @param uploadId - Upload ID
   * @param parts - Uploaded parts
   * @returns Upload result
   */
  async completeMultipartUpload(
    bucket: string,
    key: string,
    uploadId: string,
    parts: S3UploadPart[]
  ): Promise<S3UploadResult> {
    const endpoint = this.buildEndpoint()
    const url = `${endpoint}/${bucket}/${key}?uploadId=${uploadId}`

    // Build XML body
    const xml = this.buildCompleteMultipartUploadXML(parts)
    const body = Buffer.from(xml, 'utf-8')

    const headers = await this.buildAuthHeaders('POST', bucket, key, {
      'Content-Type': 'application/xml',
      'Content-Length': body.length.toString()
    })

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`S3 completeMultipartUpload failed: ${response.statusText} - ${errorText}`)
    }

    const etag = (response.headers.get('ETag') || '').replace(/"/g, '')
    const totalSize = parts.reduce((sum, part) => sum + part.size, 0)

    return {
      backend: StorageBackend.FILECOIN_IPFS,
      identifier: key,
      gatewayUrl: `${endpoint}/${bucket}/${key}`,
      size: totalSize,
      hash: this.calculateSHA256(body),
      timestamp: Date.now(),
      s3Key: key,
      bucket,
      region: this.config.region,
      etag
    }
  }

  /**
   * Abort multipart upload
   *
   * @param bucket - Bucket name
   * @param key - Object key
   * @param uploadId - Upload ID
   */
  async abortMultipartUpload(
    bucket: string,
    key: string,
    uploadId: string
  ): Promise<void> {
    const endpoint = this.buildEndpoint()
    const url = `${endpoint}/${bucket}/${key}?uploadId=${uploadId}`

    const headers = await this.buildAuthHeaders('DELETE', bucket, key)

    const response = await fetch(url, {
      method: 'DELETE',
      headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`S3 abortMultipartUpload failed: ${response.statusText} - ${errorText}`)
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Build endpoint URL
   */
  private buildEndpoint(): string {
    const protocol = this.config.useSSL !== false ? 'https' : 'http'
    const port = this.config.port || (this.config.useSSL !== false ? 443 : 80)
    const portSuffix = (port === 443 && this.config.useSSL !== false) || (port === 80 && this.config.useSSL === false) ? '' : `:${port}`
    return `${protocol}://${this.config.endpoint}${portSuffix}`
  }

  /**
   * Build AWS Signature V4 headers
   */
  private async buildAuthHeaders(
    method: string,
    bucket: string,
    key: string,
    additionalHeaders: Record<string, string> = {}
  ): Promise<Record<string, string>> {
    const host = this.config.endpoint
    const amzDate = this.getAmzDate()
    const dateStamp = amzDate.substring(0, 8)

    const headers: Record<string, string> = {
      'host': host,
      'x-amz-date': amzDate,
      ...additionalHeaders
    }

    // Build canonical request
    const canonicalUri = `/${bucket}/${key}`.replace(/\/+/g, '/')
    const canonicalQueryString = ''
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map(key => `${key.toLowerCase()}:${headers[key].trim()}`)
      .join('\n') + '\n'
    const signedHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase())
      .join(';')

    const payloadHash = 'UNSIGNED-PAYLOAD'

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n')

    // Build string to sign
    const credentialScope = `${dateStamp}/${this.config.region || 'us-east-1'}/s3/aws4_request`
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      this.sha256(canonicalRequest)
    ].join('\n')

    // Calculate signature
    const signingKey = this.getSignatureKey(
      this.config.secretAccessKey,
      dateStamp,
      this.config.region || 'us-east-1',
      's3'
    )
    const signature = createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex')

    // Build authorization header
    const authorizationHeader = [
      'AWS4-HMAC-SHA256',
      `Credential=${this.config.accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`
    ].join(' ')

    headers['Authorization'] = authorizationHeader

    return headers
  }

  /**
   * Get AMZ date (ISO 8601 format)
   */
  private getAmzDate(): string {
    return new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  }

  /**
   * Get credential scope
   */
  private getCredentialScope(): string {
    const dateStamp = this.getAmzDate().substring(0, 8)
    return `${dateStamp}/${this.config.region || 'us-east-1'}/s3/aws4_request`
  }

  /**
   * Build string to sign for presigned URL
   */
  private buildStringToSign(
    method: string,
    bucket: string,
    key: string,
    params: URLSearchParams
  ): string {
    const amzDate = this.getAmzDate()
    const dateStamp = amzDate.substring(0, 8)
    const credentialScope = `${dateStamp}/${this.config.region || 'us-east-1'}/s3/aws4_request`

    const canonicalUri = `/${bucket}/${key}`
    const canonicalQueryString = params.toString()
    const canonicalHeaders = `host:${this.config.endpoint}\n`
    const signedHeaders = 'host'
    const payloadHash = 'UNSIGNED-PAYLOAD'

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n')

    return [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      this.sha256(canonicalRequest)
    ].join('\n')
  }

  /**
   * Sign string using AWS Signature V4
   */
  private signString(stringToSign: string): string {
    const dateStamp = this.getAmzDate().substring(0, 8)
    const signingKey = this.getSignatureKey(
      this.config.secretAccessKey,
      dateStamp,
      this.config.region || 'us-east-1',
      's3'
    )
    return createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex')
  }

  /**
   * Get AWS Signature V4 signing key
   */
  private getSignatureKey(
    key: string,
    dateStamp: string,
    regionName: string,
    serviceName: string
  ): Buffer {
    const kDate = createHmac('sha256', 'AWS4' + key).update(dateStamp).digest()
    const kRegion = createHmac('sha256', kDate).update(regionName).digest()
    const kService = createHmac('sha256', kRegion).update(serviceName).digest()
    const kSigning = createHmac('sha256', kService).update('aws4_request').digest()
    return kSigning
  }

  /**
   * Calculate SHA256 hash
   */
  private sha256(data: string): string {
    return createHash('sha256').update(data).digest('hex')
  }

  /**
   * Calculate SHA256 hash of buffer
   */
  private calculateSHA256(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex')
  }

  /**
   * Build metadata headers (x-amz-meta-*)
   */
  private buildMetadataHeaders(metadata: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(metadata)) {
      headers[`x-amz-meta-${key.toLowerCase()}`] = value
    }
    return headers
  }

  /**
   * Extract metadata from response headers
   */
  private extractMetadata(headers: Headers): Record<string, string> | undefined {
    const metadata: Record<string, string> = {}
    headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('x-amz-meta-')) {
        const metaKey = key.substring('x-amz-meta-'.length)
        metadata[metaKey] = value
      }
    })
    return Object.keys(metadata).length > 0 ? metadata : undefined
  }

  /**
   * Parse S3 ListObjectsV2 XML response
   */
  private parseListObjectsResponse(xml: string): S3ListObjectsResult {
    // Simple XML parsing (production should use proper XML parser)
    const objects: S3Object[] = []
    const contentsRegex = /<Contents>(.*?)<\/Contents>/gs
    const matches = xml.matchAll(contentsRegex)

    for (const match of matches) {
      const content = match[1]
      const key = this.extractXMLValue(content, 'Key')
      const size = parseInt(this.extractXMLValue(content, 'Size') || '0', 10)
      const lastModified = new Date(this.extractXMLValue(content, 'LastModified') || Date.now())
      const etag = this.extractXMLValue(content, 'ETag')?.replace(/"/g, '') || ''
      const storageClass = this.extractXMLValue(content, 'StorageClass') as S3StorageClass

      if (key) {
        objects.push({
          key,
          size,
          lastModified,
          etag,
          storageClass
        })
      }
    }

    const isTruncated = this.extractXMLValue(xml, 'IsTruncated') === 'true'
    const nextContinuationToken = this.extractXMLValue(xml, 'NextContinuationToken')
    const keyCount = parseInt(this.extractXMLValue(xml, 'KeyCount') || '0', 10)

    return {
      objects,
      isTruncated,
      nextContinuationToken,
      keyCount
    }
  }

  /**
   * Extract value from XML string
   */
  private extractXMLValue(xml: string, tag: string): string | undefined {
    const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, 's')
    const match = xml.match(regex)
    return match ? match[1] : undefined
  }

  /**
   * Extract upload ID from XML response
   */
  private extractUploadId(xml: string): string {
    const uploadId = this.extractXMLValue(xml, 'UploadId')
    if (!uploadId) {
      throw new Error('Failed to extract UploadId from response')
    }
    return uploadId
  }

  /**
   * Build CompleteMultipartUpload XML body
   */
  private buildCompleteMultipartUploadXML(parts: S3UploadPart[]): string {
    const partXMLs = parts
      .map(part => `  <Part>\n    <PartNumber>${part.partNumber}</PartNumber>\n    <ETag>"${part.etag}"</ETag>\n  </Part>`)
      .join('\n')

    return `<CompleteMultipartUpload>\n${partXMLs}\n</CompleteMultipartUpload>`
  }
}
