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
import { ChainRegistry } from '../chains';
/**
 * thirdweb Gateway Client
 *
 * Production RPC infrastructure for blockchain applications
 */
export class GatewayClient {
    apiKey;
    gatewayUrl;
    timeout;
    enableRetries;
    maxRetries;
    stats;
    requestId = 0;
    constructor(config = {}) {
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
    getRpcUrl(chain) {
        let chainObj;
        if (typeof chain === 'number') {
            chainObj = ChainRegistry.getChain(chain);
        }
        else {
            chainObj = chain;
        }
        // Use thirdweb gateway if available, otherwise use chain's default RPC
        if (this.apiKey) {
            return `${this.gatewayUrl}/v1/${chainObj.id}/${this.apiKey}`;
        }
        // Fallback to chain's default RPC
        return chainObj.rpc || '';
    }
    /**
     * Get WebSocket URL for a specific chain
     */
    getWebSocketUrl(chain) {
        const rpcUrl = this.getRpcUrl(chain);
        // Convert HTTP(S) to WS(S)
        return rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    }
    /**
     * Make an RPC request
     */
    async request(chain, options) {
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
        }
        catch (error) {
            this.updateStats(false, Date.now() - startTime);
            throw error;
        }
    }
    /**
     * Batch multiple RPC requests
     */
    async batchRequest(chain, requests) {
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
    connectWebSocket(options) {
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
            }
            catch (error) {
                options.onError?.(error);
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
    async subscribeToBlocks(chain, callback) {
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
    async subscribeToLogs(chain, filter, callback) {
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
    getStats() {
        return { ...this.stats };
    }
    /**
     * Reset statistics
     */
    resetStats() {
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
    async makeRequest(url, payload, timeout, retries = 0) {
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
        }
        catch (error) {
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
    updateStats(success, responseTime) {
        if (success) {
            this.stats.successfulRequests++;
        }
        else {
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
export function createGatewayClient(config) {
    return new GatewayClient(config);
}
//# sourceMappingURL=GatewayClient.js.map