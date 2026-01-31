import { PrometheusCollector } from './prometheus-collector';

/**
 * MetricsAggregator - Collects metrics from various sources and updates Prometheus
 */
export class MetricsAggregator {
  private collector: PrometheusCollector;
  private aggregationInterval: NodeJS.Timeout | null = null;

  constructor(collector: PrometheusCollector) {
    this.collector = collector;
  }

  /**
   * Start periodic metric aggregation
   */
  start(intervalMs: number = 30000): void {
    if (this.aggregationInterval) {
      return; // Already running
    }

    // Collect initial metrics
    this.collectMetrics();

    // Start periodic collection
    this.aggregationInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    console.log(`Metrics aggregation started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop periodic metric aggregation
   */
  stop(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.aggregationInterval = null;
      console.log('Metrics aggregation stopped');
    }
  }

  /**
   * Collect metrics from all sources
   */
  private async collectMetrics(): Promise<void> {
    try {
      await Promise.all([
        this.collectStorageMetrics(),
        this.collectPerformanceMetrics(),
        this.collectCostMetrics()
      ]);
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  /**
   * Collect storage metrics from storage backends
   */
  private async collectStorageMetrics(): Promise<void> {
    const storage = this.collector.getStorageMetrics();

    // Simulate collecting from various storage layers
    // In production, these would query actual storage backends

    // Layer 1: Varity Internal Storage
    storage.recordStorageUsage('varity-internal', 'hot', 'filecoin', 'varity-internal-docs', 5_000_000_000); // 5GB
    storage.recordLayerDocumentCount('varity-internal', 'documentation', true, 5000);
    storage.recordLayerTotalSize('varity-internal', true, 5_000_000_000);

    // Layer 2: Industry RAG Storage
    const industries = ['finance', 'healthcare', 'retail', 'iso-merchant'];
    industries.forEach((industry) => {
      storage.recordStorageUsage('industry-rag', 'warm', 'filecoin', `industry-${industry}-rag`, 10_000_000_000); // 10GB per industry
      storage.recordLayerDocumentCount('industry-rag', industry, true, 10000);
    });
    storage.recordLayerTotalSize('industry-rag', true, 40_000_000_000); // 40GB total

    // Layer 3: Customer-Specific Storage (example for 10 customers)
    for (let i = 1; i <= 10; i++) {
      storage.recordStorageUsage('customer-data', 'hot', 'filecoin', `customer-${i}`, 500_000_000); // 500MB per customer
    }
    storage.recordLayerDocumentCount('customer-data', 'business-data', true, 5000);
    storage.recordLayerTotalSize('customer-data', true, 5_000_000_000); // 5GB total

    // Record some sample operations
    storage.recordUpload('customer-data', 'filecoin', 'success', 'application/pdf');
    storage.recordDownload('industry-rag', 'filecoin', 'success', true);
    storage.recordLatency('upload', 'filecoin', 'customer-data', 2.5);
    storage.recordThroughput('download', 'filecoin', 'industry-rag', 1_500_000); // 1.5 MB/s
  }

  /**
   * Collect performance metrics from various services
   */
  private async collectPerformanceMetrics(): Promise<void> {
    const performance = this.collector.getPerformanceMetrics();

    // Simulate collecting performance data
    // In production, these would come from actual service monitoring

    // Sample HTTP requests
    performance.recordHttpRequest('GET', '/api/v1/storage/list', 200, 0.145);
    performance.recordHttpRequest('POST', '/api/v1/storage/upload', 201, 2.456);

    // Database queries
    performance.recordDbQuery('SELECT', 'documents', 0.023, 'success');
    performance.recordDbConnectionPool(5, 15, 20);

    // Blockchain transactions
    performance.recordBlockchainTx('arbitrum-one', 'storage-reference', 15.3);
    performance.recordGasCost('arbitrum-one', 0.5);
    performance.recordConfirmationTime('arbitrum-one', 12, 180);

    // LLM inference
    performance.recordLlmInference('gemini-2.5-flash', 'akash-network', 'rag-query', 3.2);
    performance.recordLlmTokens('gemini-2.5-flash', 'input', 500);
    performance.recordLlmTokens('gemini-2.5-flash', 'output', 300);
    performance.recordLlmRequest('gemini-2.5-flash', 'akash-network', 'success');

    // Network metrics
    performance.recordNetworkLatency('filecoin-gateway', 'us-east', 45);
    performance.recordNetworkBandwidth('inbound', 'eth0', 100);
    performance.recordNetworkBandwidth('outbound', 'eth0', 80);

    // System metrics
    performance.recordCpuUsage('0', 45.2);
    performance.recordCpuUsage('1', 38.7);
    performance.recordMemoryUsage('used', 4_000_000_000); // 4GB
    performance.recordMemoryUsage('total', 8_000_000_000); // 8GB
    performance.recordActiveConnections('api', 'http', 50);
  }

  /**
   * Collect cost metrics
   */
  private async collectCostMetrics(): Promise<void> {
    const cost = this.collector.getCostMetrics();

    // Storage costs (DePin vs Cloud comparison)
    cost.recordStorageMonthlyCost('varity-internal', 'filecoin', 'hot', 10.00);
    cost.recordStorageMonthlyCost('industry-rag', 'filecoin', 'warm', 50.00);
    cost.recordStorageMonthlyCost('customer-data', 'filecoin', 'hot', 25.00);
    cost.recordStorageCostPerGb('filecoin', 'hot', 0.005);
    cost.recordStorageCostPerGb('filecoin', 'warm', 0.002);

    // Compute costs
    cost.recordComputeMonthlyCost('akash-network', 'llm-inference', 'global', 50.00);
    cost.recordComputeMonthlyCost('akash-network', 'api-server', 'global', 30.00);
    cost.recordComputeCostPerHour('akash-network', 'llm-inference', 0.069);
    cost.recordComputeCostPerHour('akash-network', 'api-server', 0.041);

    // Blockchain costs
    cost.recordBlockchainGasCost('arbitrum-one', 'storage-reference', 0.05);
    cost.recordBlockchainGasCost('varity-l3', 'transaction', 0.001);

    // LLM costs
    cost.recordLlmInferenceCost('gemini-2.5-flash', 'akash-network', 0.002);
    cost.recordLlmTokenCost('gemini-2.5-flash', 'input', 0.000015);
    cost.recordLlmTokenCost('gemini-2.5-flash', 'output', 0.00006);

    // Customer economics
    cost.recordCustomerMonthlyCost('starter', 'finance', 2.27); // $2.27 per customer on DePin
    cost.recordRevenuePerCustomer('starter', 'finance', 99.00); // $99/month subscription
    cost.recordProfitMargin('starter', 'finance', 97.7); // 97.7% profit margin

    cost.recordCustomerMonthlyCost('professional', 'healthcare', 4.50);
    cost.recordRevenuePerCustomer('professional', 'healthcare', 299.00);
    cost.recordProfitMargin('professional', 'healthcare', 98.5);

    // DePin vs Cloud savings
    cost.recordDepinCloudSavings('storage', 90.0); // 90% savings
    cost.recordDepinCloudSavings('compute', 85.0); // 85% savings
    cost.recordDepinCloudSavings('total', 89.7); // 89.7% total savings

    // Cost efficiency
    cost.recordCostEfficiency('starter', 43.6); // Revenue/Cost ratio
    cost.recordCostEfficiency('professional', 66.4);
  }

  /**
   * Get aggregation status
   */
  isRunning(): boolean {
    return this.aggregationInterval !== null;
  }
}
