/**
 * Varity GCS-Compatible Storage Types
 *
 * Type definitions for Google Cloud Storage compatible backends including:
 * - Google Cloud Storage (GCS)
 * - GCS-compatible APIs
 * - Migration from GCS to Varity
 */
// ============================================================================
// GCS Storage Classes
// ============================================================================
/**
 * GCS storage classes
 */
export var GCSStorageClass;
(function (GCSStorageClass) {
    /** Standard storage */
    GCSStorageClass["STANDARD"] = "STANDARD";
    /** Nearline storage (30-day minimum) */
    GCSStorageClass["NEARLINE"] = "NEARLINE";
    /** Coldline storage (90-day minimum) */
    GCSStorageClass["COLDLINE"] = "COLDLINE";
    /** Archive storage (365-day minimum) */
    GCSStorageClass["ARCHIVE"] = "ARCHIVE";
    /** Durable reduced availability (deprecated) */
    GCSStorageClass["DURABLE_REDUCED_AVAILABILITY"] = "DURABLE_REDUCED_AVAILABILITY";
})(GCSStorageClass || (GCSStorageClass = {}));
// ============================================================================
// GCS Access Control
// ============================================================================
/**
 * GCS predefined ACLs
 */
export var GCSPredefinedACL;
(function (GCSPredefinedACL) {
    /** Owner gets full control */
    GCSPredefinedACL["PRIVATE"] = "private";
    /** Owner gets full control, all users get read */
    GCSPredefinedACL["PUBLIC_READ"] = "publicRead";
    /** Owner gets full control, all users get read and write */
    GCSPredefinedACL["PUBLIC_READ_WRITE"] = "publicReadWrite";
    /** Owner gets full control, authenticated users get read */
    GCSPredefinedACL["AUTHENTICATED_READ"] = "authenticatedRead";
    /** Object owner gets full control, bucket owner gets read */
    GCSPredefinedACL["BUCKET_OWNER_READ"] = "bucketOwnerRead";
    /** Object owner and bucket owner get full control */
    GCSPredefinedACL["BUCKET_OWNER_FULL_CONTROL"] = "bucketOwnerFullControl";
    /** Project team owners get full control */
    GCSPredefinedACL["PROJECT_PRIVATE"] = "projectPrivate";
})(GCSPredefinedACL || (GCSPredefinedACL = {}));
// NOTE: Types are declared above and exported via interface/enum declarations
//# sourceMappingURL=gcs-compatible.js.map