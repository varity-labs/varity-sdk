/**
 * Varity SDK - Cost Optimizer
 *
 * Calculates optimal storage tier placement based on access patterns,
 * object characteristics, and cost models. Provides cost-benefit analysis
 * and savings estimation for intelligent tiering decisions.
 *
 * Features:
 * - Multi-factor cost calculation
 * - Tier optimization algorithms
 * - Savings estimation
 * - Cost-benefit analysis
 * - What-if scenarios
 *
 * @packageDocumentation
 */

import { StorageTier, type AccessPattern } from '@varity-labs/types'

/**
 * Cost model for a storage tier
 */
export interface TierCostModel {
  /** Tier identifier */
  tier: StorageTier
  /** Storage cost per GB per month (USD) */
  storageCostPerGB: number
  /** Retrieval cost per GB (USD) */
  retrievalCostPerGB: number
  /** Request cost per 1000 requests (USD) */
  requestCostPer1000: number
  /** Data transfer cost per GB (USD) */
  transferCostPerGB: number
  /** Minimum storage duration in days */
  minStorageDays?: number
  /** Early deletion fee per GB (USD) */
  earlyDeletionFeePerGB?: number
}

/**
 * Cost breakdown for an object in a tier
 */
export interface CostBreakdown {
  /** Storage tier */
  tier: StorageTier
  /** Monthly storage cost (USD) */
  storageCost: number
  /** Monthly retrieval cost estimate (USD) */
  retrievalCost: number
  /** Monthly request cost estimate (USD) */
  requestCost: number
  /** Monthly transfer cost estimate (USD) */
  transferCost: number
  /** Total monthly cost (USD) */
  totalMonthlyCost: number
  /** Cost per access (USD) */
  costPerAccess: number
  /** Assumptions used in calculation */
  assumptions: Record<string, any>
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  /** Object identifier */
  identifier: string
  /** Current tier */
  currentTier: StorageTier
  /** Optimal tier */
  optimalTier: StorageTier
  /** Current monthly cost (USD) */
  currentCost: number
  /** Optimal tier monthly cost (USD) */
  optimalCost: number
  /** Monthly savings (USD) */
  monthlySavings: number
  /** Annual savings (USD) */
  annualSavings: number
  /** Savings percentage */
  savingsPercent: number
  /** Cost breakdown for current tier */
  currentBreakdown: CostBreakdown
  /** Cost breakdown for optimal tier */
  optimalBreakdown: CostBreakdown
  /** Confidence in optimization (0-1) */
  confidence: number
  /** Reason for optimization */
  reason: string
}

/**
 * What-if scenario parameters
 */
export interface WhatIfScenario {
  /** Object size in bytes */
  size: number
  /** Access frequency (accesses per month) */
  accessesPerMonth: number
  /** Average data transfer per access (bytes) */
  avgTransferPerAccess: number
  /** Storage duration (months) */
  durationMonths: number
  /** Tiers to compare */
  tiersToCompare?: StorageTier[]
}

/**
 * What-if scenario result
 */
export interface WhatIfResult {
  /** Scenario parameters */
  scenario: WhatIfScenario
  /** Cost analysis per tier */
  tierCosts: Record<StorageTier, CostBreakdown>
  /** Most cost-effective tier */
  bestTier: StorageTier
  /** Cost difference from best tier */
  costComparisons: Record<StorageTier, number>
}

/**
 * Cost optimizer configuration
 */
export interface CostOptimizerConfig {
  /** Cost models for each tier */
  tierCosts: Record<StorageTier, TierCostModel>
  /** Default access frequency for objects without history */
  defaultAccessesPerMonth?: number
  /** Default data transfer ratio (bytes transferred / object size) */
  defaultTransferRatio?: number
  /** Optimization threshold (min savings to recommend change) */
  optimizationThreshold?: number
}

/**
 * Advanced cost optimizer for storage tier selection
 *
 * @example
 * ```typescript
 * const optimizer = new CostOptimizer({
 *   tierCosts: {
 *     [StorageTier.HOT]: {
 *       tier: StorageTier.HOT,
 *       storageCostPerGB: 0.023,
 *       retrievalCostPerGB: 0,
 *       requestCostPer1000: 0.005,
 *       transferCostPerGB: 0.09
 *     },
 *     [StorageTier.COLD]: {
 *       tier: StorageTier.COLD,
 *       storageCostPerGB: 0.01,
 *       retrievalCostPerGB: 0.01,
 *       requestCostPer1000: 0.01,
 *       transferCostPerGB: 0.09
 *     }
 *   }
 * })
 *
 * const optimal = optimizer.calculateOptimalTier(
 *   'obj-123',
 *   1024 * 1024 * 100, // 100 MB
 *   accessPattern
 * )
 *
 * console.log(`Optimal tier: ${optimal.optimalTier}`)
 * console.log(`Monthly savings: $${optimal.monthlySavings}`)
 * ```
 */
