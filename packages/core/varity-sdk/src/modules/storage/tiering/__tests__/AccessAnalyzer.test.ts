/**
 * Tests for AccessAnalyzer
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { AccessAnalyzer } from '../AccessAnalyzer'
import { StorageTier } from '@varity-labs/types/storage'
import type { AccessRecord } from '../AccessAnalyzer'

describe('AccessAnalyzer', () => {
  let analyzer: AccessAnalyzer

  beforeEach(() => {
    analyzer = new AccessAnalyzer({
      maxRecordsPerObject: 100,
      recentAccessWindow: 24,
      enablePrediction: true,
      minAccessesForPrediction: 5
    })
  })

  describe('recordAccess', () => {
    it('should record an access event', () => {
      const record: AccessRecord = {
        identifier: 'obj-1',
        timestamp: new Date(),
        type: 'read',
        bytesTransferred: 1024,
        durationMs: 50
      }

      analyzer.recordAccess(record)

      const stats = analyzer.getAccessStats('obj-1')
      expect(stats.totalAccesses).toBe(1)
      expect(stats.readCount).toBe(1)
    })

    it('should track multiple access types', () => {
      analyzer.recordAccess({
        identifier: 'obj-1',
        timestamp: new Date(),
        type: 'read',
        bytesTransferred: 1024,
        durationMs: 50
      })

      analyzer.recordAccess({
        identifier: 'obj-1',
        timestamp: new Date(),
        type: 'write',
        bytesTransferred: 2048,
        durationMs: 100
      })

      const stats = analyzer.getAccessStats('obj-1')
      expect(stats.totalAccesses).toBe(2)
      expect(stats.readCount).toBe(1)
      expect(stats.writeCount).toBe(1)
      expect(stats.totalBandwidth).toBe(3072)
    })

    it('should limit records per object', () => {
      const smallAnalyzer = new AccessAnalyzer({
        maxRecordsPerObject: 5
      })

      for (let i = 0; i < 10; i++) {
        smallAnalyzer.recordAccess({
          identifier: 'obj-1',
          timestamp: new Date(),
          type: 'read',
          bytesTransferred: 1024,
          durationMs: 50
        })
      }

      const stats = smallAnalyzer.getAccessStats('obj-1')
      expect(stats.totalAccesses).toBeLessThanOrEqual(5)
    })
  })

  describe('getAccessStats', () => {
    it('should return empty stats for new object', () => {
      const stats = analyzer.getAccessStats('new-obj')

      expect(stats.totalAccesses).toBe(0)
      expect(stats.readCount).toBe(0)
      expect(stats.writeCount).toBe(0)
    })

    it('should calculate average access interval', () => {
      const baseTime = Date.now()

      analyzer.recordAccess({
        identifier: 'obj-1',
        timestamp: new Date(baseTime),
        type: 'read',
        bytesTransferred: 1024,
        durationMs: 50
      })

      analyzer.recordAccess({
        identifier: 'obj-1',
        timestamp: new Date(baseTime + 60000), // 1 minute later
        type: 'read',
        bytesTransferred: 1024,
        durationMs: 50
      })

      const stats = analyzer.getAccessStats('obj-1')
      expect(stats.avgAccessInterval).toBeCloseTo(60, 0) // ~60 seconds
    })

    it('should detect access trends', () => {
      const baseTime = Date.now()

      // Record increasing access frequency
      for (let i = 0; i < 4; i++) {
        analyzer.recordAccess({
          identifier: 'increasing',
          timestamp: new Date(baseTime + i * 60000),
          type: 'read',
          bytesTransferred: 1024,
          durationMs: 50
        })
      }

      for (let i = 4; i < 10; i++) {
        analyzer.recordAccess({
          identifier: 'increasing',
          timestamp: new Date(baseTime + i * 30000), // Faster rate
          type: 'read',
          bytesTransferred: 1024,
          durationMs: 50
        })
      }

      const stats = analyzer.getAccessStats('increasing')
      expect(stats.trend).toBe('increasing')
    })
  })

  describe('predictAccessProbability', () => {
    it('should return low confidence for objects with few accesses', () => {
      analyzer.recordAccess({
        identifier: 'new',
        timestamp: new Date(),
        type: 'read',
        bytesTransferred: 1024,
        durationMs: 50
      })

      const prediction = analyzer.predictAccessProbability('new')

      expect(prediction.confidence).toBeLessThan(0.5)
    })

    it('should predict based on access frequency', () => {
      const baseTime = Date.now()

      // Record frequent accesses
      for (let i = 0; i < 10; i++) {
        analyzer.recordAccess({
          identifier: 'frequent',
          timestamp: new Date(baseTime + i * 60000), // Every minute
          type: 'read',
          bytesTransferred: 1024,
          durationMs: 50
        })
      }

      const prediction = analyzer.predictAccessProbability('frequent', 7)

      expect(prediction.confidence).toBeGreaterThan(0.5)
      expect(prediction.predictedFrequency).toBeGreaterThan(0)
      expect(prediction.recommendedTier).toBe(StorageTier.HOT)
    })

    it('should recommend GLACIER for infrequent access', () => {
      const baseTime = Date.now() - 30 * 24 * 60 * 60 * 1000 // 30 days ago

      // Record sparse accesses
      for (let i = 0; i < 6; i++) {
        analyzer.recordAccess({
          identifier: 'infrequent',
          timestamp: new Date(baseTime + i * 5 * 24 * 60 * 60 * 1000), // Every 5 days
          type: 'read',
          bytesTransferred: 1024,
          durationMs: 50
        })
      }

      const prediction = analyzer.predictAccessProbability('infrequent', 7)

      expect(prediction.recommendedTier).toBe(StorageTier.GLACIER)
    })
  })

  describe('getAccessPattern', () => {
    it('should generate complete access pattern', () => {
      const baseTime = Date.now()

      for (let i = 0; i < 5; i++) {
        analyzer.recordAccess({
          identifier: 'obj-1',
          timestamp: new Date(baseTime + i * 60000),
          type: 'read',
          bytesTransferred: 1024 * 1024,
          durationMs: 50
        })
      }

      const pattern = analyzer.getAccessPattern(
        'obj-1',
        StorageTier.HOT,
        10 * 1024 * 1024, // 10 MB
        {
          [StorageTier.HOT]: 0.002,
          [StorageTier.WARM]: 0.0015,
          [StorageTier.COLD]: 0.001,
          [StorageTier.GLACIER]: 0.0005
        }
      )

      expect(pattern.identifier).toBe('obj-1')
      expect(pattern.accessCount).toBe(5)
      expect(pattern.currentTier).toBe(StorageTier.HOT)
      expect(pattern.recommendedTier).toBeDefined()
      expect(pattern.recommendationConfidence).toBeGreaterThan(0)
    })
  })

  describe('getHotSpots', () => {
    it('should identify hot spots', () => {
      const baseTime = Date.now()

      // Create hot spots
      for (let i = 0; i < 20; i++) {
        analyzer.recordAccess({
          identifier: 'hot-1',
          timestamp: new Date(baseTime - i * 60000),
          type: 'read',
          bytesTransferred: 1024,
          durationMs: 50
        })
      }

      for (let i = 0; i < 10; i++) {
        analyzer.recordAccess({
          identifier: 'warm-1',
          timestamp: new Date(baseTime - i * 60000),
          type: 'read',
          bytesTransferred: 1024,
          durationMs: 50
        })
      }

      const hotSpots = analyzer.getHotSpots(2, 24)

      expect(hotSpots.length).toBe(2)
      expect(hotSpots[0].identifier).toBe('hot-1') // Most accessed
      expect(hotSpots[1].identifier).toBe('warm-1')
    })
  })

  describe('getColdObjects', () => {
    it('should identify cold objects', () => {
      const oldTime = Date.now() - 10 * 24 * 60 * 60 * 1000 // 10 days ago

      analyzer.recordAccess({
        identifier: 'cold-1',
        timestamp: new Date(oldTime),
        type: 'read',
        bytesTransferred: 1024,
        durationMs: 50
      })

      analyzer.recordAccess({
        identifier: 'recent-1',
        timestamp: new Date(),
        type: 'read',
        bytesTransferred: 1024,
        durationMs: 50
      })

      const coldObjects = analyzer.getColdObjects(10, 7 * 24) // 7 days minimum

      expect(coldObjects.length).toBe(1)
      expect(coldObjects[0].identifier).toBe('cold-1')
    })
  })

  describe('data management', () => {
    it('should clear access records', () => {
      analyzer.recordAccess({
        identifier: 'obj-1',
        timestamp: new Date(),
        type: 'read',
        bytesTransferred: 1024,
        durationMs: 50
      })

      analyzer.clearAccessRecords('obj-1')

      const stats = analyzer.getAccessStats('obj-1')
      expect(stats.totalAccesses).toBe(0)
    })

    it('should export and import records', () => {
      analyzer.recordAccess({
        identifier: 'obj-1',
        timestamp: new Date(),
        type: 'read',
        bytesTransferred: 1024,
        durationMs: 50
      })

      const exported = analyzer.exportRecords()
      const newAnalyzer = new AccessAnalyzer()
      newAnalyzer.importRecords(exported)

      const stats = newAnalyzer.getAccessStats('obj-1')
      expect(stats.totalAccesses).toBe(1)
    })
  })
})
