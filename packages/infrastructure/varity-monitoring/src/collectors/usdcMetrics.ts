import { Registry, Gauge, Counter, Histogram } from 'prom-client';
import { ethers } from 'ethers';

/**
 * USDCMetrics - USDC-specific metrics for Varity L3
 *
 * Tracks:
 * - Total USDC supply on Varity L3
 * - USDC transactions and transfers
 * - Average transaction costs in USDC
 * - USDC bridge activity
 * - USDC holder distribution
 */
export class USDCMetrics {
  private registry: Registry;
  private provider: ethers.JsonRpcProvider | null = null;
  private usdcDecimals: number = 6; // USDC has 6 decimals

  // Supply metrics
  private usdcTotalSupplyGauge: Gauge;
  private usdcCirculatingSupplyGauge: Gauge;
  private usdcLockedSupplyGauge: Gauge;

  // Transaction metrics
  private usdcTransfersCounter: Counter;
  private usdcTransferVolumeCounter: Counter;
  private usdcTransferAmountHistogram: Histogram;

  // Cost metrics
  private avgTransactionCostGauge: Gauge;
  private avgTransactionCostHistogram: Histogram;
  private totalTransactionFeesCounter: Counter;

  // Bridge metrics
  private usdcBridgeInCounter: Counter;
  private usdcBridgeOutCounter: Counter;
  private usdcBridgeVolumeGauge: Gauge;
  private usdcBridgeLatency: Histogram;

  // Holder metrics
  private usdcHoldersGauge: Gauge;
  private usdcTopHoldersGauge: Gauge;
  private usdcHolderDistributionGauge: Gauge;

  // Activity metrics
  private usdcActiveAddressesGauge: Gauge;
  private usdcTransactionRateGauge: Gauge;
  private usdcVelocityGauge: Gauge;

  // Gas token metrics (USDC is native gas)
  private gasTokenPriceGauge: Gauge;
  private avgGasUsedGauge: Gauge;
  private avgGasCostUsdc: Gauge;

