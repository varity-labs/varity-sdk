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
import type { Chain } from 'thirdweb';
/**
 * Engine configuration
 */
export interface EngineConfig {
    /**
     * Engine URL (e.g., https://engine.thirdweb.com or self-hosted)
     */
    url: string;
    /**
     * Access token for authentication
     */
    accessToken: string;
    /**
     * Backend wallet address to use for transactions
     */
    backendWalletAddress?: string;
}
/**
 * Transaction parameters for Engine
 */
export interface EngineTransactionParams {
    /**
     * Chain to execute on
     */
    chain: Chain;
    /**
     * Contract address
     */
    to: string;
    /**
     * Encoded transaction data
     */
    data: string;
    /**
     * Value to send (in wei)
     */
    value?: string;
    /**
     * Gas limit
     */
    gasLimit?: string;
    /**
     * Webhook URL for transaction status updates
     */
    webhookUrl?: string;
}
/**
 * Engine transaction status
 */
export type EngineTransactionStatus = 'queued' | 'sent' | 'mined' | 'errored' | 'cancelled';
/**
 * Engine transaction result
 */
export interface EngineTransactionResult {
    /**
     * Queue ID (unique identifier for this transaction)
     */
    queueId: string;
    /**
     * Transaction hash (available after sent)
     */
    transactionHash?: string;
    /**
     * Status
     */
    status: EngineTransactionStatus;
    /**
     * Block number (available after mined)
     */
    blockNumber?: number;
    /**
     * Error message (if errored)
     */
    errorMessage?: string;
    /**
     * Timestamp
     */
    timestamp: Date;
}
/**
 * Contract deployment parameters for Engine
 */
export interface EngineDeployParams {
    /**
     * Chain to deploy on
     */
    chain: Chain;
    /**
     * Contract ABI
     */
    abi: any[];
    /**
     * Contract bytecode
     */
    bytecode: string;
    /**
     * Constructor arguments
     */
    constructorArgs?: any[];
    /**
     * Webhook URL for deployment status updates
     */
    webhookUrl?: string;
}
/**
 * Engine webhook payload
 */
export interface EngineWebhookPayload {
    queueId: string;
    status: EngineTransactionStatus;
    transactionHash?: string;
    blockNumber?: number;
    errorMessage?: string;
    timestamp: string;
}
/**
 * thirdweb Engine Client
 *
 * Manages blockchain transactions through thirdweb's production infrastructure
 */
export declare class EngineClient {
    private url;
    private accessToken;
    private backendWalletAddress?;
    constructor(config: EngineConfig);
    /**
     * Send a transaction through Engine
     */
    sendTransaction(params: EngineTransactionParams): Promise<EngineTransactionResult>;
    /**
     * Deploy a contract through Engine
     */
    deployContract(params: EngineDeployParams): Promise<EngineTransactionResult>;
    /**
     * Get transaction status
     */
    getTransactionStatus(queueId: string): Promise<EngineTransactionResult>;
    /**
     * Wait for transaction to be mined
     */
    waitForTransaction(queueId: string, options?: {
        /**
         * Polling interval in milliseconds (default: 2000)
         */
        pollInterval?: number;
        /**
         * Maximum time to wait in milliseconds (default: 300000 = 5 minutes)
         */
        timeout?: number;
    }): Promise<EngineTransactionResult>;
    /**
     * Cancel a queued transaction
     */
    cancelTransaction(queueId: string): Promise<void>;
    /**
     * Get backend wallet balance
     */
    getWalletBalance(chainId: number, walletAddress?: string): Promise<string>;
    /**
     * Get all backend wallets
     */
    getBackendWallets(): Promise<string[]>;
    /**
     * Get transaction nonce for a wallet
     */
    getNonce(chainId: number, walletAddress?: string): Promise<number>;
    /**
     * Make HTTP request to Engine API
     */
    private request;
}
/**
 * Create Engine client instance
 */
export declare function createEngineClient(config: EngineConfig): EngineClient;
/**
 * Webhook handler helper
 *
 * Use this to handle Engine webhook notifications in your backend
 */
export declare function parseEngineWebhook(payload: any): EngineWebhookPayload;
/**
 * Verify Engine webhook signature (if configured)
 */
export declare function verifyEngineWebhook(payload: string, signature: string, secret: string): boolean;
//# sourceMappingURL=EngineClient.d.ts.map