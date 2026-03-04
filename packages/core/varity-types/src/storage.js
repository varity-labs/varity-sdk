/**
 * Varity Storage Types - Core Storage Infrastructure
 *
 * This module defines the complete type system for Varity's multi-backend storage architecture,
 * supporting Filecoin/IPFS, S3-compatible, GCS-compatible, and multi-tier storage strategies.
 *
 * Part of Varity's 3-layer encrypted storage architecture:
 * - Layer 1: Varity Internal (company docs, internal knowledge)
 * - Layer 2: Industry RAG (shared industry knowledge)
 * - Layer 3: Customer Data (private business data)
 */
/**
 * Storage layer for Varity's 3-layer architecture
 */
export var StorageLayer;
(function (StorageLayer) {
    /** Varity company documents and internal knowledge */
    StorageLayer["VARITY_INTERNAL"] = "varity-internal";
    /** Industry-specific RAG knowledge (shared across customers) */
    StorageLayer["INDUSTRY_RAG"] = "industry-rag";
    /** Customer-specific private data */
    StorageLayer["CUSTOMER_DATA"] = "customer-data";
})(StorageLayer || (StorageLayer = {}));
// ============================================================================
// Storage Backend Types
// ============================================================================
/**
 * Storage backend types supported by Varity
 */
export var StorageBackend;
(function (StorageBackend) {
    /** Filecoin/IPFS via Pinata API (current default) */
    StorageBackend["FILECOIN_IPFS"] = "filecoin-ipfs";
    /** Celestia Data Availability Layer */
    StorageBackend["CELESTIA"] = "celestia";
    /** S3-compatible storage (MinIO, AWS S3, etc.) */
    StorageBackend["S3_COMPATIBLE"] = "s3-compatible";
    /** Google Cloud Storage compatible */
    StorageBackend["GCS_COMPATIBLE"] = "gcs-compatible";
    /** Multi-tier storage with automatic tiering */
    StorageBackend["MULTI_TIER"] = "multi-tier";
})(StorageBackend || (StorageBackend = {}));
/**
 * Storage tier for multi-tier architecture
 * Balances access speed vs cost optimization
 */
export var StorageTier;
(function (StorageTier) {
    /** Fast access, higher cost (IPFS pinned, in-memory cache) */
    StorageTier["HOT"] = "hot";
    /** Moderate access, moderate cost (standard storage) */
    StorageTier["WARM"] = "warm";
    /** Infrequent access, lower cost (archive storage) */
    StorageTier["COLD"] = "cold";
    /** Long-term archive, lowest cost (deep archive) */
    StorageTier["GLACIER"] = "glacier";
})(StorageTier || (StorageTier = {}));
/**
 * Tiering policies
 */
export var TieringPolicy;
(function (TieringPolicy) {
    /** Based on object age */
    TieringPolicy["TIME_BASED"] = "time-based";
    /** Based on access frequency */
    TieringPolicy["ACCESS_BASED"] = "access-based";
    /** Based on object size */
    TieringPolicy["SIZE_BASED"] = "size-based";
    /** Cost optimization strategy */
    TieringPolicy["COST_OPTIMIZED"] = "cost-optimized";
    /** Custom policy */
    TieringPolicy["CUSTOM"] = "custom";
})(TieringPolicy || (TieringPolicy = {}));
// NOTE: Types are declared above and exported via interface/enum declarations
// No need for duplicate export statements at the end
//# sourceMappingURL=storage.js.map