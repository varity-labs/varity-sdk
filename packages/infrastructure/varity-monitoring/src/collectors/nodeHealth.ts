import { Registry, Gauge, Counter, Histogram } from 'prom-client';
import axios from 'axios';

/**
 * NodeHealthMetrics - RPC endpoint and node health monitoring
 *
 * Tracks:
 * - RPC endpoint availability and health
 * - RPC response times
 * - RPC success/failure rates
 * - Connection quality
 * - Rate limiting and errors
 */
export class NodeHealthMetrics {
  private registry: Registry;
  private rpcEndpoints: Map<string, string> = new Map();

  // Health metrics
  private nodeHealthGauge: Gauge;
  private nodeUptimeGauge: Gauge;
  private nodeSyncStatusGauge: Gauge;

  // RPC metrics
  private rpcResponseTimeHistogram: Histogram;
  private rpcSuccessCounter: Counter;
  private rpcFailureCounter: Counter;
  private rpcTimeoutCounter: Counter;

  // Connection metrics
  private rpcConnectionsGauge: Gauge;
  private rpcQueueSizeGauge: Gauge;
  private rpcRateLimitCounter: Counter;

  // Error tracking
  private rpcErrorCounter: Counter;
  private rpcErrorRateGauge: Gauge;

  constructor() {
    this.registry = new Registry();

    // Initialize health metrics
    this.nodeHealthGauge = new Gauge({
      name: 'varity_node_health_status',
      help: 'Node health status (1=healthy, 0=unhealthy)',
      labelNames: ['chain', 'node', 'endpoint'],
      registers: [this.registry]
    });

    this.nodeUptimeGauge = new Gauge({
      name: 'varity_node_uptime_seconds',
      help: 'Node uptime in seconds',
      labelNames: ['chain', 'node'],
      registers: [this.registry]
    });

    this.nodeSyncStatusGauge = new Gauge({
      name: 'varity_node_sync_status',
      help: 'Node sync status (1=synced, 0=syncing)',
      labelNames: ['chain', 'node'],
      registers: [this.registry]
    });

    // Initialize RPC metrics
    this.rpcResponseTimeHistogram = new Histogram({
      name: 'varity_rpc_response_time_seconds',
      help: 'RPC response time in seconds',
      labelNames: ['chain', 'endpoint', 'method'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry]
    });

    this.rpcSuccessCounter = new Counter({
      name: 'varity_rpc_success_total',
      help: 'Total number of successful RPC calls',
      labelNames: ['chain', 'endpoint', 'method'],
      registers: [this.registry]
    });

    this.rpcFailureCounter = new Counter({
      name: 'varity_rpc_failure_total',
      help: 'Total number of failed RPC calls',
      labelNames: ['chain', 'endpoint', 'method', 'error_type'],
      registers: [this.registry]
    });

    this.rpcTimeoutCounter = new Counter({
      name: 'varity_rpc_timeout_total',
      help: 'Total number of RPC timeouts',
      labelNames: ['chain', 'endpoint'],
      registers: [this.registry]
    });

    // Initialize connection metrics
    this.rpcConnectionsGauge = new Gauge({
      name: 'varity_rpc_active_connections',
      help: 'Number of active RPC connections',
      labelNames: ['chain', 'endpoint'],
      registers: [this.registry]
    });

    this.rpcQueueSizeGauge = new Gauge({
      name: 'varity_rpc_queue_size',
      help: 'Size of RPC request queue',
      labelNames: ['chain', 'endpoint'],
      registers: [this.registry]
    });

    this.rpcRateLimitCounter = new Counter({
      name: 'varity_rpc_rate_limit_total',
      help: 'Total number of rate limit hits',
      labelNames: ['chain', 'endpoint'],
      registers: [this.registry]
    });

    // Initialize error tracking
    this.rpcErrorCounter = new Counter({
      name: 'varity_rpc_errors_total',
      help: 'Total number of RPC errors by type',
      labelNames: ['chain', 'endpoint', 'error_code', 'error_message'],
      registers: [this.registry]
    });

    this.rpcErrorRateGauge = new Gauge({
      name: 'varity_rpc_error_rate_percent',
      help: 'RPC error rate as percentage',
      labelNames: ['chain', 'endpoint'],
      registers: [this.registry]
    });
  }

  /**
   * Add RPC endpoint for monitoring
   */
  addEndpoint(name: string, url: string): void {
    this.rpcEndpoints.set(name, url);
  }

  /**
   * Remove RPC endpoint
   */
  removeEndpoint(name: string): void {
    this.rpcEndpoints.delete(name);
  }

