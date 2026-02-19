/**
 * Varity SDK v1 - Main SDK Class
 *
 * Entry point for all Varity SDK functionality.
 * Provides access to ISO Dashboard modules and shared utilities.
 */

import { ethers } from 'ethers'
import { VaritySDKConfig, NetworkConfig } from './types'
import { getNetworkConfig, validateContractAddresses, DEFAULT_CONFIG } from './config'
import { TemplateConfig, templateRegistry, validateTemplate } from './template'
import './template-loader' // Auto-load built-in templates
import { AuthModule } from '../modules/auth'
import { StorageModule } from '../modules/storage'
import { S3Module } from '../modules/storage/S3Module'
import { ComputeModule } from '../modules/compute'
import { ZKModule } from '../modules/zk'
import { ContractsModule } from '../modules/contracts'
import { OracleModule } from '../modules/oracle'
import { AnalyticsModule } from '../modules/analytics'
import { NotificationsModule } from '../modules/notifications'
import { ExportModule } from '../modules/export'
import { CacheModule } from '../modules/cache'
import { MonitoringModule } from '../modules/monitoring'
import { ForecastingModule } from '../modules/forecasting'
import { WebhooksModule } from '../modules/webhooks'

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
export class VaritySDK {
  // Core properties
  private config: VaritySDKConfig
  private networkConfig: NetworkConfig
  private provider: ethers.Provider | null = null
  private signer: ethers.Signer | null = null
  private connected: boolean = false
  private templateConfig: TemplateConfig | null = null

  // Capability modules (universal - work across all templates)
  public auth: AuthModule
  public storage: StorageModule
  public s3: S3Module | undefined  // S3-compatible storage (optional)
  public compute: ComputeModule
  public zk: ZKModule
  public contracts: ContractsModule
  public oracle: OracleModule
  public analytics: AnalyticsModule
  public notifications: NotificationsModule
  public export: ExportModule
  public cache: CacheModule
  public monitoring: MonitoringModule
  public forecasting: ForecastingModule
  public webhooks: WebhooksModule

  /**
   * Create a new Varity SDK instance
   *
   * @param config - SDK configuration
   */
  constructor(config: Partial<VaritySDKConfig> = {}) {
    // Merge with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    } as VaritySDKConfig

    // Get network configuration
    this.networkConfig = getNetworkConfig(this.config.network)

    // Load template configuration if specified
    if (this.config.template) {
      this.templateConfig = templateRegistry.get(this.config.template) || null
      if (!this.templateConfig) {
        console.warn(
          `Warning: Template '${this.config.template}' not found in registry. ` +
          `SDK will operate with default configuration.`
        )
      }
    }

    // Apply custom template config overrides
    if (this.config.templateConfig && this.templateConfig) {
      this.templateConfig = { ...this.templateConfig, ...this.config.templateConfig }
    } else if (this.config.templateConfig) {
      this.templateConfig = this.config.templateConfig
    }

    // Validate template if loaded
    if (this.templateConfig) {
      const validation = validateTemplate(this.templateConfig)
      if (!validation.valid) {
        console.warn(
          `Warning: Template validation failed:\n` +
          validation.errors.join('\n')
        )
      }
    }

    // Validate contract addresses are configured (warning only, not blocking)
    try {
      validateContractAddresses(this.config.network)
    } catch (error) {
      console.warn(
        `Warning: ${error instanceof Error ? error.message : 'Contract validation failed'}\n` +
        `SDK will operate in read-only mode until contracts are deployed.`
      )
    }

    // Initialize capability modules (universal - work across ALL templates)
    this.auth = new AuthModule(this)
    this.storage = new StorageModule(this)
    this.compute = new ComputeModule(this)
    this.zk = new ZKModule(this)
    this.contracts = new ContractsModule(this)
    this.oracle = new OracleModule(this)
    this.analytics = new AnalyticsModule(this)
    this.notifications = new NotificationsModule(this)
    this.export = new ExportModule(this)
    this.cache = new CacheModule(this)
    this.monitoring = new MonitoringModule(this)
    this.forecasting = new ForecastingModule(this)
    this.webhooks = new WebhooksModule(this)

    // Initialize S3 module if S3 config provided
    if (this.config.s3Config) {
      this.s3 = new S3Module(this, this.config.s3Config)
    }

    const moduleCount = 13 + (this.s3 ? 1 : 0)
  }

