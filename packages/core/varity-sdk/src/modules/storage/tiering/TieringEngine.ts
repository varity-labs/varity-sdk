/**
 * Varity SDK - Tiering Engine
 *
 * Advanced tiering engine for intelligent storage tier management.
 * Evaluates access patterns, cost optimization, and performance requirements
 * to automatically promote or demote objects between storage tiers.
 *
 * Features:
 * - Rule-based tier evaluation
 * - Scheduled background tiering cycles
 * - Cost-aware decision making
 * - Performance optimization
 * - Configurable policies
 *
 * @packageDocumentation
 */

import {
  StorageTier,
  TieringPolicy,
  type TieringRule,
  type TieringCondition,
  type TieringAction,
  type AccessPattern
} from '@varity-labs/types'

/**
 * Metadata tracked for tiering decisions
 */
export interface TieringMetadata {
  /** Object identifier */
  identifier: string
  /** Current storage tier */
  tier: StorageTier
  /** Creation timestamp */
  createdAt: Date
  /** Last accessed timestamp */
  lastAccessed: Date
  /** Total access count */
  accessCount: number
  /** Object size in bytes */
  size: number
  /** Custom tags */
  tags?: Record<string, string>
}

/**
 * Decision result from tiering evaluation
 */
export interface TieringDecision {
  /** Whether to perform a tier change */
  shouldChange: boolean
  /** Current tier */
  currentTier: StorageTier
  /** Recommended target tier */
  targetTier: StorageTier
  /** Reason for decision */
  reason: string
  /** Estimated cost impact (positive = savings, negative = increase) */
  costImpact: number
  /** Confidence score (0-1) */
  confidence: number
  /** Rules that matched */
  matchedRules: string[]
}

/**
 * Result of a tiering cycle execution
 */
export interface TieringCycleResult {
  /** Cycle start timestamp */
  startTime: Date
  /** Cycle end timestamp */
  endTime: Date
  /** Total duration in milliseconds */
  durationMs: number
  /** Objects evaluated */
  objectsEvaluated: number
  /** Objects promoted to hotter tiers */
  objectsPromoted: number
  /** Objects demoted to colder tiers */
  objectsDemoted: number
  /** Total cost savings estimated (USD/month) */
  estimatedMonthlySavings: number
  /** Errors encountered */
  errors: TieringError[]
  /** Summary statistics */
  statistics: TieringCycleStats
}

/**
 * Statistics from a tiering cycle
 */
export interface TieringCycleStats {
  /** Objects by tier before cycle */
  tierDistributionBefore: Record<StorageTier, number>
  /** Objects by tier after cycle */
  tierDistributionAfter: Record<StorageTier, number>
  /** Total data moved (bytes) */
  dataMoved: number
  /** Average decision confidence */
  avgConfidence: number
  /** Rules applied count */
  rulesApplied: Record<string, number>
}

/**
 * Error encountered during tiering
 */
export interface TieringError {
  /** Object identifier */
  identifier: string
  /** Error message */
  error: string
  /** Error timestamp */
  timestamp: Date
  /** Operation that failed */
  operation: 'evaluate' | 'promote' | 'demote'
}

/**
 * Tiering engine configuration
 */
export interface TieringEngineConfig {
  /** Tiering policy */
  policy: TieringPolicy
  /** Custom tiering rules */
  rules: TieringRule[]
  /** Enable dry-run mode (no actual changes) */
  dryRun?: boolean
  /** Minimum confidence threshold for tier changes */
  minConfidence?: number
  /** Cost per GB per month for each tier */
  tierCosts: Record<StorageTier, number>
  /** Maximum objects to process per cycle */
  maxObjectsPerCycle?: number
  /** Enable parallel processing */
  parallel?: boolean
}

/**
 * Advanced tiering engine for intelligent storage optimization
 *
 * @example
 * ```typescript
 * const engine = new TieringEngine({
 *   policy: TieringPolicy.COST_OPTIMIZED,
 *   rules: [
 *     {
 *       name: 'demote-old-cold-files',
 *       condition: { type: 'age', operator: 'gt', value: 90, unit: 'days' },
 *       action: { moveTo: StorageTier.GLACIER }
 *     }
 *   ],
 *   tierCosts: {
 *     [StorageTier.HOT]: 0.023,
 *     [StorageTier.WARM]: 0.012,
 *     [StorageTier.COLD]: 0.004,
 *     [StorageTier.GLACIER]: 0.001
 *   }
 * })
 *
 * const decision = await engine.evaluateObject('obj-123', metadata)
 * if (decision.shouldChange) {
 *   console.log(`Move to ${decision.targetTier}: ${decision.reason}`)
 * }
 * ```
 */