export class CostOptimizer {
  private config: Required<CostOptimizerConfig>

  constructor(config: CostOptimizerConfig) {
    this.config = {
      ...config,
      defaultAccessesPerMonth: config.defaultAccessesPerMonth ?? 1,
      defaultTransferRatio: config.defaultTransferRatio ?? 1.0,
      optimizationThreshold: config.optimizationThreshold ?? 0.5 // $0.50/month minimum savings
    }
  }

  /**
   * Calculate optimal tier for an object
   *
   * @param identifier - Object identifier
   * @param size - Object size in bytes
   * @param accessPattern - Access pattern data
   * @returns Optimization result
   */
  calculateOptimalTier(
    identifier: string,
    size: number,
    accessPattern: AccessPattern
  ): OptimizationResult {
    const currentTier = accessPattern.currentTier

    // Calculate costs for all tiers
    const tierCosts = new Map<StorageTier, CostBreakdown>()

    for (const tier of Object.values(StorageTier)) {
      const cost = this.calculateTierCost(
        size,
        tier,
        accessPattern.accessCount,
        accessPattern.totalBandwidth
      )
      tierCosts.set(tier, cost)
    }

    // Find optimal tier (lowest total cost)
    let optimalTier = currentTier
    let lowestCost = tierCosts.get(currentTier)!.totalMonthlyCost

    for (const [tier, cost] of tierCosts.entries()) {
      if (cost.totalMonthlyCost < lowestCost) {
        lowestCost = cost.totalMonthlyCost
        optimalTier = tier
      }
    }

    const currentBreakdown = tierCosts.get(currentTier)!
    const optimalBreakdown = tierCosts.get(optimalTier)!

    const monthlySavings = currentBreakdown.totalMonthlyCost - optimalBreakdown.totalMonthlyCost
    const annualSavings = monthlySavings * 12
    const savingsPercent =
      currentBreakdown.totalMonthlyCost > 0
        ? (monthlySavings / currentBreakdown.totalMonthlyCost) * 100
        : 0

    // Calculate confidence based on access pattern confidence
    const confidence = accessPattern.recommendationConfidence

    // Generate reason
    const reason = this.generateOptimizationReason(
      currentTier,
      optimalTier,
      accessPattern,
      monthlySavings
    )

    return {
      identifier,
      currentTier,
      optimalTier,
      currentCost: currentBreakdown.totalMonthlyCost,
      optimalCost: optimalBreakdown.totalMonthlyCost,
      monthlySavings,
      annualSavings,
      savingsPercent,
      currentBreakdown,
      optimalBreakdown,
      confidence,
      reason
    }
  }

  /**
   * Estimate savings from moving to target tier
   *
   * @param currentTier - Current storage tier
   * @param targetTier - Target storage tier
   * @param size - Object size in bytes
   * @param accessPattern - Access pattern data
   * @returns Estimated monthly savings (positive = savings, negative = increase)
   */
  estimateSavings(
    currentTier: StorageTier,
    targetTier: StorageTier,
    size: number,
    accessPattern: AccessPattern
  ): number {
    const currentCost = this.calculateTierCost(
      size,
      currentTier,
      accessPattern.accessCount,
      accessPattern.totalBandwidth
    ).totalMonthlyCost

    const targetCost = this.calculateTierCost(
      size,
      targetTier,
      accessPattern.accessCount,
      accessPattern.totalBandwidth
    ).totalMonthlyCost

    return currentCost - targetCost
  }

