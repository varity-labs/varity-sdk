/**
 * Gas Usage Tracker
 *
 * Tracks gas usage for per-app billing in Varity SDK.
 * Each app's gas consumption is monitored and sent to backend for billing.
 *
 * @module tracking/gasTracker
 */

import type { ThirdwebClient, Chain } from 'thirdweb';

/**
 * Gas usage event sent to backend for billing
 */
export interface GasUsageEvent {
  /** Unique app identifier from App Store */
  appId: string;

  /** Developer's wallet address for billing */
  developerWallet: string;

  /** Transaction hash on-chain */
  transactionHash: string;

  /** Gas cost in USDC (6 decimal precision) */
  gasSponsored: string;

  /** Unix timestamp (milliseconds) */
  timestamp: number;

  /** Chain ID (33529 for Varity L3) */
  chainId: number;

  /** End user's wallet who triggered the transaction */
  userWallet: string;
}

/**
 * Transaction receipt with gas information
 */
export interface GasTransactionReceipt {
  /** Transaction hash */
  transactionHash: string;

  /** Gas used by the transaction */
  gasUsed: bigint;

  /** Effective gas price paid */
  effectiveGasPrice: bigint;

  /** Block number */
  blockNumber: bigint;

  /** Status (1 = success, 0 = failure) */
  status: number;
}

/**
 * Gas tracking configuration
 */
export interface GasTrackerConfig {
  /** API endpoint for gas tracking (default: https://api.varity.so) */
  apiUrl?: string;

  /** Enable/disable tracking (for development) */
  enabled?: boolean;

  /** Retry attempts on failure */
  retries?: number;

  /** Timeout for tracking requests (ms) */
  timeout?: number;
}

// Default configuration
const DEFAULT_CONFIG: Required<GasTrackerConfig> = {
  apiUrl: 'https://api.varity.so',
  enabled: true,
  retries: 3,
  timeout: 5000,
};

/**
 * Wait for transaction receipt with retry logic
 *
 * @param client - thirdweb client
 * @param chain - Chain to query
 * @param transactionHash - Transaction hash to wait for
 * @param maxWaitTime - Maximum time to wait in ms (default: 60s)
 * @returns Transaction receipt
 */
export async function waitForTransactionReceipt(
  client: ThirdwebClient,
  chain: Chain,
  transactionHash: string,
  maxWaitTime: number = 60000
): Promise<GasTransactionReceipt> {
  const startTime = Date.now();

  // Import thirdweb RPC functions
  const { getRpcClient, eth_getTransactionReceipt } = await import('thirdweb/rpc');

  const rpcClient = getRpcClient({ client, chain });

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const receipt = await eth_getTransactionReceipt(rpcClient, {
        hash: transactionHash as `0x${string}`,
      });

      if (receipt) {
        return {
          transactionHash: receipt.transactionHash,
          gasUsed: receipt.gasUsed,
          effectiveGasPrice: receipt.effectiveGasPrice,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 'success' ? 1 : 0,
        };
      }
    } catch (error) {
      // Receipt not ready yet, continue waiting
    }

    // Wait 2 seconds before retrying
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error(`Transaction receipt not available after ${maxWaitTime}ms`);
}

/**
 * Calculate gas cost in USDC (6 decimals)
 *
 * @param receipt - Transaction receipt with gas information
 * @param usdcPerGas - USDC price per gas unit (default: auto-fetch from oracle)
 * @returns Gas cost in USDC as string (6 decimal precision)
 *
 * @example
 * const receipt = await waitForTransactionReceipt(client, chain, txHash);
 * const usdcCost = await calculateGasInUSDC(receipt);
 * console.log(`Gas cost: ${usdcCost} USDC`);  // "0.025000"
 */
export async function calculateGasInUSDC(
  receipt: GasTransactionReceipt,
  usdcPerGas?: string
): Promise<string> {
  // Calculate total gas cost in wei
  const totalGasWei = receipt.gasUsed * receipt.effectiveGasPrice;

  // CRITICAL: Varity L3 native token is USDC (6 decimals)
  // Convert from wei (18 decimals) to USDC (6 decimals)
  // 1 USDC = 1_000_000 (10^6)
  // 1 ETH = 1_000_000_000_000_000_000 (10^18)

  // For Varity L3, the native token IS USDC, so:
  // - Gas price is already in USDC units
  // - We need to convert from 18 decimals to 6 decimals

  // Divide by 10^12 to convert from 18 decimals to 6 decimals
  const divisor = BigInt(10 ** 12);
  const usdcAmount = totalGasWei / divisor;

  // Convert to decimal string (6 decimal places)
  const usdcString = usdcAmount.toString().padStart(7, '0');
  const integerPart = usdcString.slice(0, -6) || '0';
  const decimalPart = usdcString.slice(-6);

  return `${integerPart}.${decimalPart}`;
}

