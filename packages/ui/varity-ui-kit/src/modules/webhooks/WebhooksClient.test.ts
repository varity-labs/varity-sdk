/**
 * Unit tests for WebhooksClient
 */

import {
  WebhooksClient,
  RegisterWebhookOptions,
  Webhook,
  DeliveryLog
} from './WebhooksClient'
import { createMockHTTPClient, MockHTTPClient } from '../../tests/mocks/httpClient.mock'

describe('WebhooksClient', () => {
  let mockHttp: MockHTTPClient
  let webhooksClient: WebhooksClient

  beforeEach(() => {
    mockHttp = createMockHTTPClient()
    webhooksClient = new WebhooksClient(mockHttp)
  })

  afterEach(() => {
    mockHttp.clearMocks()
  })

  describe('register', () => {
    it('should register new webhook', async () => {
      const mockWebhook: Webhook = {
        id: 'webhook-123',
        url: 'https://example.com/webhook',
        events: ['user.created', 'user.updated'],
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z'
      }

      mockHttp.mockPost('/webhooks/register', mockWebhook)

      const options: RegisterWebhookOptions = {
        url: 'https://example.com/webhook',
        events: ['user.created', 'user.updated'],
        secret: 'secret123',
        description: 'User events webhook'
      }

      const result = await webhooksClient.register(options)

      expect(result).toEqual(mockWebhook)
      expect(result.status).toBe('active')
      expect(result.events).toHaveLength(2)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'POST',
        path: '/webhooks/register',
        data: options
      })
    })
  })

  describe('list', () => {
    it('should list all webhooks', async () => {
      const mockWebhooks: Webhook[] = [
        {
          id: 'webhook-1',
          url: 'https://example.com/webhook1',
          events: ['user.created'],
          status: 'active',
          createdAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'webhook-2',
          url: 'https://example.com/webhook2',
          events: ['payment.received'],
          status: 'active',
          createdAt: '2025-01-02T00:00:00Z'
        }
      ]

      mockHttp.mockGet('/webhooks/list', mockWebhooks)

      const result = await webhooksClient.list()

      expect(result).toEqual(mockWebhooks)
      expect(result).toHaveLength(2)
    })
  })

  describe('update', () => {
    it('should update webhook', async () => {
      const mockWebhook: Webhook = {
        id: 'webhook-123',
        url: 'https://example.com/webhook-updated',
        events: ['user.created', 'user.updated', 'user.deleted'],
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z'
      }

      mockHttp.mockPut('/webhooks/webhook-123', mockWebhook)

      const updates: Partial<RegisterWebhookOptions> = {
        url: 'https://example.com/webhook-updated',
        events: ['user.created', 'user.updated', 'user.deleted']
      }

      const result = await webhooksClient.update('webhook-123', updates)

      expect(result).toEqual(mockWebhook)
      expect(result.events).toHaveLength(3)
    })
  })

  describe('delete', () => {
    it('should delete webhook', async () => {
      mockHttp.mockDelete('/webhooks/webhook-123', undefined)

      await webhooksClient.delete('webhook-123')

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'DELETE',
        path: '/webhooks/webhook-123'
      })
    })
  })

  describe('test', () => {
    it('should test webhook', async () => {
      const mockTestResult = { success: true, response: '{"status":"ok"}' }

      mockHttp.mockPost('/webhooks/webhook-123/test', mockTestResult)

      const result = await webhooksClient.test('webhook-123')

      expect(result).toEqual(mockTestResult)
      expect(result.success).toBe(true)
    })
  })

  describe('logs', () => {
    it('should get delivery logs', async () => {
      const mockLogs: DeliveryLog[] = [
        {
          id: 'log-1',
          webhookId: 'webhook-123',
          event: 'user.created',
          status: 'success',
          statusCode: 200,
          response: '{"status":"ok"}',
          timestamp: '2025-01-01T00:00:00Z'
        }
      ]

      mockHttp.mockGet('/webhooks/webhook-123/logs', mockLogs)

      const result = await webhooksClient.logs('webhook-123', 50)

      expect(result).toEqual(mockLogs)
      expect(result[0].status).toBe('success')
    })
  })

  describe('deliver', () => {
    it('should manually deliver event', async () => {
      mockHttp.mockPost('/webhooks/deliver', undefined)

      const payload = { userId: '123', action: 'created' }

      await webhooksClient.deliver('user.created', payload)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'POST',
        path: '/webhooks/deliver',
        data: { event: 'user.created', payload }
      })
    })
  })

  describe('events', () => {
    it('should get available events', async () => {
      const mockEvents = [
        'user.created',
        'user.updated',
        'user.deleted',
        'payment.received'
      ]

      mockHttp.mockGet('/webhooks/events', mockEvents)

      const result = await webhooksClient.events()

      expect(result).toEqual(mockEvents)
      expect(result).toHaveLength(4)
    })
  })

  describe('stats', () => {
    it('should get webhook statistics', async () => {
      const mockStats = {
        totalDeliveries: 1000,
        successfulDeliveries: 950,
        failedDeliveries: 50,
        successRate: 0.95
      }

      mockHttp.mockGet('/webhooks/webhook-123/stats', mockStats)

      const result = await webhooksClient.stats('webhook-123')

      expect(result).toEqual(mockStats)
      expect(result.successRate).toBe(0.95)
    })
  })
})
