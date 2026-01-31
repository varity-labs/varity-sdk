/**
 * thirdweb Gateway Client
 *
 * Production-grade RPC infrastructure powered by thirdweb
 * Provides reliable, fast, and scalable blockchain node access
 *
 * Features:
 * - High-performance RPC endpoints
 * - Automatic failover and load balancing
 * - Request rate limiting and throttling
 * - Chain-specific optimizations
 * - Analytics and monitoring
 * - WebSocket support for real-time data
 */

import type { Chain } from 'thirdweb';
import { ChainRegistry } from '../chains';

/**
 * Gateway configuration
 */
export interface GatewayConfig {
  /**
   * API key for authenticated requests (optional)
   */
  apiKey?: string;

  /**
   * Custom gateway URL (optional)
   */
  gatewayUrl?: string;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * Enable request retries
   */
  enableRetries?: boolean;

  /**
   * Maximum number of retries
   */
  maxRetries?: number;
}

/**
 * RPC request options
 */
export interface RPCRequestOptions {
  /**
   * RPC method
   */
  method: string;

  /**
   * Method parameters
   */
  params?: any[];

  /**
   * Request timeout (overrides global setting)
   */
  timeout?: number;
}

/**
 * RPC response
 */
export interface RPCResponse<T = any> {
  /**
   * Result data
   */
  result: T;

  /**
   * Request ID
   */
  id: number;

  /**
   * JSON-RPC version
   */
  jsonrpc: string;
}

/**
 * Gateway statistics
 */
export interface GatewayStats {
  /**
   * Total requests made
   */
  totalRequests: number;

  /**
   * Successful requests
   */
  successfulRequests: number;

  /**
   * Failed requests
   */
  failedRequests: number;

  /**
   * Average response time (ms)
   */
  averageResponseTime: number;

  /**
   * Requests per minute
   */
  requestsPerMinute: number;

  /**
   * Error rate (percentage)
   */
  errorRate: number;
}

/**
 * WebSocket connection options
 */
export interface WebSocketOptions {
  /**
   * Chain to connect to
   */
  chain: Chain;

  /**
   * Event handlers
   */
  onMessage?: (data: any) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;

  /**
   * Auto-reconnect on disconnect
   */
  autoReconnect?: boolean;
}

/**
 * thirdweb Gateway Client
 *
 * Production RPC infrastructure for blockchain applications
 */
export class GatewayClient {
  private apiKey?: string;
  private gatewayUrl: string;
  private timeout: number;
  private enableRetries: boolean;
  private maxRetries: number;
  private stats: GatewayStats;
  private requestId: number = 0;

