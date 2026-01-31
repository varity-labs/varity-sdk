/**
 * Alchemy Monitor for Arbitrum Sepolia Transactions
 * Week 5-6: Real-time monitoring infrastructure
 *
 * This class provides comprehensive monitoring of blockchain transactions
 * on Arbitrum Sepolia testnet using Alchemy SDK.
 *
 * Features:
 * - Real-time transaction tracking
 * - Success rate metrics
 * - Gas usage analytics
 * - Address monitoring
 * - Webhook integration
 * - Performance metrics export
 */

import { Alchemy, Network, AssetTransfersCategory } from 'alchemy-sdk';

export interface TransactionMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageGasUsed: number;
  averageGasPrice: string;
  totalGasCost: string;
  lastUpdated: number;
}

export interface AddressActivity {
  address: string;
  incomingTransfers: number;
  outgoingTransfers: number;
  totalValue: string;
  lastActivity: number;
}

export interface BlockchainStatus {
  currentBlockNumber: number;
  networkHealth: 'healthy' | 'degraded' | 'down';
  averageBlockTime: number;
  lastChecked: number;
}

export class AlchemyMonitor {
  private alchemy: Alchemy;
  private metrics: TransactionMetrics;
  private monitoredAddresses: Map<string, AddressActivity>;
  private blockchainStatus: BlockchainStatus;

  constructor(apiKey: string, network: Network = Network.ARB_SEPOLIA) {
    // Initialize Alchemy with settings
    this.alchemy = new Alchemy({
      apiKey,
      network,
    });

    this.metrics = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      averageGasUsed: 0,
      averageGasPrice: '0',
      totalGasCost: '0',
      lastUpdated: Date.now(),
    };

    this.monitoredAddresses = new Map();

    this.blockchainStatus = {
      currentBlockNumber: 0,
      networkHealth: 'healthy',
      averageBlockTime: 2, // Arbitrum blocks are ~2 seconds
      lastChecked: Date.now(),
    };

