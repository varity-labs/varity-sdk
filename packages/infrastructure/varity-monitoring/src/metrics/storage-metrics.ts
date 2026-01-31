import { Registry, Gauge, Counter, Histogram, Summary } from 'prom-client';

/**
 * StorageMetrics - Comprehensive storage monitoring for Varity 3-layer architecture
 *
 * Tracks:
 * - Storage usage across all 3 layers (Varity Internal, Industry RAG, Customer Data)
 * - Upload/Download operations
 * - Performance metrics (latency, throughput)
 * - Backend-specific metrics (Filecoin, IPFS, Celestia DA)
 */
export class StorageMetrics {
  private registry: Registry;

  // Storage usage metrics
  private storageUsageGauge: Gauge;
  private storageCapacityGauge: Gauge;
  private storageUsagePercentGauge: Gauge;

  // Operation counters
  private uploadCounter: Counter;
  private downloadCounter: Counter;
  private deleteCounter: Counter;
  private failureCounter: Counter;

  // Performance metrics
  private latencyHistogram: Histogram;
  private throughputGauge: Gauge;
  private operationDurationSummary: Summary;

  // Layer-specific metrics
  private layerDocumentCountGauge: Gauge;
  private layerTotalSizeGauge: Gauge;

  // Cost tracking
  private monthlyCostGauge: Gauge;
  private costPerOperationGauge: Gauge;

  constructor() {
    this.registry = new Registry();

    // Initialize storage usage metrics
    this.storageUsageGauge = new Gauge({
      name: 'varity_storage_bytes',
      help: 'Total storage usage in bytes',
      labelNames: ['layer', 'tier', 'backend', 'namespace'],
      registers: [this.registry]
    });

    this.storageCapacityGauge = new Gauge({
      name: 'varity_storage_capacity_bytes',
      help: 'Total storage capacity in bytes',
      labelNames: ['layer', 'backend'],
      registers: [this.registry]
    });

    this.storageUsagePercentGauge = new Gauge({
      name: 'varity_storage_usage_percent',
      help: 'Storage usage as percentage of capacity',
      labelNames: ['layer', 'backend'],
      registers: [this.registry]
    });

    // Initialize operation counters
    this.uploadCounter = new Counter({
      name: 'varity_uploads_total',
      help: 'Total number of uploads',
      labelNames: ['layer', 'backend', 'status', 'content_type'],
      registers: [this.registry]
    });

    this.downloadCounter = new Counter({
      name: 'varity_downloads_total',
      help: 'Total number of downloads',
      labelNames: ['layer', 'backend', 'status', 'cache_hit'],
      registers: [this.registry]
    });

    this.deleteCounter = new Counter({
      name: 'varity_deletes_total',
      help: 'Total number of delete operations',
      labelNames: ['layer', 'backend', 'status'],
      registers: [this.registry]
    });

    this.failureCounter = new Counter({
      name: 'varity_operation_failures_total',
      help: 'Total number of failed operations',
      labelNames: ['layer', 'backend', 'operation', 'error_type'],
      registers: [this.registry]
    });

    // Initialize performance metrics
    this.latencyHistogram = new Histogram({
      name: 'varity_operation_duration_seconds',
      help: 'Operation duration in seconds',
      labelNames: ['operation', 'backend', 'layer'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.registry]
    });

    this.throughputGauge = new Gauge({
      name: 'varity_throughput_bytes_per_second',
      help: 'Data throughput in bytes per second',
      labelNames: ['operation', 'backend', 'layer'],
      registers: [this.registry]
    });

    this.operationDurationSummary = new Summary({
      name: 'varity_operation_duration_summary',
      help: 'Summary of operation durations',
      labelNames: ['operation', 'backend'],
      percentiles: [0.5, 0.9, 0.95, 0.99],
      registers: [this.registry]
    });

    // Initialize layer-specific metrics
    this.layerDocumentCountGauge = new Gauge({
      name: 'varity_layer_document_count',
      help: 'Number of documents in storage layer',
      labelNames: ['layer', 'category', 'encrypted'],
      registers: [this.registry]
    });

    this.layerTotalSizeGauge = new Gauge({
      name: 'varity_layer_total_bytes',
      help: 'Total size of storage layer in bytes',
      labelNames: ['layer', 'encrypted'],
      registers: [this.registry]
    });

    // Initialize cost tracking
    this.monthlyCostGauge = new Gauge({
      name: 'varity_monthly_cost_usd',
      help: 'Estimated monthly cost in USD',
      labelNames: ['layer', 'backend', 'cost_type'],
      registers: [this.registry]
    });

    this.costPerOperationGauge = new Gauge({
      name: 'varity_cost_per_operation_usd',
      help: 'Cost per operation in USD',
      labelNames: ['operation', 'backend'],
      registers: [this.registry]
    });
  }