  constructor(config: GatewayConfig = {}) {
    this.apiKey = config.apiKey;
    this.gatewayUrl = config.gatewayUrl || 'https://gateway.thirdweb.com';
    this.timeout = config.timeout || 30000;
    this.enableRetries = config.enableRetries !== false;
    this.maxRetries = config.maxRetries || 3;

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsPerMinute: 0,
      errorRate: 0,
    };
  }

  /**
   * Get RPC URL for a specific chain
   */
  getRpcUrl(chain: Chain | number): string {
    let chainObj: Chain;

    if (typeof chain === 'number') {
      chainObj = ChainRegistry.getChain(chain);
    } else {
      chainObj = chain;
    }

    // Use thirdweb gateway if available, otherwise use chain's default RPC
    if (this.apiKey) {
      return `${this.gatewayUrl}/v1/${chainObj.id}/${this.apiKey}`;
    }

    // Fallback to chain's default RPC
    return (chainObj.rpc as string) || '';
  }

  /**
   * Get WebSocket URL for a specific chain
   */
  getWebSocketUrl(chain: Chain | number): string {
    const rpcUrl = this.getRpcUrl(chain);

    // Convert HTTP(S) to WS(S)
    return rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');
  }

  /**
   * Make an RPC request
   */
  async request<T = any>(
    chain: Chain | number,
    options: RPCRequestOptions
  ): Promise<RPCResponse<T>> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      const url = this.getRpcUrl(chain);
      const id = ++this.requestId;

      const response = await this.makeRequest(url, {
        jsonrpc: '2.0',
        id,
        method: options.method,
        params: options.params || [],
      }, options.timeout || this.timeout);

      const responseTime = Date.now() - startTime;
      this.updateStats(true, responseTime);

      return response;
    } catch (error) {
      this.updateStats(false, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Batch multiple RPC requests
   */
  async batchRequest<T = any>(
    chain: Chain | number,
    requests: RPCRequestOptions[]
  ): Promise<RPCResponse<T>[]> {
    const url = this.getRpcUrl(chain);

    const batchPayload = requests.map((req, index) => ({
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: req.method,
      params: req.params || [],
    }));

    const responses = await this.makeRequest(url, batchPayload, this.timeout);

    return Array.isArray(responses) ? responses : [responses];
  }

  /**
   * Create a WebSocket connection
   */
  connectWebSocket(options: WebSocketOptions): WebSocket {
    const url = this.getWebSocketUrl(options.chain);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log(`WebSocket connected to ${options.chain.name}`);
      options.onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        options.onMessage?.(data);
      } catch (error) {
        options.onError?.(error as Error);
      }
    };

    ws.onerror = (event) => {
      options.onError?.(new Error('WebSocket error'));
    };

    ws.onclose = () => {
      console.log(`WebSocket disconnected from ${options.chain.name}`);
      options.onDisconnect?.();

      if (options.autoReconnect) {
        setTimeout(() => this.connectWebSocket(options), 5000);
      }
    };

    return ws;
  }

  /**
   * Subscribe to new blocks
   */
  async subscribeToBlocks(
    chain: Chain | number,
    callback: (block: any) => void
  ): Promise<() => void> {
    const chainObj = typeof chain === 'number' ? ChainRegistry.getChain(chain) : chain;

    const ws = this.connectWebSocket({
      chain: chainObj,
      onMessage: (data) => {
        if (data.method === 'eth_subscription' && data.params?.subscription) {
          callback(data.params.result);
        }
      },
    });

    // Subscribe to new blocks
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'eth_subscribe',
      params: ['newHeads'],
    }));

    // Return unsubscribe function
    return () => ws.close();
  }

  /**
   * Subscribe to contract events
   */
  async subscribeToLogs(
    chain: Chain | number,
    filter: {
      address?: string;
      topics?: string[];
    },
    callback: (log: any) => void
  ): Promise<() => void> {
    const chainObj = typeof chain === 'number' ? ChainRegistry.getChain(chain) : chain;

    const ws = this.connectWebSocket({
      chain: chainObj,
      onMessage: (data) => {
        if (data.method === 'eth_subscription' && data.params?.subscription) {
          callback(data.params.result);
        }
      },
    });

    // Subscribe to logs
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'eth_subscribe',
      params: ['logs', filter],
    }));

    // Return unsubscribe function
    return () => ws.close();
  }

  /**
   * Get gateway statistics
   */
  getStats(): GatewayStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsPerMinute: 0,
      errorRate: 0,
    };
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(
    url: string,
    payload: any,
    timeout: number,
    retries = 0
  ): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`RPC Error: ${data.error.message}`);
      }

      return data;
    } catch (error) {
      if (this.enableRetries && retries < this.maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        return this.makeRequest(url, payload, timeout, retries + 1);
      }

      throw error;
    }
  }

  /**
   * Update statistics
   */
  private updateStats(success: boolean, responseTime: number): void {
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }

    // Update average response time
    const totalResponses = this.stats.successfulRequests + this.stats.failedRequests;
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (totalResponses - 1) + responseTime) / totalResponses;

    // Calculate error rate
    this.stats.errorRate =
      (this.stats.failedRequests / this.stats.totalRequests) * 100;
  }
}

/**
 * Create Gateway client instance
 */
export function createGatewayClient(config?: GatewayConfig): GatewayClient {
  return new GatewayClient(config);
}
