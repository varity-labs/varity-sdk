/**
 * Varity SDK v1 - Core Type Definitions
 *
 * These types define the structure of data used across all SDK modules.
 * Based on ISO Dashboard backend implementation.
 */

// ============================================================================
// Import Storage Types from @varity-labs/types
// ============================================================================

// Import storage backend types
import type {
  StorageBackend,
  MultiTierStorageConfig,
  S3CompatibleConfig,
  GCSCompatibleConfig
} from '@varity-labs/types'

// Re-export StorageLayer enum (already defined below) for consistency
// StorageLayer is defined at line 248

// ============================================================================
// SDK Configuration
// ============================================================================

export interface VaritySDKConfig {
  /** Network to connect to. Use 'beta' (recommended) or 'production'. */
  network: Network
  /** API key for Varity backend services */
  apiKey?: string
  /** Custom RPC URL (optional) */
  rpcUrl?: string
  /** @internal Wallet provider (for browser, advanced use only) */
  walletProvider?: any
  /** @internal Private key (for server-side, advanced use only) */
  privateKey?: string
  /** Backend API endpoint */
  apiEndpoint?: string
  /** Template type to use (iso, healthcare, finance, retail) */
  template?: 'iso' | 'healthcare' | 'finance' | 'retail' | 'custom'
  /** Custom template configuration (overrides built-in template) */
  templateConfig?: any

  // ============================================================================
  // Storage Backend Configuration (NEW - S3/GCS Compatible Support)
  // ============================================================================

  /** Primary storage backend to use (default: filecoin-ipfs) */
  storageBackend?: StorageBackend

  /** S3-compatible storage configuration */
  s3Config?: S3CompatibleConfig

  /** GCS-compatible storage configuration */
  gcsConfig?: GCSCompatibleConfig

  /** Multi-tier storage configuration */
  multiTierConfig?: MultiTierStorageConfig

  /** Per-layer backend routing (override default backend for specific layers) */
  storageBackends?: {
    [StorageLayer.VARITY_INTERNAL]?: StorageBackend
    [StorageLayer.INDUSTRY_RAG]?: StorageBackend
    [StorageLayer.CUSTOMER_DATA]?: StorageBackend
  }

  /** @internal Filecoin/IPFS configuration (advanced use only) */
  filecoinConfig?: {
    /** Pinata API key */
    pinataApiKey?: string
    /** Pinata secret key */
    pinataSecretKey?: string
    /** Custom IPFS gateway */
    ipfsGateway?: string
    /** Default pinning enabled */
    defaultPin?: boolean
  }

  /** @internal Celestia Data Availability configuration (advanced use only) */
  celestiaConfig?: {
    /** Celestia RPC endpoint */
    rpcEndpoint?: string
    /** Celestia namespace ID */
    namespaceId?: string
    /** Enable Celestia DA for all layers */
    enabledByDefault?: boolean
  }
}

export type Network = 'beta' | 'production' | 'arbitrum-sepolia' | 'arbitrum-l3-testnet' | 'arbitrum-l3-mainnet'

export interface NetworkConfig {
  chainId: number
  rpcUrl: string
  contracts: ContractAddresses
  explorerUrl: string
}

export interface ContractAddresses {
  MerchantRegistry: string
  TransactionVault: string
  RepPerformance: string
  ResidualCalculator: string
  AccessControlRegistry: string
  DataProofRegistry: string
  VarityWalletFactory: string
}

// ============================================================================
// ISO Dashboard Types (Extracted from iso-dashboard-mvp)
// ============================================================================

// --- Merchant Types ---

export enum MerchantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PROBLEMATIC = 'PROBLEMATIC'
}

export interface ISOMerchant {
  merchantId: string
  ownerAddress: string
  businessName: string
  assignedRepId: string
  status: MerchantStatus
  registrationDate: number
  totalLifetimeVolume: number
  totalGrossResiduals: number
  transactionCount: number
  isFlagged: boolean
  flagReason?: string
}

export interface RegisterMerchantInput {
  businessName: string
  ownerAddress: string
  assignedRepId: string
  metadata?: Record<string, any>
}