export class TieringEngine {
  private config: TieringEngineConfig
  private cycleInProgress: boolean = false
  private lastCycleTime: Date | null = null

  constructor(config: TieringEngineConfig) {
    this.config = {
      ...config,
      dryRun: config.dryRun ?? false,
      minConfidence: config.minConfidence ?? 0.7,
      maxObjectsPerCycle: config.maxObjectsPerCycle ?? 10000,
      parallel: config.parallel ?? true
    }

    // Sort rules by priority
    this.config.rules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  }

  /**
   * Evaluate a single object for tier placement
   *
   * @param identifier - Object identifier
   * @param metadata - Object metadata
   * @param accessPattern - Optional access pattern analytics
   * @returns Tiering decision
   */
  async evaluateObject(
    identifier: string,
    metadata: TieringMetadata,
    accessPattern?: AccessPattern
  ): Promise<TieringDecision> {
    const matchedRules: string[] = []
    let bestDecision: TieringDecision = {
      shouldChange: false,
      currentTier: metadata.tier,
      targetTier: metadata.tier,
      reason: 'No tier change needed',
      costImpact: 0,
      confidence: 1.0,
      matchedRules: []
    }

    // Evaluate against each rule
    for (const rule of this.config.rules) {
      if (rule.enabled === false) continue

      if (this.evaluateCondition(rule.condition, metadata)) {
        matchedRules.push(rule.name)

        const decision = this.createDecision(
          metadata,
          rule.action.moveTo,
          rule.name,
          accessPattern
        )

        // Use the first matching high-confidence rule
        if (decision.confidence >= (this.config.minConfidence ?? 0.7)) {
          bestDecision = decision
          bestDecision.matchedRules = matchedRules
          break
        }
      }
    }

    // Apply policy-specific logic if no rules matched
    if (matchedRules.length === 0) {
      bestDecision = await this.evaluateByPolicy(metadata, accessPattern)
    }

    return bestDecision
  }

  /**
   * Run a complete tiering cycle across all objects
   *
   * @param metadataList - List of all object metadata to evaluate
   * @param onProgress - Optional progress callback
   * @returns Cycle result with statistics
   */
  async runTieringCycle(
    metadataList: TieringMetadata[],
    onProgress?: (current: number, total: number) => void
  ): Promise<TieringCycleResult> {
    if (this.cycleInProgress) {
      throw new Error('Tiering cycle already in progress')
    }

    this.cycleInProgress = true
    const startTime = new Date()

    const result: TieringCycleResult = {
      startTime,
      endTime: new Date(),
      durationMs: 0,
      objectsEvaluated: 0,
      objectsPromoted: 0,
      objectsDemoted: 0,
      estimatedMonthlySavings: 0,
      errors: [],
      statistics: {
        tierDistributionBefore: this.getTierDistribution(metadataList),
        tierDistributionAfter: {} as Record<StorageTier, number>,
        dataMoved: 0,
        avgConfidence: 0,
        rulesApplied: {}
      }
    }

    try {
      // Limit objects per cycle
      const objectsToProcess = metadataList.slice(
        0,
        this.config.maxObjectsPerCycle
      )

      let totalConfidence = 0
      const decisions: Array<{ metadata: TieringMetadata; decision: TieringDecision }> = []

      // Evaluate all objects
      for (let i = 0; i < objectsToProcess.length; i++) {
        const metadata = objectsToProcess[i]

        try {
          const decision = await this.evaluateObject(metadata.identifier, metadata)
          decisions.push({ metadata, decision })

          totalConfidence += decision.confidence
          result.objectsEvaluated++

          // Track rule usage
          for (const ruleName of decision.matchedRules) {
            result.statistics.rulesApplied[ruleName] =
              (result.statistics.rulesApplied[ruleName] || 0) + 1
          }

          if (onProgress) {
            onProgress(i + 1, objectsToProcess.length)
          }
        } catch (error) {
          result.errors.push({
            identifier: metadata.identifier,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
            operation: 'evaluate'
          })
        }
      }

      // Calculate statistics
      if (result.objectsEvaluated > 0) {
        result.statistics.avgConfidence = totalConfidence / result.objectsEvaluated
      }

      // Execute tier changes (if not dry-run)
      if (!this.config.dryRun) {
        for (const { metadata, decision } of decisions) {
          if (decision.shouldChange) {
            try {
              // This would be implemented by the caller
              // We just track the intent here

              if (this.isPromotion(decision.currentTier, decision.targetTier)) {
                result.objectsPromoted++
              } else {
                result.objectsDemoted++
              }

              result.estimatedMonthlySavings += decision.costImpact
              result.statistics.dataMoved += metadata.size

              // Update metadata tier (would be done by caller)
              metadata.tier = decision.targetTier
            } catch (error) {
              result.errors.push({
                identifier: metadata.identifier,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                operation: this.isPromotion(decision.currentTier, decision.targetTier)
                  ? 'promote'
                  : 'demote'
              })
            }
          }
        }
      }

      // Calculate final tier distribution
      result.statistics.tierDistributionAfter = this.getTierDistribution(
        objectsToProcess
      )

      result.endTime = new Date()
      result.durationMs = result.endTime.getTime() - startTime.getTime()

      this.lastCycleTime = result.endTime

      return result
    } finally {
      this.cycleInProgress = false
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): TieringEngineConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<TieringEngineConfig>): void {
    this.config = { ...this.config, ...updates }

    // Re-sort rules if updated
    if (updates.rules) {
      this.config.rules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    }
  }

