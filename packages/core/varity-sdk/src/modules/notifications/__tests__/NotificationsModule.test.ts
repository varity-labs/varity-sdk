/**
 * NotificationsModule Tests
 */

import { NotificationsModule } from '../NotificationsModule'
import type { VaritySDK } from '../../../core/VaritySDK'

global.fetch = jest.fn()

describe('NotificationsModule', () => {
  let notificationsModule: NotificationsModule
  const mockSDK = {
    getAPIEndpoint: () => 'https://api.varity.test',
    getAPIKey: () => 'test-api-key'
  } as VaritySDK

  beforeEach(() => {
    jest.clearAllMocks()
    notificationsModule = new NotificationsModule(mockSDK)
  })

  describe('send', () => {
    it('should send notification', async () => {
      const mockResult = {
        id: 'notif-123',
        type: 'email' as const,
        status: 'sent' as const,
        to: ['test@example.com'],
        sentAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      })

      const result = await notificationsModule.send({
        type: 'email',
        to: 'test@example.com',
        subject: 'Test',
        message: 'Test message'
      })

      expect(result.id).toBe('notif-123')
      expect(result.status).toBe('sent')
    })
  })

  describe('sendBatch', () => {
    it('should send batch notifications', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'notif-1', status: 'sent', to: ['user1@test.com'] },
          { id: 'notif-2', status: 'sent', to: ['user2@test.com'] }
        ]
      })

      const results = await notificationsModule.sendBatch([
        { type: 'email', to: 'user1@test.com', message: 'Test 1' },
        { type: 'email', to: 'user2@test.com', message: 'Test 2' }
      ])

      expect(results).toHaveLength(2)
    })
  })

  describe('getPreferences', () => {
    it('should get notification preferences', async () => {
      const mockPrefs = {
        email: true,
        sms: false,
        push: true,
        alerts: ['compliance']
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPrefs
      })

      const result = await notificationsModule.getPreferences()

      expect(result.email).toBe(true)
      expect(result.alerts).toContain('compliance')
    })
  })

  describe('setPreferences', () => {
    it('should set notification preferences', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await expect(notificationsModule.setPreferences({
        email: true,
        sms: false
      })).resolves.not.toThrow()
    })
  })

  describe('getHistory', () => {
    it('should get notification history', async () => {
      const mockHistory = {
        entries: [
          {
            id: 'notif-1',
            type: 'email' as const,
            status: 'delivered' as const,
            to: ['test@test.com'],
            sentAt: new Date().toISOString()
          }
        ],
        total: 1,
        limit: 10,
        offset: 0
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory
      })

      const result = await notificationsModule.getHistory({ limit: 10 })

      expect(result.entries).toHaveLength(1)
    })
  })

  describe('schedule', () => {
    it('should schedule notification', async () => {
      const mockScheduled = {
        id: 'scheduled-123',
        notification: { type: 'email', to: 'test@test.com' },
        scheduledFor: '2025-02-01T09:00:00Z',
        status: 'scheduled' as const,
        createdAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockScheduled
      })

      const result = await notificationsModule.schedule({
        type: 'email',
        to: 'test@test.com',
        scheduledFor: '2025-02-01T09:00:00Z',
        message: 'Scheduled message'
      })

      expect(result.status).toBe('scheduled')
    })
  })

  describe('cancelScheduled', () => {
    it('should cancel scheduled notification', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await expect(notificationsModule.cancelScheduled('scheduled-123')).resolves.not.toThrow()
    })
  })

  describe('listScheduled', () => {
    it('should list scheduled notifications', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'scheduled-1', status: 'scheduled' }
        ]
      })

      const result = await notificationsModule.listScheduled({ status: 'scheduled' })

      expect(result).toHaveLength(1)
    })
  })

  describe('createAlertRule', () => {
    it('should create alert rule', async () => {
      const mockRule = {
        id: 'rule-123',
        name: 'High CPU',
        condition: { metric: 'cpu', operator: '>' as const, threshold: 80 },
        notification: { type: 'email' as const, to: 'admin@test.com' },
        enabled: true,
        triggerCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRule
      })

      const result = await notificationsModule.createAlertRule({
        name: 'High CPU',
        condition: { metric: 'cpu', operator: '>', threshold: 80 },
        notification: { type: 'email', to: 'admin@test.com', message: 'Alert' },
        enabled: true
      })

      expect(result.id).toBe('rule-123')
    })
  })

  describe('updateAlertRule', () => {
    it('should update alert rule', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'rule-123', enabled: false })
      })

      const result = await notificationsModule.updateAlertRule('rule-123', { enabled: false })

      expect(result.enabled).toBe(false)
    })
  })

  describe('deleteAlertRule', () => {
    it('should delete alert rule', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await expect(notificationsModule.deleteAlertRule('rule-123')).resolves.not.toThrow()
    })
  })

  describe('listAlertRules', () => {
    it('should list alert rules', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'rule-1', enabled: true }
        ]
      })

      const result = await notificationsModule.listAlertRules({ enabled: true })

      expect(result).toHaveLength(1)
    })
  })

  describe('createTemplate', () => {
    it('should create notification template', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'welcome',
        type: 'email' as const,
        body: 'Welcome {{name}}!'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplate
      })

      const result = await notificationsModule.createTemplate({
        name: 'welcome',
        type: 'email',
        body: 'Welcome {{name}}!'
      })

      expect(result.id).toBe('template-123')
    })
  })

  describe('getTemplate', () => {
    it('should get notification template', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'welcome', type: 'email' })
      })

      const result = await notificationsModule.getTemplate('welcome')

      expect(result.name).toBe('welcome')
    })
  })

  describe('listTemplates', () => {
    it('should list notification templates', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { name: 'welcome', type: 'email' },
          { name: 'alert', type: 'sms' }
        ]
      })

      const result = await notificationsModule.listTemplates()

      expect(result).toHaveLength(2)
    })
  })
})
