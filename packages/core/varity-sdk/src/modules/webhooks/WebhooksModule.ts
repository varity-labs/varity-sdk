/**
 * Webhooks Module
 *
 * Universal webhook management for event-driven integrations
 * Works across ALL templates (ISO, Healthcare, Finance, Retail)
 *
 * @example
 * ```typescript
 * // Register a webhook
 * const webhook = await sdk.webhooks.register({
 *   url: 'https://api.example.com/webhooks',
 *   events: ['transaction.created', 'user.updated'],
 *   secret: 'your-secret-key'
 * })
 *
 * // Test webhook delivery
 * await sdk.webhooks.test(webhook.id, { test_event: 'data' })
 *
 * // Get delivery logs
 * const logs = await sdk.webhooks.getLogs({ webhook_id: webhook.id })
 * ```
 */

import type { VaritySDK } from '../../core/VaritySDK'

// ============================================================================
// TYPES - Webhooks
// ============================================================================

/**
 * Webhook status
 */
export type WebhookStatus = 'active' | 'paused' | 'disabled' | 'failed'

/**
 * Webhook delivery status
 */
export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying'

/**
 * HTTP method for webhook delivery
 */
export type HttpMethod = 'POST' | 'PUT' | 'PATCH'

/**
 * Retry strategy
 */
export type RetryStrategy = 'exponential' | 'linear' | 'fixed'

// ============================================================================
// TYPES - Webhook Configuration
// ============================================================================

/**
 * Options for registering a webhook
 */
export interface RegisterWebhookOptions {
  /** Webhook endpoint URL */
  url: string
  /** Events to subscribe to */
  events: string[]
  /** Optional webhook name/description */
  name?: string
  /** Secret key for signature verification */
  secret?: string
  /** HTTP method (default: POST) */
  method?: HttpMethod
  /** Custom headers to include in requests */
  headers?: Record<string, string>
  /** Event filters */
  filters?: Record<string, any>
  /** Retry configuration */
  retry?: {
    /** Maximum retry attempts */
    max_attempts?: number
    /** Retry strategy */
    strategy?: RetryStrategy
    /** Initial delay in seconds */
    initial_delay?: number
    /** Maximum delay in seconds */
    max_delay?: number
  }
  /** Timeout in seconds */
  timeout?: number
  /** Enable/disable immediately */
  enabled?: boolean
}

/**
 * Options for updating a webhook
 */
export interface UpdateWebhookOptions {
  /** New webhook URL */
  url?: string
  /** Update event subscriptions */
  events?: string[]
  /** Update name */
  name?: string
  /** Update secret key */
  secret?: string
  /** Update HTTP method */
  method?: HttpMethod
  /** Update headers */
  headers?: Record<string, string>
  /** Update filters */
  filters?: Record<string, any>
  /** Update retry configuration */
  retry?: RegisterWebhookOptions['retry']
  /** Update timeout */
  timeout?: number
  /** Update enabled status */
  enabled?: boolean
}

/**
 * Options for listing webhooks
 */
export interface ListWebhooksOptions {
  /** Filter by status */
  status?: WebhookStatus
  /** Filter by event subscription */
  event?: string
  /** Pagination offset */
  offset?: number
  /** Page size */
  limit?: number
}

/**
 * Options for testing a webhook
 */
export interface TestWebhookOptions {
  /** Test event name */
  event?: string
  /** Test payload */
  payload?: Record<string, any>
  /** Override URL for test */
  url?: string
}

/**
 * Options for querying delivery logs
 */
export interface GetLogsOptions {
  /** Filter by webhook ID */
  webhook_id?: string
  /** Filter by delivery status */
  status?: DeliveryStatus
  /** Filter by event type */
  event?: string
  /** Start date (ISO string) */
  start_date?: string
  /** End date (ISO string) */
  end_date?: string
  /** Pagination offset */
  offset?: number
  /** Page size */
  limit?: number
}

/**
 * Options for manual webhook delivery
 */
export interface DeliverEventOptions {
  /** Event name */
  event: string
  /** Event payload */
  payload: Record<string, any>
  /** Target specific webhook IDs (omit to send to all subscribed) */
  webhook_ids?: string[]
  /** Additional metadata */
  metadata?: Record<string, any>
}

// ============================================================================
// TYPES - Webhook Results
// ============================================================================

/**
 * Registered webhook
 */
