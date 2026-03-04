/**
 * Comprehensive tests for storage types
 * Target: 30+ tests covering all storage types, enums, and interfaces
 */

import {
  StorageBackend,
  StorageTier,
  StorageLayer,
  TieringPolicy,
  IStorageAdapter,
  UploadOptions,
  StorageResult,
  StorageItem,
  ListOptions,
  StorageMetadata,
  MultiTierStorageConfig,
  TierConfig,
  AutoTieringConfig,
  TieringRule,
  TieringCondition,
  TieringAction,
  AccessPattern,
  StorageStats,
  TierStats,
  LayerStats,
  StorageOperationResult,
  EncryptionOptions,
  EncryptionMetadata,
  StorageMetrics,
  LayerMetrics,
  TierMetrics,
  BackendMetrics,
  LatencyMetrics,
  StorageCosts,
  CostComparison,
  BandwidthMetrics
} from '../storage'

describe('Storage Enums', () => {
  test('StorageBackend enum should have all expected values', () => {
    expect(StorageBackend.FILECOIN_IPFS).toBe('filecoin-ipfs')
    expect(StorageBackend.CELESTIA).toBe('celestia')
    expect(StorageBackend.S3_COMPATIBLE).toBe('s3-compatible')
    expect(StorageBackend.GCS_COMPATIBLE).toBe('gcs-compatible')
    expect(StorageBackend.MULTI_TIER).toBe('multi-tier')
  })

  test('StorageTier enum should have all expected values', () => {
    expect(StorageTier.HOT).toBe('hot')
    expect(StorageTier.WARM).toBe('warm')
    expect(StorageTier.COLD).toBe('cold')
    expect(StorageTier.GLACIER).toBe('glacier')
  })

  test('StorageLayer enum should have all 3-layer architecture values', () => {
    expect(StorageLayer.VARITY_INTERNAL).toBe('varity-internal')
    expect(StorageLayer.INDUSTRY_RAG).toBe('industry-rag')
    expect(StorageLayer.CUSTOMER_DATA).toBe('customer-data')
  })

  test('TieringPolicy enum should have all policy types', () => {
    expect(TieringPolicy.TIME_BASED).toBe('time-based')
    expect(TieringPolicy.ACCESS_BASED).toBe('access-based')
    expect(TieringPolicy.SIZE_BASED).toBe('size-based')
    expect(TieringPolicy.COST_OPTIMIZED).toBe('cost-optimized')
    expect(TieringPolicy.CUSTOM).toBe('custom')
  })
})

describe('UploadOptions Interface', () => {
  test('should accept valid upload options with required fields', () => {
    const options: UploadOptions = {
      layer: StorageLayer.CUSTOMER_DATA,
      tier: StorageTier.HOT,
      metadata: { key: 'value' },
      pin: true,
      encrypt: true,
      namespace: 'customer-123',
      contentType: 'application/json',
      tags: { env: 'production' }
    }

    expect(options.layer).toBe(StorageLayer.CUSTOMER_DATA)
    expect(options.tier).toBe(StorageTier.HOT)
    expect(options.encrypt).toBe(true)
  })

  test('should accept minimal upload options with only required fields', () => {
    const options: UploadOptions = {
      layer: StorageLayer.INDUSTRY_RAG
    }

    expect(options.layer).toBe(StorageLayer.INDUSTRY_RAG)
    expect(options.tier).toBeUndefined()
    expect(options.encrypt).toBeUndefined()
  })

  test('should support all optional fields', () => {
    const options: UploadOptions = {
      layer: StorageLayer.VARITY_INTERNAL,
      tier: StorageTier.WARM,
      metadata: { custom: 'data' },
      pin: false,
      encrypt: false,
      namespace: 'varity-internal-docs',
      contentType: 'text/plain',
      cacheControl: 'max-age=3600',
      acl: 'private',
      tags: { type: 'document', category: 'internal' }
    }

    expect(options.cacheControl).toBe('max-age=3600')
    expect(options.acl).toBe('private')
    expect(options.tags).toEqual({ type: 'document', category: 'internal' })
  })
})

