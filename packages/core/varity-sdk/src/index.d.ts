/**
 * Varity SDK v1 - Public API
 *
 * Main entry point for the Varity Backend SDK.
 * Exports all public interfaces, types, and classes.
 */
export { VaritySDK, createVaritySDK } from './core/VaritySDK';
export { getNetworkConfig, NETWORK_CONFIGS, DEFAULT_CONFIG, API_ENDPOINTS, STORAGE_CONFIG } from './core/config';
export { TemplateRegistry, templateRegistry, validateTemplate, getContractABI, getContractAddress, getEntity, getMetric, getEvent, mergeTemplateConfig } from './core/template';
export { loadISOTemplate, loadAllTemplates } from './core/template-loader';
export type { TemplateType, TemplateConfig, TemplateContract, TemplateEntity, EntityField, TemplateEvent, TemplateMetric, TemplateDashboard, DashboardWidget, TemplateStorageConfig } from './core/template';
export type { VaritySDKConfig, Network, NetworkConfig, ContractAddresses } from './core/types';
export type { ISOMerchant, RegisterMerchantInput, ISOMerchantFilters, ISOTransaction, RecordTransactionInput, BatchTransactionResult, ISORep, RegisterRepInput, ISORepLeaderboard, ISOKPISummary, ISOTrendData, ISOGrowthMetrics, ISORepPerformance, ISOProblemMerchant, FeeStructure, ResidualResult } from './core/types';
export type { StorageResult, StorageOptions, AIResponse, AIResponseWithSources, MerchantInsights, AnomalyAnalysis, UserProfile, ZKProof, AccessCondition, DataProof, TEEProvider, TEEAttestation, TEEQueryOptions, TEEResponse, ZKMLProofType, ZKMLCircuitType, ZKMLProof, ZKMLVerificationResult, ZKMLCircuitConfig, ZKMLProofInput, ZKMLProofStats } from './core/types';
export type { Pagination, PaginatedResult, ErrorResponse, TransactionReceipt, BackendAPIConfig, PinataUploadResponse, CelestiaSubmitResponse } from './core/types';
export { MerchantStatus, TransactionType, RepStatus, StorageLayer, Role } from './core/types';
export { StorageModule, S3Module } from './modules/storage';
export type { UploadResult, DataPointer, Pin, PinFilters, CelestiaReceipt, S3PutObjectParams, S3GetObjectParams, S3GetObjectResponse, S3DeleteObjectParams, S3ListObjectsParams, S3HeadObjectParams, S3HeadObjectResponse } from './modules/storage';
export { IStorageAdapter, BaseStorageAdapter, UnsupportedOperationError, FilecoinAdapter, MultiTierAdapter, AdapterFactory } from './modules/storage';
export type { AdapterFactoryConfig } from './modules/storage';
export { AnalyticsModule } from './modules/analytics';
export type { KPIOptions, KPIResult, KPISummary, TrendOptions, TrendDataPoint, TrendResult, LeaderboardOptions, LeaderboardEntry, LeaderboardResult, GrowthMetricsOptions, GrowthMetric, GrowthMetricsResult, TimeSeriesOptions, TimeSeriesResult, ComparativeAnalysisOptions, ComparativeResult } from './modules/analytics';
export { NotificationsModule } from './modules/notifications';
export type { NotificationType, NotificationPriority, NotificationStatus, SendNotificationOptions, NotificationAttachment, NotificationResult, NotificationPreferences, NotificationHistoryOptions, NotificationHistoryEntry, NotificationHistoryResult, ScheduleNotificationOptions, ScheduledNotification, AlertRule, AlertCondition, AlertRuleResult, NotificationTemplate } from './modules/notifications';
export { ExportModule } from './modules/export';
export type { ExportFormat, ReportFormat, ExportOptions, ExportResult, CSVExportOptions, JSONExportOptions, ReportOptions, ReportResult, DownloadOptions, BulkExportOptions, BulkExportResult, ExportTemplate, ScheduledExportOptions, ScheduledExport } from './modules/export';
export { CacheModule } from './modules/cache';
export type { CacheOptions, CacheEntry, CacheStats, CacheBatchOperation, CacheBatchResult, CachePattern } from './modules/cache';
export { MonitoringModule, TraceContext, SpanContext } from './modules/monitoring';
export type { HealthStatus, MetricType, HealthCheckResult, Metric, RecordMetricOptions, QueryMetricsOptions, MetricSeries, Trace, Span, LogEntry, ErrorReport, PerformanceMetrics, Alert } from './modules/monitoring';
export { ForecastingModule } from './modules/forecasting';
export type { TimeInterval, ForecastModel, AnomalySensitivity, AnomalyType, EvaluationMetric, PredictOptions, AnomalyDetectionOptions, TrendAnalysisOptions, ScenarioSimulationOptions, TrainModelOptions, EvaluateModelOptions, ForecastPoint, ForecastResult, Anomaly, AnomalyDetectionResult, TrendComponent, TrendAnalysisResult, ScenarioResult, TrainedModel, EvaluationResult } from './modules/forecasting';
export { WebhooksModule } from './modules/webhooks';
export type { WebhookStatus, DeliveryStatus, HttpMethod, RetryStrategy, RegisterWebhookOptions, UpdateWebhookOptions, ListWebhooksOptions, TestWebhookOptions, GetLogsOptions, DeliverEventOptions, Webhook, DeliveryLog, AvailableEvent, WebhookStats, TestDeliveryResult } from './modules/webhooks';
export { default as MerchantRegistryABI } from './contracts/abis/iso/MerchantRegistry.json';
export { default as TransactionVaultABI } from './contracts/abis/iso/TransactionVault.json';
export { default as RepPerformanceABI } from './contracts/abis/iso/RepPerformance.json';
export { default as ResidualCalculatorABI } from './contracts/abis/iso/ResidualCalculator.json';
export { default as AccessControlRegistryABI } from './contracts/abis/iso/AccessControlRegistry.json';
export { default as DataProofRegistryABI } from './contracts/abis/iso/DataProofRegistry.json';
export { default as VarityWalletFactoryABI } from './contracts/abis/iso/VarityWalletFactory.json';
export { ThirdwebWrapper, createThirdwebWrapper, EngineClient, createEngineClient, parseEngineWebhook, verifyEngineWebhook, NebulaClient, createNebulaClient, StorageClient, createStorageClient, BridgeClient, createBridgeClient, GatewayClient, createGatewayClient, x402Client, createx402Client, x402Middleware, } from './thirdweb';
export type { ThirdwebWrapperConfig, DeployContractParams, EngineConfig, EngineTransactionParams, EngineTransactionStatus, EngineTransactionResult, EngineDeployParams, EngineWebhookPayload, NebulaConfig, GenerateContractOptions, GeneratedContract, QueryChainOptions, QueryResult, ExplainTransactionOptions, TransactionExplanation, GenerateCodeOptions, GeneratedCode, AnalyzeContractOptions, ContractAnalysis, StorageConfig, ThirdwebUploadResult, NFTMetadata, BatchUploadItem, BatchUploadResult, ThirdwebDownloadOptions, ImageOptimizationOptions, BridgeConfig, AssetType, BridgeRoute, BridgeAssetParams, BridgeStatus, BridgeTransactionResult, BridgeQuote, BridgeHistoryEntry, GatewayConfig, RPCRequestOptions, RPCResponse, GatewayStats, WebSocketOptions, x402Config, PaymentEndpointConfig, PaymentStats, UsageRecord, SubscriptionPlan, Subscription, } from './thirdweb';
export { varietyTestnet, getVarityChain, isVarityChain, VARITY_TESTNET_RPC, VARITY_CHAIN_METADATA } from './thirdweb/varity-chain';
export { ChainRegistry, SUPPORTED_CHAINS, TESTNET_CHAINS, MAINNET_CHAINS, DEFAULT_CHAIN, chains, varityL3, varityL3Testnet, varityL3Wagmi, USDC_DECIMALS, VARITY_USDC_ADDRESS, formatUSDC, parseUSDC, formatAddress, getVarityExplorerUrl, arbitrum, arbitrumOne, arbitrumSepolia, arbitrumOneWagmi, arbitrumSepoliaWagmi, getArbitrumExplorerUrl, base, baseSepolia, baseWagmi, baseSepoliaWagmi, getBaseExplorerUrl, } from './chains';
export type { ChainSelection, ChainMetadata } from './chains';
export declare const VERSION = "2.0.0-alpha.1";
export declare const SDK_VERSION = "2.0.0-alpha.1";
//# sourceMappingURL=index.d.ts.map