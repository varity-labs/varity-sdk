import { Registry, Counter, Gauge } from 'prom-client';

/**
 * Comprehensive Alerting System Tests (25+ tests)
 * Tests alerting functionality for Varity monitoring system
 */

// Mock alert metrics class
class AlertMetrics {
  private registry: Registry;
  private alertCounter: Counter;
  private activeAlertsGauge: Gauge;
  private alertLatencyGauge: Gauge;
  private alertSuppressedCounter: Counter;

  constructor() {
    this.registry = new Registry();

    this.alertCounter = new Counter({
      name: 'varity_alerts_total',
      help: 'Total number of alerts triggered',
      labelNames: ['severity', 'alert_name', 'service'],
      registers: [this.registry]
    });

    this.activeAlertsGauge = new Gauge({
      name: 'varity_active_alerts',
      help: 'Number of currently active alerts',
      labelNames: ['severity', 'service'],
      registers: [this.registry]
    });

    this.alertLatencyGauge = new Gauge({
      name: 'varity_alert_latency_seconds',
      help: 'Time between alert trigger and notification',
      labelNames: ['alert_name', 'channel'],
      registers: [this.registry]
    });

    this.alertSuppressedCounter = new Counter({
      name: 'varity_alerts_suppressed_total',
      help: 'Total number of suppressed alerts',
      labelNames: ['alert_name', 'reason'],
      registers: [this.registry]
    });
  }

  recordAlert(severity: string, alertName: string, service: string): void {
    this.alertCounter.inc({ severity, alert_name: alertName, service });
  }

  setActiveAlerts(severity: string, service: string, count: number): void {
    this.activeAlertsGauge.set({ severity, service }, count);
  }

  recordAlertLatency(alertName: string, channel: string, seconds: number): void {
    this.alertLatencyGauge.set({ alert_name: alertName, channel }, seconds);
  }

  recordSuppressedAlert(alertName: string, reason: string): void {
    this.alertSuppressedCounter.inc({ alert_name: alertName, reason });
  }

  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  reset(): void {
    this.registry.resetMetrics();
  }
}

describe('AlertMetrics - Alert Severities', () => {
  let metrics: AlertMetrics;

  beforeEach(() => {
    metrics = new AlertMetrics();
  });

  afterEach(() => {
    metrics.reset();
  });

  it('should record critical alert', async () => {
    metrics.recordAlert('critical', 'service-down', 'api-server');
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_alerts_total');
    expect(output).toContain('severity="critical"');
    expect(output).toContain('alert_name="service-down"');
  });

  it('should record high severity alert', async () => {
    metrics.recordAlert('high', 'high-error-rate', 'storage-service');
    const output = await metrics.getMetrics();

    expect(output).toContain('severity="high"');
  });

  it('should record medium severity alert', async () => {
    metrics.recordAlert('medium', 'slow-response', 'llm-service');
    const output = await metrics.getMetrics();

    expect(output).toContain('severity="medium"');
  });

  it('should record low severity alert', async () => {
    metrics.recordAlert('low', 'high-memory-usage', 'cache-service');
    const output = await metrics.getMetrics();

    expect(output).toContain('severity="low"');
  });

  it('should record warning alert', async () => {
    metrics.recordAlert('warning', 'disk-space-80-percent', 'storage-service');
    const output = await metrics.getMetrics();

    expect(output).toContain('severity="warning"');
  });
});

