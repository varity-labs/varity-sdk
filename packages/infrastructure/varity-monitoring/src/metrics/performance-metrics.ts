import { Registry, Gauge, Counter, Histogram } from 'prom-client';

/**
 * PerformanceMetrics - System-wide performance monitoring
 *
 * Tracks:
 * - API response times
 * - Database query performance
 * - Blockchain transaction speeds
 * - LLM inference times
 * - Network latency
 */
export class PerformanceMetrics {
  private registry: Registry;

  // API metrics
  private httpRequestDuration: Histogram;
  private httpRequestCounter: Counter;
  private httpErrorCounter: Counter;

  // Database metrics
  private dbQueryDuration: Histogram;
  private dbConnectionPoolGauge: Gauge;
  private dbQueryCounter: Counter;

  // Blockchain metrics
  private blockchainTxDuration: Histogram;
  private blockchainGasCostGauge: Gauge;
  private blockchainConfirmationTime: Histogram;

  // LLM metrics
  private llmInferenceDuration: Histogram;
  private llmTokenUsageCounter: Counter;
  private llmRequestCounter: Counter;
  private llmErrorCounter: Counter;

  // Network metrics
  private networkLatencyGauge: Gauge;
  private networkBandwidthGauge: Gauge;

  // System metrics
  private cpuUsageGauge: Gauge;
  private memoryUsageGauge: Gauge;
  private activeConnectionsGauge: Gauge;

