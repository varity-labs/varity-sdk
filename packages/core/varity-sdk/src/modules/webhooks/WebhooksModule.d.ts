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
import type { VaritySDK } from '../../core/VaritySDK';
/**
 * Webhook status
 */
export type WebhookStatus = 'active' | 'paused' | 'disabled' | 'failed';
/**
 * Webhook delivery status
 */
export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying';
/**
 * HTTP method for webhook delivery
 */
export type HttpMethod = 'POST' | 'PUT' | 'PATCH';
/**
 * Retry strategy
 */
export type RetryStrategy = 'exponential' | 'linear' | 'fixed';
/**
 * Options for registering a webhook
 */
export interface RegisterWebhookOptions {
    /** Webhook endpoint URL */
    url: string;
    /** Events to subscribe to */
    events: string[];
    /** Optional webhook name/description */
    name?: string;
    /** Secret key for signature verification */
    secret?: string;
    /** HTTP method (default: POST) */
    method?: HttpMethod;
    /** Custom headers to include in requests */
    headers?: Record<string, string>;
    /** Event filters */
    filters?: Record<string, any>;
    /** Retry configuration */
    retry?: {
        /** Maximum retry attempts */
        max_attempts?: number;
        /** Retry strategy */
        strategy?: RetryStrategy;
        /** Initial delay in seconds */
        initial_delay?: number;
        /** Maximum delay in seconds */
        max_delay?: number;
    };
    /** Timeout in seconds */
    timeout?: number;
    /** Enable/disable immediately */
    enabled?: boolean;
}
/**
 * Options for updating a webhook
 */
export interface UpdateWebhookOptions {
    /** New webhook URL */
    url?: string;
    /** Update event subscriptions */
    events?: string[];
    /** Update name */
    name?: string;
    /** Update secret key */
    secret?: string;
    /** Update HTTP method */
    method?: HttpMethod;
    /** Update headers */
    headers?: Record<string, string>;
    /** Update filters */
    filters?: Record<string, any>;
    /** Update retry configuration */
    retry?: RegisterWebhookOptions['retry'];
    /** Update timeout */
    timeout?: number;
    /** Update enabled status */
    enabled?: boolean;
}
/**
 * Options for listing webhooks
 */
export interface ListWebhooksOptions {
    /** Filter by status */
    status?: WebhookStatus;
    /** Filter by event subscription */
    event?: string;
    /** Pagination offset */
    offset?: number;
    /** Page size */
    limit?: number;
}
/**
 * Options for testing a webhook
 */
export interface TestWebhookOptions {
    /** Test event name */
    event?: string;
    /** Test payload */
    payload?: Record<string, any>;
    /** Override URL for test */
    url?: string;
}
/**
 * Options for querying delivery logs
 */
export interface GetLogsOptions {
    /** Filter by webhook ID */
    webhook_id?: string;
    /** Filter by delivery status */
    status?: DeliveryStatus;
    /** Filter by event type */
    event?: string;
    /** Start date (ISO string) */
    start_date?: string;
    /** End date (ISO string) */
    end_date?: string;
    /** Pagination offset */
    offset?: number;
    /** Page size */
    limit?: number;
}
/**
 * Options for manual webhook delivery
 */
export interface DeliverEventOptions {
    /** Event name */
    event: string;
    /** Event payload */
    payload: Record<string, any>;
    /** Target specific webhook IDs (omit to send to all subscribed) */
    webhook_ids?: string[];
    /** Additional metadata */
    metadata?: Record<string, any>;
}
/**
 * Registered webhook
 */
export interface Webhook {
    /** Webhook ID */
    id: string;
    /** Webhook URL */
    url: string;
    /** Subscribed events */
    events: string[];
    /** Webhook name/description */
    name?: string;
    /** HTTP method */
    method: HttpMethod;
    /** Custom headers */
    headers?: Record<string, string>;
    /** Event filters */
    filters?: Record<string, any>;
    /** Retry configuration */
    retry: {
        max_attempts: number;
        strategy: RetryStrategy;
        initial_delay: number;
        max_delay: number;
    };
    /** Timeout in seconds */
    timeout: number;
    /** Status */
    status: WebhookStatus;
    /** Creation timestamp */
    created_at: string;
    /** Last updated timestamp */
    updated_at: string;
    /** Last delivery timestamp */
    last_delivery_at?: string;
    /** Statistics */
    stats: {
        /** Total deliveries attempted */
        total_deliveries: number;
        /** Successful deliveries */
        successful_deliveries: number;
        /** Failed deliveries */
        failed_deliveries: number;
        /** Success rate (0-1) */
        success_rate: number;
    };
}
/**
 * Webhook delivery log entry
 */