  constructor(rpcUrl?: string) {
    this.registry = new Registry();

    if (rpcUrl) {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }

    // Initialize supply metrics
    this.usdcTotalSupplyGauge = new Gauge({
      name: 'varity_usdc_total_supply',
      help: 'Total USDC supply on Varity L3',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.usdcCirculatingSupplyGauge = new Gauge({
      name: 'varity_usdc_circulating_supply',
      help: 'Circulating USDC supply (excluding locked)',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.usdcLockedSupplyGauge = new Gauge({
      name: 'varity_usdc_locked_supply',
      help: 'USDC locked in contracts',
      labelNames: ['chain', 'contract_type'],
      registers: [this.registry]
    });

    // Initialize transaction metrics
    this.usdcTransfersCounter = new Counter({
      name: 'varity_usdc_transfers_total',
      help: 'Total number of USDC transfers',
      labelNames: ['chain', 'transfer_type'],
      registers: [this.registry]
    });

    this.usdcTransferVolumeCounter = new Counter({
      name: 'varity_usdc_transfer_volume_total',
      help: 'Total USDC transfer volume',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.usdcTransferAmountHistogram = new Histogram({
      name: 'varity_usdc_transfer_amount_distribution',
      help: 'Distribution of USDC transfer amounts',
      labelNames: ['chain'],
      buckets: [1, 10, 100, 1000, 10000, 100000, 1000000],
      registers: [this.registry]
    });

    // Initialize cost metrics
    this.avgTransactionCostGauge = new Gauge({
      name: 'varity_usdc_avg_transaction_cost',
      help: 'Average transaction cost in USDC',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.avgTransactionCostHistogram = new Histogram({
      name: 'varity_usdc_transaction_cost_distribution',
      help: 'Distribution of transaction costs in USDC',
      labelNames: ['chain', 'transaction_type'],
      buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0],
      registers: [this.registry]
    });

    this.totalTransactionFeesCounter = new Counter({
      name: 'varity_usdc_transaction_fees_total',
      help: 'Total transaction fees collected in USDC',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    // Initialize bridge metrics
    this.usdcBridgeInCounter = new Counter({
      name: 'varity_usdc_bridge_in_total',
      help: 'Total USDC bridged into Varity L3',
      labelNames: ['chain', 'source_chain'],
      registers: [this.registry]
    });

    this.usdcBridgeOutCounter = new Counter({
      name: 'varity_usdc_bridge_out_total',
      help: 'Total USDC bridged out of Varity L3',
      labelNames: ['chain', 'destination_chain'],
      registers: [this.registry]
    });

    this.usdcBridgeVolumeGauge = new Gauge({
      name: 'varity_usdc_bridge_volume_24h',
      help: 'USDC bridge volume in last 24 hours',
      labelNames: ['chain', 'direction'],
      registers: [this.registry]
    });

    this.usdcBridgeLatency = new Histogram({
      name: 'varity_usdc_bridge_duration_seconds',
      help: 'Time to complete bridge operation',
      labelNames: ['chain', 'direction'],
      buckets: [60, 300, 600, 1800, 3600, 7200],
      registers: [this.registry]
    });

    // Initialize holder metrics
    this.usdcHoldersGauge = new Gauge({
      name: 'varity_usdc_holders_total',
      help: 'Total number of USDC holders',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.usdcTopHoldersGauge = new Gauge({
      name: 'varity_usdc_top_holder_balance',
      help: 'Balance of top USDC holders',
      labelNames: ['chain', 'rank'],
      registers: [this.registry]
    });

    this.usdcHolderDistributionGauge = new Gauge({
      name: 'varity_usdc_holder_distribution_percentage',
      help: 'Percentage of supply held by holder groups',
      labelNames: ['chain', 'group'],
      registers: [this.registry]
    });

    // Initialize activity metrics
    this.usdcActiveAddressesGauge = new Gauge({
      name: 'varity_usdc_active_addresses',
      help: 'Number of active USDC addresses',
      labelNames: ['chain', 'timeframe'],
      registers: [this.registry]
    });

    this.usdcTransactionRateGauge = new Gauge({
      name: 'varity_usdc_transaction_rate_per_second',
      help: 'USDC transactions per second',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.usdcVelocityGauge = new Gauge({
      name: 'varity_usdc_velocity',
      help: 'USDC velocity (transaction volume / supply)',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    // Initialize gas token metrics
    this.gasTokenPriceGauge = new Gauge({
      name: 'varity_gas_token_price_usdc',
      help: 'Price of gas token (USDC) - always 1.0',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.avgGasUsedGauge = new Gauge({
      name: 'varity_avg_gas_used_per_transaction',
      help: 'Average gas used per transaction',
      labelNames: ['chain', 'transaction_type'],
      registers: [this.registry]
    });

    this.avgGasCostUsdc = new Gauge({
      name: 'varity_avg_gas_cost_usdc',
      help: 'Average gas cost in USDC',
      labelNames: ['chain', 'transaction_type'],
      registers: [this.registry]
    });

    // Set gas token price to 1.0 (USDC is always $1)
    this.gasTokenPriceGauge.set({ chain: 'varity-l3' }, 1.0);
  }

  /**
   * Set RPC provider
   */
  setProvider(rpcUrl: string): void {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Convert wei to USDC (6 decimals)
   */
  private weiToUsdc(weiAmount: bigint): number {
    return parseFloat(ethers.formatUnits(weiAmount, this.usdcDecimals));
  }

  /**
   * Record USDC transfer
   */
  recordUsdcTransfer(
    chain: string,
    amountUsdc: number,
    transferType: 'transfer' | 'mint' | 'burn' = 'transfer'
  ): void {
    this.usdcTransfersCounter.inc({ chain, transfer_type: transferType });
    this.usdcTransferVolumeCounter.inc({ chain }, amountUsdc);
    this.usdcTransferAmountHistogram.observe({ chain }, amountUsdc);
  }

  /**
   * Record transaction cost
   */
  recordTransactionCost(
    chain: string,
    gasUsed: number,
    gasPriceWei: bigint,
    transactionType: string = 'transfer'
  ): void {
    const costUsdc = this.weiToUsdc(gasPriceWei * BigInt(gasUsed));

    this.avgTransactionCostHistogram.observe(
      { chain, transaction_type: transactionType },
      costUsdc
    );

    this.totalTransactionFeesCounter.inc({ chain }, costUsdc);
  }

  /**
   * Record bridge activity
   */
  recordBridgeActivity(
    chain: string,
    direction: 'in' | 'out',
    amountUsdc: number,
    sourceOrDestChain: string,
    durationSeconds?: number
  ): void {
    if (direction === 'in') {
      this.usdcBridgeInCounter.inc({ chain, source_chain: sourceOrDestChain }, amountUsdc);
    } else {
      this.usdcBridgeOutCounter.inc({ chain, destination_chain: sourceOrDestChain }, amountUsdc);
    }

    if (durationSeconds) {
      this.usdcBridgeLatency.observe({ chain, direction }, durationSeconds);
    }
  }

  /**
   * Update USDC supply metrics
   */
  async updateSupplyMetrics(chain: string = 'varity-l3'): Promise<void> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      // In a real implementation, this would query the USDC contract
      // For now, we'll use placeholder logic

      // Get total supply from native balance query or USDC contract
      // This is a placeholder - actual implementation would query USDC contract
      const totalSupply = 1000000; // Placeholder

      this.usdcTotalSupplyGauge.set({ chain }, totalSupply);

      // Calculate circulating supply (total - locked)
      const lockedSupply = 100000; // Placeholder - would sum locked contracts
      const circulatingSupply = totalSupply - lockedSupply;

      this.usdcCirculatingSupplyGauge.set({ chain }, circulatingSupply);
      this.usdcLockedSupplyGauge.set({ chain, contract_type: 'all' }, lockedSupply);

    } catch (error) {
      console.error('Error updating USDC supply metrics:', error);
    }
  }

  /**
   * Update holder metrics
   */
  updateHolderMetrics(
    chain: string,
    totalHolders: number,
    topHolders: Array<{ rank: number; balance: number }>,
    distribution: { top10: number; top100: number; rest: number }
  ): void {
    this.usdcHoldersGauge.set({ chain }, totalHolders);

    // Record top holders
    for (const holder of topHolders) {
      this.usdcTopHoldersGauge.set(
        { chain, rank: holder.rank.toString() },
        holder.balance
      );
    }

    // Record distribution
    this.usdcHolderDistributionGauge.set({ chain, group: 'top_10' }, distribution.top10);
    this.usdcHolderDistributionGauge.set({ chain, group: 'top_100' }, distribution.top100);
    this.usdcHolderDistributionGauge.set({ chain, group: 'rest' }, distribution.rest);
  }

  /**
   * Update activity metrics
   */
  updateActivityMetrics(
    chain: string,
    activeAddresses24h: number,
    activeAddresses7d: number,
    transactionRate: number
  ): void {
    this.usdcActiveAddressesGauge.set({ chain, timeframe: '24h' }, activeAddresses24h);
    this.usdcActiveAddressesGauge.set({ chain, timeframe: '7d' }, activeAddresses7d);
    this.usdcTransactionRateGauge.set({ chain }, transactionRate);
  }

  /**
   * Calculate and update USDC velocity
   */
  updateVelocity(chain: string, transactionVolume: number, totalSupply: number): void {
    const velocity = totalSupply > 0 ? transactionVolume / totalSupply : 0;
    this.usdcVelocityGauge.set({ chain }, velocity);
  }

  /**
   * Update average gas metrics
   */
  updateAverageGasMetrics(
    chain: string,
    transactionType: string,
    avgGasUsed: number,
    avgGasCostUsdc: number
  ): void {
    this.avgGasUsedGauge.set({ chain, transaction_type: transactionType }, avgGasUsed);
    this.avgGasCostUsdc.set({ chain, transaction_type: transactionType }, avgGasCostUsdc);
  }

  /**
   * Update average transaction cost
   */
  updateAverageTransactionCost(chain: string, avgCostUsdc: number): void {
    this.avgTransactionCostGauge.set({ chain }, avgCostUsdc);
  }

  /**
   * Update bridge volume (24h)
   */
  updateBridgeVolume(chain: string, volumeIn: number, volumeOut: number): void {
    this.usdcBridgeVolumeGauge.set({ chain, direction: 'in' }, volumeIn);
    this.usdcBridgeVolumeGauge.set({ chain, direction: 'out' }, volumeOut);
  }

  /**
   * Analyze transaction costs in a block
   */
  async analyzeBlockTransactionCosts(blockNumber: number, chain: string = 'varity-l3'): Promise<void> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const block = await this.provider.getBlock(blockNumber, true);
      if (!block || !block.transactions) {
        return;
      }

      let totalCost = 0;
      let transactionCount = 0;

      for (const tx of block.transactions) {
        if (typeof tx === 'string') continue;

        // Type assertion after string check
        const transaction = tx as ethers.TransactionResponse;

        const receipt = await this.provider.getTransactionReceipt(transaction.hash);
        if (!receipt) continue;

        const gasUsed = Number(receipt.gasUsed);
        const gasPrice = transaction.gasPrice || BigInt(0);

        this.recordTransactionCost(chain, gasUsed, gasPrice, 'unknown');

        const costUsdc = this.weiToUsdc(gasPrice * BigInt(gasUsed));
        totalCost += costUsdc;
        transactionCount++;
      }

      if (transactionCount > 0) {
        const avgCost = totalCost / transactionCount;
        this.updateAverageTransactionCost(chain, avgCost);
      }

    } catch (error) {
      console.error('Error analyzing block transaction costs:', error);
    }
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
    // Reset gas token price
    this.gasTokenPriceGauge.set({ chain: 'varity-l3' }, 1.0);
  }

  /**
   * Start continuous USDC metrics collection
   */
  startCollection(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        await this.updateSupplyMetrics();
      } catch (error) {
        console.error('Error in USDC metrics collection interval:', error);
      }
    }, intervalMs);
  }
}