export interface ISOMerchantFilters {
  status?: MerchantStatus
  assignedRepId?: string
  isFlagged?: boolean
  minVolume?: number
  maxVolume?: number
}

// --- Transaction Types ---

export enum TransactionType {
  SALE = 'SALE',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
  FORECAST = 'FORECAST'
}

export interface ISOTransaction {
  transactionId: string
  merchantId: string
  repId: string
  transactionDate: number
  transactionAmount: number
  grossResidual: number
  txType: TransactionType
  isForecast: boolean
  recordedAt: number
  batchId?: string
}

export interface RecordTransactionInput {
  merchantId: string
  transactionAmount: number
  transactionDate?: Date
  type?: TransactionType
  isForecast?: boolean
  metadata?: Record<string, any>
  autoCalculateResidual?: boolean
}

export interface BatchTransactionResult {
  batchId: string
  count: number
  transactions: ISOTransaction[]
  errors?: Array<{ index: number; error: string }>
}

// --- Rep Types ---

export enum RepStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export interface ISORep {
  repId: string
  walletAddress: string
  repName: string
  contactEmail: string
  status: RepStatus
  joinDate: number
  totalVolume: number
  totalResiduals: number
  totalTransactions: number
  merchantCount: number
  commissionRate: number
}

export interface RegisterRepInput {
  repId: string
  walletAddress: string
  name: string
  email: string
  commissionRate: number
}

export interface ISORepLeaderboard {
  repId: string
  value: number
  rank: number
  repName?: string
}

// --- Residual Calculation Types ---

export interface FeeStructure {
  baseRateBps: number
  volumeTier1: number
  volumeTier2: number
  tier1RateBps: number
  tier2RateBps: number
  tier3RateBps: number
}

export interface ResidualResult {
  grossResidual: number
  appliedRateBps: number
  tier: number
  isValid: boolean
  validationIssue?: string
}

export interface Anomaly {
  merchantId: string
  anomalyType: 'NEGATIVE_RESIDUAL' | 'RATE_DEVIATION' | 'ZERO_VOLUME'
  detectedAt: number
  amount: number
  description: string
}

// --- Analytics Types ---

export interface ISOKPISummary {
  totalMerchants: number
  activeMerchants: number
  totalVolume: number
  totalResiduals: number
  totalTransactions: number
  avgResidualPerMerchant: number
  avgVolumePerMerchant: number
  timestamp: number
}

export interface ISOTrendData {
  date: string
  volume: number
  residuals: number
  transactionCount: number
  merchantCount: number
}

export interface ISOGrowthMetrics {
  volumeGrowth: number
  residualGrowth: number
  merchantGrowth: number
  transactionGrowth: number
  period: string
}

export interface ISORepPerformance {
  repId: string
  repName: string
  totalVolume: number
  totalResiduals: number
  totalTransactions: number
  merchantCount: number
  rank: number
}

export interface ISOProblemMerchant {
  merchantId: string
  businessName: string
  flagReason: string
  flaggedAt: number
  totalVolume: number
  lastTransactionDate: number
}

// ============================================================================
// Shared Module Types (Universal across all templates)
// ============================================================================

// --- Storage Types ---
// NOTE: These types are being migrated to @varity-labs/types/storage
// For backward compatibility, we re-export them here

export enum StorageLayer {
  VARITY_INTERNAL = 'varity-internal',
  INDUSTRY_RAG = 'industry-rag',
  CUSTOMER_DATA = 'customer-data'
}

// Legacy StorageResult (kept for backward compatibility)
export interface StorageResult {
  cid: string
  gatewayUrl: string
  size: number
  hash: string
  timestamp: number
  encryptionMetadata?: {
    encrypted: boolean
    walletAddress: string
    layer: StorageLayer
  }
}

// Legacy StorageOptions (kept for backward compatibility)
export interface StorageOptions {
  layer: StorageLayer
  metadata?: Record<string, any>
  pin?: boolean
}

// --- AI Types ---

export interface AIResponse {
  answer: string
  confidence: number
  modelUsed: string
  processingTime: number
  timestamp: number
}