export interface DeliveryLog {
    /** Log entry ID */
    id: string;
    /** Webhook ID */
    webhook_id: string;
    /** Event name */
    event: string;
    /** Event payload */
    payload: Record<string, any>;
    /** Delivery status */
    status: DeliveryStatus;
    /** HTTP status code */
    http_status?: number;
    /** Response body */
    response_body?: string;
    /** Error message */
    error?: string;
    /** Attempt number */
    attempt: number;
    /** Maximum attempts */
    max_attempts: number;
    /** Delivery timestamp */
    delivered_at?: string;
    /** Next retry timestamp */
    next_retry_at?: string;
    /** Request headers sent */
    request_headers?: Record<string, string>;
    /** Response headers received */
    response_headers?: Record<string, string>;
    /** Request duration in milliseconds */
    duration_ms?: number;
    /** Created timestamp */
    created_at: string;
}
/**
 * Available webhook events
 */
export interface AvailableEvent {
    /** Event name */
    name: string;
    /** Event description */
    description: string;
    /** Event category */
    category: string;
    /** Example payload schema */
    payload_schema?: Record<string, any>;
}
/**
 * Webhook statistics
 */
export interface WebhookStats {
    /** Total registered webhooks */
    total_webhooks: number;
    /** Active webhooks */
    active_webhooks: number;
    /** Total deliveries (last 30 days) */
    total_deliveries: number;
    /** Successful deliveries */
    successful_deliveries: number;
    /** Failed deliveries */
    failed_deliveries: number;
    /** Average success rate */
    average_success_rate: number;
    /** Deliveries by status */
    by_status: Record<DeliveryStatus, number>;
    /** Deliveries by event */
    by_event: Array<{
        event: string;
        count: number;
    }>;
    /** Recent errors */
    recent_errors: Array<{
        webhook_id: string;
        error: string;
        timestamp: string;
    }>;
}
/**
 * Test delivery result
 */
export interface TestDeliveryResult {
    /** Success status */
    success: boolean;
    /** HTTP status code */
    http_status?: number;
    /** Response body */
    response_body?: string;
    /** Error message */
    error?: string;
    /** Request duration in milliseconds */
    duration_ms: number;
    /** Timestamp */
    tested_at: string;
}
/**
 * Webhooks Module
 *
 * Provides webhook management and event delivery for integrations
 * Works universally across all templates with template-specific events
 */
export declare class WebhooksModule {
    private sdk;
    constructor(sdk: VaritySDK);
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
    register(options: RegisterWebhookOptions): Promise<Webhook>;
    /**
     * Get webhook by ID
     *
     * @param webhookId - Webhook ID
     * @returns Webhook configuration
     */
    get(webhookId: string): Promise<Webhook>;
    /**
     * List all webhooks
     *
     * @param options - List options
     * @returns List of webhooks
     */
    list(options?: ListWebhooksOptions): Promise<{
        webhooks: Webhook[];
        total: number;
    }>;
    /**
     * Update webhook configuration
     *
     * @param webhookId - Webhook ID
     * @param options - Update options
     * @returns Updated webhook configuration
     */
    update(webhookId: string, options: UpdateWebhookOptions): Promise<Webhook>;
    /**
     * Delete a webhook
     *
     * @param webhookId - Webhook ID to delete
     * @returns Success status
     */
    delete(webhookId: string): Promise<{
        success: boolean;
    }>;
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
    test(webhookId: string, options?: TestWebhookOptions): Promise<TestDeliveryResult>;
    /**
     * Pause webhook delivery
     *
     * @param webhookId - Webhook ID to pause
     * @returns Updated webhook configuration
     */
    pause(webhookId: string): Promise<Webhook>;
    /**
     * Resume webhook delivery
     *
     * @param webhookId - Webhook ID to resume
     * @returns Updated webhook configuration
     */
    resume(webhookId: string): Promise<Webhook>;
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
    getLogs(options?: GetLogsOptions): Promise<{
        logs: DeliveryLog[];
        total: number;
    }>;
    /**
     * Get delivery log by ID
     *
     * @param logId - Log entry ID
     * @returns Delivery log details
     */
    getLog(logId: string): Promise<DeliveryLog>;
    /**
     * Retry failed webhook delivery
     *
     * @param logId - Log entry ID to retry
     * @returns Updated delivery log
     */
    retry(logId: string): Promise<DeliveryLog>;
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
    deliverEvent(options: DeliverEventOptions): Promise<{
        delivered: number;
        failed: number;
    }>;
    /**
     * Get available webhook events
     *
     * @returns List of available events
     */
    getAvailableEvents(): Promise<AvailableEvent[]>;
    /**
     * Get webhook statistics
     *
     * @returns Webhook statistics
     */
    getStats(): Promise<WebhookStats>;
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
    verifySignature(payload: string, signature: string, secret: string): Promise<boolean>;
}
//# sourceMappingURL=WebhooksModule.d.ts.map