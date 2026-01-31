import { Registry, Counter, Histogram, Gauge } from 'prom-client';

/**
 * ThirdwebMetrics - Thirdweb SDK operation tracking
 *
 * Tracks:
 * - Thirdweb SDK operations and success rates
 * - SDK call response times
 * - Fallback to ethers.js frequency
 * - SDK initialization performance
 * - Client health
 */
export class ThirdwebMetrics {
  private registry: Registry;

  // SDK operation metrics
  private sdkOperationCounter: Counter;
  private sdkOperationDuration: Histogram;
  private sdkSuccessCounter: Counter;
  private sdkFailureCounter: Counter;

  // Fallback metrics
  private fallbackToEthersCounter: Counter;
  private fallbackSuccessRate: Gauge;

  // Initialization metrics
  private sdkInitDuration: Histogram;
  private sdkInitFailures: Counter;

  // Client health
  private clientHealthGauge: Gauge;
  private activeClientsGauge: Gauge;

  // Method-specific metrics
  private readOperationDuration: Histogram;
  private writeOperationDuration: Histogram;
  private contractCallDuration: Histogram;

  constructor() {
    this.registry = new Registry();

    // Initialize operation metrics
    this.sdkOperationCounter = new Counter({
      name: 'varity_thirdweb_operations_total',
      help: 'Total number of Thirdweb SDK operations',
      labelNames: ['operation', 'method'],
      registers: [this.registry]
    });

    this.sdkOperationDuration = new Histogram({
      name: 'varity_thirdweb_operation_duration_seconds',
      help: 'Thirdweb SDK operation duration',
      labelNames: ['operation', 'method'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    this.sdkSuccessCounter = new Counter({
      name: 'varity_thirdweb_success_total',
      help: 'Total number of successful SDK operations',
      labelNames: ['operation', 'method'],
      registers: [this.registry]
    });

    this.sdkFailureCounter = new Counter({
      name: 'varity_thirdweb_failure_total',
      help: 'Total number of failed SDK operations',
      labelNames: ['operation', 'method', 'error_type'],
      registers: [this.registry]
    });

    // Initialize fallback metrics
    this.fallbackToEthersCounter = new Counter({
      name: 'varity_thirdweb_fallback_to_ethers_total',
      help: 'Total number of fallbacks to ethers.js',
      labelNames: ['operation', 'reason'],
      registers: [this.registry]
    });

    this.fallbackSuccessRate = new Gauge({
      name: 'varity_thirdweb_fallback_success_rate',
      help: 'Success rate when falling back to ethers.js',
      labelNames: ['operation'],
      registers: [this.registry]
    });

    // Initialize initialization metrics
    this.sdkInitDuration = new Histogram({
      name: 'varity_thirdweb_init_duration_seconds',
      help: 'Thirdweb SDK initialization duration',
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    this.sdkInitFailures = new Counter({
      name: 'varity_thirdweb_init_failures_total',
      help: 'Total number of SDK initialization failures',
      labelNames: ['error_type'],
      registers: [this.registry]
    });

    // Initialize client health
    this.clientHealthGauge = new Gauge({
      name: 'varity_thirdweb_client_health',
      help: 'Thirdweb client health status (1=healthy, 0=unhealthy)',
      labelNames: ['client_id'],
      registers: [this.registry]
    });

    this.activeClientsGauge = new Gauge({
      name: 'varity_thirdweb_active_clients',
      help: 'Number of active Thirdweb clients',
      registers: [this.registry]
    });

    // Initialize method-specific metrics
    this.readOperationDuration = new Histogram({
      name: 'varity_thirdweb_read_operation_duration_seconds',
      help: 'Duration of read operations',
      labelNames: ['method'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry]
    });

    this.writeOperationDuration = new Histogram({
      name: 'varity_thirdweb_write_operation_duration_seconds',
      help: 'Duration of write operations',
      labelNames: ['method'],
      buckets: [0.5, 1, 2, 5, 10, 30],
      registers: [this.registry]
    });

    this.contractCallDuration = new Histogram({
      name: 'varity_thirdweb_contract_call_duration_seconds',
      help: 'Duration of contract calls',
      labelNames: ['contract_address', 'function_name'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
      registers: [this.registry]
    });
  }

  /**
   * Record SDK operation
   */
  async recordOperation<T>(
    operation: string,
    method: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    this.sdkOperationCounter.inc({ operation, method });

    try {
      const result = await fn();
      const duration = (Date.now() - startTime) / 1000;

      this.sdkOperationDuration.observe({ operation, method }, duration);
      this.sdkSuccessCounter.inc({ operation, method });

      return result;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;

      this.sdkOperationDuration.observe({ operation, method }, duration);
      this.sdkFailureCounter.inc({
        operation,
        method,
        error_type: error instanceof Error ? error.name : 'unknown'
      });

      throw error;
    }
  }

  /**
   * Record fallback to ethers.js
   */
  recordFallback(operation: string, reason: string, success: boolean): void {
    this.fallbackToEthersCounter.inc({ operation, reason });
    // Update success rate would require tracking history
  }

  /**
   * Record SDK initialization
   */
  async recordInitialization<T>(fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = (Date.now() - startTime) / 1000;

      this.sdkInitDuration.observe({}, duration);

      return result;
    } catch (error) {
      this.sdkInitFailures.inc({
        error_type: error instanceof Error ? error.name : 'unknown'
      });

      throw error;
    }
  }

  /**
   * Update client health
   */
  updateClientHealth(clientId: string, isHealthy: boolean): void {
    this.clientHealthGauge.set({ client_id: clientId }, isHealthy ? 1 : 0);
  }

  /**
   * Update active clients count
   */
  updateActiveClients(count: number): void {
    this.activeClientsGauge.set({}, count);
  }

  /**
   * Record read operation
   */
  recordReadOperation(method: string, duration: number): void {
    this.readOperationDuration.observe({ method }, duration);
  }

  /**
   * Record write operation
   */
  recordWriteOperation(method: string, duration: number): void {
    this.writeOperationDuration.observe({ method }, duration);
  }

  /**
   * Record contract call
   */
  recordContractCall(contractAddress: string, functionName: string, duration: number): void {
    this.contractCallDuration.observe({ contract_address: contractAddress, function_name: functionName }, duration);
  }

  /**
   * Get metrics
   */
  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  /**
   * Get registry
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.registry.resetMetrics();
  }
}
