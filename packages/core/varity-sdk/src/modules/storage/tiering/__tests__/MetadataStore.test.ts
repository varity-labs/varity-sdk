/**
 * Tests for MetadataStore
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { MetadataStore, MetadataBackend } from '../MetadataStore'
import { StorageTier, StorageLayer } from '@varity-labs/types/storage'
import type { TieringMetadata } from '../MetadataStore'

describe('MetadataStore', () => {
  let store: MetadataStore

  beforeEach(async () => {
    store = new MetadataStore({
      backend: MetadataBackend.MEMORY,
      enableBackups: false
    })
    await store.initialize()
  })

  afterEach(() => {
    store.destroy()
  })

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const newStore = new MetadataStore({
        backend: MetadataBackend.MEMORY
      })

      await expect(newStore.initialize()).resolves.not.toThrow()
      newStore.destroy()
    })

    it('should throw if operations before initialization', async () => {
      const uninitializedStore = new MetadataStore({
        backend: MetadataBackend.MEMORY
      })

      await expect(
        uninitializedStore.save('test', {} as TieringMetadata)
      ).rejects.toThrow('not initialized')

      uninitializedStore.destroy()
    })
  })

  describe('save and load', () => {
    it('should save and load metadata', async () => {
      const metadata: TieringMetadata = {
        identifier: 'obj-1',
        tier: StorageTier.HOT,
        layer: StorageLayer.CUSTOMER_DATA,
        size: 1024 * 1024,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 5
      }

      await store.save('obj-1', metadata)

      const loaded = await store.load('obj-1')
      expect(loaded).not.toBeNull()
      expect(loaded!.identifier).toBe('obj-1')
      expect(loaded!.tier).toBe(StorageTier.HOT)
      expect(loaded!.accessCount).toBe(5)
    })

    it('should return null for non-existent object', async () => {
      const loaded = await store.load('non-existent')
      expect(loaded).toBeNull()
    })

    it('should overwrite existing metadata', async () => {
      const metadata1: TieringMetadata = {
        identifier: 'obj-1',
        tier: StorageTier.HOT,
        layer: StorageLayer.CUSTOMER_DATA,
        size: 1024 * 1024,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 5
      }

      await store.save('obj-1', metadata1)

      const metadata2: TieringMetadata = {
        ...metadata1,
        tier: StorageTier.COLD,
        accessCount: 10
      }

      await store.save('obj-1', metadata2)

      const loaded = await store.load('obj-1')
      expect(loaded!.tier).toBe(StorageTier.COLD)
      expect(loaded!.accessCount).toBe(10)
    })
  })

  describe('delete', () => {
    it('should delete metadata', async () => {
      const metadata: TieringMetadata = {
        identifier: 'obj-1',
        tier: StorageTier.HOT,
        layer: StorageLayer.CUSTOMER_DATA,
        size: 1024 * 1024,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 5
      }

      await store.save('obj-1', metadata)
      await store.delete('obj-1')

      const loaded = await store.load('obj-1')
      expect(loaded).toBeNull()
    })
  })

  describe('listAll', () => {
    it('should list all metadata', async () => {
      const metadata1: TieringMetadata = {
        identifier: 'obj-1',
        tier: StorageTier.HOT,
        layer: StorageLayer.CUSTOMER_DATA,
        size: 1024 * 1024,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 5
      }

      const metadata2: TieringMetadata = {
        identifier: 'obj-2',
        tier: StorageTier.COLD,
        layer: StorageLayer.INDUSTRY_RAG,
        size: 2 * 1024 * 1024,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 2
      }

      await store.save('obj-1', metadata1)
      await store.save('obj-2', metadata2)

      const all = await store.listAll()
      expect(all.size).toBe(2)
      expect(all.has('obj-1')).toBe(true)
      expect(all.has('obj-2')).toBe(true)
    })
  })

  describe('query', () => {
    beforeEach(async () => {
      // Add test data
      const baseTime = Date.now()

      await store.save('hot-1', {
        identifier: 'hot-1',
        tier: StorageTier.HOT,
        layer: StorageLayer.CUSTOMER_DATA,
        size: 1024 * 1024,
        createdAt: new Date(baseTime - 10 * 24 * 60 * 60 * 1000),
        lastAccessed: new Date(),
        accessCount: 100
      })

      await store.save('cold-1', {
        identifier: 'cold-1',
        tier: StorageTier.COLD,
        layer: StorageLayer.INDUSTRY_RAG,
        size: 10 * 1024 * 1024,
        createdAt: new Date(baseTime - 100 * 24 * 60 * 60 * 1000),
        lastAccessed: new Date(baseTime - 50 * 24 * 60 * 60 * 1000),
        accessCount: 5
      })
    })

    it('should filter by tier', async () => {
      const results = await store.query({
        tier: StorageTier.HOT
      })

      expect(results.length).toBe(1)
      expect(results[0].identifier).toBe('hot-1')
    })

    it('should filter by layer', async () => {
      const results = await store.query({
        layer: StorageLayer.INDUSTRY_RAG
      })

      expect(results.length).toBe(1)
      expect(results[0].identifier).toBe('cold-1')
    })

    it('should filter by size', async () => {
      const results = await store.query({
        minSize: 5 * 1024 * 1024
      })

      expect(results.length).toBe(1)
      expect(results[0].identifier).toBe('cold-1')
    })

    it('should sort results', async () => {
      const results = await store.query({
        sortBy: 'size',
        sortOrder: 'desc'
      })

      expect(results[0].identifier).toBe('cold-1') // Larger size
      expect(results[1].identifier).toBe('hot-1')
    })

    it('should paginate results', async () => {
      const results = await store.query({
        limit: 1,
        offset: 1
      })

      expect(results.length).toBe(1)
    })
  })

  describe('batchSave', () => {
    it('should save multiple metadata entries', async () => {
      const entries: TieringMetadata[] = [
        {
          identifier: 'obj-1',
          tier: StorageTier.HOT,
          layer: StorageLayer.CUSTOMER_DATA,
          size: 1024 * 1024,
          createdAt: new Date(),
          lastAccessed: new Date(),
          accessCount: 5
        },
        {
          identifier: 'obj-2',
          tier: StorageTier.COLD,
          layer: StorageLayer.INDUSTRY_RAG,
          size: 2 * 1024 * 1024,
          createdAt: new Date(),
          lastAccessed: new Date(),
          accessCount: 2
        }
      ]

      await store.batchSave(entries)

      const all = await store.listAll()
      expect(all.size).toBe(2)
    })
  })

  describe('recordTierTransition', () => {
    it('should record tier transition', async () => {
      const metadata: TieringMetadata = {
        identifier: 'obj-1',
        tier: StorageTier.HOT,
        layer: StorageLayer.CUSTOMER_DATA,
        size: 1024 * 1024,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 5
      }

      await store.save('obj-1', metadata)

      await store.recordTierTransition(
        'obj-1',
        StorageTier.HOT,
        StorageTier.COLD,
        'Cost optimization',
        2.50
      )

      const loaded = await store.load('obj-1')
      expect(loaded!.tier).toBe(StorageTier.COLD)
      expect(loaded!.tierHistory).toBeDefined()
      expect(loaded!.tierHistory!.length).toBe(1)
      expect(loaded!.tierHistory![0].fromTier).toBe(StorageTier.HOT)
      expect(loaded!.tierHistory![0].toTier).toBe(StorageTier.COLD)
      expect(loaded!.tierHistory![0].reason).toBe('Cost optimization')
      expect(loaded!.tierHistory![0].costImpact).toBe(2.50)
    })

    it('should limit tier history', async () => {
      const metadata: TieringMetadata = {
        identifier: 'obj-1',
        tier: StorageTier.HOT,
        layer: StorageLayer.CUSTOMER_DATA,
        size: 1024 * 1024,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 5
      }

      await store.save('obj-1', metadata)

      // Record many transitions
      for (let i = 0; i < 15; i++) {
        await store.recordTierTransition(
          'obj-1',
          i % 2 === 0 ? StorageTier.HOT : StorageTier.COLD,
          i % 2 === 0 ? StorageTier.COLD : StorageTier.HOT,
          `Transition ${i}`,
          1.0
        )
      }

      const loaded = await store.load('obj-1')
      expect(loaded!.tierHistory!.length).toBeLessThanOrEqual(10)
    })
  })

  describe('getStats', () => {
    it('should return statistics', async () => {
      await store.save('hot-1', {
        identifier: 'hot-1',
        tier: StorageTier.HOT,
        layer: StorageLayer.CUSTOMER_DATA,
        size: 1024 * 1024,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 5
      })

      await store.save('cold-1', {
        identifier: 'cold-1',
        tier: StorageTier.COLD,
        layer: StorageLayer.INDUSTRY_RAG,
        size: 2 * 1024 * 1024,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 2
      })

      const stats = await store.getStats()

      expect(stats.totalEntries).toBe(2)
      expect(stats.byTier[StorageTier.HOT]).toBe(1)
      expect(stats.byTier[StorageTier.COLD]).toBe(1)
      expect(stats.byLayer[StorageLayer.CUSTOMER_DATA]).toBe(1)
      expect(stats.byLayer[StorageLayer.INDUSTRY_RAG]).toBe(1)
      expect(stats.totalSize).toBe(3 * 1024 * 1024)
    })
  })

  describe('export and import', () => {
    it('should export to JSON', async () => {
      await store.save('obj-1', {
        identifier: 'obj-1',
        tier: StorageTier.HOT,
        layer: StorageLayer.CUSTOMER_DATA,
        size: 1024 * 1024,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 5
      })

      const json = await store.exportToJSON()

      expect(json).toContain('obj-1')
      expect(json).toContain(StorageTier.HOT)
    })

    it('should import from JSON', async () => {
      const metadata: TieringMetadata = {
        identifier: 'obj-1',
        tier: StorageTier.HOT,
        layer: StorageLayer.CUSTOMER_DATA,
        size: 1024 * 1024,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 5
      }

      await store.save('obj-1', metadata)
      const json = await store.exportToJSON()

      const newStore = new MetadataStore({
        backend: MetadataBackend.MEMORY
      })
      await newStore.initialize()
      await newStore.importFromJSON(json)

      const loaded = await newStore.load('obj-1')
      expect(loaded).not.toBeNull()
      expect(loaded!.identifier).toBe('obj-1')
      expect(loaded!.tier).toBe(StorageTier.HOT)

      newStore.destroy()
    })
  })

  describe('clear', () => {
    it('should clear all metadata', async () => {
      await store.save('obj-1', {
        identifier: 'obj-1',
        tier: StorageTier.HOT,
        layer: StorageLayer.CUSTOMER_DATA,
        size: 1024 * 1024,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 5
      })

      await store.clear()

      const all = await store.listAll()
      expect(all.size).toBe(0)
    })
  })
})
