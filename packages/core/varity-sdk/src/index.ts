/**
 * Varity SDK - Public API
 *
 * Main entry point for the Varity SDK.
 * Provides database, auth credentials, and app development utilities.
 */

// ============================================================================
// Advanced: Core SDK (requires infrastructure setup)
// Available via direct import if needed
// ============================================================================
// export { VaritySDK, createVaritySDK } from './core/VaritySDK'
// export { getNetworkConfig, NETWORK_CONFIGS, DEFAULT_CONFIG } from './core/config'
// export { API_ENDPOINTS, STORAGE_CONFIG } from './core/config'

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

// ============================================================================
// Advanced: Template System (internal, not developer-facing)
// ============================================================================
// export {
//   TemplateRegistry,
//   templateRegistry,
//   validateTemplate,
//   getEntity,
//   getMetric,
//   getEvent,
//   mergeTemplateConfig
// } from './core/template'
// export { loadISOTemplate, loadAllTemplates } from './core/template-loader'
// export type {
//   TemplateType,
//   TemplateConfig,
//   TemplateContract,
//   TemplateEntity,
//   EntityField,
//   TemplateEvent,
//   TemplateMetric,
//   TemplateDashboard,
//   DashboardWidget,
//   TemplateStorageConfig
// } from './core/template'

// ============================================================================
// Advanced: SDK Configuration Types (requires infrastructure setup)
// ============================================================================
// export type {
//   VaritySDKConfig,
//   Network,
//   NetworkConfig,
//   ContractAddresses
// } from './core/types'

// ============================================================================
// Advanced: ISO Dashboard Types (internal template)
// ============================================================================
// export type {
//   ISOMerchant,
//   RegisterMerchantInput,
//   ISOMerchantFilters,
//   ISOTransaction,
//   RecordTransactionInput,
//   BatchTransactionResult,
//   ISORep,
//   RegisterRepInput,
//   ISORepLeaderboard,
//   ISOKPISummary,
//   ISOTrendData,
//   ISOGrowthMetrics,
//   ISORepPerformance,
//   ISOProblemMerchant,
//   FeeStructure,
//   ResidualResult
// } from './core/types'

// ============================================================================
// Advanced: Shared Module Types (requires infrastructure setup)
// ============================================================================
// export type {
//   StorageResult,
//   StorageOptions,
//   AIResponse,
//   AIResponseWithSources,
//   MerchantInsights,
//   AnomalyAnalysis,
//   UserProfile,
//   ZKProof,
//   AccessCondition,
//   DataProof,
//   TEEProvider,
//   TEEAttestation,
//   TEEQueryOptions,
//   TEEResponse,
//   ZKMLProofType,
//   ZKMLCircuitType,
//   ZKMLProof,
//   ZKMLVerificationResult,
//   ZKMLCircuitConfig,
//   ZKMLProofInput,
//   ZKMLProofStats
// } from './core/types'

// ============================================================================
// Advanced: Utility Types (requires infrastructure setup)
// ============================================================================
// export type {
//   Pagination,
//   PaginatedResult,
//   ErrorResponse,
//   TransactionReceipt,
//   BackendAPIConfig,
//   PinataUploadResponse,
//   CelestiaSubmitResponse
// } from './core/types'

// ============================================================================
// Advanced: Enums (internal template)
// ============================================================================
// export { MerchantStatus, TransactionType, RepStatus } from './core/types'
// export { StorageLayer, Role } from './core/types'

// ============================================================================
// Advanced: Storage Module (requires Filecoin/IPFS/S3 infrastructure)
// Available via direct import if needed
// ============================================================================
// export { StorageModule, S3Module } from './modules/storage'
// export type {
//   UploadResult,
//   DataPointer,
//   Pin,
//   PinFilters,
//   CelestiaReceipt,
//   S3PutObjectParams,
//   S3GetObjectParams,
//   S3GetObjectResponse,
//   S3DeleteObjectParams,
//   S3ListObjectsParams,
//   S3HeadObjectParams,
//   S3HeadObjectResponse
// } from './modules/storage'

// ============================================================================
// Advanced: Storage Adapters (requires infrastructure setup)
// ============================================================================
// export {
//   IStorageAdapter,
//   BaseStorageAdapter,
//   UnsupportedOperationError,
//   FilecoinAdapter,
//   MultiTierAdapter,
//   AdapterFactory
// } from './modules/storage'
// export type { AdapterFactoryConfig } from './modules/storage'

