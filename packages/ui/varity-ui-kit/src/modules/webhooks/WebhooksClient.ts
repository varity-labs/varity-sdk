/**
 * Webhooks Client - Webhook management
 *
 * Handles webhook registration and management via API server
 */

import { HTTPClient } from '../../utils/http'
import { JSONObject } from '@varity-labs/types'

export interface RegisterWebhookOptions {
  url: string
  events: string[]
  secret?: string
  description?: string
  headers?: Record<string, string>
}

export interface Webhook {
  id: string
  url: string
  events: string[]
  status: 'active' | 'inactive' | 'failed'
  createdAt: string
  lastDeliveryAt?: string
}

export interface DeliveryLog {
  id: string
  webhookId: string
  event: string
  status: 'success' | 'failed' | 'pending'
  statusCode?: number
  response?: string
  timestamp: string
}

export class WebhooksClient {
  constructor(private http: HTTPClient) {}

  /**
   * Register new webhook
   */
  async register(options: RegisterWebhookOptions): Promise<Webhook> {
    return this.http.post<Webhook>('/webhooks/register', options)
  }

  /**
   * List all webhooks
   */
  async list(): Promise<Webhook[]> {
    return this.http.get<Webhook[]>('/webhooks/list')
  }

  /**
   * Update webhook
   */
  async update(webhookId: string, updates: Partial<RegisterWebhookOptions>): Promise<Webhook> {
    return this.http.put<Webhook>(`/webhooks/${webhookId}`, updates)
  }

  /**
   * Delete webhook
   */
  async delete(webhookId: string): Promise<void> {
    return this.http.delete<void>(`/webhooks/${webhookId}`)
  }

  /**
   * Test webhook
   */
  async test(webhookId: string): Promise<{ success: boolean; response?: string }> {
    return this.http.post<{ success: boolean; response?: string }>(`/webhooks/${webhookId}/test`)
  }

  /**
   * Get delivery logs
   */
  async logs(webhookId: string, limit?: number): Promise<DeliveryLog[]> {
    return this.http.get<DeliveryLog[]>(`/webhooks/${webhookId}/logs`, {
      params: { limit }
    })
  }

  /**
   * Manually deliver event
   */
  async deliver(event: string, payload: JSONObject): Promise<void> {
    return this.http.post<void>('/webhooks/deliver', { event, payload })
  }

  /**
   * Get available events
   */
  async events(): Promise<string[]> {
    return this.http.get<string[]>('/webhooks/events')
  }

  /**
   * Get webhook statistics
   */
  async stats(webhookId: string): Promise<WebhookStats> {
    return this.http.get<WebhookStats>(`/webhooks/${webhookId}/stats`)
  }
}

/**
 * Webhook statistics response
 */
export interface WebhookStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  lastDeliveryAt?: string;
}