  constructor() {
    this.registry = new Registry();

    // Initialize API metrics
    this.httpRequestDuration = new Histogram({
      name: 'varity_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry]
    });

    this.httpRequestCounter = new Counter({
      name: 'varity_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry]
    });

    this.httpErrorCounter = new Counter({
      name: 'varity_http_errors_total',
      help: 'Total number of HTTP errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.registry]
    });

    // Initialize database metrics
    this.dbQueryDuration = new Histogram({
      name: 'varity_db_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['query_type', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry]
    });

    this.dbConnectionPoolGauge = new Gauge({
      name: 'varity_db_connection_pool_size',
      help: 'Current database connection pool size',
      labelNames: ['status'],
      registers: [this.registry]
    });

    this.dbQueryCounter = new Counter({
      name: 'varity_db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['query_type', 'status'],
      registers: [this.registry]
    });

    // Initialize blockchain metrics
    this.blockchainTxDuration = new Histogram({
      name: 'varity_blockchain_tx_duration_seconds',
      help: 'Blockchain transaction duration in seconds',
      labelNames: ['chain', 'tx_type'],
      buckets: [1, 5, 10, 30, 60, 120, 300],
      registers: [this.registry]
    });

    this.blockchainGasCostGauge = new Gauge({
      name: 'varity_blockchain_gas_cost_gwei',
      help: 'Current blockchain gas cost in Gwei',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.blockchainConfirmationTime = new Histogram({
      name: 'varity_blockchain_confirmation_seconds',
      help: 'Time to transaction confirmation in seconds',
      labelNames: ['chain', 'confirmations'],
      buckets: [5, 15, 30, 60, 120, 300, 600],
      registers: [this.registry]
    });

    // Initialize LLM metrics
    this.llmInferenceDuration = new Histogram({
      name: 'varity_llm_inference_duration_seconds',
      help: 'LLM inference duration in seconds',
      labelNames: ['model', 'provider', 'task_type'],
      buckets: [0.5, 1, 2, 5, 10, 20, 30, 60],
      registers: [this.registry]
    });

    this.llmTokenUsageCounter = new Counter({
      name: 'varity_llm_tokens_total',
      help: 'Total number of LLM tokens used',
      labelNames: ['model', 'token_type'],
      registers: [this.registry]
    });

    this.llmRequestCounter = new Counter({
      name: 'varity_llm_requests_total',
      help: 'Total number of LLM requests',
      labelNames: ['model', 'provider', 'status'],
      registers: [this.registry]
    });

    this.llmErrorCounter = new Counter({
      name: 'varity_llm_errors_total',
      help: 'Total number of LLM errors',
      labelNames: ['model', 'error_type'],
      registers: [this.registry]
    });

    // Initialize network metrics
    this.networkLatencyGauge = new Gauge({
      name: 'varity_network_latency_ms',
      help: 'Network latency in milliseconds',
      labelNames: ['endpoint', 'region'],
      registers: [this.registry]
    });

    this.networkBandwidthGauge = new Gauge({
      name: 'varity_network_bandwidth_mbps',
      help: 'Network bandwidth in Mbps',
      labelNames: ['direction', 'interface'],
      registers: [this.registry]
    });

    // Initialize system metrics
    this.cpuUsageGauge = new Gauge({
      name: 'varity_cpu_usage_percent',
      help: 'CPU usage percentage',
      labelNames: ['core'],
      registers: [this.registry]
    });

    this.memoryUsageGauge = new Gauge({
      name: 'varity_memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type'],
      registers: [this.registry]
    });

    this.activeConnectionsGauge = new Gauge({
      name: 'varity_active_connections',
      help: 'Number of active connections',
      labelNames: ['service', 'protocol'],
      registers: [this.registry]
    });
  }

  // API methods
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number
  ): void {
    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode.toString() },
      duration
    );
    this.httpRequestCounter.inc({ method, route, status_code: statusCode.toString() });
  }

  recordHttpError(method: string, route: string, errorType: string): void {
    this.httpErrorCounter.inc({ method, route, error_type: errorType });
  }

  // Database methods
  recordDbQuery(queryType: string, table: string, duration: number, status: string): void {
    this.dbQueryDuration.observe({ query_type: queryType, table }, duration);
    this.dbQueryCounter.inc({ query_type: queryType, status });
  }

  recordDbConnectionPool(active: number, idle: number, total: number): void {
    this.dbConnectionPoolGauge.set({ status: 'active' }, active);
    this.dbConnectionPoolGauge.set({ status: 'idle' }, idle);
    this.dbConnectionPoolGauge.set({ status: 'total' }, total);
  }

  // Blockchain methods
  recordBlockchainTx(chain: string, txType: string, duration: number): void {
    this.blockchainTxDuration.observe({ chain, tx_type: txType }, duration);
  }

  recordGasCost(chain: string, gwei: number): void {
    this.blockchainGasCostGauge.set({ chain }, gwei);
  }

  recordConfirmationTime(chain: string, confirmations: number, seconds: number): void {
    this.blockchainConfirmationTime.observe(
      { chain, confirmations: confirmations.toString() },
      seconds
    );
  }

  // LLM methods
  recordLlmInference(
    model: string,
    provider: string,
    taskType: string,
    duration: number
  ): void {
    this.llmInferenceDuration.observe({ model, provider, task_type: taskType }, duration);
  }

  recordLlmTokens(model: string, tokenType: 'input' | 'output', count: number): void {
    this.llmTokenUsageCounter.inc({ model, token_type: tokenType }, count);
  }

  recordLlmRequest(model: string, provider: string, status: string): void {
    this.llmRequestCounter.inc({ model, provider, status });
  }

  recordLlmError(model: string, errorType: string): void {
    this.llmErrorCounter.inc({ model, error_type: errorType });
  }

  // Network methods
  recordNetworkLatency(endpoint: string, region: string, ms: number): void {
    this.networkLatencyGauge.set({ endpoint, region }, ms);
  }

  recordNetworkBandwidth(direction: 'inbound' | 'outbound', interfaceName: string, mbps: number): void {
    this.networkBandwidthGauge.set({ direction, interface: interfaceName }, mbps);
  }

  // System methods
  recordCpuUsage(core: string, percent: number): void {
    this.cpuUsageGauge.set({ core }, percent);
  }

  recordMemoryUsage(type: 'used' | 'free' | 'total', bytes: number): void {
    this.memoryUsageGauge.set({ type }, bytes);
  }

  recordActiveConnections(service: string, protocol: string, count: number): void {
    this.activeConnectionsGauge.set({ service, protocol }, count);
  }

  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  getRegistry(): Registry {
    return this.registry;
  }

  reset(): void {
    this.registry.resetMetrics();
  }
}