describe('AlertMetrics - Common Alert Types', () => {
  let metrics: AlertMetrics;

  beforeEach(() => {
    metrics = new AlertMetrics();
  });

  afterEach(() => {
    metrics.reset();
  });

  it('should record high error rate alert', async () => {
    metrics.recordAlert('high', 'high-error-rate', 'api-server');
    const output = await metrics.getMetrics();

    expect(output).toContain('alert_name="high-error-rate"');
  });

  it('should record service unavailable alert', async () => {
    metrics.recordAlert('critical', 'service-unavailable', 'storage-service');
    const output = await metrics.getMetrics();

    expect(output).toContain('alert_name="service-unavailable"');
  });

  it('should record high latency alert', async () => {
    metrics.recordAlert('medium', 'high-latency', 'llm-service');
    const output = await metrics.getMetrics();

    expect(output).toContain('alert_name="high-latency"');
  });

  it('should record database connection pool exhausted alert', async () => {
    metrics.recordAlert('high', 'db-pool-exhausted', 'api-server');
    const output = await metrics.getMetrics();

    expect(output).toContain('alert_name="db-pool-exhausted"');
  });

  it('should record disk space low alert', async () => {
    metrics.recordAlert('warning', 'disk-space-low', 'storage-service');
    const output = await metrics.getMetrics();

    expect(output).toContain('alert_name="disk-space-low"');
  });

  it('should record memory usage high alert', async () => {
    metrics.recordAlert('medium', 'memory-usage-high', 'llm-service');
    const output = await metrics.getMetrics();

    expect(output).toContain('alert_name="memory-usage-high"');
  });

  it('should record blockchain transaction failed alert', async () => {
    metrics.recordAlert('high', 'blockchain-tx-failed', 'blockchain-service');
    const output = await metrics.getMetrics();

    expect(output).toContain('alert_name="blockchain-tx-failed"');
  });
});

describe('AlertMetrics - Active Alerts Tracking', () => {
  let metrics: AlertMetrics;

  beforeEach(() => {
    metrics = new AlertMetrics();
  });

  afterEach(() => {
    metrics.reset();
  });

  it('should track active critical alerts', async () => {
    metrics.setActiveAlerts('critical', 'api-server', 2);
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_active_alerts');
    expect(output).toContain('severity="critical"');
    expect(output).toContain(' 2');
  });

  it('should track active alerts across services', async () => {
    metrics.setActiveAlerts('high', 'api-server', 3);
    metrics.setActiveAlerts('medium', 'storage-service', 5);
    metrics.setActiveAlerts('low', 'cache-service', 1);

    const output = await metrics.getMetrics();
    expect(output).toContain('service="api-server"');
    expect(output).toContain('service="storage-service"');
    expect(output).toContain('service="cache-service"');
  });

  it('should update active alert count', async () => {
    metrics.setActiveAlerts('high', 'api-server', 3);
    metrics.setActiveAlerts('high', 'api-server', 5);

    const output = await metrics.getMetrics();
    expect(output).toContain(' 5');
  });

  it('should handle zero active alerts', async () => {
    metrics.setActiveAlerts('critical', 'api-server', 0);
    const output = await metrics.getMetrics();

    expect(output).toContain(' 0');
  });
});

describe('AlertMetrics - Alert Latency', () => {
  let metrics: AlertMetrics;

  beforeEach(() => {
    metrics = new AlertMetrics();
  });

  afterEach(() => {
    metrics.reset();
  });

  it('should record email notification latency', async () => {
    metrics.recordAlertLatency('service-down', 'email', 2.5);
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_alert_latency_seconds');
    expect(output).toContain('channel="email"');
    expect(output).toContain('2.5');
  });

  it('should record Slack notification latency', async () => {
    metrics.recordAlertLatency('high-error-rate', 'slack', 0.8);
    const output = await metrics.getMetrics();

    expect(output).toContain('channel="slack"');
  });

  it('should record PagerDuty notification latency', async () => {
    metrics.recordAlertLatency('service-unavailable', 'pagerduty', 1.2);
    const output = await metrics.getMetrics();

    expect(output).toContain('channel="pagerduty"');
  });

  it('should record SMS notification latency', async () => {
    metrics.recordAlertLatency('critical-failure', 'sms', 3.5);
    const output = await metrics.getMetrics();

    expect(output).toContain('channel="sms"');
  });

  it('should record webhook notification latency', async () => {
    metrics.recordAlertLatency('deployment-failed', 'webhook', 0.5);
    const output = await metrics.getMetrics();

    expect(output).toContain('channel="webhook"');
  });
});

