/**
 * Varity SDK v1 - Public API
 *
 * Main entry point for the Varity Backend SDK.
 * Exports all public interfaces, types, and classes.
 */

// Core SDK
export { VaritySDK, createVaritySDK } from './core/VaritySDK'
export { getNetworkConfig, NETWORK_CONFIGS, DEFAULT_CONFIG, API_ENDPOINTS, STORAGE_CONFIG } from './core/config'

// Shared Development Credentials
export {
  VARITY_DEV_CREDENTIALS,
  isUsingDevCredentials,
  isProductionCredentials,
  getCredentialWarning,
  logCredentialUsage,
  resolveCredentials,
  validateCredentials,
  getUpgradeInstructions
} from './core/credentials'
export type { CredentialConfig } from './core/credentials'

// Template System
export {
  TemplateRegistry,
  templateRegistry,
  validateTemplate,
  getContractABI,
  getContractAddress,
  getEntity,
  getMetric,
  getEvent,
  mergeTemplateConfig
} from './core/template'
export { loadISOTemplate, loadAllTemplates } from './core/template-loader'
export type {
  TemplateType,
  TemplateConfig,
  TemplateContract,
  TemplateEntity,
  EntityField,
  TemplateEvent,
  TemplateMetric,
  TemplateDashboard,
  DashboardWidget,
  TemplateStorageConfig
} from './core/template'

// Types - SDK Configuration
export type {
  VaritySDKConfig,
  Network,
  NetworkConfig,
  ContractAddresses
} from './core/types'

// Types - ISO Dashboard
export type {
  ISOMerchant,
  RegisterMerchantInput,
  ISOMerchantFilters,
  ISOTransaction,
  RecordTransactionInput,
  BatchTransactionResult,
  ISORep,
  RegisterRepInput,
  ISORepLeaderboard,
  ISOKPISummary,
  ISOTrendData,
  ISOGrowthMetrics,
  ISORepPerformance,
  ISOProblemMerchant,
  FeeStructure,
  ResidualResult
} from './core/types'

// Types - Shared Modules
export type {
  StorageResult,
  StorageOptions,
  AIResponse,
  AIResponseWithSources,
  MerchantInsights,
  AnomalyAnalysis,
  UserProfile,
  ZKProof,
  AccessCondition,
  DataProof,
  // TEE Types
  TEEProvider,
  TEEAttestation,
  TEEQueryOptions,
  TEEResponse,
  // ZKML Types
  ZKMLProofType,
  ZKMLCircuitType,
  ZKMLProof,
  ZKMLVerificationResult,
  ZKMLCircuitConfig,
  ZKMLProofInput,
  ZKMLProofStats
} from './core/types'

// Types - Utilities
export type {
  Pagination,
  PaginatedResult,
  ErrorResponse,
  TransactionReceipt,
  BackendAPIConfig,
  PinataUploadResponse,
  CelestiaSubmitResponse
} from './core/types'

// Enums
export { MerchantStatus, TransactionType, RepStatus, StorageLayer, Role } from './core/types'

// Storage Module (Filecoin/IPFS + Multi-backend Support)
export { StorageModule, S3Module } from './modules/storage'
export type {
  UploadResult,
  DataPointer,
  Pin,
  PinFilters,
  CelestiaReceipt,
  S3PutObjectParams,
  S3GetObjectParams,
  S3GetObjectResponse,
  S3DeleteObjectParams,
  S3ListObjectsParams,
  S3HeadObjectParams,
  S3HeadObjectResponse
} from './modules/storage'

// Storage Adapters (Advanced Multi-Backend Support)
export {
  IStorageAdapter,
  BaseStorageAdapter,
  UnsupportedOperationError,
  FilecoinAdapter,
  MultiTierAdapter,
  AdapterFactory
} from './modules/storage'
export type { AdapterFactoryConfig } from './modules/storage'

