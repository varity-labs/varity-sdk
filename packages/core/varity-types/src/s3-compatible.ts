/**
 * Varity S3-Compatible Storage Types
 *
 * Type definitions for S3-compatible storage backends including:
 * - AWS S3
 * - MinIO
 * - DigitalOcean Spaces
 * - Cloudflare R2
 * - Any S3-API compatible storage
 */

import { StorageResult, StorageBackend, StorageTier } from './storage'

// ============================================================================
// S3 Configuration
// ============================================================================

/**
 * S3-compatible storage configuration
 */
export interface S3CompatibleConfig {
  /** S3 endpoint (e.g., 's3.varity.io', 's3.amazonaws.com', 'minio.example.com:9000') */
  endpoint: string

  /** AWS access key ID or equivalent */
  accessKeyId: string

  /** AWS secret access key or equivalent */
  secretAccessKey: string

  /** AWS region (e.g., 'us-east-1') */
  region?: string

  /** Default bucket name */
  bucket: string

  /** Use SSL/TLS for connections */
  useSSL?: boolean

  /** Custom port (default: 443 for SSL, 80 for non-SSL) */
  port?: number

  /** Use path-style addressing (true for MinIO, false for AWS S3) */
  pathStyle?: boolean

  /** Session token (for temporary credentials) */
  sessionToken?: string

  /** Force path style (override auto-detection) */
  forcePathStyle?: boolean

  /** S3 accelerate endpoint */
  useAccelerateEndpoint?: boolean

  /** Custom user agent */
  userAgent?: string

  /** Request timeout in milliseconds */
  timeout?: number
}

// ============================================================================
// S3 Upload Types
// ============================================================================

/**
 * S3 upload result with S3-specific metadata
 */
export interface S3UploadResult extends StorageResult {
  /** S3 object key */
  s3Key: string

  /** Bucket name */
  bucket: string

  /** AWS region */
  region?: string

  /** ETag returned by S3 */
  etag: string

  /** Version ID (if versioning enabled) */
  versionId?: string

  /** Server-side encryption method */
  serverSideEncryption?: 'AES256' | 'aws:kms' | 'aws:kms:dsse'

  /** KMS key ID (if using KMS encryption) */
  kmsKeyId?: string

  /** Expiration rule ID (if lifecycle policy applies) */
  expiration?: string

  /** Storage class used */
  storageClass?: S3StorageClass
}

/**
 * S3 multipart upload session
 */
export interface S3MultipartUpload {
  /** Upload ID from S3 */
  uploadId: string

  /** Bucket name */
  bucket: string

  /** Object key */
  key: string

  /** Uploaded parts */
  parts: S3UploadPart[]

  /** Upload initiated timestamp */
  initiated: Date

  /** Initiator information */
  initiator?: {
    id: string
    displayName: string
  }
}

/**
 * S3 multipart upload part
 */
export interface S3UploadPart {
  /** Part number (1-10000) */
  partNumber: number

  /** ETag for this part */
  etag: string

  /** Part size in bytes */
  size: number

  /** Last modified timestamp */
  lastModified?: Date
}

/**
 * Options for S3 multipart upload
 */
export interface S3MultipartUploadOptions {
  /** Part size in bytes (default: 5MB, min: 5MB, max: 5GB) */
  partSize?: number

  /** Number of concurrent part uploads */
  concurrency?: number

  /** Whether to leave incomplete upload on error */
  leavePartsOnError?: boolean

  /** Server-side encryption */
  serverSideEncryption?: 'AES256' | 'aws:kms'

  /** KMS key ID (if using KMS) */
  kmsKeyId?: string

  /** Storage class */
  storageClass?: S3StorageClass

  /** Metadata */
  metadata?: Record<string, string>

  /** Tags */
  tags?: Record<string, string>
}

// ============================================================================
// S3 List Operations
// ============================================================================

/**
 * S3 list objects response
 */
export interface S3ListObjectsResult {
  /** Array of objects */
  objects: S3Object[]

  /** Whether results are truncated */
  isTruncated: boolean

  /** Continuation token for next page */
  continuationToken?: string

  /** Next continuation token */
  nextContinuationToken?: string

  /** Common prefixes (for delimiter-based listing) */
  commonPrefixes?: string[]

  /** Key count */
  keyCount?: number

  /** Max keys requested */
  maxKeys?: number

  /** Prefix used in request */
  prefix?: string

  /** Delimiter used in request */
  delimiter?: string
}

/**
 * S3 object metadata
 */
export interface S3Object {
  /** Object key */
  key: string

  /** Size in bytes */
  size: number

  /** Last modified timestamp */
  lastModified: Date

  /** ETag */
  etag: string

  /** Storage class */
  storageClass?: S3StorageClass