/**
 * Track gas usage for billing
 *
 * Sends gas usage event to Varity backend API for billing purposes.
 * Includes retry logic and error handling.
 *
 * @param event - Gas usage event to track
 * @param config - Optional configuration
 * @returns Promise that resolves when tracking is complete
 *
 * @example
 * await trackGasUsage({
 *   appId: 'app_abc123',
 *   developerWallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *   transactionHash: '0x...',
 *   gasSponsored: '0.025000',
 *   timestamp: Date.now(),
 *   chainId: 33529,
 *   userWallet: '0x...',
 * });
 */
export async function trackGasUsage(
  event: GasUsageEvent,
  config: GasTrackerConfig = {}
): Promise<void> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!finalConfig.enabled) {
    console.log('[Gas Tracker] Tracking disabled, skipping');
    return;
  }

  const url = `${finalConfig.apiUrl}/v1/gas-tracking`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < finalConfig.retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gas tracking failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log(`[Gas Tracker] Tracked ${event.gasSponsored} USDC for app ${event.appId}`);
      return;

    } catch (error) {
      lastError = error as Error;
      console.warn(`[Gas Tracker] Attempt ${attempt + 1}/${finalConfig.retries} failed:`, error);

      // Wait before retrying (exponential backoff)
      if (attempt < finalConfig.retries - 1) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // All retries failed - log error but don't throw
  // We don't want to fail the user's transaction just because tracking failed
  console.error('[Gas Tracker] Failed to track gas usage after all retries:', lastError);
}

/**
 * Track gas usage for a transaction (convenience method)
 *
 * Waits for transaction receipt, calculates gas cost, and tracks usage.
 *
 * @param client - thirdweb client
 * @param chain - Chain the transaction is on
 * @param transactionHash - Transaction hash to track
 * @param appId - App identifier
 * @param developerWallet - Developer's wallet address
 * @param userWallet - End user's wallet address
 * @param config - Optional configuration
 *
 * @example
 * await trackTransactionGasUsage(
 *   client,
 *   varityL3Testnet,
 *   txHash,
 *   'app_abc123',
 *   '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *   '0x...'
 * );
 */
export async function trackTransactionGasUsage(
  client: ThirdwebClient,
  chain: Chain,
  transactionHash: string,
  appId: string,
  developerWallet: string,
  userWallet: string,
  config: GasTrackerConfig = {}
): Promise<void> {
  try {
    // Wait for transaction to be mined
    const receipt = await waitForTransactionReceipt(client, chain, transactionHash);

    // Calculate gas cost in USDC
    const gasSponsored = await calculateGasInUSDC(receipt);

    // Track the gas usage
    await trackGasUsage({
      appId,
      developerWallet,
      transactionHash,
      gasSponsored,
      timestamp: Date.now(),
      chainId: chain.id,
      userWallet,
    }, config);

  } catch (error) {
    console.error('[Gas Tracker] Error tracking transaction gas usage:', error);
    // Don't throw - we don't want to fail the user's flow
  }
}

/**
 * Create a gas tracker instance with default config
 *
 * @param config - Gas tracker configuration
 * @returns Object with tracking methods
 *
 * @example
 * const tracker = createGasTracker({
 *   apiUrl: 'https://api.varity.so',
 *   enabled: true,
 * });
 *
 * await tracker.trackTransaction(client, chain, txHash, appId, devWallet, userWallet);
 */
export function createGasTracker(config: GasTrackerConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return {
    /**
     * Track gas usage event
     */
    trackEvent: (event: GasUsageEvent) => trackGasUsage(event, finalConfig),

    /**
     * Track transaction gas usage
     */
    trackTransaction: (
      client: ThirdwebClient,
      chain: Chain,
      transactionHash: string,
      appId: string,
      developerWallet: string,
      userWallet: string
    ) => trackTransactionGasUsage(
      client,
      chain,
      transactionHash,
      appId,
      developerWallet,
      userWallet,
      finalConfig
    ),

    /**
     * Calculate gas in USDC
     */
    calculateGas: calculateGasInUSDC,

    /**
     * Wait for receipt
     */
    waitForReceipt: (client: ThirdwebClient, chain: Chain, txHash: string) =>
      waitForTransactionReceipt(client, chain, txHash),
  };
}
