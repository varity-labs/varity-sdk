/**
 * Varity GCS-Compatible Storage Types
 *
 * Type definitions for Google Cloud Storage compatible backends including:
 * - Google Cloud Storage (GCS)
 * - GCS-compatible APIs
 * - Migration from GCS to Varity
 */
import { StorageResult } from './storage';
/**
 * Google Cloud Storage compatible configuration
 */
export interface GCSCompatibleConfig {
    /** GCS endpoint (default: 'storage.googleapis.com') */
    endpoint?: string;
    /** Google Cloud project ID */
    projectId: string;
    /** Authentication credentials */
    credentials: GCSCredentials;
    /** Default bucket name */
    bucket: string;
    /** API endpoint override */
    apiEndpoint?: string;
    /** Custom user agent */
    userAgent?: string;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Retry configuration */
    retry?: {
        maxRetries: number;
        initialDelayMs: number;
        maxDelayMs: number;
    };
}
/**
 * GCS authentication credentials
 */
export interface GCSCredentials {
    /** Credential type */
    type: 'service_account' | 'oauth2' | 'api_key' | 'external_account';
    /** Service account email */
    clientEmail?: string;
    /** Service account private key (PEM format) */
    privateKey?: string;
    /** Private key ID */
    privateKeyId?: string;
    /** OAuth2 access token */
    accessToken?: string;
    /** OAuth2 refresh token */
    refreshToken?: string;
    /** OAuth2 client ID */
    clientId?: string;
    /** OAuth2 client secret */
    clientSecret?: string;
    /** Token expiry timestamp */
    expiryDate?: number;
    /** API key (for public access) */
    apiKey?: string;
    /** External account configuration */
    externalAccount?: GCSExternalAccountConfig;
}
/**
 * GCS external account configuration (workload identity federation)
 */
export interface GCSExternalAccountConfig {
    /** Audience */
    audience: string;
    /** Subject token type */
    subjectTokenType: string;
    /** Token URL */
    tokenUrl: string;
    /** Service account impersonation URL */
    serviceAccountImpersonationUrl?: string;
    /** Credential source */
    credentialSource: {
        file?: string;
        url?: string;
        headers?: Record<string, string>;
        format?: {
            type: 'json' | 'text';
            subjectTokenFieldName?: string;
        };
    };
}
/**
 * GCS upload result
 */
export interface GCSUploadResult extends StorageResult {
    /** Object name in GCS */
    gcsName: string;
    /** Bucket name */
    bucket: string;
    /** Object generation (version) */
    generation: string;
    /** Metadata generation */
    metageneration: string;
    /** Content type */
    contentType: string;
    /** MD5 hash (base64) */
    md5Hash: string;
    /** CRC32C checksum (base64) */
    crc32c: string;
    /** Storage class */
    storageClass?: GCSStorageClass;
    /** Time created */
    timeCreated: Date;
    /** Time updated */
    updated: Date;
    /** KMS key name (if encrypted) */
    kmsKeyName?: string;
    /** Customer-supplied encryption key SHA256 */
    customerEncryption?: {
        encryptionAlgorithm: string;
        keySha256: string;
    };
}
/**
 * GCS resumable upload session
 */
export interface GCSResumableUpload {
    /** Resumable upload session URI */
    sessionUri: string;
    /** Bucket name */
    bucket: string;
    /** Object name */
    name: string;
    /** Bytes uploaded so far */
    uploadedBytes: number;
    /** Total bytes (if known) */
    totalBytes?: number;
    /** Upload ID */
    uploadId: string;
    /** Expiration time */
    expiresAt?: Date;
}
/**
 * Options for GCS resumable upload
 */
export interface GCSResumableUploadOptions {
    /** Chunk size in bytes (must be multiple of 256KB) */
    chunkSize?: number;
    /** Content type */
    contentType?: string;
    /** Metadata */
    metadata?: Record<string, string>;
    /** Predefined ACL */
    predefinedAcl?: GCSPredefinedACL;
    /** Storage class */
    storageClass?: GCSStorageClass;
    /** Customer-supplied encryption key */
    encryptionKey?: any;
    /** KMS key name */
    kmsKeyName?: string;
    /** Generation match precondition */
    ifGenerationMatch?: string;
    /** Metageneration match precondition */
    ifMetagenerationMatch?: string;
}
/**
 * GCS list objects response
 */
