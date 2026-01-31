import { Registry, Gauge, Counter, Histogram } from 'prom-client';
import { ethers } from 'ethers';
import { createThirdwebClient, defineChain, getRpcClient } from 'thirdweb';
import { formatUnits } from 'ethers';

/**
 * BlockchainMetrics - Real-time blockchain metrics for Varity L3
 *
 * Collects comprehensive metrics from Varity L3 blockchain:
 * - Block height and block time
 * - Transaction throughput
 * - Gas prices (in USDC with 6 decimals)
 * - Network hash rate
 * - Pending transaction pool size
 */
export class BlockchainMetrics {
  private registry: Registry;
  private provider: ethers.JsonRpcProvider | null = null;
  private thirdwebClient: any = null;
  private chainId: number = 33529; // Varity L3 Chain ID

  // Block metrics
  private blockHeightGauge: Gauge;
  private blockTimeGauge: Gauge;
  private avgBlockTimeGauge: Gauge;
  private blockSizeGauge: Gauge;
  private blockGasUsedGauge: Gauge;
  private blockGasLimitGauge: Gauge;

  // Transaction metrics
  private txCountGauge: Gauge;
  private txThroughputGauge: Gauge;
  private pendingTxCountGauge: Gauge;
  private txSuccessCounter: Counter;
  private txFailureCounter: Counter;

  // Gas metrics (USDC - 6 decimals)
  private gasPriceGauge: Gauge;
  private avgGasPriceGauge: Gauge;
  private maxGasPriceGauge: Gauge;
  private minGasPriceGauge: Gauge;
  private gasPriceHistogram: Histogram;

  // Network metrics
  private networkHashRateGauge: Gauge;
  private peerCountGauge: Gauge;
  private syncingStatusGauge: Gauge;

  // Performance metrics
  private rpcLatencyHistogram: Histogram;
  private blockProcessingTimeHistogram: Histogram;

  // Error tracking
  private rpcErrorCounter: Counter;
  private blockReorgCounter: Counter;

