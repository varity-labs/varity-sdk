import { Registry, Gauge, Counter, Histogram } from 'prom-client';
import { ethers } from 'ethers';

/**
 * ContractMetrics - Smart contract monitoring and analytics
 *
 * Tracks:
 * - Deployed contracts
 * - Contract interactions (calls, transactions)
 * - Gas consumption by contract
 * - Contract success/failure rates
 * - Contract event emissions
 */
export class ContractMetrics {
  private registry: Registry;
  private provider: ethers.JsonRpcProvider | null = null;

  // Contract deployment metrics
  private deployedContractsGauge: Gauge;
  private contractDeploymentCounter: Counter;
  private contractDeploymentGasCost: Histogram;

  // Contract interaction metrics
  private contractCallsCounter: Counter;
  private contractTransactionsCounter: Counter;
  private contractInteractionLatency: Histogram;
  private contractGasUsed: Histogram;

  // Contract success/failure metrics
  private contractSuccessCounter: Counter;
  private contractFailureCounter: Counter;
  private contractRevertCounter: Counter;

  // Contract event metrics
  private contractEventsCounter: Counter;
  private contractEventLatency: Histogram;

  // Contract state metrics
  private contractStorageGauge: Gauge;
  private contractBalanceGauge: Gauge;
  private contractCodeSizeGauge: Gauge;

  // Popular contract tracking
  private popularContractsGauge: Gauge;
  private contractInteractionRateGauge: Gauge;