export interface AIResponseWithSources extends AIResponse {
  sources: Array<{
    cid: string
    title: string
    snippet: string
    relevanceScore: number
  }>
  context: string
}

export interface MerchantInsights {
  merchantId: string
  summary: string
  strengths: string[]
  concerns: string[]
  recommendations: string[]
  performanceScore: number
}

export interface AnomalyAnalysis {
  merchantId: string
  anomaliesDetected: Anomaly[]
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  recommendation: string
}

// --- Access Control Types ---

export enum Role {
  ADMIN = 'ADMIN_ROLE',
  MANAGER = 'MANAGER_ROLE',
  REP = 'REP_ROLE',
  MERCHANT = 'MERCHANT_ROLE',
  SYSTEM = 'SYSTEM_ROLE'
}

export interface UserProfile {
  userAddress: string
  primaryRole: Role
  metadata: string
  createdAt: number
  lastUpdated: number
  isActive: boolean
}

export interface ZKProof {
  a: [bigint, bigint]
  b: [[bigint, bigint], [bigint, bigint]]
  c: [bigint, bigint]
}

export interface AccessCondition {
  condition: string
  encryptedKey: string
  isActive: boolean
  lastUpdated: number
}

// --- Data Proof Types ---

export interface DataProof {
  dataCID: string
  owner: string
  isVerified: boolean
  timestamp: number
  dataHash: string
  metadata: string
}

// ============================================================================
// Utility Types
// ============================================================================

export interface Pagination {
  page: number
  limit: number
  offset?: number
}

export interface PaginatedResult<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ErrorResponse {
  code: string
  message: string
  details?: any
  timestamp: number
}

// ============================================================================
// Blockchain Transaction Types
// ============================================================================

/**
 * Blockchain transaction receipt
 */
export interface TransactionReceipt {
  /** Transaction hash */
  hash: string
  /** Block number where transaction was included */
  blockNumber: number
  /** Gas used by the transaction */
  gasUsed: bigint
  /** Transaction status (1 = success, 0 = failure) */
  status: number
  /** Transaction logs/events */
  logs: any[]
  /** Transaction sender address */
  from?: string
  /** Transaction recipient address */
  to?: string
  /** Contract address (if contract creation) */
  contractAddress?: string
}

// ============================================================================
// Backend API Types
// ============================================================================

export interface BackendAPIConfig {
  baseUrl: string
  apiKey?: string
  timeout?: number
}

export interface PinataUploadResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
}

export interface CelestiaSubmitResponse {
  height: number
  commitment: string
  namespace: string
  blobId: string
}

// ============================================================================
// TEE (Trusted Execution Environment) Types
// ============================================================================

/**
 * Supported TEE providers for encrypted computation
 */
export type TEEProvider =
  | 'phala'           // Phala Network (Phat Contracts)
  | 'akash-tee'       // Akash Network with TEE
  | 'intel-sgx'       // Intel SGX
  | 'amd-sev'         // AMD SEV-SNP
  | 'arm-trustzone'   // ARM TrustZone

/**
 * TEE attestation quote and verification data
 */
export interface TEEAttestation {
  /** TEE provider type */
  provider: TEEProvider
  /** Attestation type (remote or local) */
  attestationType: 'remote' | 'local'
  /** Base64-encoded attestation quote */
  quote: string
  /** TEE enclave public key (PEM format) */
  publicKey: string
  /** Intel SGX: MRENCLAVE measurement */
  mrenclave?: string
  /** Intel SGX: MRSIGNER measurement */
  mrsigner?: string
  /** AMD SEV: Measurement field */
  measurement?: string
  /** ARM TrustZone: Boot seed */
  bootSeed?: string
  /** Attestation timestamp (Unix) */
  timestamp: number
  /** Attestation signature */
  signature: string
  /** Whether attestation has been verified */
  verified: boolean
  /** Verification details */
  verificationDetails?: {
    tcbStatus?: string
    advisoryIds?: string[]
    policyValid?: boolean
  }
}

/**
 * Options for TEE-encrypted LLM queries
 */
