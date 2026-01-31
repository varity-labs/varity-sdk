import type { VaritySDK } from '../../core/VaritySDK';
/**
 * Notifications Module
 *
 * Universal multi-channel notifications and alerting across all templates.
 * Supports email, SMS, Slack, push notifications, and more.
 * Works identically for ISO, Healthcare, Finance, Retail, etc.
 */
export type NotificationType = 'email' | 'sms' | 'slack' | 'push' | 'webhook' | 'in-app';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
export interface SendNotificationOptions {
    type: NotificationType;
    to: string | string[];
    template?: string;
    subject?: string;
    message?: string;
    data?: Record<string, any>;
    priority?: NotificationPriority;
    channels?: NotificationType[];
    attachments?: NotificationAttachment[];
    scheduledFor?: string;
    metadata?: Record<string, any>;
}
export interface NotificationAttachment {
    filename: string;
    url?: string;
    content?: string;
    mimetype?: string;
}
export interface NotificationResult {
    id: string;
    type: NotificationType;
    status: NotificationStatus;
    to: string[];
    sentAt?: string;
    deliveredAt?: string;
    error?: string;
    metadata?: Record<string, any>;
}
export interface NotificationPreferences {
    email?: boolean;
    sms?: boolean;
    slack?: boolean;
    push?: boolean;
    inApp?: boolean;
    alerts?: string[];
    quietHours?: {
        enabled: boolean;
        start: string;
        end: string;
        timezone?: string;
    };
    frequency?: {
        digest?: boolean;
        digestFrequency?: 'hourly' | 'daily' | 'weekly';
    };
}
export interface NotificationHistoryOptions {
    type?: NotificationType;
    status?: NotificationStatus;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    userId?: string;
}
export interface NotificationHistoryEntry {
    id: string;
    type: NotificationType;
    status: NotificationStatus;
    to: string[];
    subject?: string;
    template?: string;
    sentAt: string;
    deliveredAt?: string;
    error?: string;
    metadata?: Record<string, any>;
}
export interface NotificationHistoryResult {
    entries: NotificationHistoryEntry[];
    total: number;
    limit: number;
    offset: number;
}
export interface ScheduleNotificationOptions extends SendNotificationOptions {
    scheduledFor: string;
    repeat?: {
        interval: 'daily' | 'weekly' | 'monthly';
        count?: number;
        endDate?: string;
    };
}
export interface ScheduledNotification {
    id: string;
    notification: SendNotificationOptions;
    scheduledFor: string;
    repeat?: {
        interval: string;
        count?: number;
        endDate?: string;
    };
    status: 'scheduled' | 'sent' | 'cancelled';
    createdAt: string;
}
export interface AlertRule {
    id?: string;
    name: string;
    condition: AlertCondition;
    notification: SendNotificationOptions;
    enabled: boolean;
    metadata?: Record<string, any>;
}
export interface AlertCondition {
    metric: string;
    operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
    threshold: number | string;
    duration?: number;
    aggregation?: 'avg' | 'sum' | 'count' | 'min' | 'max';
}
export interface AlertRuleResult {
    id: string;
    name: string;
    condition: AlertCondition;
    notification: SendNotificationOptions;
    enabled: boolean;
    lastTriggered?: string;
    triggerCount: number;
    createdAt: string;
    updatedAt: string;
}
export interface NotificationTemplate {
    id?: string;
    name: string;
    type: NotificationType;
    subject?: string;
    body: string;
    variables?: string[];
    metadata?: Record<string, any>;
}
/**
 * NotificationsModule - Universal notifications and alerting
 *
 * Provides multi-channel notification delivery with templates, scheduling,
 * preferences, and alert rules. Works across all templates by using
 * template-specific notification templates.
 */
export declare class NotificationsModule {
    private sdk;
    constructor(sdk: VaritySDK);
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
    send(options: SendNotificationOptions): Promise<NotificationResult>;
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
    sendBatch(notifications: SendNotificationOptions[]): Promise<NotificationResult[]>;
    /**
     * Get notification preferences for a user
     *
     * Universal method - retrieves user notification preferences.
     */
    getPreferences(userId?: string): Promise<NotificationPreferences>;
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
    setPreferences(preferences: NotificationPreferences, userId?: string): Promise<void>;
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
    getHistory(options?: NotificationHistoryOptions): Promise<NotificationHistoryResult>;
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
    schedule(options: ScheduleNotificationOptions): Promise<ScheduledNotification>;
    /**
     * Cancel scheduled notification
     *
     * Universal method - cancels a scheduled notification.
     */
    cancelScheduled(notificationId: string): Promise<void>;
    /**
     * List scheduled notifications
     *
     * Universal method - lists all scheduled notifications.
     */
    listScheduled(options?: {
        status?: string;
        limit?: number;
    }): Promise<ScheduledNotification[]>;
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
    createAlertRule(rule: AlertRule): Promise<AlertRuleResult>;
    /**
     * Update alert rule
     *
     * Universal method - updates an existing alert rule.
     */
    updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<AlertRuleResult>;
    /**
     * Delete alert rule
     *
     * Universal method - deletes an alert rule.
     */
    deleteAlertRule(ruleId: string): Promise<void>;
    /**
     * List alert rules
     *
     * Universal method - lists all alert rules.
     */
    listAlertRules(options?: {
        enabled?: boolean;
    }): Promise<AlertRuleResult[]>;
    /**
     * Create notification template
     *
     * Universal method - creates a reusable notification template.
     */
    createTemplate(template: NotificationTemplate): Promise<NotificationTemplate>;
    /**
     * Get notification template
     *
     * Universal method - retrieves a notification template by name.
     */
    getTemplate(templateName: string): Promise<NotificationTemplate>;
    /**
     * List notification templates
     *
     * Universal method - lists all available notification templates.
     */
    listTemplates(type?: NotificationType): Promise<NotificationTemplate[]>;
}
//# sourceMappingURL=NotificationsModule.d.ts.map