  /**
   * Get last cycle time
   */
  getLastCycleTime(): Date | null {
    return this.lastCycleTime
  }

  /**
   * Check if cycle is in progress
   */
  isCycleInProgress(): boolean {
    return this.cycleInProgress
  }

  // ========================================================================
  // Private helper methods
  // ========================================================================

  /**
   * Evaluate a tiering condition
   */
  private evaluateCondition(
    condition: TieringCondition,
    metadata: TieringMetadata
  ): boolean {
    let actualValue: number

    switch (condition.type) {
      case 'age':
        const ageMs = Date.now() - metadata.createdAt.getTime()
        actualValue = ageMs / (24 * 60 * 60 * 1000) // Convert to days
        break

      case 'last_accessed':
        const lastAccessMs = Date.now() - metadata.lastAccessed.getTime()
        actualValue = lastAccessMs / (24 * 60 * 60 * 1000) // Convert to days
        break

      case 'access_count':
        actualValue = metadata.accessCount
        break

      case 'size':
        actualValue = metadata.size / (1024 * 1024) // Convert to MB
        if (condition.unit === 'gb') {
          actualValue = actualValue / 1024
        }
        break

      case 'cost':
        const currentCost = this.calculateMonthlyCost(metadata.tier, metadata.size)
        actualValue = currentCost
        break

      default:
        return false
    }

    return this.compareValues(actualValue, condition.operator, condition.value)
  }

  /**
   * Compare values based on operator
   */
  private compareValues(
    actual: number,
    operator: TieringCondition['operator'],
    expected: number
  ): boolean {
    switch (operator) {
      case 'gt': return actual > expected
      case 'gte': return actual >= expected
      case 'lt': return actual < expected
      case 'lte': return actual <= expected
      case 'eq': return actual === expected
      case 'ne': return actual !== expected
      default: return false
    }
  }

  /**
   * Create a tiering decision
   */
  private createDecision(
    metadata: TieringMetadata,
    targetTier: StorageTier,
    reason: string,
    accessPattern?: AccessPattern
  ): TieringDecision {
    const currentCost = this.calculateMonthlyCost(metadata.tier, metadata.size)
    const targetCost = this.calculateMonthlyCost(targetTier, metadata.size)
    const costImpact = currentCost - targetCost

    // Calculate confidence based on access pattern
    let confidence = 0.8 // Base confidence
    if (accessPattern) {
      confidence = accessPattern.recommendationConfidence
    }

    return {
      shouldChange: metadata.tier !== targetTier,
      currentTier: metadata.tier,
      targetTier,
      reason,
      costImpact,
      confidence,
      matchedRules: [reason]
    }
  }

  /**
   * Evaluate by policy when no rules match
   */
  private async evaluateByPolicy(
    metadata: TieringMetadata,
    accessPattern?: AccessPattern
  ): Promise<TieringDecision> {
    switch (this.config.policy) {
      case TieringPolicy.COST_OPTIMIZED:
        return this.evaluateCostOptimized(metadata, accessPattern)

      case TieringPolicy.ACCESS_BASED:
        return this.evaluateAccessBased(metadata, accessPattern)

      case TieringPolicy.TIME_BASED:
        return this.evaluateTimeBased(metadata)

      case TieringPolicy.SIZE_BASED:
        return this.evaluateSizeBased(metadata)

      default:
        return this.createDecision(
          metadata,
          metadata.tier,
          'Default policy: no change',
          accessPattern
        )
    }
  }

