/**
 * Tests for TieringEngine
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { TieringEngine } from '../TieringEngine'
import { StorageTier, TieringPolicy, StorageLayer } from '@varity-labs/types/storage'
import type { TieringMetadata, TieringEngineConfig } from '../TieringEngine'

describe('TieringEngine', () => {
  let engine: TieringEngine
  let config: TieringEngineConfig

  beforeEach(() => {
    config = {
      policy: TieringPolicy.COST_OPTIMIZED,
      rules: [
        {
          name: 'archive-old-files',
          condition: { type: 'age', operator: 'gt', value: 90, unit: 'days' },
          action: { moveTo: StorageTier.GLACIER },
          priority: 1,
          enabled: true
        },
        {
          name: 'demote-inactive',
          condition: { type: 'last_accessed', operator: 'gt', value: 30, unit: 'days' },
          action: { moveTo: StorageTier.COLD },
          priority: 2,
          enabled: true
        }
      ],
      tierCosts: {
        [StorageTier.HOT]: 0.002,
        [StorageTier.WARM]: 0.0015,
        [StorageTier.COLD]: 0.001,
        [StorageTier.GLACIER]: 0.0005
      },
      dryRun: false,
      minConfidence: 0.7
    }

    engine = new TieringEngine(config)
  })

  describe('evaluateObject', () => {
    it('should recommend demotion for old files', async () => {
      const metadata: TieringMetadata = {
        identifier: 'old-file',
        tier: StorageTier.HOT,
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        lastAccessed: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        accessCount: 1,
        size: 1024 * 1024,
        layer: StorageLayer.CUSTOMER_DATA
      }

      const decision = await engine.evaluateObject('old-file', metadata)

      expect(decision.shouldChange).toBe(true)
      expect(decision.targetTier).toBe(StorageTier.GLACIER)
      expect(decision.matchedRules).toContain('archive-old-files')
      expect(decision.costImpact).toBeGreaterThan(0)
    })

    it('should recommend no change for recently accessed files', async () => {
      const metadata: TieringMetadata = {
        identifier: 'recent-file',
        tier: StorageTier.HOT,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        accessCount: 50,
        size: 1024 * 1024,
        layer: StorageLayer.CUSTOMER_DATA
      }

      const decision = await engine.evaluateObject('recent-file', metadata)

      expect(decision.shouldChange).toBe(false)
      expect(decision.currentTier).toBe(StorageTier.HOT)
    })

    it('should apply rules by priority', async () => {
      const metadata: TieringMetadata = {
        identifier: 'priority-test',
        tier: StorageTier.HOT,
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // Matches both rules
        lastAccessed: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        accessCount: 5,
        size: 1024 * 1024,
        layer: StorageLayer.CUSTOMER_DATA
      }

      const decision = await engine.evaluateObject('priority-test', metadata)

      // Should match first rule (higher priority)
      expect(decision.matchedRules[0]).toBe('archive-old-files')
      expect(decision.targetTier).toBe(StorageTier.GLACIER)
    })
  })

  describe('runTieringCycle', () => {
    it('should evaluate multiple objects', async () => {
      const metadataList: TieringMetadata[] = [
        {
          identifier: 'obj-1',
          tier: StorageTier.HOT,
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
          lastAccessed: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
          accessCount: 1,
          size: 1024 * 1024,
          layer: StorageLayer.CUSTOMER_DATA
        },
        {
          identifier: 'obj-2',
          tier: StorageTier.HOT,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          accessCount: 50,
          size: 1024 * 1024,
          layer: StorageLayer.CUSTOMER_DATA
        }
      ]

      const result = await engine.runTieringCycle(metadataList)

      expect(result.objectsEvaluated).toBe(2)
      expect(result.durationMs).toBeGreaterThan(0)
      expect(result.statistics.tierDistributionBefore[StorageTier.HOT]).toBe(2)
    })

    it('should track tier distribution changes', async () => {
      const metadataList: TieringMetadata[] = [
        {
          identifier: 'hot-1',
          tier: StorageTier.HOT,
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
          lastAccessed: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
          accessCount: 1,
          size: 1024 * 1024,
          layer: StorageLayer.CUSTOMER_DATA
        }
      ]

      const result = await engine.runTieringCycle(metadataList)

      expect(result.statistics.tierDistributionBefore[StorageTier.HOT]).toBe(1)
      expect(result.objectsDemoted).toBeGreaterThan(0)
    })

    it('should respect dry-run mode', async () => {
      const dryRunEngine = new TieringEngine({
        ...config,
        dryRun: true
      })

      const metadataList: TieringMetadata[] = [
        {
          identifier: 'test',
          tier: StorageTier.HOT,
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
          lastAccessed: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
          accessCount: 1,
          size: 1024 * 1024,
          layer: StorageLayer.CUSTOMER_DATA
        }
      ]

      const result = await dryRunEngine.runTieringCycle(metadataList)

      expect(result.objectsEvaluated).toBe(1)
      expect(result.objectsDemoted).toBe(0) // No actual changes in dry-run
      expect(result.objectsPromoted).toBe(0)
    })
  })

  describe('configuration', () => {
    it('should update configuration', () => {
      const newRules = [
        {
          name: 'new-rule',
          condition: { type: 'size', operator: 'gt', value: 1000, unit: 'mb' },
          action: { moveTo: StorageTier.COLD },
          priority: 1
        }
      ]

      engine.updateConfig({ rules: newRules })

      const currentConfig = engine.getConfig()
      expect(currentConfig.rules.length).toBe(1)
      expect(currentConfig.rules[0].name).toBe('new-rule')
    })

    it('should track last cycle time', async () => {
      expect(engine.getLastCycleTime()).toBeNull()

      await engine.runTieringCycle([])

      expect(engine.getLastCycleTime()).not.toBeNull()
      expect(engine.getLastCycleTime()).toBeInstanceOf(Date)
    })
  })

  describe('policy-based evaluation', () => {
    it('should evaluate with COST_OPTIMIZED policy', async () => {
      const costEngine = new TieringEngine({
        ...config,
        policy: TieringPolicy.COST_OPTIMIZED,
        rules: [] // No rules, use policy
      })

      const metadata: TieringMetadata = {
        identifier: 'cost-test',
        tier: StorageTier.HOT,
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        lastAccessed: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        accessCount: 1,
        size: 1024 * 1024,
        layer: StorageLayer.CUSTOMER_DATA
      }

      const decision = await costEngine.evaluateObject('cost-test', metadata)

      expect(decision.targetTier).toBe(StorageTier.GLACIER)
      expect(decision.reason).toContain('Cost optimization')
    })

    it('should evaluate with ACCESS_BASED policy', async () => {
      const accessEngine = new TieringEngine({
        ...config,
        policy: TieringPolicy.ACCESS_BASED,
        rules: []
      })

      const metadata: TieringMetadata = {
        identifier: 'access-test',
        tier: StorageTier.HOT,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastAccessed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        accessCount: 1,
        size: 1024 * 1024,
        layer: StorageLayer.CUSTOMER_DATA
      }

      const decision = await accessEngine.evaluateObject('access-test', metadata)

      expect(decision.reason).toContain('access')
    })
  })
})
