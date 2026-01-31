/**
 * Varity Client - Public Frontend SDK
 *
 * Lightweight API client for frontend applications.
 * NO blockchain dependencies - all operations via REST API.
 */

import { HTTPClient } from '../utils/http'
import { getAPIEndpoint, getFullAPIURL, API_BASE_PATH } from './config'

// Import module clients
import { AuthClient } from '../modules/auth'
import { StorageClient } from '../modules/storage'
import { ComputeClient } from '../modules/compute'
import { ZKClient } from '../modules/zk'
import { AnalyticsClient } from '../modules/analytics'
import { NotificationsClient } from '../modules/notifications'
import { ExportClient } from '../modules/export'
import { CacheClient } from '../modules/cache'
import { MonitoringClient } from '../modules/monitoring'
import { ForecastingClient } from '../modules/forecasting'
import { WebhooksClient } from '../modules/webhooks'
import { OracleClient } from '../modules/oracle'
import { TemplateDeploymentClient } from '../modules/templates'

export interface VarityClientConfig {
  /** API endpoint (defaults to localhost:3009 for development) */
  apiEndpoint?: string
  /** API key for authentication */
  apiKey?: string
  /** Request timeout in milliseconds */
  timeout?: number
}

/**
 * VarityClient - Main SDK class for frontend applications
 *
 * @example
 * ```typescript
 * import { VarityClient } from '@varity-labs/ui-kit'
 *
 * const client = new VarityClient({
 *   apiEndpoint: 'http://localhost:3009',
 *   apiKey: 'your-api-key'
 * })
 *
 * // Use modules
 * const merchants = await client.merchants.list()
 * const proof = await client.zk.proveMLInference('model-id', input, output)
 * ```
 */
export class VarityClient {
  private http: HTTPClient
  private apiEndpoint: string

  // Module instances
  public auth: AuthClient
  public storage: StorageClient
  public compute: ComputeClient
  public zk: ZKClient
  public analytics: AnalyticsClient
  public notifications: NotificationsClient
  public export: ExportClient
  public cache: CacheClient
  public monitoring: MonitoringClient
  public forecasting: ForecastingClient
  public webhooks: WebhooksClient
  public oracle: OracleClient
  public templates: TemplateDeploymentClient

  constructor(config: VarityClientConfig = {}) {
    this.apiEndpoint = getAPIEndpoint(config.apiEndpoint)

    // Initialize HTTP client
    this.http = new HTTPClient({
      baseURL: `${this.apiEndpoint}${API_BASE_PATH}`,
      apiKey: config.apiKey,
      timeout: config.timeout
    })

    // Initialize module clients
    this.auth = new AuthClient(this.http)
    this.storage = new StorageClient(this.http)
    this.compute = new ComputeClient(this.http)
    this.zk = new ZKClient(this.http)
    this.analytics = new AnalyticsClient(this.http)
    this.notifications = new NotificationsClient(this.http)
    this.export = new ExportClient(this.http)
    this.cache = new CacheClient(this.http)
    this.monitoring = new MonitoringClient(this.http)
    this.forecasting = new ForecastingClient(this.http)
    this.webhooks = new WebhooksClient(this.http)
    this.oracle = new OracleClient(this.http)
    this.templates = new TemplateDeploymentClient(this.http)
  }

  /**
   * Get the API endpoint URL
   */
  getAPIEndpoint(): string {
    return this.apiEndpoint
  }

  /**
   * Update API key
   */
  setAPIKey(apiKey: string): void {
    this.http.setAPIKey(apiKey)
  }

  /**
   * Get HTTP client (for advanced usage)
   */
  getHTTPClient(): HTTPClient {
    return this.http
  }
}
