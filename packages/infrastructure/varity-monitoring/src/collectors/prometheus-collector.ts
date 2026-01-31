import { Registry, collectDefaultMetrics } from 'prom-client';
import { StorageMetrics } from '../metrics/storage-metrics';
import { PerformanceMetrics } from '../metrics/performance-metrics';
import { CostMetrics } from '../metrics/cost-metrics';

/**
 * PrometheusCollector - Aggregates all metrics and provides unified interface
 */
export class PrometheusCollector {
  private aggregateRegistry: Registry;
  private storageMetrics: StorageMetrics;
  private performanceMetrics: PerformanceMetrics;
  private costMetrics: CostMetrics;
  private defaultMetricsInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.aggregateRegistry = new Registry();
    this.storageMetrics = new StorageMetrics();
    this.performanceMetrics = new PerformanceMetrics();
    this.costMetrics = new CostMetrics();

    // Collect default Node.js metrics
    collectDefaultMetrics({ register: this.aggregateRegistry, prefix: 'varity_' });
  }

  /**
   * Get storage metrics instance
   */
  getStorageMetrics(): StorageMetrics {
    return this.storageMetrics;
  }

  /**
   * Get performance metrics instance
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMetrics;
  }

  /**
   * Get cost metrics instance
   */
  getCostMetrics(): CostMetrics {
    return this.costMetrics;
  }

  /**
   * Get all metrics in Prometheus format
   */
  async getAllMetrics(): Promise<string> {
    const metrics: string[] = [];

    // Collect default metrics
    metrics.push(await this.aggregateRegistry.metrics());

    // Collect storage metrics
    metrics.push(await this.storageMetrics.getMetrics());

    // Collect performance metrics
    metrics.push(await this.performanceMetrics.getMetrics());

    // Collect cost metrics
    metrics.push(await this.costMetrics.getMetrics());

    return metrics.filter(m => m.trim().length > 0).join('\n\n');
  }

  /**
   * Get metrics for specific category
   */
  async getMetricsByCategory(category: 'storage' | 'performance' | 'cost' | 'default'): Promise<string> {
    switch (category) {
      case 'storage':
        return await this.storageMetrics.getMetrics();
      case 'performance':
        return await this.performanceMetrics.getMetrics();
      case 'cost':
        return await this.costMetrics.getMetrics();
      case 'default':
        return await this.aggregateRegistry.metrics();
      default:
        throw new Error(`Unknown category: ${category}`);
    }
  }

  /**
   * Reset all metrics
   */
  resetAll(): void {
    this.storageMetrics.reset();
    this.performanceMetrics.reset();
    this.costMetrics.reset();
    this.aggregateRegistry.resetMetrics();
  }

  /**
   * Start collecting default metrics at interval
   */
  startDefaultCollection(intervalMs: number = 10000): void {
    if (this.defaultMetricsInterval) {
      return; // Already collecting
    }

    this.defaultMetricsInterval = setInterval(() => {
      // Default metrics are collected automatically by prom-client
    }, intervalMs);
  }

  /**
   * Stop collecting default metrics
   */
  stopDefaultCollection(): void {
    if (this.defaultMetricsInterval) {
      clearInterval(this.defaultMetricsInterval);
      this.defaultMetricsInterval = null;
    }
  }
}