  /**
   * Cost-optimized tier evaluation
   */
  private evaluateCostOptimized(
    metadata: TieringMetadata,
    accessPattern?: AccessPattern
  ): TieringDecision {
    if (accessPattern?.recommendedTier) {
      return this.createDecision(
        metadata,
        accessPattern.recommendedTier,
        'Cost optimization recommendation',
        accessPattern
      )
    }

    // Fallback: demote old, rarely accessed objects
    const daysSinceAccess = (Date.now() - metadata.lastAccessed.getTime()) / (24 * 60 * 60 * 1000)

    if (daysSinceAccess > 90 && metadata.tier !== StorageTier.GLACIER) {
      return this.createDecision(metadata, StorageTier.GLACIER, 'Cost optimization: archive old object')
    } else if (daysSinceAccess > 30 && metadata.tier === StorageTier.HOT) {
      return this.createDecision(metadata, StorageTier.COLD, 'Cost optimization: demote inactive object')
    }

    return this.createDecision(metadata, metadata.tier, 'Cost optimization: no change')
  }

  /**
   * Access-based tier evaluation
   */
  private evaluateAccessBased(
    metadata: TieringMetadata,
    accessPattern?: AccessPattern
  ): TieringDecision {
    const daysSinceAccess = (Date.now() - metadata.lastAccessed.getTime()) / (24 * 60 * 60 * 1000)
    const accessFrequency = metadata.accessCount / Math.max(1, daysSinceAccess)

    // High access frequency -> promote to HOT
    if (accessFrequency > 1 && metadata.tier !== StorageTier.HOT) {
      return this.createDecision(metadata, StorageTier.HOT, 'Frequent access detected', accessPattern)
    }

    // Low access frequency -> demote to COLD
    if (accessFrequency < 0.1 && metadata.tier === StorageTier.HOT) {
      return this.createDecision(metadata, StorageTier.COLD, 'Infrequent access detected', accessPattern)
    }

    return this.createDecision(metadata, metadata.tier, 'Access pattern: no change', accessPattern)
  }

  /**
   * Time-based tier evaluation
   */
  private evaluateTimeBased(metadata: TieringMetadata): TieringDecision {
    const ageInDays = (Date.now() - metadata.createdAt.getTime()) / (24 * 60 * 60 * 1000)

    if (ageInDays > 365 && metadata.tier !== StorageTier.GLACIER) {
      return this.createDecision(metadata, StorageTier.GLACIER, 'Age-based: move to archive')
    } else if (ageInDays > 90 && metadata.tier === StorageTier.HOT) {
      return this.createDecision(metadata, StorageTier.COLD, 'Age-based: demote old object')
    }

    return this.createDecision(metadata, metadata.tier, 'Age-based: no change')
  }

  /**
   * Size-based tier evaluation
   */
  private evaluateSizeBased(metadata: TieringMetadata): TieringDecision {
    const sizeMB = metadata.size / (1024 * 1024)

    // Small files stay in HOT for performance
    if (sizeMB < 1 && metadata.tier !== StorageTier.HOT) {
      return this.createDecision(metadata, StorageTier.HOT, 'Size-based: small file to hot tier')
    }

    // Large files go to COLD for cost savings
    if (sizeMB > 100 && metadata.tier === StorageTier.HOT) {
      return this.createDecision(metadata, StorageTier.COLD, 'Size-based: large file to cold tier')
    }

    return this.createDecision(metadata, metadata.tier, 'Size-based: no change')
  }

  /**
   * Calculate monthly cost for tier and size
   */
  private calculateMonthlyCost(tier: StorageTier, sizeBytes: number): number {
    const sizeGB = sizeBytes / (1024 * 1024 * 1024)
    const costPerGB = this.config.tierCosts[tier] || 0
    return sizeGB * costPerGB
  }

  /**
   * Check if tier change is a promotion (to hotter tier)
   */
  private isPromotion(from: StorageTier, to: StorageTier): boolean {
    const tierOrder = [
      StorageTier.GLACIER,
      StorageTier.COLD,
      StorageTier.WARM,
      StorageTier.HOT
    ]
    return tierOrder.indexOf(to) > tierOrder.indexOf(from)
  }

  /**
   * Get tier distribution from metadata list
   */
  private getTierDistribution(metadataList: TieringMetadata[]): Record<StorageTier, number> {
    const distribution: Record<StorageTier, number> = {
      [StorageTier.HOT]: 0,
      [StorageTier.WARM]: 0,
      [StorageTier.COLD]: 0,
      [StorageTier.GLACIER]: 0
    }

    for (const metadata of metadataList) {
      distribution[metadata.tier] = (distribution[metadata.tier] || 0) + 1
    }

    return distribution
  }
}
