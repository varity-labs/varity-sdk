/**
 * Unit tests for NotificationsClient
 */

import {
  NotificationsClient,
  SendNotificationOptions,
  NotificationResult,
  ScheduleNotificationOptions,
  NotificationPreferences
} from './NotificationsClient'
import { createMockHTTPClient, MockHTTPClient } from '../../tests/mocks/httpClient.mock'

describe('NotificationsClient', () => {
  let mockHttp: MockHTTPClient
  let notificationsClient: NotificationsClient

  beforeEach(() => {
    mockHttp = createMockHTTPClient()
    notificationsClient = new NotificationsClient(mockHttp)
  })

  afterEach(() => {
    mockHttp.clearMocks()
  })

  describe('send', () => {
    it('should send notification immediately', async () => {
      const mockResult: NotificationResult = {
        id: 'notif-123',
        status: 'sent',
        timestamp: Date.now()
      }

      mockHttp.mockPost('/notifications/send', mockResult)

      const options: SendNotificationOptions = {
        type: 'email',
        to: 'user@example.com',
        subject: 'Test Subject',
        body: 'Test body content',
        priority: 'high'
      }

      const result = await notificationsClient.send(options)

      expect(result).toEqual(mockResult)
      expect(result.status).toBe('sent')

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'POST',
        path: '/notifications/send',
        data: options
      })
    })
  })

  describe('schedule', () => {
    it('should schedule notification for later', async () => {
      const mockResult: NotificationResult = {
        id: 'notif-456',
        status: 'pending',
        timestamp: Date.now()
      }

      mockHttp.mockPost('/notifications/schedule', mockResult)

      const options: ScheduleNotificationOptions = {
        type: 'email',
        to: 'user@example.com',
        body: 'Scheduled notification',
        scheduledAt: '2025-11-01T10:00:00Z',
        timezone: 'America/Los_Angeles'
      }

      const result = await notificationsClient.schedule(options)

      expect(result).toEqual(mockResult)
      expect(result.status).toBe('pending')
    })
  })

  describe('history', () => {
    it('should get notification history', async () => {
      const mockHistory: NotificationResult[] = [
        { id: 'notif-1', status: 'sent', timestamp: Date.now() - 1000 },
        { id: 'notif-2', status: 'sent', timestamp: Date.now() - 2000 }
      ]

      mockHttp.mockGet('/notifications/history', mockHistory)

      const result = await notificationsClient.history(10)

      expect(result).toEqual(mockHistory)
      expect(result).toHaveLength(2)
    })
  })

  describe('getPreferences', () => {
    it('should get notification preferences', async () => {
      const mockPreferences: NotificationPreferences = {
        email: true,
        sms: false,
        push: true,
        quietHours: {
          start: '22:00',
          end: '08:00'
        }
      }

      mockHttp.mockGet('/notifications/preferences', mockPreferences)

      const result = await notificationsClient.getPreferences()

      expect(result).toEqual(mockPreferences)
      expect(result.email).toBe(true)
      expect(result.quietHours?.start).toBe('22:00')
    })
  })

  describe('updatePreferences', () => {
    it('should update notification preferences', async () => {
      mockHttp.mockPut('/notifications/preferences', undefined)

      const preferences: Partial<NotificationPreferences> = {
        email: false,
        sms: true
      }

      await notificationsClient.updatePreferences(preferences)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'PUT',
        path: '/notifications/preferences',
        data: preferences
      })
    })
  })

  describe('getAlerts', () => {
    it('should get active alerts', async () => {
      const mockAlerts = [
        { id: 'alert-1', message: 'System warning', severity: 'medium' },
        { id: 'alert-2', message: 'Critical issue', severity: 'high' }
      ]

      mockHttp.mockGet('/notifications/alerts', mockAlerts)

      const result = await notificationsClient.getAlerts()

      expect(result).toEqual(mockAlerts)
      expect(result).toHaveLength(2)
    })
  })
})