export interface Webhook {
  /** Webhook ID */
  id: string
  /** Webhook URL */
  url: string
  /** Subscribed events */
  events: string[]
  /** Webhook name/description */
  name?: string
  /** HTTP method */
  method: HttpMethod
  /** Custom headers */
  headers?: Record<string, string>
  /** Event filters */
  filters?: Record<string, any>
  /** Retry configuration */
  retry: {
    max_attempts: number
    strategy: RetryStrategy
    initial_delay: number
    max_delay: number
  }
  /** Timeout in seconds */
  timeout: number
  /** Status */
  status: WebhookStatus
  /** Creation timestamp */
  created_at: string
  /** Last updated timestamp */
  updated_at: string
  /** Last delivery timestamp */
  last_delivery_at?: string
  /** Statistics */
  stats: {
    /** Total deliveries attempted */
    total_deliveries: number
    /** Successful deliveries */
    successful_deliveries: number
    /** Failed deliveries */
    failed_deliveries: number
    /** Success rate (0-1) */
    success_rate: number
  }
}

/**
 * Webhook delivery log entry
 */
export interface DeliveryLog {
  /** Log entry ID */
  id: string
  /** Webhook ID */
  webhook_id: string
  /** Event name */
  event: string
  /** Event payload */
  payload: Record<string, any>
  /** Delivery status */
  status: DeliveryStatus
  /** HTTP status code */
  http_status?: number
  /** Response body */
  response_body?: string
  /** Error message */
  error?: string
  /** Attempt number */
  attempt: number
  /** Maximum attempts */
  max_attempts: number
  /** Delivery timestamp */
  delivered_at?: string
  /** Next retry timestamp */
  next_retry_at?: string
  /** Request headers sent */
  request_headers?: Record<string, string>
  /** Response headers received */
  response_headers?: Record<string, string>
  /** Request duration in milliseconds */
  duration_ms?: number
  /** Created timestamp */
  created_at: string
}

/**
 * Available webhook events
 */
export interface AvailableEvent {
  /** Event name */
  name: string
  /** Event description */
  description: string
  /** Event category */
  category: string
  /** Example payload schema */
  payload_schema?: Record<string, any>
}

/**
 * Webhook statistics
 */
export interface WebhookStats {
  /** Total registered webhooks */
  total_webhooks: number
  /** Active webhooks */
  active_webhooks: number
  /** Total deliveries (last 30 days) */
  total_deliveries: number
  /** Successful deliveries */
  successful_deliveries: number
  /** Failed deliveries */
  failed_deliveries: number
  /** Average success rate */
  average_success_rate: number
  /** Deliveries by status */
  by_status: Record<DeliveryStatus, number>
  /** Deliveries by event */
  by_event: Array<{
    event: string
    count: number
  }>
  /** Recent errors */
  recent_errors: Array<{
    webhook_id: string
    error: string
    timestamp: string
  }>
}

/**
 * Test delivery result
 */
export interface TestDeliveryResult {
  /** Success status */
  success: boolean
  /** HTTP status code */
  http_status?: number
  /** Response body */
  response_body?: string
  /** Error message */
  error?: string
  /** Request duration in milliseconds */
  duration_ms: number
  /** Timestamp */
  tested_at: string
}

// ============================================================================
// WEBHOOKS MODULE CLASS
// ============================================================================

/**
 * Webhooks Module
 *
 * Provides webhook management and event delivery for integrations
 * Works universally across all templates with template-specific events
 */
export class WebhooksModule {
  constructor(private sdk: VaritySDK) {}