  /**
   * Perform health check on RPC endpoint
   */
  async checkEndpointHealth(
    chain: string,
    endpoint: string,
    url: string,
    timeoutMs: number = 5000
  ): Promise<boolean> {
    const startTime = Date.now();

    try {
      const response = await axios.post(
        url,
        {
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        },
        {
          timeout: timeoutMs,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const responseTime = (Date.now() - startTime) / 1000;

      this.rpcResponseTimeHistogram.observe(
        { chain, endpoint, method: 'eth_blockNumber' },
        responseTime
      );

      if (response.data && response.data.result) {
        this.rpcSuccessCounter.inc({ chain, endpoint, method: 'eth_blockNumber' });
        this.nodeHealthGauge.set({ chain, node: endpoint, endpoint: url }, 1);
        return true;
      } else {
        this.rpcFailureCounter.inc({
          chain,
          endpoint,
          method: 'eth_blockNumber',
          error_type: 'invalid_response'
        });
        this.nodeHealthGauge.set({ chain, node: endpoint, endpoint: url }, 0);
        return false;
      }

    } catch (error) {
      const responseTime = (Date.now() - startTime) / 1000;

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          this.rpcTimeoutCounter.inc({ chain, endpoint });
          this.rpcFailureCounter.inc({
            chain,
            endpoint,
            method: 'eth_blockNumber',
            error_type: 'timeout'
          });
        } else if (error.response?.status === 429) {
          this.rpcRateLimitCounter.inc({ chain, endpoint });
          this.rpcFailureCounter.inc({
            chain,
            endpoint,
            method: 'eth_blockNumber',
            error_type: 'rate_limit'
          });
        } else {
          this.rpcFailureCounter.inc({
            chain,
            endpoint,
            method: 'eth_blockNumber',
            error_type: error.code || 'unknown'
          });

          this.rpcErrorCounter.inc({
            chain,
            endpoint,
            error_code: error.response?.status?.toString() || 'network_error',
            error_message: error.message
          });
        }
      }

      this.nodeHealthGauge.set({ chain, node: endpoint, endpoint: url }, 0);
      return false;
    }
  }

  /**
   * Check all registered endpoints
   */
  async checkAllEndpoints(chain: string = 'varity-l3'): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    const checks = Array.from(this.rpcEndpoints.entries()).map(async ([name, url]) => {
      const isHealthy = await this.checkEndpointHealth(chain, name, url);
      results.set(name, isHealthy);
    });

    await Promise.all(checks);

    // Calculate error rates
    for (const [name, _] of this.rpcEndpoints.entries()) {
      await this.calculateErrorRate(chain, name);
    }

    return results;
  }

  /**
   * Calculate error rate for endpoint
   */
  private async calculateErrorRate(chain: string, endpoint: string): Promise<void> {
    // This would typically query metrics history
    // For now, just set to 0 as placeholder
    this.rpcErrorRateGauge.set({ chain, endpoint }, 0);
  }

  /**
   * Monitor RPC method call
   */
  async monitorRpcCall<T>(
    chain: string,
    endpoint: string,
    method: string,
    call: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await call();
      const duration = (Date.now() - startTime) / 1000;

      this.rpcResponseTimeHistogram.observe({ chain, endpoint, method }, duration);
      this.rpcSuccessCounter.inc({ chain, endpoint, method });

      return result;

    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;

      this.rpcFailureCounter.inc({
        chain,
        endpoint,
        method,
        error_type: error instanceof Error ? error.name : 'unknown'
      });

      if (error instanceof Error) {
        this.rpcErrorCounter.inc({
          chain,
          endpoint,
          error_code: 'exception',
          error_message: error.message
        });
      }

      throw error;
    }
  }

  /**
   * Record active connections
   */
  recordActiveConnections(chain: string, endpoint: string, count: number): void {
    this.rpcConnectionsGauge.set({ chain, endpoint }, count);
  }

  /**
   * Record queue size
   */
  recordQueueSize(chain: string, endpoint: string, size: number): void {
    this.rpcQueueSizeGauge.set({ chain, endpoint }, size);
  }

  /**
   * Record node uptime
   */
  recordNodeUptime(chain: string, node: string, uptimeSeconds: number): void {
    this.nodeUptimeGauge.set({ chain, node }, uptimeSeconds);
  }

  /**
   * Record sync status
   */
  recordSyncStatus(chain: string, node: string, isSynced: boolean): void {
    this.nodeSyncStatusGauge.set({ chain, node }, isSynced ? 1 : 0);
  }

  /**
   * Get endpoint health status
   */
  async getEndpointStatus(chain: string): Promise<Array<{
    endpoint: string;
    healthy: boolean;
    responseTime: number;
  }>> {
    const statuses: Array<{
      endpoint: string;
      healthy: boolean;
      responseTime: number;
    }> = [];

    for (const [name, url] of this.rpcEndpoints.entries()) {
      const startTime = Date.now();
      const healthy = await this.checkEndpointHealth(chain, name, url);
      const responseTime = (Date.now() - startTime) / 1000;

      statuses.push({
        endpoint: name,
        healthy,
        responseTime
      });
    }

    return statuses;
  }

  /**
   * Get metrics in Prometheus format
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

  /**
   * Start continuous health monitoring
   */
  startMonitoring(chain: string = 'varity-l3', intervalMs: number = 30000): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        await this.checkAllEndpoints(chain);
      } catch (error) {
        console.error('Error in health monitoring interval:', error);
      }
    }, intervalMs);
  }
}
