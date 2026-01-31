/**
 * Varity SDK - Access Analyzer
 *
 * Tracks and analyzes access patterns for storage objects to enable
 * intelligent tiering decisions. Provides predictive analytics and
 * access frequency monitoring.
 *
 * Features:
 * - Real-time access tracking
 * - Pattern prediction
 * - Access frequency analysis
 * - Time-series analytics
 * - Hot spot detection
 *
 * @packageDocumentation
 */

import { StorageTier, type AccessPattern } from '@varity-labs/types'

/**
 * Access record for a single access event
 */
export interface AccessRecord {
  /** Object identifier */
  identifier: string
  /** Access timestamp */
  timestamp: Date
  /** Access type */
  type: 'read' | 'write' | 'delete' | 'list'
  /** Bytes transferred */
  bytesTransferred: number
  /** Request duration in milliseconds */
  durationMs: number
  /** Source of access (IP, user ID, etc.) */
  source?: string
}

/**
 * Access statistics for an object
 */
export interface AccessStats {
  /** Object identifier */
  identifier: string
  /** Total access count */
  totalAccesses: number
  /** Read count */
  readCount: number
  /** Write count */
  writeCount: number
  /** First access timestamp */
  firstAccess: Date
  /** Last access timestamp */
  lastAccess: Date
  /** Average interval between accesses (seconds) */
  avgAccessInterval: number
  /** Total bandwidth consumed (bytes) */
  totalBandwidth: number
  /** Average request duration (milliseconds) */
  avgDuration: number
  /** Access frequency trend */
  trend: 'increasing' | 'decreasing' | 'stable'
  /** Current storage tier */
  currentTier?: StorageTier
}

/**
 * Time window for access analysis
 */
export interface TimeWindow {
  /** Window start */
  start: Date
  /** Window end */
  end: Date
  /** Access count in window */
  accessCount: number
  /** Bandwidth in window */
  bandwidth: number
}

/**
 * Access pattern prediction
 */
export interface AccessPrediction {
  /** Object identifier */
  identifier: string
  /** Predicted access probability (0-1) for next time period */
  probability: number
  /** Confidence in prediction (0-1) */
  confidence: number
  /** Predicted access frequency (accesses per day) */
  predictedFrequency: number
  /** Recommended tier based on prediction */
  recommendedTier: StorageTier
  /** Time period for prediction (days) */
  predictionPeriodDays: number
}

/**
 * Analyzer configuration
 */
export interface AccessAnalyzerConfig {
  /** Maximum access records to keep in memory per object */
  maxRecordsPerObject?: number
  /** Time window for recent access analysis (hours) */
  recentAccessWindow?: number
  /** Enable predictive analytics */
  enablePrediction?: boolean
  /** Minimum access count before making predictions */
  minAccessesForPrediction?: number
}

/**
 * Advanced access pattern analyzer for intelligent tiering
 *
 * @example
 * ```typescript
 * const analyzer = new AccessAnalyzer({
 *   maxRecordsPerObject: 1000,
 *   recentAccessWindow: 24,
 *   enablePrediction: true
 * })
 *
 * // Record an access
 * analyzer.recordAccess({
 *   identifier: 'obj-123',
 *   timestamp: new Date(),
 *   type: 'read',
 *   bytesTransferred: 1024 * 1024
 * })
 *
 * // Get statistics
 * const stats = analyzer.getAccessStats('obj-123')
 * console.log(`Access count: ${stats.totalAccesses}`)
 *
 * // Predict future access
 * const prediction = analyzer.predictAccessProbability('obj-123')
 * console.log(`Predicted probability: ${prediction.probability}`)
 * ```
 */
export class AccessAnalyzer {
  private config: Required<AccessAnalyzerConfig>
  private accessRecords: Map<string, AccessRecord[]>
  private statsCache: Map<string, { stats: AccessStats; timestamp: number }>
  private cacheTTL: number = 5 * 60 * 1000 // 5 minutes