  /** Owner information */
  owner?: {
    id: string
    displayName: string
  }

  /** Checksum algorithm */
  checksumAlgorithm?: 'CRC32' | 'CRC32C' | 'SHA1' | 'SHA256'

  /** Restore status (for archived objects) */
  restoreStatus?: S3RestoreStatus
}

/**
 * S3 object restore status
 */
export interface S3RestoreStatus {
  /** Whether restore is in progress */
  isRestoreInProgress: boolean

  /** Restore expiry date */
  restoreExpiryDate?: Date
}

// ============================================================================
// S3 Bucket Operations
// ============================================================================

/**
 * S3 bucket configuration
 */
export interface S3Bucket {
  /** Bucket name */
  name: string

  /** Creation date */
  creationDate: Date

  /** AWS region */
  region?: string

  /** Bucket location constraint */
  locationConstraint?: string
}

/**
 * S3 bucket versioning configuration
 */
export interface S3BucketVersioning {
  /** Versioning status */
  status: 'Enabled' | 'Suspended'

  /** MFA delete status */
  mfaDelete?: 'Enabled' | 'Disabled'
}

/**
 * S3 bucket lifecycle rule
 */
export interface S3LifecycleRule {
  /** Rule ID */
  id: string

  /** Rule status */
  status: 'Enabled' | 'Disabled'

  /** Object key prefix filter */
  prefix?: string

  /** Tag filters */
  tags?: Record<string, string>

  /** Transitions between storage classes */
  transitions?: S3Transition[]

  /** Expiration configuration */
  expiration?: S3Expiration

  /** Non-current version transitions */
  noncurrentVersionTransitions?: S3NoncurrentVersionTransition[]

  /** Non-current version expiration */
  noncurrentVersionExpiration?: S3NoncurrentVersionExpiration

  /** Abort incomplete multipart upload */
  abortIncompleteMultipartUpload?: {
    daysAfterInitiation: number
  }
}

/**
 * S3 storage class transition
 */
export interface S3Transition {
  /** Days after object creation */
  days?: number

  /** Specific date */
  date?: Date

  /** Target storage class */
  storageClass: S3StorageClass
}

/**
 * S3 object expiration
 */
export interface S3Expiration {
  /** Days after object creation */
  days?: number

  /** Specific date */
  date?: Date

  /** Expire delete markers */
  expiredObjectDeleteMarker?: boolean
}

/**
 * S3 non-current version transition
 */
export interface S3NoncurrentVersionTransition {
  /** Days after becoming non-current */
  noncurrentDays: number

  /** Target storage class */
  storageClass: S3StorageClass

  /** Newer versions to retain */
  newerNoncurrentVersions?: number
}

/**
 * S3 non-current version expiration
 */
export interface S3NoncurrentVersionExpiration {
  /** Days after becoming non-current */
  noncurrentDays: number

  /** Newer versions to retain */
  newerNoncurrentVersions?: number
}

// ============================================================================
// S3 Storage Classes
// ============================================================================

/**
 * S3 storage classes
 */
export enum S3StorageClass {
  /** Standard storage (frequent access) */
  STANDARD = 'STANDARD',

  /** Reduced redundancy (deprecated) */
  REDUCED_REDUNDANCY = 'REDUCED_REDUNDANCY',

  /** Infrequent access */
  STANDARD_IA = 'STANDARD_IA',

  /** One zone infrequent access */
  ONEZONE_IA = 'ONEZONE_IA',

  /** Intelligent tiering */
  INTELLIGENT_TIERING = 'INTELLIGENT_TIERING',

  /** Glacier instant retrieval */
  GLACIER_IR = 'GLACIER_IR',

  /** Glacier flexible retrieval */
  GLACIER = 'GLACIER',

  /** Glacier deep archive */
  DEEP_ARCHIVE = 'DEEP_ARCHIVE',

  /** Outposts */
  OUTPOSTS = 'OUTPOSTS',

  /** Express One Zone */
  EXPRESS_ONEZONE = 'EXPRESS_ONEZONE'
}

// ============================================================================
// S3 Access Control
// ============================================================================

/**
 * S3 canned ACLs
 */
export enum S3ACL {
  /** Owner gets full control */
  PRIVATE = 'private',

  /** Owner gets full control, public gets read */
  PUBLIC_READ = 'public-read',

  /** Owner gets full control, public gets read and write */
  PUBLIC_READ_WRITE = 'public-read-write',

  /** Owner gets full control, authenticated users get read */
  AUTHENTICATED_READ = 'authenticated-read',

  /** Object owner gets full control, bucket owner gets read */
  BUCKET_OWNER_READ = 'bucket-owner-read',

  /** Object owner and bucket owner get full control */
  BUCKET_OWNER_FULL_CONTROL = 'bucket-owner-full-control',