describe('StorageResult Interface', () => {
  test('should represent a complete upload result', () => {
    const result: StorageResult = {
      identifier: 'QmXxxYyyZzz',
      gatewayUrl: 'https://ipfs.varity.io/ipfs/QmXxxYyyZzz',
      size: 1024,
      hash: 'sha256:abcdef123456',
      timestamp: Date.now(),
      backend: StorageBackend.FILECOIN_IPFS,
      tier: StorageTier.HOT,
      layer: StorageLayer.CUSTOMER_DATA,
      encryptionMetadata: {
        encrypted: true,
        walletAddress: '0x123abc',
        layer: StorageLayer.CUSTOMER_DATA,
        algorithm: 'aes-256-gcm'
      }
    }

    expect(result.identifier).toBe('QmXxxYyyZzz')
    expect(result.backend).toBe(StorageBackend.FILECOIN_IPFS)
    expect(result.encryptionMetadata?.encrypted).toBe(true)
  })

  test('should support minimal result without optional fields', () => {
    const result: StorageResult = {
      identifier: 'abc123',
      gatewayUrl: 'https://storage.varity.io/abc123',
      size: 512,
      hash: 'sha256:xyz789',
      timestamp: Date.now(),
      backend: StorageBackend.S3_COMPATIBLE
    }

    expect(result.tier).toBeUndefined()
    expect(result.encryptionMetadata).toBeUndefined()
  })
})

describe('StorageItem Interface', () => {
  test('should represent a storage item from list operation', () => {
    const item: StorageItem = {
      identifier: 'item-123',
      key: 'customer-456/document.pdf',
      size: 2048,
      lastModified: new Date(),
      etag: '"abc123"',
      metadata: { type: 'pdf' },
      tier: StorageTier.COLD,
      storageClass: 'GLACIER',
      encrypted: true
    }

    expect(item.identifier).toBe('item-123')
    expect(item.tier).toBe(StorageTier.COLD)
    expect(item.encrypted).toBe(true)
  })

  test('should support minimal storage item', () => {
    const item: StorageItem = {
      identifier: 'item-456',
      key: 'file.txt',
      size: 128,
      lastModified: new Date()
    }

    expect(item.etag).toBeUndefined()
    expect(item.encrypted).toBeUndefined()
  })
})

describe('ListOptions Interface', () => {
  test('should support all list filtering options', () => {
    const options: ListOptions = {
      prefix: 'customer-123/',
      delimiter: '/',
      maxResults: 100,
      continuationToken: 'token123',
      tier: StorageTier.HOT,
      startAfter: 'file-001.txt',
      includeMetadata: true
    }

    expect(options.prefix).toBe('customer-123/')
    expect(options.maxResults).toBe(100)
    expect(options.includeMetadata).toBe(true)
  })

  test('should support empty list options', () => {
    const options: ListOptions = {}

    expect(options.prefix).toBeUndefined()
    expect(options.maxResults).toBeUndefined()
  })
})

describe('MultiTierStorageConfig Interface', () => {
  test('should define complete multi-tier configuration', () => {
    const config: MultiTierStorageConfig = {
      hotTier: {
        backend: StorageBackend.FILECOIN_IPFS,
        replication: 3,
        costPerGB: 0.10,
        accessLatency: 50
      },
      warmTier: {
        backend: StorageBackend.S3_COMPATIBLE,
        replication: 2,
        costPerGB: 0.05,
        accessLatency: 200
      },
      coldTier: {
        backend: StorageBackend.CELESTIA,
        replication: 1,
        costPerGB: 0.01,
        accessLatency: 1000
      },
      autoTiering: {
        enabled: true,
        policy: TieringPolicy.COST_OPTIMIZED,
        checkInterval: 24
      }
    }

    expect(config.hotTier.backend).toBe(StorageBackend.FILECOIN_IPFS)
    expect(config.autoTiering.enabled).toBe(true)
    expect(config.coldTier.costPerGB).toBe(0.01)
  })
})

describe('TieringRule Interface', () => {
  test('should define time-based tiering rule', () => {
    const rule: TieringRule = {
      name: 'archive-old-files',
      description: 'Move files older than 90 days to cold storage',
      condition: {
        type: 'age',
        operator: 'gt',
        value: 90,
        unit: 'days'
      },
      action: {
        moveTo: StorageTier.COLD,
        notify: true,
        notifyTo: ['admin@example.com']
      },
      priority: 1,
      enabled: true
    }

    expect(rule.condition.type).toBe('age')
    expect(rule.action.moveTo).toBe(StorageTier.COLD)
    expect(rule.enabled).toBe(true)
  })

  test('should define size-based tiering rule', () => {
    const rule: TieringRule = {
      name: 'large-file-cold-storage',
      condition: {
        type: 'size',
        operator: 'gt',
        value: 100,
        unit: 'mb'
      },
      action: {
        moveTo: StorageTier.COLD
      }
    }

    expect(rule.condition.type).toBe('size')
    expect(rule.condition.value).toBe(100)
  })

  test('should define access-based tiering rule with deletion', () => {
    const rule: TieringRule = {
      name: 'delete-unused-files',
      condition: {
        type: 'last_accessed',
        operator: 'gt',
        value: 365,
        unit: 'days'
      },
      action: {
        moveTo: StorageTier.GLACIER,
        delete: true,
        notify: true
      }
    }

    expect(rule.action.delete).toBe(true)
    expect(rule.condition.operator).toBe('gt')
  })
})