  constructor(config: AccessAnalyzerConfig = {}) {
    this.config = {
      maxRecordsPerObject: config.maxRecordsPerObject ?? 1000,
      recentAccessWindow: config.recentAccessWindow ?? 24,
      enablePrediction: config.enablePrediction ?? true,
      minAccessesForPrediction: config.minAccessesForPrediction ?? 5
    }

    this.accessRecords = new Map()
    this.statsCache = new Map()
  }

  /**
   * Record an access event
   *
   * @param record - Access record to track
   */
  recordAccess(record: AccessRecord): void {
    const { identifier } = record

    // Get or create records array
    let records = this.accessRecords.get(identifier)
    if (!records) {
      records = []
      this.accessRecords.set(identifier, records)
    }

    // Add new record
    records.push(record)

    // Trim old records if exceeding limit
    if (records.length > this.config.maxRecordsPerObject) {
      records.shift() // Remove oldest
    }

    // Invalidate stats cache
    this.statsCache.delete(identifier)
  }

  /**
   * Get access statistics for an object
   *
   * @param identifier - Object identifier
   * @returns Access statistics
   */
  getAccessStats(identifier: string): AccessStats {
    // Check cache
    const cached = this.statsCache.get(identifier)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.stats
    }

    const records = this.accessRecords.get(identifier) || []

    if (records.length === 0) {
      // No access history
      const stats: AccessStats = {
        identifier,
        totalAccesses: 0,
        readCount: 0,
        writeCount: 0,
        firstAccess: new Date(),
        lastAccess: new Date(),
        avgAccessInterval: 0,
        totalBandwidth: 0,
        avgDuration: 0,
        trend: 'stable'
      }
      return stats
    }

    // Calculate statistics
    const stats: AccessStats = {
      identifier,
      totalAccesses: records.length,
      readCount: records.filter(r => r.type === 'read').length,
      writeCount: records.filter(r => r.type === 'write').length,
      firstAccess: records[0].timestamp,
      lastAccess: records[records.length - 1].timestamp,
      avgAccessInterval: this.calculateAvgInterval(records),
      totalBandwidth: records.reduce((sum, r) => sum + r.bytesTransferred, 0),
      avgDuration: records.reduce((sum, r) => sum + r.durationMs, 0) / records.length,
      trend: this.detectTrend(records)
    }

    // Cache the result
    this.statsCache.set(identifier, {
      stats,
      timestamp: Date.now()
    })