  /**
   * Calculate detailed cost breakdown for a tier
   *
   * @param size - Object size in bytes
   * @param tier - Storage tier
   * @param accessesPerMonth - Number of accesses per month
   * @param transferBytes - Total bytes transferred per month
   * @returns Cost breakdown
   */
  calculateTierCost(
    size: number,
    tier: StorageTier,
    accessesPerMonth: number = this.config.defaultAccessesPerMonth,
    transferBytes: number = size * this.config.defaultTransferRatio
  ): CostBreakdown {
    const model = this.config.tierCosts[tier]
    const sizeGB = size / (1024 * 1024 * 1024)
    const transferGB = transferBytes / (1024 * 1024 * 1024)

    // Storage cost (monthly)
    const storageCost = sizeGB * model.storageCostPerGB

    // Retrieval cost (based on accesses)
    const retrievalGB = (transferBytes * accessesPerMonth) / (1024 * 1024 * 1024)
    const retrievalCost = retrievalGB * model.retrievalCostPerGB

    // Request cost
    const requestCost = (accessesPerMonth / 1000) * model.requestCostPer1000

    // Transfer cost
    const transferCost = transferGB * accessesPerMonth * model.transferCostPerGB

    const totalMonthlyCost = storageCost + retrievalCost + requestCost + transferCost
    const costPerAccess = accessesPerMonth > 0 ? totalMonthlyCost / accessesPerMonth : 0

    return {
      tier,
      storageCost,
      retrievalCost,
      requestCost,
      transferCost,
      totalMonthlyCost,
      costPerAccess,
      assumptions: {
        sizeGB,
        accessesPerMonth,
        transferGB,
        model
      }
    }
  }

  /**
   * Run what-if scenario analysis
   *
   * @param scenario - Scenario parameters
   * @returns What-if result
   */
  runWhatIfScenario(scenario: WhatIfScenario): WhatIfResult {
    const tiersToCompare =
      scenario.tiersToCompare || (Object.values(StorageTier) as StorageTier[])

    const tierCosts: Record<StorageTier, CostBreakdown> = {} as any

    for (const tier of tiersToCompare) {
      tierCosts[tier] = this.calculateTierCost(
        scenario.size,
        tier,
        scenario.accessesPerMonth,
        scenario.avgTransferPerAccess * scenario.accessesPerMonth
      )
    }

    // Find best tier
    let bestTier = tiersToCompare[0]
    let lowestCost = tierCosts[bestTier].totalMonthlyCost

    for (const tier of tiersToCompare) {
      if (tierCosts[tier].totalMonthlyCost < lowestCost) {
        lowestCost = tierCosts[tier].totalMonthlyCost
        bestTier = tier
      }
    }

    // Calculate cost differences
    const costComparisons: Record<StorageTier, number> = {} as any
    for (const tier of tiersToCompare) {
      costComparisons[tier] = tierCosts[tier].totalMonthlyCost - lowestCost
    }

    return {
      scenario,
      tierCosts,
      bestTier,
      costComparisons
    }
  }

  /**
   * Calculate total cost for multiple objects
   *
   * @param objects - Array of object data
   * @returns Total cost breakdown by tier
   */
  calculateTotalCost(
    objects: Array<{
      identifier: string
      size: number
      tier: StorageTier
      accessPattern: AccessPattern
    }>
  ): {
    totalMonthlyCost: number
    byTier: Record<StorageTier, { cost: number; count: number; size: number }>
    optimizationOpportunities: OptimizationResult[]
  } {
    let totalMonthlyCost = 0
    const byTier: Record<StorageTier, { cost: number; count: number; size: number }> = {
      [StorageTier.HOT]: { cost: 0, count: 0, size: 0 },
      [StorageTier.WARM]: { cost: 0, count: 0, size: 0 },
      [StorageTier.COLD]: { cost: 0, count: 0, size: 0 },
      [StorageTier.GLACIER]: { cost: 0, count: 0, size: 0 }
    }
    const optimizationOpportunities: OptimizationResult[] = []

    for (const obj of objects) {
      const cost = this.calculateTierCost(
        obj.size,
        obj.tier,
        obj.accessPattern.accessCount,
        obj.accessPattern.totalBandwidth
      )

      totalMonthlyCost += cost.totalMonthlyCost

      byTier[obj.tier].cost += cost.totalMonthlyCost
      byTier[obj.tier].count++
      byTier[obj.tier].size += obj.size

      // Check for optimization opportunities
      const optimization = this.calculateOptimalTier(
        obj.identifier,
        obj.size,
        obj.accessPattern
      )

      if (
        optimization.monthlySavings >= this.config.optimizationThreshold &&
        optimization.optimalTier !== obj.tier
      ) {
        optimizationOpportunities.push(optimization)
      }
    }

    // Sort optimization opportunities by savings
    optimizationOpportunities.sort((a, b) => b.monthlySavings - a.monthlySavings)

    return {
      totalMonthlyCost,
      byTier,
      optimizationOpportunities
    }
  }

  /**
   * Get cost model for a tier
   */
  getTierCostModel(tier: StorageTier): TierCostModel {
    return this.config.tierCosts[tier]
  }