export interface TEEQueryOptions {
  /** Context to include with query */
  context?: string
  /** Require attestation verification */
  requireAttestation?: boolean
  /** Specific TEE provider to use */
  teeProvider?: TEEProvider
  /** Temperature for LLM generation */
  temperature?: number
  /** Maximum tokens to generate */
  maxTokens?: number
  /** Knowledge base for RAG */
  knowledgeBase?: string
}

/**
 * Response from TEE-encrypted LLM query
 */
export interface TEEResponse extends AIResponse {
  /** TEE attestation (if requested) */
  attestation?: TEEAttestation
  /** Whether response was encrypted */
  encrypted: boolean
  /** Encryption metadata */
  encryptionMetadata?: {
    algorithm: string
    keySize: number
    ivSize: number
  }
}

// ============================================================================
// ZKML (Zero-Knowledge Machine Learning) Types
// ============================================================================

/**
 * ZKML proof types supported
 */
export type ZKMLProofType = 'groth16' | 'plonk' | 'stark' | 'mock'

/**
 * ZKML circuit types
 */
export type ZKMLCircuitType = 'circom' | 'ezkl' | 'halo2' | 'custom'

/**
 * ZKML proof for machine learning inference
 * Extends the base ZKProof with ML-specific fields
 */
export interface ZKMLProof {
  /** Unique proof identifier */
  proofId: string
  /** Model identifier */
  modelId: string
  /** Hash of input data */
  inputHash: string
  /** Hash of output data */
  outputHash: string
  /** Hash of model weights/fingerprint */
  modelHash: string
  /** Proof type (groth16, plonk, stark) */
  proofType: ZKMLProofType
  /** Groth16 proof components */
  proof: {
    pi_a: string[]
    pi_b: string[][]
    pi_c: string[]
    protocol?: string
  }
  /** Public signals/inputs */
  publicSignals: string[]
  /** Verification key (optional, for off-chain verification) */
  verificationKey?: any
  /** Whether proof has been verified */
  verified: boolean
  /** On-chain verification transaction hash */
  blockchainTxHash?: string
  /** Proof generation timestamp */
  timestamp: number
  /** Proof generation time in milliseconds */
  generationTimeMs?: number
}

/**
 * ZKML proof verification result
 */
export interface ZKMLVerificationResult {
  /** Whether proof is valid */
  valid: boolean
  /** Verification method used */
  verificationMethod: 'on-chain' | 'off-chain'
  /** Transaction hash (if on-chain) */
  txHash?: string
  /** Gas used (if on-chain) */
  gasUsed?: bigint
  /** Verification time in milliseconds */
  verificationTimeMs: number
  /** Error message (if verification failed) */
  error?: string
}

/**
 * ZKML circuit configuration
 */
export interface ZKMLCircuitConfig {
  /** Circuit name/ID */
  circuitId: string
  /** Circuit type */
  circuitType: ZKMLCircuitType
  /** Proving system */
  provingSystem: ZKMLProofType
  /** Maximum input length */
  maxInputLength: number
  /** Maximum output length */
  maxOutputLength: number
  /** Model precision */
  modelPrecision: 'fp32' | 'fp16' | 'int8' | 'int4'
  /** Circuit file path (compiled) */
  circuitPath?: string
  /** Proving key path */
  provingKeyPath?: string
  /** Verification key path */
  verificationKeyPath?: string
  /** WASM witness generator path */
  wasmPath?: string
}

/**
 * ZKML proof generation input
 */
export interface ZKMLProofInput {
  /** Model identifier */
  modelId: string
  /** Input data to model */
  input: any
  /** Output from model */
  output: any
  /** Additional context */
  context?: any
  /** Circuit ID to use */
  circuitId?: string
  /** Whether to submit to blockchain */
  submitOnChain?: boolean
}

/**
 * ZKML proof statistics
 */
export interface ZKMLProofStats {
  /** Total proofs generated */
  totalProofsGenerated: number
  /** Total proofs verified */
  totalProofsVerified: number
  /** Average proof generation time */
  avgGenerationTimeMs: number
  /** Average verification time */
  avgVerificationTimeMs: number
  /** Success rate */
  successRate: number
  /** Cached proofs count */
  cachedProofs: number
}