  /**
   * Connect to the blockchain network
   *
   * @param walletProvider - Optional wallet provider (e.g., window.ethereum)
   * @returns Promise that resolves when connected
   */
  async connect(walletProvider?: any): Promise<void> {
    try {
      // Priority 1: Use provided wallet provider
      if (walletProvider) {
        const browserProvider = new ethers.BrowserProvider(walletProvider)
        this.provider = browserProvider
        this.signer = await browserProvider.getSigner()
      }
      // Priority 2: Use configured wallet provider
      else if (this.config.walletProvider) {
        const browserProvider = new ethers.BrowserProvider(this.config.walletProvider)
        this.provider = browserProvider
        this.signer = await browserProvider.getSigner()
      }
      // Priority 3: Use private key (server-side)
      else if (this.config.privateKey) {
        this.provider = new ethers.JsonRpcProvider(
          this.config.rpcUrl || this.networkConfig.rpcUrl
        )
        this.signer = new ethers.Wallet(this.config.privateKey, this.provider)
      }
      // Priority 4: Read-only mode
      else {
        this.provider = new ethers.JsonRpcProvider(
          this.config.rpcUrl || this.networkConfig.rpcUrl
        )
        console.warn(
          'Connected in read-only mode. Provide a wallet or private key for write operations.'
        )
      }

      // Verify network
      const network = await this.provider.getNetwork()
      if (Number(network.chainId) !== this.networkConfig.chainId) {
        throw new Error(
          `Network mismatch: Expected chain ID ${this.networkConfig.chainId}, ` +
          `but connected to ${network.chainId}`
        )
      }

      this.connected = true
      console.log(`✅ Connected to ${this.config.network} (Chain ID: ${network.chainId})`)
    } catch (error) {
      throw new Error(
        `Failed to connect to network: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Disconnect from the network
   */
  async disconnect(): Promise<void> {
    this.provider = null
    this.signer = null
    this.connected = false
    console.log('Disconnected from network')
  }

  /**
   * Check if SDK is connected
   */
  isConnected(): boolean {
    return this.connected
  }

  /**
   * Get the current provider
   */
  getProvider(): ethers.Provider {
    if (!this.provider) {
      throw new Error('SDK not connected. Call connect() first.')
    }
    return this.provider
  }

  /**
   * Get the current signer (throws if read-only)
   */
  getSigner(): ethers.Signer {
    if (!this.signer) {
      throw new Error('No signer available. SDK is in read-only mode.')
    }
    return this.signer
  }

  /**
   * Get SDK configuration
   */
  getConfig(): VaritySDKConfig {
    return { ...this.config }
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(): NetworkConfig {
    return { ...this.networkConfig }
  }

  /**
   * Get contract address by name
   */
  getContractAddress(contractName: keyof NetworkConfig['contracts']): string {
    const address = this.networkConfig.contracts[contractName]
    if (!address || address === '') {
      throw new Error(
        `Contract ${contractName} not deployed on ${this.config.network}. ` +
        `Please deploy contracts or check configuration.`
      )
    }
    return address
  }

  /**
   * Get block number
   */
  async getBlockNumber(): Promise<number> {
    const provider = this.getProvider()
    return await provider.getBlockNumber()
  }

  /**
   * Get wallet address (if signer available)
   */
  async getAddress(): Promise<string> {
    const signer = this.getSigner()
    return await signer.getAddress()
  }

  /**
   * Get wallet balance (if signer available)
   */
  async getBalance(): Promise<bigint> {
    const signer = this.getSigner()
    const address = await signer.getAddress()
    const provider = this.getProvider()
    return await provider.getBalance(address)
  }

  /**
   * Format balance to ETH
   */
  formatBalance(balance: bigint): string {
    return ethers.formatEther(balance)
  }

  /**
   * Parse ETH to Wei
   */
  parseEther(value: string): bigint {
    return ethers.parseEther(value)
  }

  /**
   * Get backend API base URL
   */
  getAPIEndpoint(): string {
    return this.config.apiEndpoint || DEFAULT_CONFIG.apiEndpoint
  }

  /**
   * Get API key for backend services
   */
  getAPIKey(): string | undefined {
    return this.config.apiKey
  }

  /**
   * Get current template configuration
   *
   * @returns Template configuration or null if no template loaded
   */
  getTemplate(): TemplateConfig | null {
    return this.templateConfig
  }

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
  loadTemplate(template: string | TemplateConfig): TemplateConfig {
    if (typeof template === 'string') {
      const config = templateRegistry.get(template as any)
      if (!config) {
        throw new Error(`Template '${template}' not found in registry`)
      }
      this.templateConfig = config
    } else {
      const validation = validateTemplate(template)
      if (!validation.valid) {
        throw new Error(`Invalid template configuration:\n${validation.errors.join('\n')}`)
      }
      this.templateConfig = template
    }

    return this.templateConfig
  }

  /**
   * Check if template is loaded
   */
  hasTemplate(): boolean {
    return this.templateConfig !== null
  }
}

/**
 * Create a new Varity SDK instance (convenience function)
 *
 * @param config - SDK configuration
 * @returns Configured SDK instance
 */
export function createVaritySDK(config: Partial<VaritySDKConfig> = {}): VaritySDK {
  return new VaritySDK(config)
}