    return stats
  }

  /**
   * Predict access probability for an object
   *
   * @param identifier - Object identifier
   * @param periodDays - Prediction period in days
   * @returns Access prediction
   */
  predictAccessProbability(
    identifier: string,
    periodDays: number = 7
  ): AccessPrediction {
    const records = this.accessRecords.get(identifier) || []

    // Not enough data for prediction
    if (records.length < this.config.minAccessesForPrediction) {
      return {
        identifier,
        probability: 0.5,
        confidence: 0.1,
        predictedFrequency: 0,
        recommendedTier: StorageTier.COLD,
        predictionPeriodDays: periodDays
      }
    }

    const stats = this.getAccessStats(identifier)

    // Calculate access frequency (accesses per day)
    const totalDays = (stats.lastAccess.getTime() - stats.firstAccess.getTime()) / (24 * 60 * 60 * 1000)
    const accessesPerDay = totalDays > 0 ? stats.totalAccesses / totalDays : 0

    // Calculate recent access frequency (last N hours)
    const recentWindow = this.config.recentAccessWindow * 60 * 60 * 1000
    const recentAccesses = records.filter(
      r => Date.now() - r.timestamp.getTime() < recentWindow
    ).length
    const recentFrequency = recentAccesses / (this.config.recentAccessWindow / 24)

    // Predict probability based on trend and frequency
    let probability = 0.5
    let confidence = 0.5

    if (stats.trend === 'increasing') {
      probability = Math.min(0.95, recentFrequency / (periodDays * 10))
      confidence = 0.7
    } else if (stats.trend === 'decreasing') {
      probability = Math.max(0.05, accessesPerDay / (periodDays * 5))
      confidence = 0.7
    } else {
      // Stable trend
      probability = Math.min(0.9, accessesPerDay / (periodDays * 2))
      confidence = 0.8
    }

    // Recommend tier based on predicted frequency
    const recommendedTier = this.recommendTierFromFrequency(recentFrequency)

    // Adjust confidence based on data quality
    confidence = Math.min(confidence, stats.totalAccesses / this.config.minAccessesForPrediction)

    return {
      identifier,
      probability,
      confidence,
      predictedFrequency: recentFrequency,
      recommendedTier,
      predictionPeriodDays: periodDays
    }
  }

  /**
   * Get access pattern for tiering decisions
   *
   * @param identifier - Object identifier
   * @param currentTier - Current storage tier
   * @param size - Object size in bytes
   * @param tierCosts - Cost per GB per month for each tier
   * @returns Access pattern with recommendations
   */
  getAccessPattern(
    identifier: string,
    currentTier: StorageTier,
    size: number,
    tierCosts: Record<StorageTier, number>
  ): AccessPattern {
    const stats = this.getAccessStats(identifier)
    const prediction = this.predictAccessProbability(identifier)

    // Calculate cost savings for recommended tier
    const currentCostPerMonth = (size / (1024 * 1024 * 1024)) * tierCosts[currentTier]
    const recommendedCostPerMonth =
      (size / (1024 * 1024 * 1024)) * tierCosts[prediction.recommendedTier]
    const costSavingsEstimate = currentCostPerMonth - recommendedCostPerMonth

    return {
      identifier,
      accessCount: stats.totalAccesses,
      lastAccessed: stats.lastAccess,
      averageAccessInterval: stats.avgAccessInterval / (24 * 60 * 60), // Convert to days
      totalBandwidth: stats.totalBandwidth,
      currentTier,
      recommendedTier: prediction.recommendedTier,
      costSavingsEstimate,
      recommendationConfidence: prediction.confidence
    }
  }

  /**
   * Get hot spot objects (frequently accessed)
   *
   * @param topN - Number of hot spots to return
   * @param timeWindowHours - Time window for analysis
   * @returns List of hot spot identifiers with stats
   */
  getHotSpots(
    topN: number = 10,
    timeWindowHours: number = 24
  ): Array<{ identifier: string; stats: AccessStats }> {
    const windowMs = timeWindowHours * 60 * 60 * 1000
    const cutoffTime = Date.now() - windowMs

    const hotSpots: Array<{ identifier: string; accessCount: number; stats: AccessStats }> = []

    for (const [identifier, records] of this.accessRecords.entries()) {
      const recentAccesses = records.filter(
        r => r.timestamp.getTime() >= cutoffTime
      ).length

      if (recentAccesses > 0) {
        hotSpots.push({
          identifier,
          accessCount: recentAccesses,
          stats: this.getAccessStats(identifier)
        })
      }
    }

    // Sort by access count and return top N
    return hotSpots
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, topN)
      .map(({ identifier, stats }) => ({ identifier, stats }))
  }

  /**
   * Get cold objects (rarely accessed)
   *
   * @param topN - Number of cold objects to return
   * @param minAgeHours - Minimum age in hours
   * @returns List of cold object identifiers with stats
   */
  getColdObjects(
    topN: number = 10,
    minAgeHours: number = 168 // 7 days
  ): Array<{ identifier: string; stats: AccessStats }> {
    const minAgeMs = minAgeHours * 60 * 60 * 1000
    const cutoffTime = Date.now() - minAgeMs

    const coldObjects: Array<{ identifier: string; daysSinceAccess: number; stats: AccessStats }> = []

    for (const [identifier, records] of this.accessRecords.entries()) {
      if (records.length === 0) continue

      const lastAccess = records[records.length - 1].timestamp.getTime()
      const daysSinceAccess = (Date.now() - lastAccess) / (24 * 60 * 60 * 1000)

      if (lastAccess < cutoffTime) {
        coldObjects.push({
          identifier,
          daysSinceAccess,
          stats: this.getAccessStats(identifier)
        })
      }
    }

    // Sort by days since last access (descending) and return top N
    return coldObjects
      .sort((a, b) => b.daysSinceAccess - a.daysSinceAccess)
      .slice(0, topN)
      .map(({ identifier, stats }) => ({ identifier, stats }))
  }

  /**
   * Clear access records for an object
   *
   * @param identifier - Object identifier
   */
  clearAccessRecords(identifier: string): void {
    this.accessRecords.delete(identifier)
    this.statsCache.delete(identifier)
  }

  /**
   * Clear all access records
   */
  clearAllRecords(): void {
    this.accessRecords.clear()
    this.statsCache.clear()
  }

  /**
   * Export access records to JSON
   *
   * @returns Serialized access records
   */
  exportRecords(): string {
    const data: Record<string, AccessRecord[]> = {}
    for (const [identifier, records] of this.accessRecords.entries()) {
      data[identifier] = records
    }
    return JSON.stringify(data, null, 2)
  }

  /**
   * Import access records from JSON
   *
   * @param json - Serialized access records
   */
  importRecords(json: string): void {
    const data = JSON.parse(json) as Record<string, AccessRecord[]>
    this.accessRecords.clear()
    this.statsCache.clear()

    for (const [identifier, records] of Object.entries(data)) {
      this.accessRecords.set(
        identifier,
        records.map(r => ({
          ...r,
          timestamp: new Date(r.timestamp)
        }))
      )
    }
  }

  // ========================================================================
  // Private helper methods
  // ========================================================================

  /**
   * Calculate average interval between accesses
   */
  private calculateAvgInterval(records: AccessRecord[]): number {
    if (records.length < 2) return 0

    const intervals: number[] = []
    for (let i = 1; i < records.length; i++) {
      const interval = records[i].timestamp.getTime() - records[i - 1].timestamp.getTime()
      intervals.push(interval / 1000) // Convert to seconds
    }

    return intervals.reduce((sum, val) => sum + val, 0) / intervals.length
  }

  /**
   * Detect access trend
   */
  private detectTrend(records: AccessRecord[]): 'increasing' | 'decreasing' | 'stable' {
    if (records.length < 4) return 'stable'

    // Split into two halves and compare access frequency
    const midpoint = Math.floor(records.length / 2)
    const firstHalf = records.slice(0, midpoint)
    const secondHalf = records.slice(midpoint)

    const firstDuration =
      firstHalf[firstHalf.length - 1].timestamp.getTime() - firstHalf[0].timestamp.getTime()
    const secondDuration =
      secondHalf[secondHalf.length - 1].timestamp.getTime() - secondHalf[0].timestamp.getTime()

    if (firstDuration === 0 || secondDuration === 0) return 'stable'

    const firstFrequency = firstHalf.length / firstDuration
    const secondFrequency = secondHalf.length / secondDuration

    const ratio = secondFrequency / firstFrequency

    if (ratio > 1.2) return 'increasing'
    if (ratio < 0.8) return 'decreasing'
    return 'stable'
  }

  /**
   * Recommend tier based on access frequency
   */
  private recommendTierFromFrequency(accessesPerDay: number): StorageTier {
    if (accessesPerDay >= 10) return StorageTier.HOT
    if (accessesPerDay >= 1) return StorageTier.WARM
    if (accessesPerDay >= 0.1) return StorageTier.COLD
    return StorageTier.GLACIER
  }
}
