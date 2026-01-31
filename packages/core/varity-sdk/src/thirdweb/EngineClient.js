/**
 * thirdweb Engine Client
 *
 * Production-grade transaction management infrastructure
 * Replaces custom transaction queues with thirdweb's managed service
 *
 * Features:
 * - Automatic transaction queueing and execution
 * - Gas price optimization
 * - Automatic retry with exponential backoff
 * - Webhook notifications for transaction events
 * - Multi-chain support
 * - Production-ready scalability
 */
/**
 * thirdweb Engine Client
 *
 * Manages blockchain transactions through thirdweb's production infrastructure
 */
export class EngineClient {
    url;
    accessToken;
    backendWalletAddress;
    constructor(config) {
        this.url = config.url.replace(/\/$/, ''); // Remove trailing slash
        this.accessToken = config.accessToken;
        this.backendWalletAddress = config.backendWalletAddress;
    }
    /**
     * Send a transaction through Engine
     */
    async sendTransaction(params) {
        const response = await this.request('/transaction/write', {
            method: 'POST',
            body: JSON.stringify({
                chainId: params.chain.id,
                toAddress: params.to,
                data: params.data,
                value: params.value || '0',
                gasLimit: params.gasLimit,
                backendWalletAddress: this.backendWalletAddress,
                webhookUrl: params.webhookUrl,
            }),
        });
        return {
            queueId: response.result.queueId,
            status: 'queued',
            timestamp: new Date(),
        };
    }
    /**
     * Deploy a contract through Engine
     */
    async deployContract(params) {
        const response = await this.request('/contract/deploy', {
            method: 'POST',
            body: JSON.stringify({
                chainId: params.chain.id,
                abi: params.abi,
                bytecode: params.bytecode,
                constructorArgs: params.constructorArgs || [],
                backendWalletAddress: this.backendWalletAddress,
                webhookUrl: params.webhookUrl,
            }),
        });
        return {
            queueId: response.result.queueId,
            status: 'queued',
            timestamp: new Date(),
        };
    }
    /**
     * Get transaction status
     */
    async getTransactionStatus(queueId) {
        const response = await this.request(`/transaction/status/${queueId}`);
        return {
            queueId,
            transactionHash: response.result.transactionHash,
            status: response.result.status,
            blockNumber: response.result.blockNumber,
            errorMessage: response.result.errorMessage,
            timestamp: new Date(response.result.timestamp),
        };
    }
    /**
     * Wait for transaction to be mined
     */
    async waitForTransaction(queueId, options) {
        const pollInterval = options?.pollInterval || 2000;
        const timeout = options?.timeout || 300000;
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const status = await this.getTransactionStatus(queueId);
            if (status.status === 'mined') {
                return status;
            }
            if (status.status === 'errored' || status.status === 'cancelled') {
                throw new Error(`Transaction ${queueId} ${status.status}: ${status.errorMessage || 'Unknown error'}`);
            }
            // Wait before polling again
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        throw new Error(`Transaction ${queueId} timed out after ${timeout}ms`);
    }
    /**
     * Cancel a queued transaction
     */
    async cancelTransaction(queueId) {
        await this.request(`/transaction/cancel/${queueId}`, {
            method: 'POST',
        });
    }
    /**
     * Get backend wallet balance
     */
    async getWalletBalance(chainId, walletAddress) {
        const address = walletAddress || this.backendWalletAddress;
        if (!address) {
            throw new Error('Wallet address required');
        }
        const response = await this.request(`/backend-wallet/${chainId}/get-balance?walletAddress=${address}`);
        return response.result.balance;
    }
    /**
     * Get all backend wallets
     */
    async getBackendWallets() {
        const response = await this.request('/backend-wallet/get-all');
        return response.result.wallets;
    }
    /**
     * Get transaction nonce for a wallet
     */
    async getNonce(chainId, walletAddress) {
        const address = walletAddress || this.backendWalletAddress;
        if (!address) {
            throw new Error('Wallet address required');
        }
        const response = await this.request(`/backend-wallet/${chainId}/get-nonce?walletAddress=${address}`);
        return response.result.nonce;
    }
    /**
     * Make HTTP request to Engine API
     */
    async request(endpoint, options) {
        const url = `${this.url}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.accessToken}`,
                ...options?.headers,
            },
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(`Engine request failed: ${error.error || error.message || 'Unknown error'}`);
        }
        return response.json();
    }
}
/**
 * Create Engine client instance
 */
export function createEngineClient(config) {
    return new EngineClient(config);
}
/**
 * Webhook handler helper
 *
 * Use this to handle Engine webhook notifications in your backend
 */
export function parseEngineWebhook(payload) {
    return {
        queueId: payload.queueId,
        status: payload.status,
        transactionHash: payload.transactionHash,
        blockNumber: payload.blockNumber,
        errorMessage: payload.errorMessage,
        timestamp: payload.timestamp,
    };
}
/**
 * Verify Engine webhook signature (if configured)
 */
export function verifyEngineWebhook(payload, signature, secret) {
    // Implement HMAC verification
    // This is a placeholder - actual implementation would use crypto.subtle or similar
    // to verify HMAC-SHA256 signature
    // For now, return true (webhook verification can be implemented based on Engine's spec)
    console.warn('Engine webhook verification not implemented - please implement HMAC verification');
    return true;
}
//# sourceMappingURL=EngineClient.js.map