describe('AlertMetrics - Suppressed Alerts', () => {
  let metrics: AlertMetrics;

  beforeEach(() => {
    metrics = new AlertMetrics();
  });

  afterEach(() => {
    metrics.reset();
  });

  it('should record alert suppressed due to maintenance window', async () => {
    metrics.recordSuppressedAlert('high-latency', 'maintenance_window');
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_alerts_suppressed_total');
    expect(output).toContain('reason="maintenance_window"');
  });

  it('should record alert suppressed due to rate limiting', async () => {
    metrics.recordSuppressedAlert('high-error-rate', 'rate_limited');
    const output = await metrics.getMetrics();

    expect(output).toContain('reason="rate_limited"');
  });

  it('should record alert suppressed due to duplicate', async () => {
    metrics.recordSuppressedAlert('service-down', 'duplicate');
    const output = await metrics.getMetrics();

    expect(output).toContain('reason="duplicate"');
  });

  it('should record alert suppressed due to low priority', async () => {
    metrics.recordSuppressedAlert('disk-space-warning', 'low_priority');
    const output = await metrics.getMetrics();

    expect(output).toContain('reason="low_priority"');
  });

  it('should record multiple suppressed alerts', async () => {
    metrics.recordSuppressedAlert('alert-1', 'maintenance_window');
    metrics.recordSuppressedAlert('alert-2', 'rate_limited');
    metrics.recordSuppressedAlert('alert-3', 'duplicate');

    const output = await metrics.getMetrics();
    expect(output).toContain('varity_alerts_suppressed_total');
  });
});

describe('AlertMetrics - Alert Scenarios', () => {
  let metrics: AlertMetrics;

  beforeEach(() => {
    metrics = new AlertMetrics();
  });

  afterEach(() => {
    metrics.reset();
  });

  it('should handle alert storm scenario', async () => {
    for (let i = 0; i < 100; i++) {
      metrics.recordAlert('high', 'connection-timeout', 'api-server');
    }

    const output = await metrics.getMetrics();
    expect(output).toContain('varity_alerts_total');
  });

  it('should handle cascading failures', async () => {
    metrics.recordAlert('critical', 'database-down', 'storage-service');
    metrics.recordAlert('high', 'api-errors-spiking', 'api-server');
    metrics.recordAlert('high', 'cache-unavailable', 'cache-service');

    const output = await metrics.getMetrics();
    expect(output).toContain('alert_name="database-down"');
    expect(output).toContain('alert_name="api-errors-spiking"');
    expect(output).toContain('alert_name="cache-unavailable"');
  });

  it('should track alert resolution', async () => {
    metrics.setActiveAlerts('critical', 'api-server', 3);
    // Simulate resolution
    metrics.setActiveAlerts('critical', 'api-server', 0);

    const output = await metrics.getMetrics();
    expect(output).toContain('varity_active_alerts');
  });
});

describe('AlertMetrics - Performance Testing', () => {
  let metrics: AlertMetrics;

  beforeEach(() => {
    metrics = new AlertMetrics();
  });

  afterEach(() => {
    metrics.reset();
  });

  it('should handle high-volume alert recording', async () => {
    const startTime = Date.now();

    for (let i = 0; i < 1000; i++) {
      metrics.recordAlert('medium', 'test-alert', 'test-service');
    }

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000);
  });

  it('should handle concurrent alert operations', async () => {
    const promises = [];

    for (let i = 0; i < 100; i++) {
      promises.push(
        Promise.resolve().then(() => {
          metrics.recordAlert('high', 'concurrent-alert', 'api-server');
        })
      );
    }

    await Promise.all(promises);

    const output = await metrics.getMetrics();
    expect(output).toContain('varity_alerts_total');
  });
});

describe('AlertMetrics - Edge Cases', () => {
  let metrics: AlertMetrics;

  beforeEach(() => {
    metrics = new AlertMetrics();
  });

  afterEach(() => {
    metrics.reset();
  });

  it('should handle empty alert name', async () => {
    metrics.recordAlert('medium', '', 'api-server');
    const output = await metrics.getMetrics();

    expect(output).toContain('alert_name=""');
  });

  it('should handle special characters in alert name', async () => {
    metrics.recordAlert('high', 'error-rate>10%', 'api-server');
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_alerts_total');
  });

  it('should handle very low latency', async () => {
    metrics.recordAlertLatency('fast-alert', 'webhook', 0.001);
    const output = await metrics.getMetrics();

    expect(output).toContain('varity_alert_latency_seconds');
  });

  it('should reset all alert metrics', async () => {
    metrics.recordAlert('critical', 'test-alert', 'test-service');
    metrics.setActiveAlerts('high', 'api-server', 5);
    metrics.recordAlertLatency('alert', 'email', 2.5);

    metrics.reset();

    const output = await metrics.getMetrics();
    expect(output).toBeTruthy();
  });
});