// Universal Capability Modules
export { AnalyticsModule } from './modules/analytics'
export type {
  KPIOptions,
  KPIResult,
  KPISummary,
  TrendOptions,
  TrendDataPoint,
  TrendResult,
  LeaderboardOptions,
  LeaderboardEntry,
  LeaderboardResult,
  GrowthMetricsOptions,
  GrowthMetric,
  GrowthMetricsResult,
  TimeSeriesOptions,
  TimeSeriesResult,
  ComparativeAnalysisOptions,
  ComparativeResult
} from './modules/analytics'

export { NotificationsModule } from './modules/notifications'
export type {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  SendNotificationOptions,
  NotificationAttachment,
  NotificationResult,
  NotificationPreferences,
  NotificationHistoryOptions,
  NotificationHistoryEntry,
  NotificationHistoryResult,
  ScheduleNotificationOptions,
  ScheduledNotification,
  AlertRule,
  AlertCondition,
  AlertRuleResult,
  NotificationTemplate
} from './modules/notifications'

export { ExportModule } from './modules/export'
export type {
  ExportFormat,
  ReportFormat,
  ExportOptions,
  ExportResult,
  CSVExportOptions,
  JSONExportOptions,
  ReportOptions,
  ReportResult,
  DownloadOptions,
  BulkExportOptions,
  BulkExportResult,
  ExportTemplate,
  ScheduledExportOptions,
  ScheduledExport
} from './modules/export'

export { CacheModule } from './modules/cache'
export type {
  CacheOptions,
  CacheEntry,
  CacheStats,
  CacheBatchOperation,
  CacheBatchResult,
  CachePattern
} from './modules/cache'

export { MonitoringModule, TraceContext, SpanContext } from './modules/monitoring'
export type {
  HealthStatus,
  MetricType,
  HealthCheckResult,
  Metric,
  RecordMetricOptions,
  QueryMetricsOptions,
  MetricSeries,
  Trace,
  Span,
  LogEntry,
  ErrorReport,
  PerformanceMetrics,
  Alert
} from './modules/monitoring'

export { ForecastingModule } from './modules/forecasting'
export type {
  TimeInterval,
  ForecastModel,
  AnomalySensitivity,
  AnomalyType,
  EvaluationMetric,
  PredictOptions,
  AnomalyDetectionOptions,
  TrendAnalysisOptions,
  ScenarioSimulationOptions,
  TrainModelOptions,
  EvaluateModelOptions,
  ForecastPoint,
  ForecastResult,
  Anomaly,
  AnomalyDetectionResult,
  TrendComponent,
  TrendAnalysisResult,
  ScenarioResult,
  TrainedModel,
  EvaluationResult
} from './modules/forecasting'

export { WebhooksModule } from './modules/webhooks'
export type {
  WebhookStatus,
  DeliveryStatus,
  HttpMethod,
  RetryStrategy,
  RegisterWebhookOptions,
  UpdateWebhookOptions,
  ListWebhooksOptions,
  TestWebhookOptions,
  GetLogsOptions,
  DeliverEventOptions,
  Webhook,
  DeliveryLog,
  AvailableEvent,
  WebhookStats,
  TestDeliveryResult
} from './modules/webhooks'

// Contract ABIs (optional export for advanced users)
export { default as MerchantRegistryABI } from './contracts/abis/iso/MerchantRegistry.json'
export { default as TransactionVaultABI } from './contracts/abis/iso/TransactionVault.json'
export { default as RepPerformanceABI } from './contracts/abis/iso/RepPerformance.json'
export { default as ResidualCalculatorABI } from './contracts/abis/iso/ResidualCalculator.json'
export { default as AccessControlRegistryABI } from './contracts/abis/iso/AccessControlRegistry.json'
export { default as DataProofRegistryABI } from './contracts/abis/iso/DataProofRegistry.json'
export { default as VarityWalletFactoryABI } from './contracts/abis/iso/VarityWalletFactory.json'