  /**
   * Update cost model for a tier
   */
  updateTierCostModel(tier: StorageTier, model: Partial<TierCostModel>): void {
    this.config.tierCosts[tier] = {
      ...this.config.tierCosts[tier],
      ...model
    }
  }

  /**
   * Get configuration
   */
  getConfig(): Required<CostOptimizerConfig> {
    return { ...this.config }
  }

  // ========================================================================
  // Private helper methods
  // ========================================================================

  /**
   * Generate human-readable optimization reason
   */
  private generateOptimizationReason(
    currentTier: StorageTier,
    optimalTier: StorageTier,
    accessPattern: AccessPattern,
    savings: number
  ): string {
    if (currentTier === optimalTier) {
      return 'Current tier is already optimal'
    }

    const tierOrder = [StorageTier.GLACIER, StorageTier.COLD, StorageTier.WARM, StorageTier.HOT]
    const isPromotion = tierOrder.indexOf(optimalTier) > tierOrder.indexOf(currentTier)

    if (savings < this.config.optimizationThreshold) {
      return `Minor optimization available (${isPromotion ? 'promote' : 'demote'} to ${optimalTier}), but below threshold`
    }

    const accessFreq = accessPattern.accessCount / Math.max(1, accessPattern.averageAccessInterval)

    if (isPromotion) {
      return `Promote to ${optimalTier} for better performance (access freq: ${accessFreq.toFixed(2)}/day, savings: $${savings.toFixed(2)}/mo)`
    } else {
      return `Demote to ${optimalTier} for cost savings (low access freq: ${accessFreq.toFixed(2)}/day, savings: $${savings.toFixed(2)}/mo)`
    }
  }
}

/**
 * Default DePin-optimized cost models
 *
 * Based on Filecoin/IPFS pricing with significant savings over AWS S3/GCS
 */
export const DEFAULT_DEPIN_COST_MODELS: Record<StorageTier, TierCostModel> = {
  [StorageTier.HOT]: {
    tier: StorageTier.HOT,
    storageCostPerGB: 0.002, // Filecoin with IPFS pinning
    retrievalCostPerGB: 0.001,
    requestCostPer1000: 0.0005,
    transferCostPerGB: 0.01, // DePin egress
    minStorageDays: 0
  },
  [StorageTier.WARM]: {
    tier: StorageTier.WARM,
    storageCostPerGB: 0.0015,
    retrievalCostPerGB: 0.002,
    requestCostPer1000: 0.001,
    transferCostPerGB: 0.01,
    minStorageDays: 7
  },
  [StorageTier.COLD]: {
    tier: StorageTier.COLD,
    storageCostPerGB: 0.001, // Filecoin standard
    retrievalCostPerGB: 0.005,
    requestCostPer1000: 0.002,
    transferCostPerGB: 0.01,
    minStorageDays: 30
  },
  [StorageTier.GLACIER]: {
    tier: StorageTier.GLACIER,
    storageCostPerGB: 0.0005, // Filecoin archive
    retrievalCostPerGB: 0.01,
    requestCostPer1000: 0.005,
    transferCostPerGB: 0.01,
    minStorageDays: 90,
    earlyDeletionFeePerGB: 0.001
  }
}

/**
 * AWS S3 cost models for comparison
 */
export const AWS_S3_COST_MODELS: Record<StorageTier, TierCostModel> = {
  [StorageTier.HOT]: {
    tier: StorageTier.HOT,
    storageCostPerGB: 0.023, // S3 Standard
    retrievalCostPerGB: 0,
    requestCostPer1000: 0.005,
    transferCostPerGB: 0.09
  },
  [StorageTier.WARM]: {
    tier: StorageTier.WARM,
    storageCostPerGB: 0.0125, // S3 Standard-IA
    retrievalCostPerGB: 0.01,
    requestCostPer1000: 0.01,
    transferCostPerGB: 0.09,
    minStorageDays: 30
  },
  [StorageTier.COLD]: {
    tier: StorageTier.COLD,
    storageCostPerGB: 0.004, // S3 Glacier Instant
    retrievalCostPerGB: 0.03,
    requestCostPer1000: 0.02,
    transferCostPerGB: 0.09,
    minStorageDays: 90
  },
  [StorageTier.GLACIER]: {
    tier: StorageTier.GLACIER,
    storageCostPerGB: 0.001, // S3 Glacier Deep Archive
    retrievalCostPerGB: 0.02,
    requestCostPer1000: 0.05,
    transferCostPerGB: 0.09,
    minStorageDays: 180,
    earlyDeletionFeePerGB: 0.001
  }
}