  constructor(rpcUrl?: string) {
    this.registry = new Registry();

    if (rpcUrl) {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }

    // Initialize deployment metrics
    this.deployedContractsGauge = new Gauge({
      name: 'varity_contracts_deployed_total',
      help: 'Total number of deployed contracts',
      labelNames: ['chain', 'contract_type'],
      registers: [this.registry]
    });

    this.contractDeploymentCounter = new Counter({
      name: 'varity_contract_deployments_total',
      help: 'Total number of contract deployments',
      labelNames: ['chain', 'deployer', 'status'],
      registers: [this.registry]
    });

    this.contractDeploymentGasCost = new Histogram({
      name: 'varity_contract_deployment_gas_used',
      help: 'Gas used for contract deployment',
      labelNames: ['chain', 'contract_type'],
      buckets: [100000, 500000, 1000000, 2000000, 5000000, 10000000],
      registers: [this.registry]
    });

    // Initialize interaction metrics
    this.contractCallsCounter = new Counter({
      name: 'varity_contract_calls_total',
      help: 'Total number of contract calls',
      labelNames: ['chain', 'contract_address', 'function_name'],
      registers: [this.registry]
    });

    this.contractTransactionsCounter = new Counter({
      name: 'varity_contract_transactions_total',
      help: 'Total number of contract transactions',
      labelNames: ['chain', 'contract_address', 'function_name'],
      registers: [this.registry]
    });

    this.contractInteractionLatency = new Histogram({
      name: 'varity_contract_interaction_duration_seconds',
      help: 'Contract interaction duration in seconds',
      labelNames: ['chain', 'contract_address', 'interaction_type'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry]
    });

    this.contractGasUsed = new Histogram({
      name: 'varity_contract_gas_used',
      help: 'Gas used by contract interactions',
      labelNames: ['chain', 'contract_address', 'function_name'],
      buckets: [21000, 50000, 100000, 200000, 500000, 1000000, 2000000],
      registers: [this.registry]
    });

    // Initialize success/failure metrics
    this.contractSuccessCounter = new Counter({
      name: 'varity_contract_success_total',
      help: 'Total number of successful contract interactions',
      labelNames: ['chain', 'contract_address', 'function_name'],
      registers: [this.registry]
    });

    this.contractFailureCounter = new Counter({
      name: 'varity_contract_failure_total',
      help: 'Total number of failed contract interactions',
      labelNames: ['chain', 'contract_address', 'error_type'],
      registers: [this.registry]
    });

    this.contractRevertCounter = new Counter({
      name: 'varity_contract_revert_total',
      help: 'Total number of contract reverts',
      labelNames: ['chain', 'contract_address', 'revert_reason'],
      registers: [this.registry]
    });

    // Initialize event metrics
    this.contractEventsCounter = new Counter({
      name: 'varity_contract_events_total',
      help: 'Total number of contract events emitted',
      labelNames: ['chain', 'contract_address', 'event_name'],
      registers: [this.registry]
    });

    this.contractEventLatency = new Histogram({
      name: 'varity_contract_event_processing_duration_seconds',
      help: 'Time to process contract events',
      labelNames: ['chain', 'event_name'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    // Initialize state metrics
    this.contractStorageGauge = new Gauge({
      name: 'varity_contract_storage_slots_used',
      help: 'Number of storage slots used by contract',
      labelNames: ['chain', 'contract_address'],
      registers: [this.registry]
    });

    this.contractBalanceGauge = new Gauge({
      name: 'varity_contract_balance_usdc',
      help: 'Contract balance in USDC',
      labelNames: ['chain', 'contract_address'],
      registers: [this.registry]
    });

    this.contractCodeSizeGauge = new Gauge({
      name: 'varity_contract_code_size_bytes',
      help: 'Contract bytecode size in bytes',
      labelNames: ['chain', 'contract_address'],
      registers: [this.registry]
    });

    // Initialize popularity metrics
    this.popularContractsGauge = new Gauge({
      name: 'varity_contract_popularity_score',
      help: 'Contract popularity score based on interactions',
      labelNames: ['chain', 'contract_address', 'contract_name'],
      registers: [this.registry]
    });

    this.contractInteractionRateGauge = new Gauge({
      name: 'varity_contract_interaction_rate_per_minute',
      help: 'Contract interactions per minute',
      labelNames: ['chain', 'contract_address'],
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
   * Record contract deployment
   */
  async recordContractDeployment(
    chain: string,
    contractAddress: string,
    deployer: string,
    gasUsed: number,
    status: 'success' | 'failed',
    contractType?: string
  ): Promise<void> {
    this.contractDeploymentCounter.inc({ chain, deployer, status });

    if (status === 'success') {
      this.deployedContractsGauge.inc({ chain, contract_type: contractType || 'unknown' });
      this.contractDeploymentGasCost.observe(
        { chain, contract_type: contractType || 'unknown' },
        gasUsed
      );

      // Get contract code size
      if (this.provider) {
        try {
          const code = await this.provider.getCode(contractAddress);
          const codeSize = (code.length - 2) / 2; // Remove '0x' and count bytes
          this.contractCodeSizeGauge.set({ chain, contract_address: contractAddress }, codeSize);
        } catch (error) {
          console.error('Error getting contract code size:', error);
        }
      }
    }
  }

  /**
   * Record contract call (read-only)
   */
  recordContractCall(
    chain: string,
    contractAddress: string,
    functionName: string,
    duration: number
  ): void {
    this.contractCallsCounter.inc({ chain, contract_address: contractAddress, function_name: functionName });
    this.contractInteractionLatency.observe(
      { chain, contract_address: contractAddress, interaction_type: 'call' },
      duration
    );
  }

  /**
   * Record contract transaction (state-changing)
   */
  recordContractTransaction(
    chain: string,
    contractAddress: string,
    functionName: string,
    gasUsed: number,
    duration: number,
    status: 'success' | 'failed'
  ): void {
    this.contractTransactionsCounter.inc({
      chain,
      contract_address: contractAddress,
      function_name: functionName
    });

    this.contractGasUsed.observe(
      { chain, contract_address: contractAddress, function_name: functionName },
      gasUsed
    );

    this.contractInteractionLatency.observe(
      { chain, contract_address: contractAddress, interaction_type: 'transaction' },
      duration
    );

    if (status === 'success') {
      this.contractSuccessCounter.inc({ chain, contract_address: contractAddress, function_name: functionName });
    } else {
      this.contractFailureCounter.inc({
        chain,
        contract_address: contractAddress,
        error_type: 'transaction_failed'
      });
    }
  }

  /**
   * Record contract revert
   */
  recordContractRevert(
    chain: string,
    contractAddress: string,
    revertReason: string
  ): void {
    this.contractRevertCounter.inc({
      chain,
      contract_address: contractAddress,
      revert_reason: revertReason
    });
  }

  /**
   * Record contract event
   */
  recordContractEvent(
    chain: string,
    contractAddress: string,
    eventName: string,
    processingTime: number
  ): void {
    this.contractEventsCounter.inc({ chain, contract_address: contractAddress, event_name: eventName });
    this.contractEventLatency.observe({ chain, event_name: eventName }, processingTime);
  }

  /**
   * Update contract balance
   */
  async updateContractBalance(
    chain: string,
    contractAddress: string
  ): Promise<void> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const balance = await this.provider.getBalance(contractAddress);
      const balanceUsdc = parseFloat(ethers.formatUnits(balance, 6)); // USDC has 6 decimals
      this.contractBalanceGauge.set({ chain, contract_address: contractAddress }, balanceUsdc);
    } catch (error) {
      console.error('Error getting contract balance:', error);
    }
  }

  /**
   * Track contract popularity
   */
  updateContractPopularity(
    chain: string,
    contractAddress: string,
    contractName: string,
    score: number
  ): void {
    this.popularContractsGauge.set(
      { chain, contract_address: contractAddress, contract_name: contractName },
      score
    );
  }

  /**
   * Update contract interaction rate
   */
  updateContractInteractionRate(
    chain: string,
    contractAddress: string,
    ratePerMinute: number
  ): void {
    this.contractInteractionRateGauge.set(
      { chain, contract_address: contractAddress },
      ratePerMinute
    );
  }

  /**
   * Analyze contract activity in a block
   */
  async analyzeBlockContracts(blockNumber: number, chain: string = 'varity-l3'): Promise<void> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const startTime = Date.now();

    try {
      const block = await this.provider.getBlock(blockNumber, true);
      if (!block || !block.transactions) {
        return;
      }

      for (const tx of block.transactions) {
        if (typeof tx === 'string') continue;

        // Type assertion after string check
        const transaction = tx as ethers.TransactionResponse;

        const receipt = await this.provider.getTransactionReceipt(transaction.hash);
        if (!receipt) continue;

        // Check if it's a contract interaction
        if (receipt.to) {
          const code = await this.provider.getCode(receipt.to);
          if (code !== '0x') {
            // It's a contract interaction
            const duration = (Date.now() - startTime) / 1000;
            const status = receipt.status === 1 ? 'success' : 'failed';

            this.recordContractTransaction(
              chain,
              receipt.to,
              'unknown',
              Number(receipt.gasUsed),
              duration,
              status
            );

            // Process events
            for (const log of receipt.logs) {
              this.recordContractEvent(chain, log.address, 'unknown', 0.01);
            }
          }
        }

        // Check if it's a contract deployment
        if (!transaction.to && receipt.contractAddress) {
          const status = receipt.status === 1 ? 'success' : 'failed';
          await this.recordContractDeployment(
            chain,
            receipt.contractAddress,
            transaction.from,
            Number(receipt.gasUsed),
            status
          );
        }
      }
    } catch (error) {
      console.error('Error analyzing block contracts:', error);
    }
  }

  /**
   * Get top contracts by interaction count
   */
  async getTopContracts(limit: number = 10): Promise<Array<{ address: string; interactions: number }>> {
    // This would typically query a database or cache
    // For now, return empty array as placeholder
    return [];
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
   * Start continuous contract monitoring
   */
  startMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(async () => {
      if (!this.provider) return;

      try {
        const blockNumber = await this.provider.getBlockNumber();
        await this.analyzeBlockContracts(blockNumber);
      } catch (error) {
        console.error('Error in contract monitoring interval:', error);
      }
    }, intervalMs);
  }
}
