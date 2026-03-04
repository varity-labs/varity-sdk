import type { VaritySDK } from '../../core/VaritySDK'

/**
 * Notifications Module
 *
 * Universal multi-channel notifications and alerting across all templates.
 * Supports email, SMS, Slack, push notifications, and more.
 * Works identically for ISO, Healthcare, Finance, Retail, etc.
 */

export type NotificationType = 'email' | 'sms' | 'slack' | 'push' | 'webhook' | 'in-app'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'

export interface SendNotificationOptions {
  type: NotificationType
  to: string | string[] // Email address, phone number, Slack channel, etc.
  template?: string // Template name (configured per template)
  subject?: string
  message?: string
  data?: Record<string, any> // Template variables
  priority?: NotificationPriority
  channels?: NotificationType[] // Multi-channel delivery
  attachments?: NotificationAttachment[]
  scheduledFor?: string // ISO date for scheduled delivery
  metadata?: Record<string, any>
}

export interface NotificationAttachment {
  filename: string
  url?: string
  content?: string // Base64 encoded
  mimetype?: string
}

export interface NotificationResult {
  id: string
  type: NotificationType
  status: NotificationStatus
  to: string[]
  sentAt?: string
  deliveredAt?: string
  error?: string
  metadata?: Record<string, any>
}

export interface NotificationPreferences {
  email?: boolean
  sms?: boolean
  slack?: boolean
  push?: boolean
  inApp?: boolean
  alerts?: string[] // Alert categories to subscribe to
  quietHours?: {
    enabled: boolean
    start: string // HH:MM
    end: string // HH:MM
    timezone?: string
  }
  frequency?: {
    digest?: boolean // Aggregate notifications
    digestFrequency?: 'hourly' | 'daily' | 'weekly'
  }
}

export interface NotificationHistoryOptions {
  type?: NotificationType
  status?: NotificationStatus
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
  userId?: string
}

export interface NotificationHistoryEntry {
  id: string
  type: NotificationType
  status: NotificationStatus
  to: string[]
  subject?: string
  template?: string
  sentAt: string
  deliveredAt?: string
  error?: string
  metadata?: Record<string, any>
}

export interface NotificationHistoryResult {
  entries: NotificationHistoryEntry[]
  total: number
  limit: number
  offset: number
}

export interface ScheduleNotificationOptions extends SendNotificationOptions {
  scheduledFor: string // Required for scheduled notifications
  repeat?: {
    interval: 'daily' | 'weekly' | 'monthly'
    count?: number // Number of times to repeat
    endDate?: string // End date for recurring notifications
  }
}

export interface ScheduledNotification {
  id: string
  notification: SendNotificationOptions
  scheduledFor: string
  repeat?: {
    interval: string
    count?: number
    endDate?: string
  }
  status: 'scheduled' | 'sent' | 'cancelled'
  createdAt: string
}

export interface AlertRule {
  id?: string
  name: string
  condition: AlertCondition
  notification: SendNotificationOptions
  enabled: boolean
  metadata?: Record<string, any>
}

export interface AlertCondition {
  metric: string
  operator: '>' | '<' | '=' | '>=' | '<=' | '!='
  threshold: number | string
  duration?: number // Duration in seconds to check
  aggregation?: 'avg' | 'sum' | 'count' | 'min' | 'max'
}

export interface AlertRuleResult {
  id: string
  name: string
  condition: AlertCondition
  notification: SendNotificationOptions
  enabled: boolean
  lastTriggered?: string
  triggerCount: number
  createdAt: string
  updatedAt: string
}

export interface NotificationTemplate {
  id?: string
  name: string
  type: NotificationType
  subject?: string
  body: string // Template with variable placeholders {{variable}}
  variables?: string[] // List of expected variables
  metadata?: Record<string, any>
}

/**
 * NotificationsModule - Universal notifications and alerting
 *
 * Provides multi-channel notification delivery with templates, scheduling,
 * preferences, and alert rules. Works across all templates by using
 * template-specific notification templates.
 */
export class NotificationsModule {
  constructor(private sdk: VaritySDK) {}

