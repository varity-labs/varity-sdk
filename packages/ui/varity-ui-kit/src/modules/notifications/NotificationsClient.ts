/**
 * Notifications Client - Notification management
 *
 * Handles sending notifications and managing preferences via API server
 */

import { HTTPClient } from '../../utils/http'

export interface SendNotificationOptions {
  type: 'email' | 'sms' | 'push' | 'webhook'
  to: string
  subject?: string
  body: string
  priority?: 'low' | 'normal' | 'high'
  attachments?: Array<{ filename: string; content: string }>
}

export interface NotificationResult {
  id: string
  status: 'sent' | 'pending' | 'failed'
  timestamp: number
}

export interface ScheduleNotificationOptions extends SendNotificationOptions {
  scheduledAt: string
  timezone?: string
  repeat?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    count?: number
  }
}

export interface NotificationPreferences {
  email: boolean
  sms: boolean
  push: boolean
  quietHours?: {
    start: string
    end: string
  }
}

export class NotificationsClient {
  constructor(private http: HTTPClient) {}

  /**
   * Send notification immediately
   */
  async send(options: SendNotificationOptions): Promise<NotificationResult> {
    return this.http.post<NotificationResult>('/notifications/send', options)
  }

  /**
   * Schedule notification for later
   */
  async schedule(options: ScheduleNotificationOptions): Promise<NotificationResult> {
    return this.http.post<NotificationResult>('/notifications/schedule', options)
  }

  /**
   * Get notification history
   */
  async history(limit?: number): Promise<NotificationResult[]> {
    return this.http.get<NotificationResult[]>('/notifications/history', {
      params: { limit }
    })
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    return this.http.get<NotificationPreferences>('/notifications/preferences')
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    return this.http.put<void>('/notifications/preferences', preferences)
  }

  /**
   * Get active alerts
   */
  async getAlerts(): Promise<any[]> {
    return this.http.get<any[]>('/notifications/alerts')
  }
}