describe('AccessPattern Interface', () => {
  test('should analyze object access patterns', () => {
    const pattern: AccessPattern = {
      identifier: 'object-123',
      accessCount: 50,
      lastAccessed: new Date(),
      averageAccessInterval: 7,
      totalBandwidth: 10485760,
      currentTier: StorageTier.HOT,
      recommendedTier: StorageTier.WARM,
      costSavingsEstimate: 5.50,
      recommendationConfidence: 0.95
    }

    expect(pattern.accessCount).toBe(50)
    expect(pattern.currentTier).toBe(StorageTier.HOT)
    expect(pattern.recommendedTier).toBe(StorageTier.WARM)
    expect(pattern.recommendationConfidence).toBe(0.95)
  })
})

describe('StorageStats Interface', () => {
  test('should provide comprehensive storage statistics', () => {
    const stats: StorageStats = {
      totalObjects: 10000,
      totalSize: 1073741824,
      byTier: {
        [StorageTier.HOT]: {
          objectCount: 3000,
          totalSize: 536870912,
          monthlyCost: 50.00,
          avgObjectSize: 178956
        },
        [StorageTier.WARM]: {
          objectCount: 4000,
          totalSize: 268435456,
          monthlyCost: 25.00,
          avgObjectSize: 67108
        },
        [StorageTier.COLD]: {
          objectCount: 2000,
          totalSize: 134217728,
          monthlyCost: 10.00,
          avgObjectSize: 67108
        },
        [StorageTier.GLACIER]: {
          objectCount: 1000,
          totalSize: 134217728,
          monthlyCost: 2.00,
          avgObjectSize: 134217
        }
      },
      byLayer: {
        [StorageLayer.VARITY_INTERNAL]: {
          objectCount: 1000,
          totalSize: 107374182,
          percentage: 10
        },
        [StorageLayer.INDUSTRY_RAG]: {
          objectCount: 4000,
          totalSize: 429496729,
          percentage: 40
        },
        [StorageLayer.CUSTOMER_DATA]: {
          objectCount: 5000,
          totalSize: 536870912,
          percentage: 50
        }
      },
      monthlyCostEstimate: 87.00,
      lastUpdated: new Date()
    }

    expect(stats.totalObjects).toBe(10000)
    expect(stats.monthlyCostEstimate).toBe(87.00)
    expect(stats.byTier[StorageTier.HOT].objectCount).toBe(3000)
  })
})

describe('EncryptionOptions Interface', () => {
  test('should configure encryption with Lit Protocol', () => {
    const options: EncryptionOptions = {
      enabled: true,
      algorithm: 'aes-256-gcm',
      keyDerivation: 'pbkdf2',
      litProtocol: true,
      customKey: 'base64encodedkey=='
    }

    expect(options.enabled).toBe(true)
    expect(options.algorithm).toBe('aes-256-gcm')
    expect(options.litProtocol).toBe(true)
  })

  test('should support minimal encryption options', () => {
    const options: EncryptionOptions = {
      enabled: false
    }

    expect(options.enabled).toBe(false)
    expect(options.algorithm).toBeUndefined()
  })
})

describe('EncryptionMetadata Interface', () => {
  test('should store complete encryption metadata', () => {
    const metadata: EncryptionMetadata = {
      encrypted: true,
      algorithm: 'aes-256-gcm',
      walletAddress: '0xabc123def456',
      layer: StorageLayer.CUSTOMER_DATA,
      litProtocolEnabled: true,
      keyId: 'key-123',
      iv: 'iv-base64',
      authTag: 'tag-base64'
    }

    expect(metadata.encrypted).toBe(true)
    expect(metadata.litProtocolEnabled).toBe(true)
    expect(metadata.walletAddress).toBe('0xabc123def456')
  })
})