  /**
   * Send notification immediately
   *
   * Universal method - sends notifications via any channel for any template.
   * Template configuration provides template-specific message content.
   *
   * @example ISO Dashboard
   * ```typescript
   * await sdk.notifications.send({
   *   type: 'email',
   *   to: 'merchant@example.com',
   *   template: 'merchant_registered',
   *   data: { merchantName: 'Acme Corp' }
   * })
   * ```
   *
   * @example Healthcare Dashboard
   * ```typescript
   * await sdk.notifications.send({
   *   type: 'sms',
   *   to: '+1234567890',
   *   template: 'appointment_reminder',
   *   data: { patientName: 'John Doe', appointmentTime: '2025-01-15 10:00' }
   * })
   * ```
   */
  async send(options: SendNotificationOptions): Promise<NotificationResult> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Send batch notifications
   *
   * Universal method - sends multiple notifications efficiently.
   *
   * @example
   * ```typescript
   * const results = await sdk.notifications.sendBatch([
   *   { type: 'email', to: 'user1@example.com', template: 'alert' },
   *   { type: 'email', to: 'user2@example.com', template: 'alert' },
   *   { type: 'sms', to: '+1234567890', template: 'urgent_alert' }
   * ])
   * ```
   */
  async sendBatch(notifications: SendNotificationOptions[]): Promise<NotificationResult[]> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/notifications/send-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({ notifications })
    })

    if (!response.ok) {
      throw new Error(`Failed to send batch notifications: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get notification preferences for a user
   *
   * Universal method - retrieves user notification preferences.
   */
  async getPreferences(userId?: string): Promise<NotificationPreferences> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const url = userId
      ? `${apiEndpoint}/api/v1/notifications/preferences?userId=${userId}`
      : `${apiEndpoint}/api/v1/notifications/preferences`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get notification preferences: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Set notification preferences for a user
   *
   * Universal method - updates user notification preferences.
   *
   * @example
   * ```typescript
   * await sdk.notifications.setPreferences({
   *   email: true,
   *   slack: true,
   *   push: false,
   *   alerts: ['compliance', 'anomaly', 'milestone'],
   *   quietHours: {
   *     enabled: true,
   *     start: '22:00',
   *     end: '08:00',
   *     timezone: 'America/New_York'
   *   }
   * })
   * ```
   */
  async setPreferences(preferences: NotificationPreferences, userId?: string): Promise<void> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/notifications/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({ preferences, userId })
    })

    if (!response.ok) {
      throw new Error(`Failed to set notification preferences: ${response.statusText}`)
    }
  }

  /**
   * Get notification history
   *
   * Universal method - retrieves past notifications with filtering.
   *
   * @example
   * ```typescript
   * const history = await sdk.notifications.getHistory({
   *   type: 'email',
   *   status: 'delivered',
   *   startDate: '2025-01-01',
   *   limit: 50
   * })
   * ```
   */
  async getHistory(options: NotificationHistoryOptions = {}): Promise<NotificationHistoryResult> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/notifications/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to get notification history: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Schedule notification for later delivery
   *
   * Universal method - schedules notifications for future delivery.
   *
   * @example
   * ```typescript
   * const scheduled = await sdk.notifications.schedule({
   *   type: 'email',
   *   to: 'user@example.com',
   *   template: 'monthly_report',
   *   scheduledFor: '2025-02-01T09:00:00Z',
   *   repeat: {
   *     interval: 'monthly',
   *     count: 12
   *   }
   * })
   * ```
   */
  async schedule(options: ScheduleNotificationOptions): Promise<ScheduledNotification> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/notifications/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to schedule notification: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Cancel scheduled notification
   *
   * Universal method - cancels a scheduled notification.
   */
  async cancelScheduled(notificationId: string): Promise<void> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/notifications/schedule/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to cancel scheduled notification: ${response.statusText}`)
    }
  }

  /**
   * List scheduled notifications
   *
   * Universal method - lists all scheduled notifications.
   */
  async listScheduled(options: { status?: string; limit?: number } = {}): Promise<ScheduledNotification[]> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const queryParams = new URLSearchParams()
    if (options.status) queryParams.append('status', options.status)
    if (options.limit) queryParams.append('limit', options.limit.toString())

    const response = await fetch(`${apiEndpoint}/api/v1/notifications/scheduled?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to list scheduled notifications: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Create alert rule
   *
   * Universal method - creates an automatic alert based on conditions.
   *
   * @example ISO Dashboard
   * ```typescript
   * await sdk.notifications.createAlertRule({
   *   name: 'High Residual Alert',
   *   condition: {
   *     metric: 'residual_amount',
   *     operator: '>',
   *     threshold: 10000,
   *     duration: 300 // 5 minutes
   *   },
   *   notification: {
   *     type: 'email',
   *     to: 'admin@example.com',
   *     template: 'high_residual_alert'
   *   },
   *   enabled: true
   * })
   * ```
   */
  async createAlertRule(rule: AlertRule): Promise<AlertRuleResult> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/notifications/alert-rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(rule)
    })

    if (!response.ok) {
      throw new Error(`Failed to create alert rule: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Update alert rule
   *
   * Universal method - updates an existing alert rule.
   */
  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<AlertRuleResult> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/notifications/alert-rules/${ruleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error(`Failed to update alert rule: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Delete alert rule
   *
   * Universal method - deletes an alert rule.
   */
  async deleteAlertRule(ruleId: string): Promise<void> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/notifications/alert-rules/${ruleId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to delete alert rule: ${response.statusText}`)
    }
  }

  /**
   * List alert rules
   *
   * Universal method - lists all alert rules.
   */
  async listAlertRules(options: { enabled?: boolean } = {}): Promise<AlertRuleResult[]> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const queryParams = new URLSearchParams()
    if (options.enabled !== undefined) queryParams.append('enabled', options.enabled.toString())

    const response = await fetch(`${apiEndpoint}/api/v1/notifications/alert-rules?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to list alert rules: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Create notification template
   *
   * Universal method - creates a reusable notification template.
   */
  async createTemplate(template: NotificationTemplate): Promise<NotificationTemplate> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/notifications/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(template)
    })

    if (!response.ok) {
      throw new Error(`Failed to create notification template: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get notification template
   *
   * Universal method - retrieves a notification template by name.
   */
  async getTemplate(templateName: string): Promise<NotificationTemplate> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/notifications/templates/${templateName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get notification template: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * List notification templates
   *
   * Universal method - lists all available notification templates.
   */
  async listTemplates(type?: NotificationType): Promise<NotificationTemplate[]> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const queryParams = type ? `?type=${type}` : ''

    const response = await fetch(`${apiEndpoint}/api/v1/notifications/templates${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to list notification templates: ${response.statusText}`)
    }

    return await response.json()
  }
}
