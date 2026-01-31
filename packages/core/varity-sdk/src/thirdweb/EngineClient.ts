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
export type EngineTransactionStatus =
  | 'queued'
  | 'sent'
  | 'mined'
  | 'errored'
  | 'cancelled';

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
export class EngineClient {
  private url: string;
  private accessToken: string;
  private backendWalletAddress?: string;

  constructor(config: EngineConfig) {
    this.url = config.url.replace(/\/$/, ''); // Remove trailing slash
    this.accessToken = config.accessToken;
    this.backendWalletAddress = config.backendWalletAddress;
  }

  /**
   * Send a transaction through Engine
   *
   * Automatically queues, optimizes gas, and retries failed transactions.
   *
   * @param params - Transaction parameters
   * @returns Transaction result with queue ID
   *
   * @example Basic transaction
   * ```typescript
   * import { EngineClient, varityL3Testnet } from '@varity-labs/sdk';
   * import { prepareContractCall } from 'thirdweb';
   *
   * const engine = new EngineClient({
   *   url: 'https://engine.varity.so',
   *   accessToken: process.env.ENGINE_ACCESS_TOKEN,
   *   backendWalletAddress: '0x...'
   * });
   *
   * // Prepare transaction
   * const tx = prepareContractCall({
   *   contract,
   *   method: 'function transfer(address to, uint256 amount)',
   *   params: [recipientAddress, amount]
   * });
   *
   * // Send through Engine
   * const result = await engine.sendTransaction({
   *   chain: varityL3Testnet,
   *   to: contract.address,
   *   data: tx.data,
   *   value: '0'
   * });
   *
   * console.log('Queue ID:', result.queueId);
   * ```
   *
   * @example With webhook notifications
   * ```typescript
   * const result = await engine.sendTransaction({
   *   chain: varityL3Testnet,
   *   to: contractAddress,
   *   data: encodedData,
   *   webhookUrl: 'https://myapp.com/api/webhook/engine'
   * });
   *
   * // Your webhook will receive status updates:
   * // { queueId, status: 'mined', transactionHash, blockNumber }
   * ```
   *
   * @example With gas limit
   * ```typescript
   * const result = await engine.sendTransaction({
   *   chain: varityL3Testnet,
   *   to: contractAddress,
   *   data: encodedData,
   *   gasLimit: '500000' // Override estimated gas
   * });
   * ```
   */
  async sendTransaction(params: EngineTransactionParams): Promise<EngineTransactionResult> {
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
   *
   * Deploys smart contracts with automatic gas optimization and retry logic.
   *
   * @param params - Deployment parameters
   * @returns Deployment result with queue ID
   *
   * @example Deploy ERC-721 NFT contract
   * ```typescript
   * import { EngineClient, varityL3Testnet } from '@varity-labs/sdk';
   * import NFTContractABI from './abis/NFTContract.json';
   * import NFTContractBytecode from './bytecode/NFTContract.json';
   *
   * const engine = new EngineClient({
   *   url: 'https://engine.varity.so',
   *   accessToken: process.env.ENGINE_ACCESS_TOKEN
   * });
   *
   * const result = await engine.deployContract({
   *   chain: varityL3Testnet,
   *   abi: NFTContractABI,
   *   bytecode: NFTContractBytecode.bytecode,
   *   constructorArgs: [
   *     'My NFT Collection',  // name
   *     'MNFT',               // symbol
   *     '0x...'               // owner address
   *   ]
   * });
   *
   * console.log('Deploying contract, Queue ID:', result.queueId);
   * ```
   *
   * @example Deploy ERC-20 token
   * ```typescript
   * const result = await engine.deployContract({
   *   chain: varityL3Testnet,
   *   abi: ERC20ABI,
   *   bytecode: ERC20Bytecode.bytecode,
   *   constructorArgs: [
   *     'My Token',           // name
   *     'MTK',                // symbol
   *     ethers.utils.parseEther('1000000')  // initial supply
   *   ],
   *   webhookUrl: 'https://myapp.com/api/webhook/deployment'
   * });
   * ```
   *
   * @example Deploy and wait for completion
   * ```typescript
   * const deployment = await engine.deployContract({
   *   chain: varityL3Testnet,
   *   abi: ContractABI,
   *   bytecode: ContractBytecode.bytecode,
   *   constructorArgs: []
   * });
   *
   * // Wait for deployment to complete
   * const completed = await engine.waitForTransaction(deployment.queueId);
   * console.log('Contract deployed at:', completed.transactionHash);
   * ```
   */
  async deployContract(params: EngineDeployParams): Promise<EngineTransactionResult> {
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
  async getTransactionStatus(queueId: string): Promise<EngineTransactionResult> {
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
   *
   * Polls Engine API until transaction is confirmed or fails.
   *
   * @param queueId - Engine queue ID from sendTransaction or deployContract
   * @param options - Optional polling configuration
   * @returns Completed transaction result
   *
   * @example Basic usage
   * ```typescript
   * import { EngineClient } from '@varity-labs/sdk';
   *
   * const engine = new EngineClient({ url, accessToken });
   *
   * // Send transaction
   * const tx = await engine.sendTransaction({ ... });
   *
   * // Wait for confirmation (default: poll every 2s, timeout 5min)
   * const result = await engine.waitForTransaction(tx.queueId);
   * console.log('Transaction mined:', result.transactionHash);
   * console.log('Block number:', result.blockNumber);
   * ```
   *
   * @example With custom polling interval
   * ```typescript
   * // Poll every 5 seconds instead of default 2 seconds
   * const result = await engine.waitForTransaction(queueId, {
   *   pollInterval: 5000,  // 5 seconds
   *   timeout: 600000      // 10 minutes
   * });
   * ```
   *
   * @example With error handling
   * ```typescript
   * try {
   *   const result = await engine.waitForTransaction(queueId);
   *   console.log('Success:', result.transactionHash);
   * } catch (error) {
   *   if (error.message.includes('timed out')) {
   *     console.error('Transaction took too long');
   *   } else if (error.message.includes('errored')) {
   *     console.error('Transaction failed:', error.message);
   *   }
   * }
   * ```
   */
  async waitForTransaction(
    queueId: string,
    options?: {
      /**
       * Polling interval in milliseconds (default: 2000)
       */
      pollInterval?: number;

      /**
       * Maximum time to wait in milliseconds (default: 300000 = 5 minutes)
       */
      timeout?: number;
    }
  ): Promise<EngineTransactionResult> {
    const pollInterval = options?.pollInterval || 2000;
    const timeout = options?.timeout || 300000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getTransactionStatus(queueId);

      if (status.status === 'mined') {
        return status;
      }

      if (status.status === 'errored' || status.status === 'cancelled') {
        throw new Error(
          `Transaction ${queueId} ${status.status}: ${status.errorMessage || 'Unknown error'}`
        );
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Transaction ${queueId} timed out after ${timeout}ms`);
  }

  /**
   * Cancel a queued transaction
   */
  async cancelTransaction(queueId: string): Promise<void> {
    await this.request(`/transaction/cancel/${queueId}`, {
      method: 'POST',
    });
  }

  /**
   * Get backend wallet balance
   */
  async getWalletBalance(chainId: number, walletAddress?: string): Promise<string> {
    const address = walletAddress || this.backendWalletAddress;
    if (!address) {
      throw new Error('Wallet address required');
    }

    const response = await this.request(
      `/backend-wallet/${chainId}/get-balance?walletAddress=${address}`
    );

    return response.result.balance;
  }

  /**
   * Get all backend wallets
   */
  async getBackendWallets(): Promise<string[]> {
    const response = await this.request('/backend-wallet/get-all');
    return response.result.wallets;
  }

  /**
   * Get transaction nonce for a wallet
   */
  async getNonce(chainId: number, walletAddress?: string): Promise<number> {
    const address = walletAddress || this.backendWalletAddress;
    if (!address) {
      throw new Error('Wallet address required');
    }

    const response = await this.request(
      `/backend-wallet/${chainId}/get-nonce?walletAddress=${address}`
    );

    return response.result.nonce;
  }

  /**
   * Make HTTP request to Engine API
   */
  private async request(endpoint: string, options?: RequestInit): Promise<any> {
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
 *
 * Factory function for creating EngineClient instances.
 *
 * @param config - Engine configuration
 * @returns Configured Engine client
 *
 * @example Basic setup
 * ```typescript
 * import { createEngineClient } from '@varity-labs/sdk';
 *
 * const engine = createEngineClient({
 *   url: 'https://engine.varity.so',
 *   accessToken: process.env.ENGINE_ACCESS_TOKEN
 * });
 *
 * // Now use engine client
 * const result = await engine.sendTransaction({ ... });
 * ```
 *
 * @example With backend wallet
 * ```typescript
 * const engine = createEngineClient({
 *   url: 'https://engine.varity.so',
 *   accessToken: process.env.ENGINE_ACCESS_TOKEN,
 *   backendWalletAddress: '0x...' // Default wallet for all transactions
 * });
 * ```
 *
 * @example Self-hosted Engine
 * ```typescript
 * const engine = createEngineClient({
 *   url: 'https://my-engine.example.com',
 *   accessToken: process.env.MY_ENGINE_TOKEN
 * });
 * ```
 */
export function createEngineClient(config: EngineConfig): EngineClient {
  return new EngineClient(config);
}

/**
 * Webhook handler helper
 *
 * Use this to handle Engine webhook notifications in your backend
 */
export function parseEngineWebhook(payload: any): EngineWebhookPayload {
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
export function verifyEngineWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Implement HMAC verification
  // This is a placeholder - actual implementation would use crypto.subtle or similar
  // to verify HMAC-SHA256 signature

  // For now, return true (webhook verification can be implemented based on Engine's spec)
  console.warn('Engine webhook verification not implemented - please implement HMAC verification');
  return true;
}
