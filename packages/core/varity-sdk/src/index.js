/**
 * Varity SDK v1 - Public API
 *
 * Main entry point for the Varity Backend SDK.
 * Exports all public interfaces, types, and classes.
 */
// Core SDK
export { VaritySDK, createVaritySDK } from './core/VaritySDK';
export { getNetworkConfig, NETWORK_CONFIGS, DEFAULT_CONFIG, API_ENDPOINTS, STORAGE_CONFIG } from './core/config';
// Template System
export { TemplateRegistry, templateRegistry, validateTemplate, getContractABI, getContractAddress, getEntity, getMetric, getEvent, mergeTemplateConfig } from './core/template';
export { loadISOTemplate, loadAllTemplates } from './core/template-loader';
// Enums
export { MerchantStatus, TransactionType, RepStatus, StorageLayer, Role } from './core/types';
// Storage Module (Filecoin/IPFS + Multi-backend Support)
export { StorageModule, S3Module } from './modules/storage';
// Storage Adapters (Advanced Multi-Backend Support)
export { BaseStorageAdapter, UnsupportedOperationError, FilecoinAdapter, MultiTierAdapter, AdapterFactory } from './modules/storage';
// Universal Capability Modules
export { AnalyticsModule } from './modules/analytics';
export { NotificationsModule } from './modules/notifications';
export { ExportModule } from './modules/export';
export { CacheModule } from './modules/cache';
export { MonitoringModule, TraceContext, SpanContext } from './modules/monitoring';
export { ForecastingModule } from './modules/forecasting';
export { WebhooksModule } from './modules/webhooks';
// Contract ABIs (optional export for advanced users)
export { default as MerchantRegistryABI } from './contracts/abis/iso/MerchantRegistry.json';
export { default as TransactionVaultABI } from './contracts/abis/iso/TransactionVault.json';
export { default as RepPerformanceABI } from './contracts/abis/iso/RepPerformance.json';
export { default as ResidualCalculatorABI } from './contracts/abis/iso/ResidualCalculator.json';
export { default as AccessControlRegistryABI } from './contracts/abis/iso/AccessControlRegistry.json';
export { default as DataProofRegistryABI } from './contracts/abis/iso/DataProofRegistry.json';
export { default as VarityWalletFactoryABI } from './contracts/abis/iso/VarityWalletFactory.json';
// Thirdweb Integration (NEW in v2.0.0-beta.2, Complete in v2.0.0-alpha.1)
export { 
// Core
ThirdwebWrapper, createThirdwebWrapper, 
// Engine
EngineClient, createEngineClient, parseEngineWebhook, verifyEngineWebhook, 
// Nebula AI
NebulaClient, createNebulaClient, 
// Storage
StorageClient, createStorageClient, 
// Bridge
BridgeClient, createBridgeClient, 
// Gateway
GatewayClient, createGatewayClient, 
// x402 Payment
x402Client, createx402Client, x402Middleware, } from './thirdweb';
export { varietyTestnet, getVarityChain, isVarityChain, VARITY_TESTNET_RPC, VARITY_CHAIN_METADATA } from './thirdweb/varity-chain';
// Multi-Chain Configuration (NEW in v2.0.0-alpha.1)
export { ChainRegistry, SUPPORTED_CHAINS, TESTNET_CHAINS, MAINNET_CHAINS, DEFAULT_CHAIN, chains, 
// Varity L3
varityL3, varityL3Testnet, varityL3Wagmi, USDC_DECIMALS, VARITY_USDC_ADDRESS, formatUSDC, parseUSDC, formatAddress, getVarityExplorerUrl, 
// Arbitrum
arbitrum, arbitrumOne, arbitrumSepolia, arbitrumOneWagmi, arbitrumSepoliaWagmi, getArbitrumExplorerUrl, 
// Base
base, baseSepolia, baseWagmi, baseSepoliaWagmi, getBaseExplorerUrl, } from './chains';
// Version
export const VERSION = '2.0.0-alpha.1';
export const SDK_VERSION = '2.0.0-alpha.1'; // Multi-chain support + thirdweb Engine integration
//# sourceMappingURL=index.js.map