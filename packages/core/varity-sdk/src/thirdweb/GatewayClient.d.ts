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
export declare class GatewayClient {
    private apiKey?;
    private gatewayUrl;
    private timeout;
    private enableRetries;
    private maxRetries;
    private stats;
    private requestId;
    constructor(config?: GatewayConfig);
    /**
     * Get RPC URL for a specific chain
     */
    getRpcUrl(chain: Chain | number): string;
    /**
     * Get WebSocket URL for a specific chain
     */
    getWebSocketUrl(chain: Chain | number): string;
    /**
     * Make an RPC request
     */
    request<T = any>(chain: Chain | number, options: RPCRequestOptions): Promise<RPCResponse<T>>;
    /**
     * Batch multiple RPC requests
     */
    batchRequest<T = any>(chain: Chain | number, requests: RPCRequestOptions[]): Promise<RPCResponse<T>[]>;
    /**
     * Create a WebSocket connection
     */
    connectWebSocket(options: WebSocketOptions): WebSocket;
    /**
     * Subscribe to new blocks
     */
    subscribeToBlocks(chain: Chain | number, callback: (block: any) => void): Promise<() => void>;
    /**
     * Subscribe to contract events
     */
    subscribeToLogs(chain: Chain | number, filter: {
        address?: string;
        topics?: string[];
    }, callback: (log: any) => void): Promise<() => void>;
    /**
     * Get gateway statistics
     */
    getStats(): GatewayStats;
    /**
     * Reset statistics
     */
    resetStats(): void;
    /**
     * Make HTTP request with retry logic
     */
    private makeRequest;
    /**
     * Update statistics
     */
    private updateStats;
}
/**
 * Create Gateway client instance
 */
export declare function createGatewayClient(config?: GatewayConfig): GatewayClient;
//# sourceMappingURL=GatewayClient.d.ts.map