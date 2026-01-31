/**
 * Varity SDK v1 - Core Type Definitions
 *
 * These types define the structure of data used across all SDK modules.
 * Based on ISO Dashboard backend implementation.
 */
// ============================================================================
// ISO Dashboard Types (Extracted from iso-dashboard-mvp)
// ============================================================================
// --- Merchant Types ---
export var MerchantStatus;
(function (MerchantStatus) {
    MerchantStatus["ACTIVE"] = "ACTIVE";
    MerchantStatus["INACTIVE"] = "INACTIVE";
    MerchantStatus["PROBLEMATIC"] = "PROBLEMATIC";
})(MerchantStatus || (MerchantStatus = {}));
// --- Transaction Types ---
export var TransactionType;
(function (TransactionType) {
    TransactionType["SALE"] = "SALE";
    TransactionType["REFUND"] = "REFUND";
    TransactionType["ADJUSTMENT"] = "ADJUSTMENT";
    TransactionType["FORECAST"] = "FORECAST";
})(TransactionType || (TransactionType = {}));
// --- Rep Types ---
export var RepStatus;
(function (RepStatus) {
    RepStatus["ACTIVE"] = "ACTIVE";
    RepStatus["INACTIVE"] = "INACTIVE";
    RepStatus["SUSPENDED"] = "SUSPENDED";
})(RepStatus || (RepStatus = {}));
// ============================================================================
// Shared Module Types (Universal across all templates)
// ============================================================================
// --- Storage Types ---
// NOTE: These types are being migrated to @varity/types/storage
// For backward compatibility, we re-export them here
export var StorageLayer;
(function (StorageLayer) {
    StorageLayer["VARITY_INTERNAL"] = "varity-internal";
    StorageLayer["INDUSTRY_RAG"] = "industry-rag";
    StorageLayer["CUSTOMER_DATA"] = "customer-data";
})(StorageLayer || (StorageLayer = {}));
// --- Access Control Types ---
export var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN_ROLE";
    Role["MANAGER"] = "MANAGER_ROLE";
    Role["REP"] = "REP_ROLE";
    Role["MERCHANT"] = "MERCHANT_ROLE";
    Role["SYSTEM"] = "SYSTEM_ROLE";
})(Role || (Role = {}));
//# sourceMappingURL=types.js.map