// ============================================================================
// Advanced: Capability Modules (require backend API — not yet available)
// These modules will be enabled in a future release.
// ============================================================================
// export { AnalyticsModule } from './modules/analytics'
// export type {
//   KPIOptions,
//   KPIResult,
//   KPISummary,
//   TrendOptions,
//   TrendDataPoint,
//   TrendResult,
//   LeaderboardOptions,
//   LeaderboardEntry,
//   LeaderboardResult,
//   GrowthMetricsOptions,
//   GrowthMetric,
//   GrowthMetricsResult,
//   TimeSeriesOptions,
//   TimeSeriesResult,
//   ComparativeAnalysisOptions,
//   ComparativeResult
// } from './modules/analytics'

// export { NotificationsModule } from './modules/notifications'
// export type {
//   NotificationType,
//   NotificationPriority,
//   NotificationStatus,
//   SendNotificationOptions,
//   NotificationAttachment,
//   NotificationResult,
//   NotificationPreferences,
//   NotificationHistoryOptions,
//   NotificationHistoryEntry,
//   NotificationHistoryResult,
//   ScheduleNotificationOptions,
//   ScheduledNotification,
//   AlertRule,
//   AlertCondition,
//   AlertRuleResult,
//   NotificationTemplate
// } from './modules/notifications'

// export { ExportModule } from './modules/export'
// export type {
//   ExportFormat,
//   ReportFormat,
//   ExportOptions,
//   ExportResult,
//   CSVExportOptions,
//   JSONExportOptions,
//   ReportOptions,
//   ReportResult,
//   DownloadOptions,
//   BulkExportOptions,
//   BulkExportResult,
//   ExportTemplate,
//   ScheduledExportOptions,
//   ScheduledExport
// } from './modules/export'

// export { CacheModule } from './modules/cache'
// export type {
//   CacheOptions,
//   CacheEntry,
//   CacheStats,
//   CacheBatchOperation,
//   CacheBatchResult,
//   CachePattern
// } from './modules/cache'

// export { MonitoringModule, TraceContext, SpanContext } from './modules/monitoring'
// export type {
//   HealthStatus,
//   MetricType,
//   HealthCheckResult,
//   Metric,
//   RecordMetricOptions,
//   QueryMetricsOptions,
//   MetricSeries,
//   Trace,
//   Span,
//   LogEntry,
//   ErrorReport,
//   PerformanceMetrics,
//   Alert
// } from './modules/monitoring'

// export { ForecastingModule } from './modules/forecasting'
// export type {
//   TimeInterval,
//   ForecastModel,
//   AnomalySensitivity,
//   AnomalyType,
//   EvaluationMetric,
//   PredictOptions,
//   AnomalyDetectionOptions,
//   TrendAnalysisOptions,
//   ScenarioSimulationOptions,
//   TrainModelOptions,
//   EvaluateModelOptions,
//   ForecastPoint,
//   ForecastResult,
//   Anomaly,
//   AnomalyDetectionResult,
//   TrendComponent,
//   TrendAnalysisResult,
//   ScenarioResult,
//   TrainedModel,
//   EvaluationResult
// } from './modules/forecasting'

// export { WebhooksModule } from './modules/webhooks'
// export type {
//   WebhookStatus,
//   DeliveryStatus,
//   HttpMethod,
//   RetryStrategy,
//   RegisterWebhookOptions,
//   UpdateWebhookOptions,
//   ListWebhooksOptions,
//   TestWebhookOptions,
//   GetLogsOptions,
//   DeliverEventOptions,
//   Webhook,
//   DeliveryLog,
//   AvailableEvent,
//   WebhookStats,
//   TestDeliveryResult
// } from './modules/webhooks'

// ============================================================================
// Advanced: Contract ABIs
// Available via direct import: import MerchantRegistryABI from '@varity-labs/sdk/contracts/abis/iso/MerchantRegistry.json'
// ============================================================================
// export { default as MerchantRegistryABI } from './contracts/abis/iso/MerchantRegistry.json'
// export { default as TransactionVaultABI } from './contracts/abis/iso/TransactionVault.json'
// export { default as RepPerformanceABI } from './contracts/abis/iso/RepPerformance.json'
// export { default as ResidualCalculatorABI } from './contracts/abis/iso/ResidualCalculator.json'
// export { default as AccessControlRegistryABI } from './contracts/abis/iso/AccessControlRegistry.json'
// export { default as DataProofRegistryABI } from './contracts/abis/iso/DataProofRegistry.json'
// export { default as VarityWalletFactoryABI } from './contracts/abis/iso/VarityWalletFactory.json'

