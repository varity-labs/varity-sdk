import { Registry, Gauge, Counter } from 'prom-client';

/**
 * CostMetrics - Cost tracking and optimization metrics
 *
 * Tracks:
 * - Storage costs (Filecoin, IPFS, Celestia DA)
 * - Compute costs (Akash Network)
 * - Blockchain transaction costs
 * - LLM inference costs
 * - Cost per customer
 */
export class CostMetrics {
  private registry: Registry;

  // Storage cost metrics
  private storageMonthlyGauge: Gauge;
  private storagePerGbGauge: Gauge;
  private storageTotalCostCounter: Counter;

  // Compute cost metrics
  private computeMonthlyGauge: Gauge;
  private computePerHourGauge: Gauge;
  private computeTotalCostCounter: Counter;

  // Blockchain cost metrics
  private blockchainGasCostGauge: Gauge;
  private blockchainTotalCostCounter: Counter;

  // LLM cost metrics
  private llmInferenceCostGauge: Gauge;
  private llmTokenCostGauge: Gauge;
  private llmTotalCostCounter: Counter;

  // Customer cost metrics
  private customerMonthlyCostGauge: Gauge;
  private revenuePerCustomerGauge: Gauge;
  private profitMarginGauge: Gauge;

  // Infrastructure comparison
  private depinVsCloudSavingsGauge: Gauge;
  private costEfficiencyGauge: Gauge;

  constructor() {
    this.registry = new Registry();

    // Initialize storage cost metrics
    this.storageMonthlyGauge = new Gauge({
      name: 'varity_storage_monthly_cost_usd',
      help: 'Monthly storage cost in USD',
      labelNames: ['layer', 'backend', 'tier'],
      registers: [this.registry]
    });

    this.storagePerGbGauge = new Gauge({
      name: 'varity_storage_cost_per_gb_usd',
      help: 'Storage cost per GB in USD',
      labelNames: ['backend', 'tier'],
      registers: [this.registry]
    });

    this.storageTotalCostCounter = new Counter({
      name: 'varity_storage_total_cost_usd',
      help: 'Total storage cost in USD',
      labelNames: ['layer', 'backend'],
      registers: [this.registry]
    });

    // Initialize compute cost metrics
    this.computeMonthlyGauge = new Gauge({
      name: 'varity_compute_monthly_cost_usd',
      help: 'Monthly compute cost in USD',
      labelNames: ['provider', 'instance_type', 'region'],
      registers: [this.registry]
    });

    this.computePerHourGauge = new Gauge({
      name: 'varity_compute_cost_per_hour_usd',
      help: 'Compute cost per hour in USD',
      labelNames: ['provider', 'instance_type'],
      registers: [this.registry]
    });

    this.computeTotalCostCounter = new Counter({
      name: 'varity_compute_total_cost_usd',
      help: 'Total compute cost in USD',
      labelNames: ['provider', 'instance_type'],
      registers: [this.registry]
    });

    // Initialize blockchain cost metrics
    this.blockchainGasCostGauge = new Gauge({
      name: 'varity_blockchain_avg_gas_cost_usd',
      help: 'Average blockchain gas cost in USD',
      labelNames: ['chain', 'tx_type'],
      registers: [this.registry]
    });

    this.blockchainTotalCostCounter = new Counter({
      name: 'varity_blockchain_total_cost_usd',
      help: 'Total blockchain transaction cost in USD',
      labelNames: ['chain', 'tx_type'],
      registers: [this.registry]
    });

    // Initialize LLM cost metrics
    this.llmInferenceCostGauge = new Gauge({
      name: 'varity_llm_inference_cost_usd',
      help: 'Average LLM inference cost in USD',
      labelNames: ['model', 'provider'],
      registers: [this.registry]
    });

    this.llmTokenCostGauge = new Gauge({
      name: 'varity_llm_cost_per_1k_tokens_usd',
      help: 'LLM cost per 1K tokens in USD',
      labelNames: ['model', 'token_type'],
      registers: [this.registry]
    });

    this.llmTotalCostCounter = new Counter({
      name: 'varity_llm_total_cost_usd',
      help: 'Total LLM cost in USD',
      labelNames: ['model', 'provider'],
      registers: [this.registry]
    });

    // Initialize customer cost metrics
    this.customerMonthlyCostGauge = new Gauge({
      name: 'varity_customer_monthly_cost_usd',
      help: 'Average cost per customer per month in USD',
      labelNames: ['tier', 'industry'],
      registers: [this.registry]
    });

    this.revenuePerCustomerGauge = new Gauge({
      name: 'varity_revenue_per_customer_usd',
      help: 'Average revenue per customer in USD',
      labelNames: ['tier', 'industry'],
      registers: [this.registry]
    });

    this.profitMarginGauge = new Gauge({
      name: 'varity_profit_margin_percent',
      help: 'Profit margin percentage',
      labelNames: ['tier', 'industry'],
      registers: [this.registry]
    });

    // Initialize infrastructure comparison
    this.depinVsCloudSavingsGauge = new Gauge({
      name: 'varity_depin_cloud_savings_percent',
      help: 'Cost savings percentage vs traditional cloud',
      labelNames: ['service_type'],
      registers: [this.registry]
    });

    this.costEfficiencyGauge = new Gauge({
      name: 'varity_cost_efficiency_ratio',
      help: 'Cost efficiency ratio (revenue/cost)',
      labelNames: ['tier'],
      registers: [this.registry]
    });
  }

