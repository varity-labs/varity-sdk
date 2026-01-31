/**
 * Varity SDK v1 - Main SDK Class
 *
 * Entry point for all Varity SDK functionality.
 * Provides access to ISO Dashboard modules and shared utilities.
 */
import { ethers } from 'ethers';
import { VaritySDKConfig, NetworkConfig } from './types';
import { TemplateConfig } from './template';
import './template-loader';
import { AuthModule } from '../modules/auth';
import { StorageModule } from '../modules/storage';
import { S3Module } from '../modules/storage/S3Module';
import { ComputeModule } from '../modules/compute';
import { ZKModule } from '../modules/zk';
import { ContractsModule } from '../modules/contracts';
import { OracleModule } from '../modules/oracle';
import { AnalyticsModule } from '../modules/analytics';
import { NotificationsModule } from '../modules/notifications';
import { ExportModule } from '../modules/export';
import { CacheModule } from '../modules/cache';
import { MonitoringModule } from '../modules/monitoring';
import { ForecastingModule } from '../modules/forecasting';
import { WebhooksModule } from '../modules/webhooks';
/**
 * Main Varity SDK class
 *
 * **Capability-based architecture** - Universal methods that work across all templates
 *
 * @example
 * ```typescript
 * import { VaritySDK } from '@varity-labs/sdk'
 *
 * const sdk = new VaritySDK({
 *   network: 'arbitrum-sepolia',
 *   apiKey: 'your-api-key'
 * })
 *
 * await sdk.connect()
 *
 * // Universal capability modules (work for ALL templates)
 * await sdk.auth.login({ address: '0x...' })
 * const encrypted = await sdk.storage.uploadEncrypted(data)
 * const insights = await sdk.compute.query("Analyze performance")
 * await sdk.contracts.send('MerchantRegistry', 'registerMerchant', [...])
 * const proof = await sdk.zk.generateProof('login', { public: [...], private: [...] })
 * const price = await sdk.oracle.getPrice('ETH')
 * const kpis = await sdk.analytics.getKPIs({ period: 'current_month' })
 * const forecast = await sdk.forecasting.predict({ metric: 'revenue', periods: 12, interval: 'month' })
 * await sdk.webhooks.register({ url: 'https://api.example.com/webhook', events: ['transaction.created'] })
 * ```
 */
export declare class VaritySDK {
    private config;
    private networkConfig;
    private provider;
    private signer;
    private connected;
    private templateConfig;
    auth: AuthModule;
    storage: StorageModule;
    s3: S3Module | undefined;
    compute: ComputeModule;
    zk: ZKModule;
    contracts: ContractsModule;
    oracle: OracleModule;
    analytics: AnalyticsModule;
    notifications: NotificationsModule;
    export: ExportModule;
    cache: CacheModule;
    monitoring: MonitoringModule;
    forecasting: ForecastingModule;
    webhooks: WebhooksModule;
    /**
     * Create a new Varity SDK instance
     *
     * @param config - SDK configuration
     */
    constructor(config?: Partial<VaritySDKConfig>);
    /**
     * Connect to the blockchain network
     *
     * @param walletProvider - Optional wallet provider (e.g., window.ethereum)
     * @returns Promise that resolves when connected
     */
    connect(walletProvider?: any): Promise<void>;
    /**
     * Disconnect from the network
     */
    disconnect(): Promise<void>;
    /**
     * Check if SDK is connected
     */
    isConnected(): boolean;
    /**
     * Get the current provider
     */
    getProvider(): ethers.Provider;
    /**
     * Get the current signer (throws if read-only)
     */
    getSigner(): ethers.Signer;
    /**
     * Get SDK configuration
     */
    getConfig(): VaritySDKConfig;
    /**
     * Get network configuration
     */
    getNetworkConfig(): NetworkConfig;
    /**
     * Get contract address by name
     */
    getContractAddress(contractName: keyof NetworkConfig['contracts']): string;
    /**
     * Get block number
     */
    getBlockNumber(): Promise<number>;
    /**
     * Get wallet address (if signer available)
     */
    getAddress(): Promise<string>;
    /**
     * Get wallet balance (if signer available)
     */
    getBalance(): Promise<bigint>;
    /**
     * Format balance to ETH
     */
    formatBalance(balance: bigint): string;
    /**
     * Parse ETH to Wei
     */
    parseEther(value: string): bigint;
    /**
     * Get backend API base URL
     */
    getAPIEndpoint(): string;
    /**
     * Get API key for backend services
     */
    getAPIKey(): string | undefined;
    /**
     * Get current template configuration
     *
     * @returns Template configuration or null if no template loaded
     */
    getTemplate(): TemplateConfig | null;
    /**
     * Load template configuration
     *
     * @param template - Template type or custom configuration
     * @returns Loaded template configuration
     *
     * @example
     * ```typescript
     * // Load built-in template
     * await sdk.loadTemplate('iso')
     *
     * // Load custom template
     * await sdk.loadTemplate(customTemplateConfig)
     * ```
     */
    loadTemplate(template: string | TemplateConfig): TemplateConfig;
    /**
     * Check if template is loaded
     */
    hasTemplate(): boolean;
}
/**
 * Create a new Varity SDK instance (convenience function)
 *
 * @param config - SDK configuration
 * @returns Configured SDK instance
 */
export declare function createVaritySDK(config?: Partial<VaritySDKConfig>): VaritySDK;
//# sourceMappingURL=VaritySDK.d.ts.map