  /** Log delivery write permission */
  LOG_DELIVERY_WRITE = 'log-delivery-write'
}

/**
 * S3 bucket policy
 */
export interface S3BucketPolicy {
  /** Policy version */
  version: string

  /** Policy ID */
  id?: string

  /** Policy statements */
  statements: S3PolicyStatement[]
}

/**
 * S3 policy statement
 */
export interface S3PolicyStatement {
  /** Statement ID */
  sid?: string

  /** Effect (Allow or Deny) */
  effect: 'Allow' | 'Deny'

  /** Principal (user/role/service) */
  principal: string | string[] | { [key: string]: string | string[] }

  /** Action(s) */
  action: string | string[]

  /** Resource(s) */
  resource: string | string[]

  /** Condition */
  condition?: Record<string, Record<string, string | string[]>>
}

// ============================================================================
// S3 CORS Configuration
// ============================================================================

/**
 * S3 CORS configuration
 */
export interface S3CORSConfiguration {
  /** CORS rules */
  corsRules: S3CORSRule[]
}

/**
 * S3 CORS rule
 */
export interface S3CORSRule {
  /** Allowed origins */
  allowedOrigins: string[]

  /** Allowed methods */
  allowedMethods: ('GET' | 'PUT' | 'POST' | 'DELETE' | 'HEAD')[]

  /** Allowed headers */
  allowedHeaders?: string[]

  /** Exposed headers */
  exposeHeaders?: string[]

  /** Max age in seconds */
  maxAgeSeconds?: number
}

// ============================================================================
// S3 Presigned URLs
// ============================================================================

/**
 * Options for generating presigned URLs
 */
export interface S3PresignedUrlOptions {
  /** Expiration time in seconds */
  expiresIn: number

  /** HTTP method */
  method?: 'GET' | 'PUT' | 'DELETE' | 'HEAD'

  /** Response headers to override */
  responseHeaders?: {
    contentType?: string
    contentDisposition?: string
    cacheControl?: string
    contentEncoding?: string
    contentLanguage?: string
    expires?: Date
  }

  /** Request headers (for PUT) */
  requestHeaders?: Record<string, string>

  /** Version ID (for versioned objects) */
  versionId?: string
}

/**
 * Presigned URL result
 */
export interface S3PresignedUrl {
  /** Presigned URL */
  url: string

  /** Expiration timestamp */
  expiresAt: Date

  /** HTTP method */
  method: string

  /** Headers to include in request */
  headers?: Record<string, string>
}

// ============================================================================
// S3 Server-Side Encryption
// ============================================================================

/**
 * Server-side encryption configuration
 */
export interface S3ServerSideEncryption {
  /** Encryption type */
  type: 'AES256' | 'aws:kms' | 'aws:kms:dsse'

  /** KMS key ID (for KMS encryption) */
  kmsKeyId?: string

  /** KMS encryption context */
  kmsEncryptionContext?: Record<string, string>

  /** Bucket key enabled */
  bucketKeyEnabled?: boolean
}

// ============================================================================
// S3 Object Lock
// ============================================================================

/**
 * S3 object lock configuration
 */
export interface S3ObjectLock {
  /** Lock mode */
  mode: 'GOVERNANCE' | 'COMPLIANCE'

  /** Retain until date */
  retainUntilDate?: Date

  /** Legal hold */
  legalHold?: 'ON' | 'OFF'
}

// ============================================================================
// S3 Replication
// ============================================================================

/**
 * S3 replication configuration
 */
export interface S3ReplicationConfiguration {
  /** IAM role ARN */
  role: string

  /** Replication rules */
  rules: S3ReplicationRule[]
}

/**
 * S3 replication rule
 */
export interface S3ReplicationRule {
  /** Rule ID */
  id?: string

  /** Priority */
  priority?: number

  /** Rule status */
  status: 'Enabled' | 'Disabled'

  /** Prefix filter */
  prefix?: string

  /** Tag filters */
  tags?: Record<string, string>

  /** Destination configuration */
  destination: S3ReplicationDestination

  /** Delete marker replication */
  deleteMarkerReplication?: {
    status: 'Enabled' | 'Disabled'
  }
}

/**
 * S3 replication destination
 */
export interface S3ReplicationDestination {
  /** Destination bucket ARN */
  bucket: string

  /** Storage class */
  storageClass?: S3StorageClass

  /** Replication time control */
  replicationTime?: {
    status: 'Enabled' | 'Disabled'
    time: {
      minutes: number
    }
  }

  /** Metrics */
  metrics?: {
    status: 'Enabled' | 'Disabled'
    eventThreshold: {
      minutes: number
    }
  }
}

// NOTE: Types are declared above and exported via interface/enum declarations