// ============================================================================
// Advanced: Thirdweb Integration
// Available via direct import: import { ThirdwebWrapper } from '@varity-labs/sdk/thirdweb'
// ============================================================================
// export {
//   ThirdwebWrapper,
//   createThirdwebWrapper,
//   EngineClient,
//   createEngineClient,
//   parseEngineWebhook,
//   verifyEngineWebhook,
//   NebulaClient,
//   createNebulaClient,
//   StorageClient,
//   createStorageClient,
//   BridgeClient,
//   createBridgeClient,
//   GatewayClient,
//   createGatewayClient,
//   x402Client,
//   createx402Client,
//   x402Middleware,
// } from './thirdweb'
// export type {
//   ThirdwebWrapperConfig,
//   DeployContractParams,
//   EngineConfig,
//   EngineTransactionParams,
//   EngineTransactionStatus,
//   EngineTransactionResult,
//   EngineDeployParams,
//   EngineWebhookPayload,
//   NebulaConfig,
//   GenerateContractOptions,
//   GeneratedContract,
//   QueryChainOptions,
//   QueryResult,
//   ExplainTransactionOptions,
//   TransactionExplanation,
//   GenerateCodeOptions,
//   GeneratedCode,
//   AnalyzeContractOptions,
//   ContractAnalysis,
//   StorageConfig,
//   ThirdwebUploadResult,
//   NFTMetadata,
//   BatchUploadItem,
//   BatchUploadResult,
//   ThirdwebDownloadOptions,
//   ImageOptimizationOptions,
//   BridgeConfig,
//   AssetType,
//   BridgeRoute,
//   BridgeAssetParams,
//   BridgeStatus,
//   BridgeTransactionResult,
//   BridgeQuote,
//   BridgeHistoryEntry,
//   GatewayConfig,
//   RPCRequestOptions,
//   RPCResponse,
//   GatewayStats,
//   WebSocketOptions,
//   x402Config,
//   PaymentEndpointConfig,
//   PaymentStats,
//   UsageRecord,
//   SubscriptionPlan,
//   Subscription,
// } from './thirdweb'
// export { varietyTestnet, getVarityChain, isVarityChain, VARITY_TESTNET_RPC, VARITY_CHAIN_METADATA } from './thirdweb/varity-chain'

// ============================================================================
// Advanced: Blockchain & Chain Configuration
// Available via direct import: import { ChainRegistry } from '@varity-labs/sdk/chains'
// ============================================================================
// export {
//   ChainRegistry,
//   SUPPORTED_CHAINS,
//   TESTNET_CHAINS,
//   MAINNET_CHAINS,
//   DEFAULT_CHAIN,
//   chains,
//   varityL3,
//   varityL3Testnet,
//   varityL3Wagmi,
//   USDC_DECIMALS,
//   VARITY_USDC_ADDRESS,
//   formatUSDC,
//   parseUSDC,
//   formatAddress,
//   getVarityExplorerUrl,
//   arbitrum,
//   arbitrumOne,
//   arbitrumSepolia,
//   arbitrumOneWagmi,
//   arbitrumSepoliaWagmi,
//   getArbitrumExplorerUrl,
//   base,
//   baseSepolia,
//   baseWagmi,
//   baseSepoliaWagmi,
//   getBaseExplorerUrl,
// } from './chains'
// export type { ChainSelection, ChainMetadata } from './chains'

// ============================================================================
// Advanced: Blockchain Module
// Available via direct import: import { BlockchainService } from '@varity-labs/sdk/blockchain'
// ============================================================================
// export {
//   BlockchainService,
//   NFTLicensingService,
//   RevenueSplitService,
// } from './blockchain'
// export type {
//   ContractConfig,
//   NFTLicenseMetadata,
//   LicenseInfo,
//   RevenueSplit,
//   TransactionResult,
//   BlockchainServiceOptions,
// } from './blockchain'

// ============================================================================
// Advanced: Gas Tracking Module
// Available via direct import: import { trackGasUsage } from '@varity-labs/sdk/tracking'
// ============================================================================
// export {
//   trackGasUsage,
//   trackTransactionGasUsage,
//   waitForTransactionReceipt,
//   calculateGasInUSDC,
//   createGasTracker,
// } from './tracking'
// export type {
//   GasUsageEvent,
//   GasTransactionReceipt,
//   GasTrackerConfig,
//   BillingStatus,
//   AppIdentifier,
//   GasUsageRecord,
//   AppUsageSummary,
//   BillingCycle,
//   GasTrackingStats,
//   GasUsageQueryOptions,
//   GasUsageQueryResult,
//   BillingAlert,
//   GasExportFormat,
//   GasExportOptions,
// } from './tracking'

// Database Module — Zero-Config Database API
export {
  Database,
  db,
  Collection,
} from './database'
export type {
  DatabaseConfig,
  QueryOptions,
  Document,
  CollectionResponse,
} from './database'

// Version
export const VERSION = '2.0.0-alpha.1'
export const SDK_VERSION = '2.0.0-alpha.1'
