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
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
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
    async register(options) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Failed to register webhook: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get webhook by ID
     *
     * @param webhookId - Webhook ID
     * @returns Webhook configuration
     */
    async get(webhookId) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/${webhookId}`, {
            headers: {
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to get webhook: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * List all webhooks
     *
     * @param options - List options
     * @returns List of webhooks
     */
    async list(options) {
        const params = new URLSearchParams();
        if (options) {
            Object.entries(options).forEach(([key, value]) => {
                if (value !== undefined)
                    params.append(key, String(value));
            });
        }
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks?${params.toString()}`, {
            headers: {
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to list webhooks: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Update webhook configuration
     *
     * @param webhookId - Webhook ID
     * @param options - Update options
     * @returns Updated webhook configuration
     */
    async update(webhookId, options) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/${webhookId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Failed to update webhook: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Delete a webhook
     *
     * @param webhookId - Webhook ID to delete
     * @returns Success status
     */
    async delete(webhookId) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/${webhookId}`, {
            method: 'DELETE',
            headers: {
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to delete webhook: ${response.statusText}`);
        }
        return await response.json();
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
    async test(webhookId, options) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/${webhookId}/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            },
            body: JSON.stringify(options || {})
        });
        if (!response.ok) {
            throw new Error(`Failed to test webhook: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Pause webhook delivery
     *
     * @param webhookId - Webhook ID to pause
     * @returns Updated webhook configuration
     */
    async pause(webhookId) {
        return await this.update(webhookId, { enabled: false });
    }
    /**
     * Resume webhook delivery
     *
     * @param webhookId - Webhook ID to resume
     * @returns Updated webhook configuration
     */
    async resume(webhookId) {
        return await this.update(webhookId, { enabled: true });
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
    async getLogs(options) {
        const params = new URLSearchParams();
        if (options) {
            Object.entries(options).forEach(([key, value]) => {
                if (value !== undefined)
                    params.append(key, String(value));
            });
        }
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/logs?${params.toString()}`, {
            headers: {
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to get webhook logs: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get delivery log by ID
     *
     * @param logId - Log entry ID
     * @returns Delivery log details
     */
    async getLog(logId) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/logs/${logId}`, {
            headers: {
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to get delivery log: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Retry failed webhook delivery
     *
     * @param logId - Log entry ID to retry
     * @returns Updated delivery log
     */
    async retry(logId) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/logs/${logId}/retry`, {
            method: 'POST',
            headers: {
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to retry webhook delivery: ${response.statusText}`);
        }
        return await response.json();
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
    async deliverEvent(options) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/deliver`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Failed to deliver event: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get available webhook events
     *
     * @returns List of available events
     */
    async getAvailableEvents() {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/events`, {
            headers: {
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to get available events: ${response.statusText}`);
        }
        const data = await response.json();
        return data.events;
    }
    /**
     * Get webhook statistics
     *
     * @returns Webhook statistics
     */
    async getStats() {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/stats`, {
            headers: {
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to get webhook stats: ${response.statusText}`);
        }
        return await response.json();
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
    async verifySignature(payload, signature, secret) {
        const response = await fetch(`${this.sdk.getAPIEndpoint()}/api/v1/webhooks/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.sdk.getAPIKey() && { 'X-API-Key': this.sdk.getAPIKey() })
            },
            body: JSON.stringify({ payload, signature, secret })
        });
        if (!response.ok) {
            throw new Error(`Failed to verify signature: ${response.statusText}`);
        }
        const data = await response.json();
        return data.valid;
    }
}
//# sourceMappingURL=WebhooksModule.js.map