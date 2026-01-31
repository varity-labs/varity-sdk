/**
 * Tests for CostOptimizer
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { CostOptimizer, DEFAULT_DEPIN_COST_MODELS } from '../CostOptimizer'
import { StorageTier } from '@varity-labs/types/storage'
import type { AccessPattern } from '@varity-labs/types/storage'

describe('CostOptimizer', () => {
  let optimizer: CostOptimizer

  beforeEach(() => {
    optimizer = new CostOptimizer({
      tierCosts: DEFAULT_DEPIN_COST_MODELS,
      optimizationThreshold: 0.5
    })
  })

  describe('calculateOptimalTier', () => {
    it('should recommend COLD tier for infrequent access', () => {
      const accessPattern: AccessPattern = {
        identifier: 'obj-1',
        accessCount: 2,
        lastAccessed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        averageAccessInterval: 15, // 15 days
        totalBandwidth: 2 * 1024 * 1024,
        currentTier: StorageTier.HOT,
        recommendedTier: StorageTier.COLD,
        costSavingsEstimate: 0,
        recommendationConfidence: 0.8
      }

      const result = optimizer.calculateOptimalTier(
        'obj-1',
        100 * 1024 * 1024, // 100 MB
        accessPattern
      )

      expect(result.optimalTier).toBe(StorageTier.COLD)
      expect(result.monthlySavings).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should calculate cost savings correctly', () => {
      const accessPattern: AccessPattern = {
        identifier: 'obj-1',
        accessCount: 100,
        lastAccessed: new Date(),
        averageAccessInterval: 0.1, // Frequent access
        totalBandwidth: 100 * 1024 * 1024,
        currentTier: StorageTier.COLD,
        recommendedTier: StorageTier.HOT,
        costSavingsEstimate: 0,
        recommendationConfidence: 0.8
      }

      const result = optimizer.calculateOptimalTier(
        'obj-1',
        1024 * 1024 * 1024, // 1 GB
        accessPattern
      )

      expect(result.currentCost).toBeGreaterThan(0)
      expect(result.optimalCost).toBeGreaterThan(0)
      expect(result.savingsPercent).toBeDefined()
    })
  })

  describe('estimateSavings', () => {
    it('should estimate positive savings for demotion', () => {
      const accessPattern: AccessPattern = {
        identifier: 'obj-1',
        accessCount: 5,
        lastAccessed: new Date(),
        averageAccessInterval: 10,
        totalBandwidth: 5 * 1024 * 1024,
        currentTier: StorageTier.HOT,
        recommendedTier: StorageTier.COLD,
        costSavingsEstimate: 0,
        recommendationConfidence: 0.8
      }

      const savings = optimizer.estimateSavings(
        StorageTier.HOT,
        StorageTier.COLD,
        1024 * 1024 * 1024, // 1 GB
        accessPattern
      )

      expect(savings).toBeGreaterThan(0) // Positive = savings
    })

    it('should estimate negative savings for promotion', () => {
      const accessPattern: AccessPattern = {
        identifier: 'obj-1',
        accessCount: 100,
        lastAccessed: new Date(),
        averageAccessInterval: 0.1,
        totalBandwidth: 100 * 1024 * 1024,
        currentTier: StorageTier.COLD,
        recommendedTier: StorageTier.HOT,
        costSavingsEstimate: 0,
        recommendationConfidence: 0.8
      }

      const savings = optimizer.estimateSavings(
        StorageTier.COLD,
        StorageTier.HOT,
        1024 * 1024 * 1024,
        accessPattern
      )

      expect(savings).toBeLessThan(0) // Negative = cost increase
    })
  })

  describe('calculateTierCost', () => {
    it('should calculate cost for HOT tier', () => {
      const cost = optimizer.calculateTierCost(
        1024 * 1024 * 1024, // 1 GB
        StorageTier.HOT,
        10, // 10 accesses/month
        10 * 1024 * 1024 // 10 MB transfer/month
      )

      expect(cost.tier).toBe(StorageTier.HOT)
      expect(cost.storageCost).toBeGreaterThan(0)
      expect(cost.totalMonthlyCost).toBeGreaterThan(0)
      expect(cost.costPerAccess).toBeGreaterThan(0)
    })

    it('should show HOT tier is more expensive than COLD', () => {
      const size = 1024 * 1024 * 1024 // 1 GB

      const hotCost = optimizer.calculateTierCost(size, StorageTier.HOT, 1, size)
      const coldCost = optimizer.calculateTierCost(size, StorageTier.COLD, 1, size)

      expect(hotCost.storageCost).toBeGreaterThan(coldCost.storageCost)
    })

    it('should include all cost components', () => {
      const cost = optimizer.calculateTierCost(
        1024 * 1024 * 1024,
        StorageTier.COLD,
        100,
        100 * 1024 * 1024
      )

      expect(cost.storageCost).toBeGreaterThan(0)
      expect(cost.retrievalCost).toBeGreaterThan(0)
      expect(cost.requestCost).toBeGreaterThan(0)
      expect(cost.transferCost).toBeGreaterThan(0)
      expect(cost.totalMonthlyCost).toEqual(
        cost.storageCost + cost.retrievalCost + cost.requestCost + cost.transferCost
      )
    })
  })

  describe('runWhatIfScenario', () => {
    it('should run what-if analysis', () => {
      const result = optimizer.runWhatIfScenario({
        size: 1024 * 1024 * 1024, // 1 GB
        accessesPerMonth: 10,
        avgTransferPerAccess: 1024 * 1024, // 1 MB
        durationMonths: 12
      })

      expect(result.bestTier).toBeDefined()
      expect(result.tierCosts).toBeDefined()
      expect(result.costComparisons).toBeDefined()

      // Best tier should have 0 cost difference
      expect(result.costComparisons[result.bestTier]).toBe(0)
    })

    it('should compare specific tiers', () => {
      const result = optimizer.runWhatIfScenario({
        size: 1024 * 1024 * 1024,
        accessesPerMonth: 5,
        avgTransferPerAccess: 1024 * 1024,
        durationMonths: 12,
        tiersToCompare: [StorageTier.HOT, StorageTier.COLD]
      })

      expect(Object.keys(result.tierCosts).length).toBe(2)
      expect(result.tierCosts[StorageTier.HOT]).toBeDefined()
      expect(result.tierCosts[StorageTier.COLD]).toBeDefined()
    })
  })

  describe('calculateTotalCost', () => {
    it('should calculate total cost for multiple objects', () => {
      const objects = [
        {
          identifier: 'obj-1',
          size: 1024 * 1024 * 1024,
          tier: StorageTier.HOT,
          accessPattern: {
            identifier: 'obj-1',
            accessCount: 10,
            lastAccessed: new Date(),
            averageAccessInterval: 1,
            totalBandwidth: 10 * 1024 * 1024,
            currentTier: StorageTier.HOT,
            recommendedTier: StorageTier.HOT,
            costSavingsEstimate: 0,
            recommendationConfidence: 0.8
          }
        },
        {
          identifier: 'obj-2',
          size: 1024 * 1024 * 1024,
          tier: StorageTier.COLD,
          accessPattern: {
            identifier: 'obj-2',
            accessCount: 1,
            lastAccessed: new Date(),
            averageAccessInterval: 30,
            totalBandwidth: 1024 * 1024,
            currentTier: StorageTier.COLD,
            recommendedTier: StorageTier.COLD,
            costSavingsEstimate: 0,
            recommendationConfidence: 0.8
          }
        }
      ]

      const result = optimizer.calculateTotalCost(objects)

      expect(result.totalMonthlyCost).toBeGreaterThan(0)
      expect(result.byTier[StorageTier.HOT].count).toBe(1)
      expect(result.byTier[StorageTier.COLD].count).toBe(1)
    })

    it('should identify optimization opportunities', () => {
      const objects = [
        {
          identifier: 'obj-1',
          size: 1024 * 1024 * 1024,
          tier: StorageTier.HOT,
          accessPattern: {
            identifier: 'obj-1',
            accessCount: 1,
            lastAccessed: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            averageAccessInterval: 90,
            totalBandwidth: 1024 * 1024,
            currentTier: StorageTier.HOT,
            recommendedTier: StorageTier.GLACIER,
            costSavingsEstimate: 0,
            recommendationConfidence: 0.9
          }
        }
      ]

      const result = optimizer.calculateTotalCost(objects)

      expect(result.optimizationOpportunities.length).toBeGreaterThan(0)
      expect(result.optimizationOpportunities[0].monthlySavings).toBeGreaterThan(0.5)
    })
  })

  describe('cost model management', () => {
    it('should get tier cost model', () => {
      const model = optimizer.getTierCostModel(StorageTier.HOT)

      expect(model.tier).toBe(StorageTier.HOT)
      expect(model.storageCostPerGB).toBeDefined()
      expect(model.retrievalCostPerGB).toBeDefined()
    })

    it('should update tier cost model', () => {
      optimizer.updateTierCostModel(StorageTier.HOT, {
        storageCostPerGB: 0.005
      })

      const model = optimizer.getTierCostModel(StorageTier.HOT)
      expect(model.storageCostPerGB).toBe(0.005)
    })
  })

  describe('cost comparison', () => {
    it('should show DePin savings vs AWS', () => {
      const size = 1024 * 1024 * 1024 // 1 GB
      const accesses = 10

      const depinCost = optimizer.calculateTierCost(size, StorageTier.HOT, accesses)

      // AWS HOT tier is more expensive
      expect(depinCost.storageCost).toBeLessThan(0.023) // AWS S3 Standard rate
    })
  })
})
