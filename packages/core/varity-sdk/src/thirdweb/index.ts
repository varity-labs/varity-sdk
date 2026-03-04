/**
 * Varity SDK - thirdweb Integration Module
 *
 * Complete thirdweb v5 integration including:
 * - ThirdwebWrapper for contract operations
 * - Engine for production transaction management
 * - Nebula AI for natural language blockchain
 * - Storage for IPFS/Arweave
 * - Bridge for cross-chain transfers
 * - Gateway for RPC infrastructure
 * - x402 for API monetization
 */

// ThirdwebWrapper
export {
  ThirdwebWrapper,
  createThirdwebWrapper,
  type ThirdwebWrapperConfig,
  type DeployContractParams,
} from './ThirdwebWrapper';

// Engine Client
export {
  EngineClient,
  createEngineClient,
  parseEngineWebhook,
  verifyEngineWebhook,
  type EngineConfig,
  type EngineTransactionParams,
  type EngineTransactionStatus,
  type EngineTransactionResult,
  type EngineDeployParams,
  type EngineWebhookPayload,
} from './EngineClient';

// Nebula AI Client
export {
  NebulaClient,
  createNebulaClient,
  type NebulaConfig,
  type GenerateContractOptions,
  type GeneratedContract,
  type QueryChainOptions,
  type QueryResult,
  type ExplainTransactionOptions,
  type TransactionExplanation,
  type GenerateCodeOptions,
  type GeneratedCode,
  type AnalyzeContractOptions,
  type ContractAnalysis,
} from './NebulaClient';

// Storage Client
export {
  StorageClient,
  createStorageClient,
  type StorageConfig,
  type ThirdwebUploadResult,
  type NFTMetadata,
  type BatchUploadItem,
  type BatchUploadResult,
  type ThirdwebDownloadOptions,
  type ImageOptimizationOptions,
} from './StorageClient';

// Bridge Client
export {
  BridgeClient,
  createBridgeClient,
  type BridgeConfig,
  type AssetType,
  type BridgeRoute,
  type BridgeAssetParams,
  type BridgeStatus,
  type BridgeTransactionResult,
  type BridgeQuote,
  type BridgeHistoryEntry,
} from './BridgeClient';

// Gateway Client
export {
  GatewayClient,
  createGatewayClient,
  type GatewayConfig,
  type RPCRequestOptions,
  type RPCResponse,
  type GatewayStats,
  type WebSocketOptions,
} from './GatewayClient';

// x402 Payment Protocol Client
export {
  x402Client,
  createx402Client,
  x402Middleware,
  type x402Config,
  type PaymentEndpointConfig,
  type PaymentStats,
  type UsageRecord,
  type SubscriptionPlan,
  type Subscription,
} from './x402Client';

// Legacy chain export (backwards compatibility)
export {
  varietyTestnet,
  getVarityChain,
  isVarityChain,
  VARITY_TESTNET_RPC,
  VARITY_CHAIN_METADATA,
} from './varity-chain';
