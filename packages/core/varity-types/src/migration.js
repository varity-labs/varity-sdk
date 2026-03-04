/**
 * Varity Storage Migration Types
 *
 * Type definitions for migrating data from traditional cloud storage
 * (AWS S3, GCP GCS, Azure Blob) to Varity's decentralized storage architecture.
 *
 * Supports:
 * - Batch migration jobs
 * - Progress tracking
 * - Error handling and retry logic
 * - Integrity verification
 * - Migration from multiple sources
 */
// ============================================================================
// Migration Job Status
// ============================================================================
/**
 * Migration job lifecycle status
 */
export var MigrationStatus;
(function (MigrationStatus) {
    /** Job created but not started */
    MigrationStatus["PENDING"] = "pending";
    /** Job is currently running */
    MigrationStatus["RUNNING"] = "running";
    /** Job is temporarily paused */
    MigrationStatus["PAUSED"] = "paused";
    /** Job completed successfully */
    MigrationStatus["COMPLETED"] = "completed";
    /** Job failed with errors */
    MigrationStatus["FAILED"] = "failed";
    /** Job was cancelled by user */
    MigrationStatus["CANCELLED"] = "cancelled";
    /** Job is being validated */
    MigrationStatus["VALIDATING"] = "validating";
    /** Job is in retry state */
    MigrationStatus["RETRYING"] = "retrying";
})(MigrationStatus || (MigrationStatus = {}));
/**
 * Migration phase
 */
export var MigrationPhase;
(function (MigrationPhase) {
    /** Discovering objects to migrate */
    MigrationPhase["DISCOVERY"] = "discovery";
    /** Transferring data */
    MigrationPhase["TRANSFER"] = "transfer";
    /** Verifying integrity */
    MigrationPhase["VERIFICATION"] = "verification";
    /** Cleaning up source (if configured) */
    MigrationPhase["CLEANUP"] = "cleanup";
    /** Completed */
    MigrationPhase["DONE"] = "done";
})(MigrationPhase || (MigrationPhase = {}));
// ============================================================================
// Migration Sources and Targets
// ============================================================================
/**
 * Migration source types
 */
export var MigrationSource;
(function (MigrationSource) {
    /** AWS S3 */
    MigrationSource["AWS_S3"] = "aws-s3";
    /** Google Cloud Storage */
    MigrationSource["GCP_GCS"] = "gcp-gcs";
    /** Azure Blob Storage */
    MigrationSource["AZURE_BLOB"] = "azure-blob";
    /** Local filesystem */
    MigrationSource["LOCAL_FILESYSTEM"] = "local-filesystem";
    /** HTTP/HTTPS URLs */
    MigrationSource["HTTP"] = "http";
    /** FTP/SFTP */
    MigrationSource["FTP"] = "ftp";
    /** Another Varity storage layer */
    MigrationSource["VARITY"] = "varity";
})(MigrationSource || (MigrationSource = {}));
/**
 * Migration target (always Varity)
 */
export var MigrationTarget;
(function (MigrationTarget) {
    /** Varity Filecoin/IPFS storage */
    MigrationTarget["VARITY_FILECOIN"] = "varity-filecoin";
    /** Varity S3-compatible storage */
    MigrationTarget["VARITY_S3_COMPATIBLE"] = "varity-s3-compatible";
    /** Varity GCS-compatible storage */
    MigrationTarget["VARITY_GCS_COMPATIBLE"] = "varity-gcs-compatible";
})(MigrationTarget || (MigrationTarget = {}));
// NOTE: Types are declared above and exported via interface/enum declarations
//# sourceMappingURL=migration.js.map