  constructor(
    rpcUrl?: string,
    thirdwebClientId?: string
  ) {
    this.registry = new Registry();

    // Initialize RPC provider
    if (rpcUrl) {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }

    // Initialize Thirdweb client
    if (thirdwebClientId) {
      this.thirdwebClient = createThirdwebClient({
        clientId: thirdwebClientId
      });
    }

    // Initialize block metrics
    this.blockHeightGauge = new Gauge({
      name: 'varity_blockchain_block_height',
      help: 'Current blockchain block height',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.blockTimeGauge = new Gauge({
      name: 'varity_blockchain_block_time_seconds',
      help: 'Time between blocks in seconds',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.avgBlockTimeGauge = new Gauge({
      name: 'varity_blockchain_avg_block_time_seconds',
      help: 'Average block time over last 100 blocks',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.blockSizeGauge = new Gauge({
      name: 'varity_blockchain_block_size_bytes',
      help: 'Block size in bytes',
      labelNames: ['chain', 'block_number'],
      registers: [this.registry]
    });

    this.blockGasUsedGauge = new Gauge({
      name: 'varity_blockchain_block_gas_used',
      help: 'Gas used in block',
      labelNames: ['chain', 'block_number'],
      registers: [this.registry]
    });

    this.blockGasLimitGauge = new Gauge({
      name: 'varity_blockchain_block_gas_limit',
      help: 'Gas limit of block',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    // Initialize transaction metrics
    this.txCountGauge = new Gauge({
      name: 'varity_blockchain_tx_count',
      help: 'Number of transactions in block',
      labelNames: ['chain', 'block_number'],
      registers: [this.registry]
    });

    this.txThroughputGauge = new Gauge({
      name: 'varity_blockchain_tx_throughput_per_second',
      help: 'Transaction throughput per second',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.pendingTxCountGauge = new Gauge({
      name: 'varity_blockchain_pending_tx_count',
      help: 'Number of pending transactions in mempool',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.txSuccessCounter = new Counter({
      name: 'varity_blockchain_tx_success_total',
      help: 'Total number of successful transactions',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.txFailureCounter = new Counter({
      name: 'varity_blockchain_tx_failure_total',
      help: 'Total number of failed transactions',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    // Initialize gas metrics (USDC - 6 decimals)
    this.gasPriceGauge = new Gauge({
      name: 'varity_blockchain_gas_price_usdc',
      help: 'Current gas price in USDC (6 decimals)',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.avgGasPriceGauge = new Gauge({
      name: 'varity_blockchain_avg_gas_price_usdc',
      help: 'Average gas price in USDC over last 100 blocks',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.maxGasPriceGauge = new Gauge({
      name: 'varity_blockchain_max_gas_price_usdc',
      help: 'Maximum gas price in USDC',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.minGasPriceGauge = new Gauge({
      name: 'varity_blockchain_min_gas_price_usdc',
      help: 'Minimum gas price in USDC',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.gasPriceHistogram = new Histogram({
      name: 'varity_blockchain_gas_price_distribution_usdc',
      help: 'Gas price distribution in USDC',
      labelNames: ['chain'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 10.0],
      registers: [this.registry]
    });

    // Initialize network metrics
    this.networkHashRateGauge = new Gauge({
      name: 'varity_blockchain_network_hashrate',
      help: 'Estimated network hash rate',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.peerCountGauge = new Gauge({
      name: 'varity_blockchain_peer_count',
      help: 'Number of connected peers',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.syncingStatusGauge = new Gauge({
      name: 'varity_blockchain_syncing_status',
      help: 'Blockchain syncing status (0=synced, 1=syncing)',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    // Initialize performance metrics
    this.rpcLatencyHistogram = new Histogram({
      name: 'varity_blockchain_rpc_latency_seconds',
      help: 'RPC call latency in seconds',
      labelNames: ['chain', 'method'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    this.blockProcessingTimeHistogram = new Histogram({
      name: 'varity_blockchain_block_processing_time_seconds',
      help: 'Time to process and index a block',
      labelNames: ['chain'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry]
    });

    // Initialize error tracking
    this.rpcErrorCounter = new Counter({
      name: 'varity_blockchain_rpc_errors_total',
      help: 'Total number of RPC errors',
      labelNames: ['chain', 'method', 'error_type'],
      registers: [this.registry]
    });

    this.blockReorgCounter = new Counter({
      name: 'varity_blockchain_reorg_total',
      help: 'Total number of blockchain reorganizations',
      labelNames: ['chain', 'depth'],
      registers: [this.registry]
    });
  }

  /**
   * Set RPC provider
   */
  setProvider(rpcUrl: string): void {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Set Thirdweb client
   */
  setThirdwebClient(clientId: string): void {
    this.thirdwebClient = createThirdwebClient({
      clientId
    });
  }

  /**
   * Convert gas price from wei to USDC (6 decimals)
   */
  private weiToUsdc(weiAmount: bigint): number {
    // Convert wei to USDC assuming 1:1 with 6 decimals
    return parseFloat(formatUnits(weiAmount, 6));
  }

  /**
   * Collect all blockchain metrics
   */
  async collectMetrics(): Promise<void> {
    if (!this.provider) {
      throw new Error('RPC provider not initialized');
    }

    const startTime = Date.now();

    try {
      // Collect block metrics
      await this.collectBlockMetrics();

      // Collect transaction metrics
      await this.collectTransactionMetrics();

      // Collect gas metrics
      await this.collectGasMetrics();

      // Collect network metrics
      await this.collectNetworkMetrics();

      const duration = (Date.now() - startTime) / 1000;
      this.blockProcessingTimeHistogram.observe({ chain: 'varity-l3' }, duration);

    } catch (error) {
      console.error('Error collecting blockchain metrics:', error);
      this.rpcErrorCounter.inc({
        chain: 'varity-l3',
        method: 'collectMetrics',
        error_type: error instanceof Error ? error.name : 'UnknownError'
      });
    }
  }

  /**
   * Collect block-related metrics
   */
  private async collectBlockMetrics(): Promise<void> {
    if (!this.provider) return;

    const startTime = Date.now();

    try {
      const blockNumber = await this.provider.getBlockNumber();
      this.blockHeightGauge.set({ chain: 'varity-l3' }, blockNumber);

      const block = await this.provider.getBlock(blockNumber);
      if (block) {
        // Record block time
        const prevBlock = await this.provider.getBlock(blockNumber - 1);
        if (prevBlock) {
          const blockTime = block.timestamp - prevBlock.timestamp;
          this.blockTimeGauge.set({ chain: 'varity-l3' }, blockTime);
        }

        // Record block gas usage
        this.blockGasUsedGauge.set(
          { chain: 'varity-l3', block_number: blockNumber.toString() },
          Number(block.gasUsed)
        );

        this.blockGasLimitGauge.set(
          { chain: 'varity-l3' },
          Number(block.gasLimit)
        );

        // Record transaction count
        this.txCountGauge.set(
          { chain: 'varity-l3', block_number: blockNumber.toString() },
          block.transactions.length
        );

        // Calculate average block time over last 100 blocks
        await this.calculateAverageBlockTime(blockNumber);
      }

      const duration = (Date.now() - startTime) / 1000;
      this.rpcLatencyHistogram.observe(
        { chain: 'varity-l3', method: 'getBlock' },
        duration
      );

    } catch (error) {
      this.rpcErrorCounter.inc({
        chain: 'varity-l3',
        method: 'collectBlockMetrics',
        error_type: error instanceof Error ? error.name : 'UnknownError'
      });
      throw error;
    }
  }

  /**
   * Calculate average block time
   */
  private async calculateAverageBlockTime(currentBlock: number): Promise<void> {
    if (!this.provider) return;

    try {
      const sampleSize = Math.min(100, currentBlock);
      const startBlock = currentBlock - sampleSize;

      const currentBlockData = await this.provider.getBlock(currentBlock);
      const startBlockData = await this.provider.getBlock(startBlock);

      if (currentBlockData && startBlockData) {
        const timeDiff = currentBlockData.timestamp - startBlockData.timestamp;
        const avgBlockTime = timeDiff / sampleSize;
        this.avgBlockTimeGauge.set({ chain: 'varity-l3' }, avgBlockTime);
      }
    } catch (error) {
      // Silent fail for average calculation
    }
  }

  /**
   * Collect transaction metrics
   */
  private async collectTransactionMetrics(): Promise<void> {
    if (!this.provider) return;

    try {
      // Get pending transaction count
      const pendingBlock = await this.provider.send('eth_getBlockByNumber', ['pending', false]);
      if (pendingBlock && pendingBlock.transactions) {
        this.pendingTxCountGauge.set(
          { chain: 'varity-l3' },
          pendingBlock.transactions.length
        );
      }

      // Calculate transaction throughput
      const blockNumber = await this.provider.getBlockNumber();
      const block = await this.provider.getBlock(blockNumber);
      const prevBlock = await this.provider.getBlock(blockNumber - 1);

      if (block && prevBlock) {
        const timeDiff = block.timestamp - prevBlock.timestamp;
        const throughput = timeDiff > 0 ? block.transactions.length / timeDiff : 0;
        this.txThroughputGauge.set({ chain: 'varity-l3' }, throughput);
      }

    } catch (error) {
      this.rpcErrorCounter.inc({
        chain: 'varity-l3',
        method: 'collectTransactionMetrics',
        error_type: error instanceof Error ? error.name : 'UnknownError'
      });
    }
  }

  /**
   * Collect gas price metrics (in USDC)
   */
  private async collectGasMetrics(): Promise<void> {
    if (!this.provider) return;

    const startTime = Date.now();

    try {
      const feeData = await this.provider.getFeeData();

      if (feeData.gasPrice) {
        const gasPriceUsdc = this.weiToUsdc(feeData.gasPrice);
        this.gasPriceGauge.set({ chain: 'varity-l3' }, gasPriceUsdc);
        this.gasPriceHistogram.observe({ chain: 'varity-l3' }, gasPriceUsdc);
      }

      // Calculate average gas price over last 10 blocks
      await this.calculateAverageGasPrice();

      const duration = (Date.now() - startTime) / 1000;
      this.rpcLatencyHistogram.observe(
        { chain: 'varity-l3', method: 'getFeeData' },
        duration
      );

    } catch (error) {
      this.rpcErrorCounter.inc({
        chain: 'varity-l3',
        method: 'collectGasMetrics',
        error_type: error instanceof Error ? error.name : 'UnknownError'
      });
    }
  }

  /**
   * Calculate average gas price
   */
  private async calculateAverageGasPrice(): Promise<void> {
    if (!this.provider) return;

    try {
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrices: number[] = [];

      for (let i = 0; i < 10; i++) {
        const block = await this.provider.getBlock(blockNumber - i);
        if (block && block.baseFeePerGas) {
          gasPrices.push(this.weiToUsdc(block.baseFeePerGas));
        }
      }

      if (gasPrices.length > 0) {
        const avgGasPrice = gasPrices.reduce((a, b) => a + b, 0) / gasPrices.length;
        const maxGasPrice = Math.max(...gasPrices);
        const minGasPrice = Math.min(...gasPrices);

        this.avgGasPriceGauge.set({ chain: 'varity-l3' }, avgGasPrice);
        this.maxGasPriceGauge.set({ chain: 'varity-l3' }, maxGasPrice);
        this.minGasPriceGauge.set({ chain: 'varity-l3' }, minGasPrice);
      }
    } catch (error) {
      // Silent fail for average calculation
    }
  }

  /**
   * Collect network metrics
   */
  private async collectNetworkMetrics(): Promise<void> {
    if (!this.provider) return;

    try {
      // Check syncing status
      const syncing = await this.provider.send('eth_syncing', []);
      this.syncingStatusGauge.set(
        { chain: 'varity-l3' },
        syncing ? 1 : 0
      );

      // Get peer count
      try {
        const peerCount = await this.provider.send('net_peerCount', []);
        this.peerCountGauge.set({ chain: 'varity-l3' }, parseInt(peerCount, 16));
      } catch (error) {
        // Peer count might not be available on all RPC endpoints
      }

    } catch (error) {
      this.rpcErrorCounter.inc({
        chain: 'varity-l3',
        method: 'collectNetworkMetrics',
        error_type: error instanceof Error ? error.name : 'UnknownError'
      });
    }
  }

  /**
   * Record transaction success
   */
  recordTransactionSuccess(chain: string = 'varity-l3'): void {
    this.txSuccessCounter.inc({ chain });
  }

  /**
   * Record transaction failure
   */
  recordTransactionFailure(chain: string = 'varity-l3'): void {
    this.txFailureCounter.inc({ chain });
  }

  /**
   * Record block reorganization
   */
  recordBlockReorg(depth: number, chain: string = 'varity-l3'): void {
    this.blockReorgCounter.inc({ chain, depth: depth.toString() });
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
  }

  /**
   * Start continuous metrics collection
   */
  startCollection(intervalMs: number = 30000): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        console.error('Error in metrics collection interval:', error);
      }
    }, intervalMs);
  }
}