  /**
   * Register a new webhook
   *
   * @param options - Webhook registration options
   * @returns Registered webhook configuration
   *
   * @example
   * ```typescript
   * const webhook = await sdk.webhooks.register({
   *   url: 'https://api.example.com/webhooks',
   *   events: ['transaction.created', 'user.updated'],
   *   secret: 'your-secret-key',
   *   retry: {
   *     max_attempts: 5,
   *     strategy: 'exponential'
   *   }
   * })
   * ```
   */
  async register(options: RegisterWebhookOptions): Promise<Webhook> {
    const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to register webhook: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get webhook by ID
   *
   * @param webhookId - Webhook ID
   * @returns Webhook configuration
   */
  async get(webhookId: string): Promise<Webhook> {
    const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/${webhookId}`, {
      headers: {
        ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get webhook: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * List all webhooks
   *
   * @param options - List options
   * @returns List of webhooks
   */
  async list(options?: ListWebhooksOptions): Promise<{ webhooks: Webhook[]; total: number }> {
    const params = new URLSearchParams()
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value))
      })
    }

    const response = await fetch(
      `${this.sdk.getAPIEndpoint()}/api/v1/webhooks?${params.toString()}`,
      {
        headers: {
          ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to list webhooks: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Update webhook configuration
   *
   * @param webhookId - Webhook ID
   * @param options - Update options
   * @returns Updated webhook configuration
   */
  async update(webhookId: string, options: UpdateWebhookOptions): Promise<Webhook> {
    const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/${webhookId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to update webhook: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Delete a webhook
   *
   * @param webhookId - Webhook ID to delete
   * @returns Success status
   */
  async delete(webhookId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: {
        ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to delete webhook: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Test webhook delivery
   *
   * @param webhookId - Webhook ID to test
   * @param options - Test options
   * @returns Test delivery result
   *
   * @example
   * ```typescript
   * const result = await sdk.webhooks.test('webhook-123', {
   *   event: 'test.event',
   *   payload: { test: true }
   * })
   * ```
   */
  async test(webhookId: string, options?: TestWebhookOptions): Promise<TestDeliveryResult> {
    const response = await fetch(
      `${this.sdk.getAPIEndpoint()}/api/v1/webhooks/${webhookId}/test`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
        },
        body: JSON.stringify(options || {})
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to test webhook: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Pause webhook delivery
   *
   * @param webhookId - Webhook ID to pause
   * @returns Updated webhook configuration
   */
  async pause(webhookId: string): Promise<Webhook> {
    return await this.update(webhookId, { enabled: false })
  }

  /**
   * Resume webhook delivery
   *
   * @param webhookId - Webhook ID to resume
   * @returns Updated webhook configuration
   */
  async resume(webhookId: string): Promise<Webhook> {
    return await this.update(webhookId, { enabled: true })
  }

  /**
   * Get webhook delivery logs
   *
   * @param options - Log query options
   * @returns Delivery logs
   *
   * @example
   * ```typescript
   * const logs = await sdk.webhooks.getLogs({
   *   webhook_id: 'webhook-123',
   *   status: 'failed',
   *   limit: 50
   * })
   * ```
   */
  async getLogs(options?: GetLogsOptions): Promise<{ logs: DeliveryLog[]; total: number }> {
    const params = new URLSearchParams()
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value))
      })
    }

    const response = await fetch(
      `${this.sdk.getAPIEndpoint()}/api/v1/webhooks/logs?${params.toString()}`,
      {
        headers: {
          ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get webhook logs: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get delivery log by ID
   *
   * @param logId - Log entry ID
   * @returns Delivery log details
   */
  async getLog(logId: string): Promise<DeliveryLog> {
    const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/logs/${logId}`, {
      headers: {
        ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get delivery log: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Retry failed webhook delivery
   *
   * @param logId - Log entry ID to retry
   * @returns Updated delivery log
   */
  async retry(logId: string): Promise<DeliveryLog> {
    const response = await fetch(
      `${this.sdk.getAPIEndpoint()}/api/v1/webhooks/logs/${logId}/retry`,
      {
        method: 'POST',
        headers: {
          ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to retry webhook delivery: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Manually deliver an event to webhooks
   *
   * @param options - Event delivery options
   * @returns Delivery result
   *
   * @example
   * ```typescript
   * await sdk.webhooks.deliverEvent({
   *   event: 'custom.event',
   *   payload: { data: 'important data' },
   *   webhook_ids: ['webhook-123'] // Optional: target specific webhooks
   * })
   * ```
   */
  async deliverEvent(options: DeliverEventOptions): Promise<{ delivered: number; failed: number }> {
    const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/deliver`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to deliver event: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get available webhook events
   *
   * @returns List of available events
   */
  async getAvailableEvents(): Promise<AvailableEvent[]> {
    const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/events`, {
      headers: {
        ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get available events: ${response.statusText}`)
    }

    const data = await response.json()
    return data.events
  }

  /**
   * Get webhook statistics
   *
   * @returns Webhook statistics
   */
  async getStats(): Promise<WebhookStats> {
    const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/stats`, {
      headers: {
        ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get webhook stats: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Verify webhook signature
   *
   * @param payload - Webhook payload (raw string)
   * @param signature - Signature header value
   * @param secret - Webhook secret key
   * @returns True if signature is valid
   *
   * @example
   * ```typescript
   * // In your webhook handler
   * const isValid = await sdk.webhooks.verifySignature(
   *   JSON.stringify(req.body),
   *   req.headers['x-webhook-signature'],
   *   'your-secret-key'
   * )
   * ```
   */
  async verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
    const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
      },
      body: JSON.stringify({ payload, signature, secret })
    })

    if (!response.ok) {
      throw new Error(`Failed to verify signature: ${response.statusText}`)
    }

    const data = await response.json()
    return data.valid
  }
}
