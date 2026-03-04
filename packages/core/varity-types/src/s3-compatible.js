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
// ============================================================================
// S3 Storage Classes
// ============================================================================
/**
 * S3 storage classes
 */
export var S3StorageClass;
(function (S3StorageClass) {
    /** Standard storage (frequent access) */
    S3StorageClass["STANDARD"] = "STANDARD";
    /** Reduced redundancy (deprecated) */
    S3StorageClass["REDUCED_REDUNDANCY"] = "REDUCED_REDUNDANCY";
    /** Infrequent access */
    S3StorageClass["STANDARD_IA"] = "STANDARD_IA";
    /** One zone infrequent access */
    S3StorageClass["ONEZONE_IA"] = "ONEZONE_IA";
    /** Intelligent tiering */
    S3StorageClass["INTELLIGENT_TIERING"] = "INTELLIGENT_TIERING";
    /** Glacier instant retrieval */
    S3StorageClass["GLACIER_IR"] = "GLACIER_IR";
    /** Glacier flexible retrieval */
    S3StorageClass["GLACIER"] = "GLACIER";
    /** Glacier deep archive */
    S3StorageClass["DEEP_ARCHIVE"] = "DEEP_ARCHIVE";
    /** Outposts */
    S3StorageClass["OUTPOSTS"] = "OUTPOSTS";
    /** Express One Zone */
    S3StorageClass["EXPRESS_ONEZONE"] = "EXPRESS_ONEZONE";
})(S3StorageClass || (S3StorageClass = {}));
// ============================================================================
// S3 Access Control
// ============================================================================
/**
 * S3 canned ACLs
 */
export var S3ACL;
(function (S3ACL) {
    /** Owner gets full control */
    S3ACL["PRIVATE"] = "private";
    /** Owner gets full control, public gets read */
    S3ACL["PUBLIC_READ"] = "public-read";
    /** Owner gets full control, public gets read and write */
    S3ACL["PUBLIC_READ_WRITE"] = "public-read-write";
    /** Owner gets full control, authenticated users get read */
    S3ACL["AUTHENTICATED_READ"] = "authenticated-read";
    /** Object owner gets full control, bucket owner gets read */
    S3ACL["BUCKET_OWNER_READ"] = "bucket-owner-read";
    /** Object owner and bucket owner get full control */
    S3ACL["BUCKET_OWNER_FULL_CONTROL"] = "bucket-owner-full-control";
    /** Log delivery write permission */
    S3ACL["LOG_DELIVERY_WRITE"] = "log-delivery-write";
})(S3ACL || (S3ACL = {}));
// NOTE: Types are declared above and exported via interface/enum declarations
//# sourceMappingURL=s3-compatible.js.map