export interface GCSListObjectsResult {
    /** Array of objects */
    items: GCSObject[];
    /** Next page token */
    nextPageToken?: string;
    /** Prefixes (for delimiter-based listing) */
    prefixes?: string[];
    /** Kind (always 'storage#objects') */
    kind: string;
}
/**
 * GCS object metadata
 */
export interface GCSObject {
    /** Object name */
    name: string;
    /** Bucket name */
    bucket: string;
    /** Object generation */
    generation: string;
    /** Metadata generation */
    metageneration: string;
    /** Size in bytes (as string) */
    size: string;
    /** Content type */
    contentType: string;
    /** Time created */
    timeCreated: Date;
    /** Time updated */
    updated: Date;
    /** Time deleted (if soft-deleted) */
    timeDeleted?: Date;
    /** MD5 hash (base64) */
    md5Hash: string;
    /** CRC32C checksum (base64) */
    crc32c: string;
    /** ETag */
    etag: string;
    /** Storage class */
    storageClass: GCSStorageClass;
    /** Owner */
    owner?: {
        entity: string;
        entityId: string;
    };
    /** Custom metadata */
    metadata?: Record<string, string>;
    /** ACL */
    acl?: GCSObjectAccessControl[];
    /** Content encoding */
    contentEncoding?: string;
    /** Content disposition */
    contentDisposition?: string;
    /** Content language */
    contentLanguage?: string;
    /** Cache control */
    cacheControl?: string;
    /** Custom time */
    customTime?: Date;
    /** Event-based hold */
    eventBasedHold?: boolean;
    /** Temporary hold */
    temporaryHold?: boolean;
    /** Retention expiration time */
    retentionExpirationTime?: Date;
    /** KMS key name */
    kmsKeyName?: string;
    /** Customer encryption */
    customerEncryption?: {
        encryptionAlgorithm: string;
        keySha256: string;
    };
}
/**
 * GCS object access control
 */
export interface GCSObjectAccessControl {
    /** Kind */
    kind: string;
    /** Entity */
    entity: string;
    /** Role */
    role: 'OWNER' | 'READER' | 'WRITER';
    /** Email */
    email?: string;
    /** Entity ID */
    entityId?: string;
    /** Domain */
    domain?: string;
    /** Project team */
    projectTeam?: {
        projectNumber: string;
        team: string;
    };
    /** ETag */
    etag?: string;
}
/**
 * GCS bucket metadata
 */
export interface GCSBucket {
    /** Bucket name */
    name: string;
    /** Bucket location */
    location: string;
    /** Storage class */
    storageClass: GCSStorageClass;
    /** Time created */
    timeCreated: Date;
    /** Time updated */
    updated: Date;
    /** Project number */
    projectNumber: string;
    /** Metageneration */
    metageneration: string;
    /** ETag */
    etag: string;
    /** Labels */
    labels?: Record<string, string>;
    /** Lifecycle configuration */
    lifecycle?: GCSBucketLifecycle;
    /** CORS configuration */
    cors?: GCSCORSConfiguration[];
    /** Default event-based hold */
    defaultEventBasedHold?: boolean;
    /** Retention policy */
    retentionPolicy?: GCSRetentionPolicy;
    /** Versioning */
    versioning?: {
        enabled: boolean;
    };
    /** Website configuration */
    website?: {
        mainPageSuffix?: string;
        notFoundPage?: string;
    };
    /** Logging */
    logging?: {
        logBucket: string;
        logObjectPrefix: string;
    };
    /** Encryption */
    encryption?: {
        defaultKmsKeyName: string;
    };
    /** IAM configuration */
    iamConfiguration?: {
        uniformBucketLevelAccess?: {
            enabled: boolean;
            lockedTime?: Date;
        };
        publicAccessPrevention?: 'enforced' | 'inherited';
    };
}
/**
 * GCS bucket lifecycle configuration
 */
export interface GCSBucketLifecycle {
    /** Lifecycle rules */
    rule: GCSLifecycleRule[];
}
/**
 * GCS lifecycle rule
 */
export interface GCSLifecycleRule {
    /** Action */
    action: {
        type: 'Delete' | 'SetStorageClass' | 'AbortIncompleteMultipartUpload';
        storageClass?: GCSStorageClass;
    };
    /** Condition */
    condition: {
        age?: number;
        createdBefore?: string;
        customTimeBefore?: string;
        daysSinceCustomTime?: number;
        daysSinceNoncurrentTime?: number;
        isLive?: boolean;
        matchesPrefix?: string[];
        matchesSuffix?: string[];
        matchesStorageClass?: GCSStorageClass[];
        noncurrentTimeBefore?: string;
        numNewerVersions?: number;
    };
}
/**
 * GCS retention policy
 */
