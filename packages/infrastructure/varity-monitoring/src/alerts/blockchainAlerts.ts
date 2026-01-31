import { EventEmitter } from 'events';

export interface AlertThreshold {
  metric: string;
  condition: 'above' | 'below' | 'equal';
  threshold: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface Alert {
  id: string;
  timestamp: Date;
  severity: 'critical' | 'warning' | 'info';
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
  resolved: boolean;
}

/**
 * BlockchainAlerts - Alerting system for blockchain metrics
 *
 * Alerts on:
 * - High gas prices
 * - RPC downtime
 * - Abnormal transaction patterns
 * - Bridge issues
 * - Node health problems
 */
export class BlockchainAlerts extends EventEmitter {
  private thresholds: Map<string, AlertThreshold> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private maxHistorySize: number = 1000;

  constructor() {
    super();
    this.initializeDefaultThresholds();
  }

  /**
   * Initialize default alert thresholds
   */
  private initializeDefaultThresholds(): void {
    // Gas price alerts
    this.addThreshold({
      metric: 'gas_price_usdc',
      condition: 'above',
      threshold: 1.0,
      severity: 'warning',
      message: 'Gas price is unusually high'
    });

    this.addThreshold({
      metric: 'gas_price_usdc',
      condition: 'above',
      threshold: 5.0,
      severity: 'critical',
      message: 'Gas price is critically high'
    });

    // RPC health alerts
    this.addThreshold({
      metric: 'rpc_error_rate',
      condition: 'above',
      threshold: 10.0,
      severity: 'warning',
      message: 'RPC error rate is elevated'
    });

    this.addThreshold({
      metric: 'rpc_error_rate',
      condition: 'above',
      threshold: 50.0,
      severity: 'critical',
      message: 'RPC error rate is critical - service degradation'
    });

    // Block time alerts
    this.addThreshold({
      metric: 'block_time',
      condition: 'above',
      threshold: 5.0,
      severity: 'warning',
      message: 'Block time is slower than expected'
    });

    // Transaction throughput alerts
    this.addThreshold({
      metric: 'tx_throughput',
      condition: 'below',
      threshold: 1.0,
      severity: 'warning',
      message: 'Transaction throughput is low'
    });

    // Node sync alerts
    this.addThreshold({
      metric: 'node_syncing',
      condition: 'equal',
      threshold: 1,
      severity: 'critical',
      message: 'Node is out of sync'
    });

    // Bridge volume alerts
    this.addThreshold({
      metric: 'bridge_volume_anomaly',
      condition: 'above',
      threshold: 1000000,
      severity: 'info',
      message: 'Unusual bridge volume detected'
    });
  }

  /**
   * Add alert threshold
   */
  addThreshold(threshold: AlertThreshold): void {
    this.thresholds.set(threshold.metric, threshold);
  }

  /**
   * Remove alert threshold
   */
  removeThreshold(metric: string): void {
    this.thresholds.delete(metric);
  }

  /**
   * Check metric against thresholds
   */
  checkMetric(metric: string, value: number): void {
    const threshold = this.thresholds.get(metric);
    if (!threshold) return;

    const shouldAlert = this.evaluateCondition(value, threshold);

    if (shouldAlert) {
      this.triggerAlert(metric, value, threshold);
    } else {
      this.resolveAlert(metric);
    }
  }

  /**
   * Evaluate threshold condition
   */
  private evaluateCondition(value: number, threshold: AlertThreshold): boolean {
    switch (threshold.condition) {
      case 'above':
        return value > threshold.threshold;
      case 'below':
        return value < threshold.threshold;
      case 'equal':
        return value === threshold.threshold;
      default:
        return false;
    }
  }

  /**
   * Trigger alert
   */
  private triggerAlert(metric: string, value: number, threshold: AlertThreshold): void {
    const existingAlert = this.activeAlerts.get(metric);

    // Don't re-trigger if alert already active
    if (existingAlert && !existingAlert.resolved) {
      return;
    }

    const alert: Alert = {
      id: `${metric}-${Date.now()}`,
      timestamp: new Date(),
      severity: threshold.severity,
      metric,
      currentValue: value,
      threshold: threshold.threshold,
      message: threshold.message,
      resolved: false
    };

    this.activeAlerts.set(metric, alert);
    this.alertHistory.push(alert);

    // Trim history if needed
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(-this.maxHistorySize);
    }

    // Emit alert event
    this.emit('alert', alert);

    // Log alert
    console.error(`[${alert.severity.toUpperCase()}] ${alert.message} (${metric}=${value}, threshold=${threshold.threshold})`);
  }

  /**
   * Resolve alert
   */
  private resolveAlert(metric: string): void {
    const alert = this.activeAlerts.get(metric);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      this.emit('alert:resolved', alert);
      console.info(`[RESOLVED] Alert for ${metric} has been resolved`);
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(a => !a.resolved);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: 'critical' | 'warning' | 'info'): Alert[] {
    return this.getActiveAlerts().filter(a => a.severity === severity);
  }

  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts(): void {
    for (const [metric, alert] of this.activeAlerts.entries()) {
      if (alert.resolved) {
        this.activeAlerts.delete(metric);
      }
    }
  }

  /**
   * Get alert summary
   */
  getAlertSummary(): {
    total: number;
    critical: number;
    warning: number;
    info: number;
  } {
    const active = this.getActiveAlerts();

    return {
      total: active.length,
      critical: active.filter(a => a.severity === 'critical').length,
      warning: active.filter(a => a.severity === 'warning').length,
      info: active.filter(a => a.severity === 'info').length
    };
  }
}