describe('StorageMetrics Interface', () => {
  test('should provide comprehensive metrics and analytics', () => {
    const metrics: StorageMetrics = {
      totalSize: 1073741824,
      objectCount: 10000,
      byLayer: {
        [StorageLayer.VARITY_INTERNAL]: {
          objectCount: 1000,
          totalSize: 107374182,
          lastUpdated: new Date(),
          encryptedObjects: 1000,
          avgObjectSize: 107374
        },
        [StorageLayer.INDUSTRY_RAG]: {
          objectCount: 4000,
          totalSize: 429496729,
          lastUpdated: new Date(),
          encryptedObjects: 4000,
          avgObjectSize: 107374
        },
        [StorageLayer.CUSTOMER_DATA]: {
          objectCount: 5000,
          totalSize: 536870912,
          lastUpdated: new Date(),
          encryptedObjects: 5000,
          avgObjectSize: 107374
        }
      },
      byTier: {
        [StorageTier.HOT]: {
          objectCount: 3000,
          totalSize: 536870912,
          averageAccessTime: 50,
          costPerGB: 0.10,
          monthlyCost: 50.00,
          avgObjectSize: 178956
        },
        [StorageTier.WARM]: {
          objectCount: 4000,
          totalSize: 268435456,
          averageAccessTime: 200,
          costPerGB: 0.05,
          monthlyCost: 25.00,
          avgObjectSize: 67108
        },
        [StorageTier.COLD]: {
          objectCount: 2000,
          totalSize: 134217728,
          averageAccessTime: 1000,
          costPerGB: 0.01,
          monthlyCost: 10.00,
          avgObjectSize: 67108
        },
        [StorageTier.GLACIER]: {
          objectCount: 1000,
          totalSize: 134217728,
          averageAccessTime: 5000,
          costPerGB: 0.005,
          monthlyCost: 2.00,
          avgObjectSize: 134217
        }
      },
      byBackend: {
        [StorageBackend.FILECOIN_IPFS]: {
          objectCount: 5000,
          totalSize: 536870912,
          availability: 99.9,
          latency: {
            p50: 50,
            p95: 100,
            p99: 200,
            avg: 60
          }
        },
        [StorageBackend.CELESTIA]: {
          objectCount: 2000,
          totalSize: 214748364,
          availability: 99.5,
          latency: {
            p50: 500,
            p95: 1000,
            p99: 2000,
            avg: 600
          }
        },
        [StorageBackend.S3_COMPATIBLE]: {
          objectCount: 2000,
          totalSize: 214748364,
          availability: 99.99,
          latency: {
            p50: 30,
            p95: 80,
            p99: 150,
            avg: 40
          }
        },
        [StorageBackend.GCS_COMPATIBLE]: {
          objectCount: 1000,
          totalSize: 107374182,
          availability: 99.95,
          latency: {
            p50: 40,
            p95: 90,
            p99: 160,
            avg: 50
          }
        },
        [StorageBackend.MULTI_TIER]: {
          objectCount: 0,
          totalSize: 0,
          availability: 100,
          latency: {
            p50: 0,
            p95: 0,
            p99: 0,
            avg: 0
          }
        }
      },
      costs: {
        monthlyTotal: 226.80,
        breakdown: {
          storage: 150.00,
          bandwidth: 50.00,
          operations: 25.00,
          replication: 1.80
        },
        comparisonToAWS: {
          sourceMonthlyCost: 2200.00,
          targetMonthlyCost: 226.80,
          savingsAmount: 1973.20,
          savingsPercent: 89.7,
          storageCost: 1800.00,
          bandwidthCost: 300.00,
          operationsCost: 100.00
        },
        comparisonToGCP: {
          sourceMonthlyCost: 1800.00,
          targetMonthlyCost: 226.80,
          savingsAmount: 1573.20,
          savingsPercent: 87.4,
          storageCost: 1500.00,
          bandwidthCost: 250.00,
          operationsCost: 50.00
        },
        monthlySavings: 1973.20,
        savingsPercent: 89.7
      },
      lastUpdated: new Date()
    }

    expect(metrics.totalSize).toBe(1073741824)
    expect(metrics.costs.savingsPercent).toBe(89.7)
    expect(metrics.byBackend[StorageBackend.FILECOIN_IPFS].availability).toBe(99.9)
  })
})

describe('StorageOperationResult Interface', () => {
  test('should track successful operation metrics', () => {
    const result: StorageOperationResult = {
      success: true,
      operation: 'upload',
      durationMs: 1250,
      bytesTransferred: 1048576,
      details: { retries: 0 }
    }

    expect(result.success).toBe(true)
    expect(result.operation).toBe('upload')
    expect(result.bytesTransferred).toBe(1048576)
  })

  test('should track failed operation with error', () => {
    const result: StorageOperationResult = {
      success: false,
      operation: 'download',
      durationMs: 500,
      bytesTransferred: 0,
      error: 'Network timeout',
      details: { retries: 3, lastError: 'Connection reset' }
    }

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network timeout')
  })
})

describe('BandwidthMetrics Interface', () => {
  test('should track bandwidth usage metrics', () => {
    const metrics: BandwidthMetrics = {
      uploadBytes: 10485760,
      downloadBytes: 52428800,
      uploadRequests: 100,
      downloadRequests: 500,
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      avgUploadSpeed: 1048576,
      avgDownloadSpeed: 5242880
    }

    expect(metrics.uploadBytes).toBe(10485760)
    expect(metrics.downloadRequests).toBe(500)
    expect(metrics.avgDownloadSpeed).toBe(5242880)
  })
})