  /**
   * Record storage usage for a specific layer and backend
   */
  recordStorageUsage(
    layer: string,
    tier: string,
    backend: string,
    namespace: string,
    bytes: number
  ): void {
    this.storageUsageGauge.set({ layer, tier, backend, namespace }, bytes);
  }

  /**
   * Record storage capacity
   */
  recordStorageCapacity(layer: string, backend: string, bytes: number): void {
    this.storageCapacityGauge.set({ layer, backend }, bytes);
  }

  /**
   * Record storage usage percentage
   */
  recordStorageUsagePercent(layer: string, backend: string, percent: number): void {
    this.storageUsagePercentGauge.set({ layer, backend }, percent);
  }

  /**
   * Record upload operation
   */
  recordUpload(
    layer: string,
    backend: string,
    status: 'success' | 'failure',
    contentType: string = 'unknown'
  ): void {
    this.uploadCounter.inc({ layer, backend, status, content_type: contentType });
  }

  /**
   * Record download operation
   */
  recordDownload(
    layer: string,
    backend: string,
    status: 'success' | 'failure',
    cacheHit: boolean = false
  ): void {
    this.downloadCounter.inc({
      layer,
      backend,
      status,
      cache_hit: cacheHit ? 'true' : 'false'
    });
  }

  /**
   * Record delete operation
   */
  recordDelete(layer: string, backend: string, status: 'success' | 'failure'): void {
    this.deleteCounter.inc({ layer, backend, status });
  }

  /**
   * Record operation failure
   */
  recordFailure(
    layer: string,
    backend: string,
    operation: string,
    errorType: string
  ): void {
    this.failureCounter.inc({ layer, backend, operation, error_type: errorType });
  }

  /**
   * Record operation latency
   */
  recordLatency(
    operation: string,
    backend: string,
    layer: string,
    seconds: number
  ): void {
    this.latencyHistogram.observe({ operation, backend, layer }, seconds);
    this.operationDurationSummary.observe({ operation, backend }, seconds);
  }

  /**
   * Record throughput
   */
  recordThroughput(
    operation: string,
    backend: string,
    layer: string,
    bytesPerSecond: number
  ): void {
    this.throughputGauge.set({ operation, backend, layer }, bytesPerSecond);
  }

  /**
   * Record document count in a layer
   */
  recordLayerDocumentCount(
    layer: string,
    category: string,
    encrypted: boolean,
    count: number
  ): void {
    this.layerDocumentCountGauge.set(
      { layer, category, encrypted: encrypted ? 'true' : 'false' },
      count
    );
  }

  /**
   * Record total layer size
   */
  recordLayerTotalSize(layer: string, encrypted: boolean, bytes: number): void {
    this.layerTotalSizeGauge.set(
      { layer, encrypted: encrypted ? 'true' : 'false' },
      bytes
    );
  }

  /**
   * Record monthly cost estimate
   */
  recordMonthlyCost(
    layer: string,
    backend: string,
    costType: string,
    usd: number
  ): void {
    this.monthlyCostGauge.set({ layer, backend, cost_type: costType }, usd);
  }

  /**
   * Record cost per operation
   */
  recordCostPerOperation(operation: string, backend: string, usd: number): void {
    this.costPerOperationGauge.set({ operation, backend }, usd);
  }

  /**
   * Get Prometheus metrics output
   */
  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  /**
   * Get registry for custom use
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.registry.resetMetrics();
  }
}