// Thirdweb Integration (NEW in v2.0.0-beta.2, Complete in v2.0.0-alpha.1)
export {
  // Core
  ThirdwebWrapper,
  createThirdwebWrapper,
  // Engine
  EngineClient,
  createEngineClient,
  parseEngineWebhook,
  verifyEngineWebhook,
  // Nebula AI
  NebulaClient,
  createNebulaClient,
  // Storage
  StorageClient,
  createStorageClient,
  // Bridge
  BridgeClient,
  createBridgeClient,
  // Gateway
  GatewayClient,
  createGatewayClient,
  // x402 Payment
  x402Client,
  createx402Client,
  x402Middleware,
} from './thirdweb'
export type {
  // Core
  ThirdwebWrapperConfig,
  DeployContractParams,
  // Engine
  EngineConfig,
  EngineTransactionParams,
  EngineTransactionStatus,
  EngineTransactionResult,
  EngineDeployParams,
  EngineWebhookPayload,
  // Nebula AI
  NebulaConfig,
  GenerateContractOptions,
  GeneratedContract,
  QueryChainOptions,
  QueryResult,
  ExplainTransactionOptions,
  TransactionExplanation,
  GenerateCodeOptions,
  GeneratedCode,
  AnalyzeContractOptions,
  ContractAnalysis,
  // Storage
  StorageConfig,
  ThirdwebUploadResult,
  NFTMetadata,
  BatchUploadItem,
  BatchUploadResult,
  ThirdwebDownloadOptions,
  ImageOptimizationOptions,
  // Bridge
  BridgeConfig,
  AssetType,
  BridgeRoute,
  BridgeAssetParams,
  BridgeStatus,
  BridgeTransactionResult,
  BridgeQuote,
  BridgeHistoryEntry,
  // Gateway
  GatewayConfig,
  RPCRequestOptions,
  RPCResponse,
  GatewayStats,
  WebSocketOptions,
  // x402 Payment
  x402Config,
  PaymentEndpointConfig,
  PaymentStats,
  UsageRecord,
  SubscriptionPlan,
  Subscription,
} from './thirdweb'
export { varietyTestnet, getVarityChain, isVarityChain, VARITY_TESTNET_RPC, VARITY_CHAIN_METADATA } from './thirdweb/varity-chain'

// Multi-Chain Configuration (NEW in v2.0.0-alpha.1)
export {
  ChainRegistry,
  SUPPORTED_CHAINS,
  TESTNET_CHAINS,
  MAINNET_CHAINS,
  DEFAULT_CHAIN,
  chains,
  // Varity L3
  varityL3,
  varityL3Testnet,
  varityL3Wagmi,
  USDC_DECIMALS,
  VARITY_USDC_ADDRESS,
  formatUSDC,
  parseUSDC,
  formatAddress,
  getVarityExplorerUrl,
  // Arbitrum
  arbitrum,
  arbitrumOne,
  arbitrumSepolia,
  arbitrumOneWagmi,
  arbitrumSepoliaWagmi,
  getArbitrumExplorerUrl,
  // Base
  base,
  baseSepolia,
  baseWagmi,
  baseSepoliaWagmi,
  getBaseExplorerUrl,
} from './chains'
export type { ChainSelection, ChainMetadata } from './chains'

// Blockchain Module (Production patterns from generic-template-dashboard)
export {
  BlockchainService,
  NFTLicensingService,
  RevenueSplitService,
} from './blockchain'
export type {
  ContractConfig,
  NFTLicenseMetadata,
  LicenseInfo,
  RevenueSplit,
  TransactionResult,
  BlockchainServiceOptions,
} from './blockchain'

// Gas Tracking Module (NEW - Per-App Gas Usage Billing)
export {
  trackGasUsage,
  trackTransactionGasUsage,
  waitForTransactionReceipt,
  calculateGasInUSDC,
  createGasTracker,
} from './tracking'
export type {
  GasUsageEvent,
  GasTransactionReceipt,
  GasTrackerConfig,
  BillingStatus,
  AppIdentifier,
  GasUsageRecord,
  AppUsageSummary,
  BillingCycle,
  GasTrackingStats,
  GasUsageQueryOptions,
  GasUsageQueryResult,
  BillingAlert,
  GasExportFormat,
  GasExportOptions,
} from './tracking'

// Version
export const VERSION = '2.0.0-alpha.1'
export const SDK_VERSION = '2.0.0-alpha.1' // Multi-chain support + thirdweb Engine integration + Blockchain module