  // Storage cost methods
  recordStorageMonthlyCost(layer: string, backend: string, tier: string, usd: number): void {
    this.storageMonthlyGauge.set({ layer, backend, tier }, usd);
  }

  recordStorageCostPerGb(backend: string, tier: string, usd: number): void {
    this.storagePerGbGauge.set({ backend, tier }, usd);
  }

  recordStorageTotalCost(layer: string, backend: string, usd: number): void {
    this.storageTotalCostCounter.inc({ layer, backend }, usd);
  }

  // Compute cost methods
  recordComputeMonthlyCost(
    provider: string,
    instanceType: string,
    region: string,
    usd: number
  ): void {
    this.computeMonthlyGauge.set({ provider, instance_type: instanceType, region }, usd);
  }

  recordComputeCostPerHour(provider: string, instanceType: string, usd: number): void {
    this.computePerHourGauge.set({ provider, instance_type: instanceType }, usd);
  }

  recordComputeTotalCost(provider: string, instanceType: string, usd: number): void {
    this.computeTotalCostCounter.inc({ provider, instance_type: instanceType }, usd);
  }

  // Blockchain cost methods
  recordBlockchainGasCost(chain: string, txType: string, usd: number): void {
    this.blockchainGasCostGauge.set({ chain, tx_type: txType }, usd);
  }

  recordBlockchainTotalCost(chain: string, txType: string, usd: number): void {
    this.blockchainTotalCostCounter.inc({ chain, tx_type: txType }, usd);
  }

  // LLM cost methods
  recordLlmInferenceCost(model: string, provider: string, usd: number): void {
    this.llmInferenceCostGauge.set({ model, provider }, usd);
  }

  recordLlmTokenCost(model: string, tokenType: 'input' | 'output', usdPer1k: number): void {
    this.llmTokenCostGauge.set({ model, token_type: tokenType }, usdPer1k);
  }

  recordLlmTotalCost(model: string, provider: string, usd: number): void {
    this.llmTotalCostCounter.inc({ model, provider }, usd);
  }

  // Customer cost methods
  recordCustomerMonthlyCost(tier: string, industry: string, usd: number): void {
    this.customerMonthlyCostGauge.set({ tier, industry }, usd);
  }

  recordRevenuePerCustomer(tier: string, industry: string, usd: number): void {
    this.revenuePerCustomerGauge.set({ tier, industry }, usd);
  }

  recordProfitMargin(tier: string, industry: string, percent: number): void {
    this.profitMarginGauge.set({ tier, industry }, percent);
  }

  // Infrastructure comparison methods
  recordDepinCloudSavings(serviceType: string, percent: number): void {
    this.depinVsCloudSavingsGauge.set({ service_type: serviceType }, percent);
  }

  recordCostEfficiency(tier: string, ratio: number): void {
    this.costEfficiencyGauge.set({ tier }, ratio);
  }

  /**
   * Calculate and record comprehensive cost breakdown
   */
  recordCostBreakdown(data: {
    storage: { layer: string; backend: string; cost: number }[];
    compute: { provider: string; instanceType: string; cost: number }[];
    blockchain: { chain: string; txType: string; cost: number }[];
    llm: { model: string; provider: string; cost: number }[];
  }): void {
    // Record storage costs
    data.storage.forEach(({ layer, backend, cost }) => {
      this.recordStorageTotalCost(layer, backend, cost);
    });

    // Record compute costs
    data.compute.forEach(({ provider, instanceType, cost }) => {
      this.recordComputeTotalCost(provider, instanceType, cost);
    });

    // Record blockchain costs
    data.blockchain.forEach(({ chain, txType, cost }) => {
      this.recordBlockchainTotalCost(chain, txType, cost);
    });

    // Record LLM costs
    data.llm.forEach(({ model, provider, cost }) => {
      this.recordLlmTotalCost(model, provider, cost);
    });
  }

  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  getRegistry(): Registry {
    return this.registry;
  }

  reset(): void {
    this.registry.resetMetrics();
  }
}