export interface GCSRetentionPolicy {
    /** Retention period in seconds */
    retentionPeriod: string;
    /** Effective time */
    effectiveTime: Date;
    /** Is locked */
    isLocked: boolean;
}
/**
 * GCS storage classes
 */
export declare enum GCSStorageClass {
    /** Standard storage */
    STANDARD = "STANDARD",
    /** Nearline storage (30-day minimum) */
    NEARLINE = "NEARLINE",
    /** Coldline storage (90-day minimum) */
    COLDLINE = "COLDLINE",
    /** Archive storage (365-day minimum) */
    ARCHIVE = "ARCHIVE",
    /** Durable reduced availability (deprecated) */
    DURABLE_REDUCED_AVAILABILITY = "DURABLE_REDUCED_AVAILABILITY"
}
/**
 * GCS predefined ACLs
 */
export declare enum GCSPredefinedACL {
    /** Owner gets full control */
    PRIVATE = "private",
    /** Owner gets full control, all users get read */
    PUBLIC_READ = "publicRead",
    /** Owner gets full control, all users get read and write */
    PUBLIC_READ_WRITE = "publicReadWrite",
    /** Owner gets full control, authenticated users get read */
    AUTHENTICATED_READ = "authenticatedRead",
    /** Object owner gets full control, bucket owner gets read */
    BUCKET_OWNER_READ = "bucketOwnerRead",
    /** Object owner and bucket owner get full control */
    BUCKET_OWNER_FULL_CONTROL = "bucketOwnerFullControl",
    /** Project team owners get full control */
    PROJECT_PRIVATE = "projectPrivate"
}
/**
 * GCS bucket ACL
 */
export interface GCSBucketAccessControl {
    /** Kind */
    kind: string;
    /** Entity */
    entity: string;
    /** Role */
    role: 'OWNER' | 'READER' | 'WRITER';
    /** Email */
    email?: string;
    /** Entity ID */
    entityId?: string;
    /** Domain */
    domain?: string;
    /** Project team */
    projectTeam?: {
        projectNumber: string;
        team: string;
    };
    /** ETag */
    etag?: string;
}
/**
 * GCS CORS configuration
 */
export interface GCSCORSConfiguration {
    /** Max age in seconds */
    maxAgeSeconds?: number;
    /** Allowed methods */
    method?: string[];
    /** Allowed origins */
    origin?: string[];
    /** Response headers */
    responseHeader?: string[];
}
/**
 * Options for generating signed URLs
 */
export interface GCSSignedUrlOptions {
    /** Expiration time */
    expires: Date | number;
    /** HTTP method */
    method?: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'HEAD';
    /** Content type */
    contentType?: string;
    /** Content MD5 */
    contentMd5?: string;
    /** Extension headers */
    extensionHeaders?: Record<string, string>;
    /** Query parameters */
    queryParams?: Record<string, string>;
    /** Version (v2 or v4) */
    version?: 'v2' | 'v4';
    /** Virtual hosted style */
    virtualHostedStyle?: boolean;
    /** Bucket-bound hostname */
    bucketBoundHostname?: string;
}
/**
 * Signed URL result
 */
export interface GCSSignedUrl {
    /** Signed URL */
    url: string;
    /** Expiration timestamp */
    expiresAt: Date;
    /** HTTP method */
    method: string;
}
/**
 * GCS notification configuration
 */
export interface GCSNotification {
    /** Notification ID */
    id: string;
    /** Topic (Pub/Sub topic) */
    topic: string;
    /** Event types */
    event_types?: string[];
    /** Custom attributes */
    custom_attributes?: Record<string, string>;
    /** Object name prefix */
    object_name_prefix?: string;
    /** Payload format */
    payload_format?: 'JSON_API_V1' | 'NONE';
    /** ETag */
    etag?: string;
}
/**
 * GCS customer-supplied encryption key
 */
export interface GCSCustomerEncryption {
    /** Encryption algorithm */
    encryptionAlgorithm: 'AES256';
    /** Base64-encoded encryption key */
    key: string;
    /** Base64-encoded SHA256 of the key */
    keySha256: string;
}
/**
 * GCS KMS encryption
 */
export interface GCSKMSEncryption {
    /** KMS key name */
    kmsKeyName: string;
}
//# sourceMappingURL=gcs-compatible.d.ts.map