    console.log(`✅ AlchemyMonitor initialized for ${network}`);
  }

  /**
   * Track a specific transaction and update metrics
   */
  async trackTransaction(txHash: string): Promise<void> {
    try {
      const receipt = await this.alchemy.core.getTransactionReceipt(txHash);

      if (!receipt) {
        console.warn(`⚠️  Transaction ${txHash} not found or pending`);
        return;
      }

      this.metrics.totalTransactions++;

      if (receipt.status === 1) {
        this.metrics.successfulTransactions++;
        console.log(`✅ Transaction ${txHash} succeeded`);
      } else {
        this.metrics.failedTransactions++;
        console.error(`❌ Transaction ${txHash} failed`);
      }

      // Update average gas used
      const gasUsed = receipt.gasUsed.toNumber();
      this.metrics.averageGasUsed =
        (this.metrics.averageGasUsed * (this.metrics.totalTransactions - 1) + gasUsed) /
        this.metrics.totalTransactions;

      // Update gas price and cost if available
      if (receipt.effectiveGasPrice) {
        const gasPrice = receipt.effectiveGasPrice.toString();
        const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice).toString();

        // Calculate total gas cost
        const previousCost = BigInt(this.metrics.totalGasCost);
        const newCost = BigInt(gasCost);
        this.metrics.totalGasCost = (previousCost + newCost).toString();

        // Calculate average gas price
        const previousAvg = BigInt(this.metrics.averageGasPrice || '0');
        const avgGasPrice =
          (previousAvg * BigInt(this.metrics.totalTransactions - 1) + BigInt(gasPrice)) /
          BigInt(this.metrics.totalTransactions);
        this.metrics.averageGasPrice = avgGasPrice.toString();
      }

      this.metrics.lastUpdated = Date.now();

      console.log(`📊 Metrics updated: ${this.getSuccessRate().toFixed(2)}% success rate`);
    } catch (error) {
      console.error(`Error tracking transaction ${txHash}:`, error);
      throw new Error(`Failed to track transaction: ${(error as Error).message}`);
    }
  }

  /**
   * Calculate transaction success rate
   */
  getSuccessRate(): number {
    if (this.metrics.totalTransactions === 0) {
      return 0;
    }

    return (this.metrics.successfulTransactions / this.metrics.totalTransactions) * 100;
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): TransactionMetrics {
    return { ...this.metrics };
  }

  /**
   * Monitor all transactions for a specific address
   */
  async monitorAddress(address: string): Promise<AddressActivity> {
    try {
      console.log(`🔍 Monitoring address: ${address}`);

      // Get asset transfers
      const history = await this.alchemy.core.getAssetTransfers({
        fromAddress: address,
        category: [
          AssetTransfersCategory.EXTERNAL,
          AssetTransfersCategory.INTERNAL,
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC721,
          AssetTransfersCategory.ERC1155,
        ],
        maxCount: 100,
      });

      const incomingHistory = await this.alchemy.core.getAssetTransfers({
        toAddress: address,
        category: [
          AssetTransfersCategory.EXTERNAL,
          AssetTransfersCategory.INTERNAL,
          AssetTransfersCategory.ERC20,
        ],
        maxCount: 100,
      });

      // Calculate total value transferred
      let totalValue = BigInt(0);
      for (const transfer of [...history.transfers, ...incomingHistory.transfers]) {
        if (transfer.value) {
          const valueWei = BigInt(Math.floor(transfer.value * 1e18));
          totalValue += valueWei;
        }
      }

      const activity: AddressActivity = {
        address,
        outgoingTransfers: history.transfers.length,
        incomingTransfers: incomingHistory.transfers.length,
        totalValue: totalValue.toString(),
        lastActivity: Date.now(),
      };

      this.monitoredAddresses.set(address, activity);

      console.log(`📊 Address Activity for ${address}:`);
      console.log(`   Outgoing: ${activity.outgoingTransfers}`);
      console.log(`   Incoming: ${activity.incomingTransfers}`);
      console.log(`   Total Value: ${this.formatEther(activity.totalValue)} ETH`);

      return activity;
    } catch (error) {
      console.error(`Error monitoring address ${address}:`, error);
      throw new Error(`Failed to monitor address: ${(error as Error).message}`);
    }
  }

  /**
   * Get activity for a monitored address
   */
  getAddressActivity(address: string): AddressActivity | undefined {
    return this.monitoredAddresses.get(address);
  }

  /**
   * Get all monitored addresses
   */
  getAllMonitoredAddresses(): AddressActivity[] {
    return Array.from(this.monitoredAddresses.values());
  }

  /**
   * Check blockchain network status
   */
  async checkNetworkStatus(): Promise<BlockchainStatus> {
    try {
      const currentBlock = await this.alchemy.core.getBlockNumber();

      // Get last 10 blocks to calculate average block time
      const recentBlocks = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          this.alchemy.core.getBlock(currentBlock - i)
        )
      );

      // Calculate average block time
      let totalTimeDiff = 0;
      for (let i = 0; i < recentBlocks.length - 1; i++) {
        const timeDiff = recentBlocks[i].timestamp - recentBlocks[i + 1].timestamp;
        totalTimeDiff += timeDiff;
      }
      const avgBlockTime = totalTimeDiff / (recentBlocks.length - 1);

      this.blockchainStatus = {
        currentBlockNumber: currentBlock,
        networkHealth: avgBlockTime < 10 ? 'healthy' : avgBlockTime < 30 ? 'degraded' : 'down',
        averageBlockTime: avgBlockTime,
        lastChecked: Date.now(),
      };

      console.log(`🌐 Network Status:`);
      console.log(`   Current Block: ${currentBlock}`);
      console.log(`   Health: ${this.blockchainStatus.networkHealth}`);
      console.log(`   Avg Block Time: ${avgBlockTime.toFixed(2)}s`);

      return { ...this.blockchainStatus };
    } catch (error) {
      console.error('Error checking network status:', error);
      this.blockchainStatus.networkHealth = 'down';
      throw new Error(`Failed to check network status: ${(error as Error).message}`);
    }
  }

  /**
   * Get current blockchain status
   */
  getBlockchainStatus(): BlockchainStatus {
    return { ...this.blockchainStatus };
  }

  /**
   * Export metrics in JSON format
   */
  exportMetrics(): object {
    return {
      metrics: this.getMetrics(),
      successRate: this.getSuccessRate(),
      monitoredAddresses: this.getAllMonitoredAddresses(),
      blockchainStatus: this.getBlockchainStatus(),
      timestamp: Date.now(),
      network: 'arbitrum-sepolia',
    };
  }

  /**
   * Reset all metrics (for testing purposes)
   */
  resetMetrics(): void {
    this.metrics = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      averageGasUsed: 0,
      averageGasPrice: '0',
      totalGasCost: '0',
      lastUpdated: Date.now(),
    };

    this.monitoredAddresses.clear();

    console.log('🔄 Metrics reset');
  }

  /**
   * Setup webhook for contract events (requires Alchemy Notify API)
   */
  async setupWebhook(
    contractAddress: string,
    webhookUrl: string
  ): Promise<{ webhookId: string }> {
    try {
      console.log(`🔗 Setting up webhook for contract: ${contractAddress}`);
      console.log(`   Webhook URL: ${webhookUrl}`);

      // Note: This is a placeholder for Alchemy Notify API integration
      // Actual implementation requires Alchemy Notify API access

      return {
        webhookId: `webhook-${Date.now()}`,
      };
    } catch (error) {
      console.error('Error setting up webhook:', error);
      throw new Error(`Failed to setup webhook: ${(error as Error).message}`);
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(txHash: string): Promise<any> {
    try {
      const [receipt, transaction] = await Promise.all([
        this.alchemy.core.getTransactionReceipt(txHash),
        this.alchemy.core.getTransaction(txHash),
      ]);

      if (!receipt || !transaction) {
        throw new Error('Transaction not found');
      }

      return {
        hash: txHash,
        status: receipt.status === 1 ? 'success' : 'failed',
        from: receipt.from,
        to: receipt.to,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
        blockNumber: receipt.blockNumber,
        confirmations: receipt.confirmations,
        value: transaction.value.toString(),
        data: transaction.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Error getting transaction details for ${txHash}:`, error);
      throw new Error(`Failed to get transaction details: ${(error as Error).message}`);
    }
  }

  /**
   * Format wei to ether
   */
  private formatEther(wei: string): string {
    const value = BigInt(wei);
    const eth = Number(value) / 1e18;
    return eth.toFixed(6);
  }

  /**
   * Format gas price (wei to gwei)
   */
  formatGasPrice(wei: string): string {
    const value = BigInt(wei);
    const gwei = Number(value) / 1e9;
    return gwei.toFixed(2);
  }

  /**
   * Get average gas cost in ETH
   */
  getAverageGasCostETH(): string {
    if (this.metrics.totalTransactions === 0) {
      return '0';
    }

    const avgCost = BigInt(this.metrics.totalGasCost) / BigInt(this.metrics.totalTransactions);
    return this.formatEther(avgCost.toString());
  }

  /**
   * Print summary report
   */
  printSummary(): void {
    console.log('\n📊 Alchemy Monitor Summary Report');
    console.log('================================');
    console.log(`Total Transactions: ${this.metrics.totalTransactions}`);
    console.log(`Successful: ${this.metrics.successfulTransactions}`);
    console.log(`Failed: ${this.metrics.failedTransactions}`);
    console.log(`Success Rate: ${this.getSuccessRate().toFixed(2)}%`);
    console.log(`Average Gas Used: ${this.metrics.averageGasUsed.toFixed(0)}`);
    console.log(`Average Gas Price: ${this.formatGasPrice(this.metrics.averageGasPrice)} gwei`);
    console.log(`Total Gas Cost: ${this.formatEther(this.metrics.totalGasCost)} ETH`);
    console.log(`Average Cost per TX: ${this.getAverageGasCostETH()} ETH`);
    console.log(`Monitored Addresses: ${this.monitoredAddresses.size}`);
    console.log(`Network Health: ${this.blockchainStatus.networkHealth}`);
    console.log(`Current Block: ${this.blockchainStatus.currentBlockNumber}`);
    console.log('================================\n');
  }
}

export default AlchemyMonitor;
