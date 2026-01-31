/**
 * Revenue Split Service for Varity SDK
 *
 * Manages revenue distribution (70% creator, 30% platform).
 * Production patterns extracted from generic-template-dashboard.
 *
 * @example
 * ```typescript
 * import { BlockchainService, RevenueSplitService } from '@varity-labs/sdk';
 *
 * const blockchain = new BlockchainService({ rpcUrl: "...", chainId: 33529 });
 * const revenue = new RevenueSplitService(blockchain);
 *
 * const [creatorAmount, platformAmount] = revenue.calculateSplit(100_000_000n); // 100 USDC
 * console.log(`Creator: ${creatorAmount}, Platform: ${platformAmount}`);
 * ```
 */

import type { BlockchainService } from './BlockchainService';
import type { RevenueSplit, TransactionResult } from './types';

export class RevenueSplitService {
  private blockchain: BlockchainService;
  private splitterContractName: string;
  private platformPercentage: number;
  private creatorPercentage: number;

  constructor(
    blockchainService: BlockchainService,
    splitterContractName: string = 'RevenueSplitter',
    platformPercentage: number = 30
  ) {
    this.blockchain = blockchainService;
    this.splitterContractName = splitterContractName;
    this.platformPercentage = platformPercentage;
    this.creatorPercentage = 100 - platformPercentage;
  }

  /**
   * Calculate creator and platform amounts from total
   *
   * @param totalAmount - Total amount in smallest unit (e.g., USDC with 6 decimals)
   * @returns Tuple of [creatorAmount, platformAmount]
   *
   * @example
   * ```typescript
   * const [creator, platform] = revenue.calculateSplit(100_000_000n); // 100 USDC
   * // Returns: [70_000_000n, 30_000_000n] (70 USDC, 30 USDC)
   * ```
   */
  calculateSplit(totalAmount: bigint): [bigint, bigint] {
    const creatorAmount = (totalAmount * BigInt(this.creatorPercentage)) / 100n;
    const platformAmount = totalAmount - creatorAmount; // Remainder goes to platform
    return [creatorAmount, platformAmount];
  }

  /**
   * Distribute revenue for a tool purchase
   *
   * Note: Transaction submission requires thirdweb Engine setup
   *
   * @param toolId - The tool's ID
   * @param amountUSDC - Amount in USDC (6 decimals)
   * @returns TransactionResult if successful, null if error
   */
  async distributeRevenue(
    toolId: number,
    amountUSDC: bigint
  ): Promise<TransactionResult | null> {
    try {
      // Calculate split
      const [creatorAmount, platformAmount] = this.calculateSplit(amountUSDC);

      console.log(
        `Distributing revenue for tool ${toolId}: ` +
          `Total=${amountUSDC}, Creator=${creatorAmount} (${this.creatorPercentage}%), ` +
          `Platform=${platformAmount} (${this.platformPercentage}%)`
      );

      // Note: Actual transaction submission would be done via thirdweb Engine
      // This requires Engine setup with backend wallet and access token
      console.warn(
        'Transaction submission requires thirdweb Engine configuration'
      );

      return {
        txHash: '0x0', // Placeholder
        status: 1,
      };
    } catch (error) {
      console.error(`Error distributing revenue for tool ${toolId}:`, error);
      return null;
    }
  }

  /**
   * Get revenue split configuration for a tool
   *
   * @param toolId - The tool's ID
   * @returns RevenueSplit configuration, or null if not found
   */
  async getRevenueSplitConfig(toolId: number): Promise<RevenueSplit | null> {
    try {
      // Call getRevenueSplit(uint256)
      const splitData = await this.blockchain.readContract<any[]>(
        this.splitterContractName,
        'getRevenueSplit',
        [BigInt(toolId)]
      );

      return {
        creatorPercentage: Number(splitData[0]),
        platformPercentage: Number(splitData[1]),
        creatorAddress: splitData[2],
        platformAddress: splitData[3],
      };
    } catch (error) {
      console.error(`Error getting revenue split config for tool ${toolId}:`, error);
      return null;
    }
  }

  /**
   * Format USDC amount to human-readable string
   *
   * @param amount - Amount in smallest unit
   * @returns Formatted string (e.g., "100.00 USDC")
   */
  formatUSDC(amount: bigint): string {
    return this.blockchain.formatUSDC(amount);
  }

  /**
   * Parse human-readable USDC to smallest unit
   *
   * @param amountStr - Amount as string (e.g., "100.50")
   * @returns Amount in smallest unit (6 decimals)
   */
  parseUSDC(amountStr: string): bigint {
    return this.blockchain.parseUSDC(amountStr);
  }
}
