/**
 * Comprehensive tests for migration types
 * Target: 20+ tests covering migration job types and enums
 */

import {
  MigrationStatus,
  MigrationPhase,
  MigrationSource,
  MigrationTarget,
  MigrationJob,
  MigrationSourceConfig,
  MigrationTargetConfig,
  MigrationProgress,
  MigrationStats,
  MigrationConfig,
  MigrationFilter,
  MigrationError,
  MigrationVerification,
  MigrationSchedule,
  MigrationTemplate
} from '../migration'

import { StorageLayer, StorageTier } from '../storage'

describe('Migration Enums', () => {
  test('MigrationStatus enum should have all lifecycle states', () => {
    expect(MigrationStatus.PENDING).toBe('pending')
    expect(MigrationStatus.RUNNING).toBe('running')
    expect(MigrationStatus.PAUSED).toBe('paused')
    expect(MigrationStatus.COMPLETED).toBe('completed')
    expect(MigrationStatus.FAILED).toBe('failed')
    expect(MigrationStatus.CANCELLED).toBe('cancelled')
    expect(MigrationStatus.VALIDATING).toBe('validating')
    expect(MigrationStatus.RETRYING).toBe('retrying')
  })

  test('MigrationPhase enum should have all phases', () => {
    expect(MigrationPhase.DISCOVERY).toBe('discovery')
    expect(MigrationPhase.TRANSFER).toBe('transfer')
    expect(MigrationPhase.VERIFICATION).toBe('verification')
    expect(MigrationPhase.CLEANUP).toBe('cleanup')
    expect(MigrationPhase.DONE).toBe('done')
  })

  test('MigrationSource enum should have all source types', () => {
    expect(MigrationSource.AWS_S3).toBe('aws-s3')
    expect(MigrationSource.GCP_GCS).toBe('gcp-gcs')
    expect(MigrationSource.AZURE_BLOB).toBe('azure-blob')
    expect(MigrationSource.LOCAL_FILESYSTEM).toBe('local-filesystem')
    expect(MigrationSource.HTTP).toBe('http')
    expect(MigrationSource.FTP).toBe('ftp')
    expect(MigrationSource.VARITY).toBe('varity')
  })

  test('MigrationTarget enum should have all target types', () => {
    expect(MigrationTarget.VARITY_FILECOIN).toBe('varity-filecoin')
    expect(MigrationTarget.VARITY_S3_COMPATIBLE).toBe('varity-s3-compatible')
    expect(MigrationTarget.VARITY_GCS_COMPATIBLE).toBe('varity-gcs-compatible')
  })
})

describe('MigrationJob Interface', () => {
  test('should create complete migration job', () => {
    const job: MigrationJob = {
      id: 'job-123abc',
      name: 'Migrate S3 to Varity',
      description: 'Migrate production data from AWS S3 to Varity',
      source: {
        type: MigrationSource.AWS_S3,
        credentials: {
          aws: {
            accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
            secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
          }
        },
        bucket: 'source-bucket',
        region: 'us-east-1'
      },
      target: {
        type: MigrationTarget.VARITY_FILECOIN,
        layer: StorageLayer.CUSTOMER_DATA,
        tier: StorageTier.HOT,
        encrypt: true
      },
      status: MigrationStatus.PENDING,
      phase: MigrationPhase.DISCOVERY,
      progress: {
        totalObjects: 0,
        completedObjects: 0,
        failedObjects: 0,
        skippedObjects: 0,
        inProgressObjects: 0,
        totalBytes: 0,
        transferredBytes: 0,
        failedBytes: 0,
        percentage: 0,
        estimatedTimeRemaining: 0
      },
      config: {
        concurrency: 10,
        chunkSize: 10485760,
        validateChecksum: true,
        deleteSourceAfterMigration: false
      },
      errors: [],
      warnings: [],
      createdAt: new Date(),
      lastUpdated: new Date()
    }

    expect(job.id).toBe('job-123abc')
    expect(job.source.type).toBe(MigrationSource.AWS_S3)
    expect(job.target.type).toBe(MigrationTarget.VARITY_FILECOIN)
    expect(job.status).toBe(MigrationStatus.PENDING)
  })

  test('should create GCS to Varity migration job', () => {
    const job: MigrationJob = {
      id: 'job-456xyz',
      name: 'Migrate GCS to Varity',
      source: {
        type: MigrationSource.GCP_GCS,
        credentials: {
          gcp: {
            projectId: 'my-gcp-project',
            clientEmail: 'service@project.iam.gserviceaccount.com',
            privateKey: '-----BEGIN PRIVATE KEY-----\n...'
          }
        },
        bucket: 'gcs-bucket',
        prefix: 'data/'
      },
      target: {
        type: MigrationTarget.VARITY_FILECOIN,
        layer: StorageLayer.INDUSTRY_RAG,
        encrypt: true
      },
      status: MigrationStatus.RUNNING,
      phase: MigrationPhase.TRANSFER,
      progress: {
        totalObjects: 10000,
        completedObjects: 5000,
        failedObjects: 0,
        skippedObjects: 0,
        inProgressObjects: 100,
        totalBytes: 10737418240,
        transferredBytes: 5368709120,
        failedBytes: 0,
        percentage: 50,
        estimatedTimeRemaining: 3600
      },
      config: {
        concurrency: 10,
        chunkSize: 10485760,
        validateChecksum: true,
        deleteSourceAfterMigration: false
      },
      errors: [],
      warnings: [],
      createdAt: new Date(),
      lastUpdated: new Date(),
      startedAt: new Date()
    }

    expect(job.source.type).toBe(MigrationSource.GCP_GCS)
    expect(job.progress.percentage).toBe(50)
    expect(job.startedAt).toBeDefined()
  })
})

describe('MigrationProgress Interface', () => {
  test('should track migration progress', () => {
    const progress: MigrationProgress = {
      totalObjects: 1000,
      completedObjects: 750,
      failedObjects: 5,
      skippedObjects: 0,
      inProgressObjects: 50,
      totalBytes: 1073741824,
      transferredBytes: 805306368,
      failedBytes: 10485760,
      percentage: 75,
      currentRate: 10485760,
      averageRate: 8388608,
      estimatedTimeRemaining: 900
    }

    expect(progress.percentage).toBe(75)
    expect(progress.currentRate).toBe(10485760)
    expect(progress.failedObjects).toBe(5)
  })
})

describe('MigrationStats Interface', () => {
  test('should provide comprehensive migration statistics', () => {
    const stats: MigrationStats = {
      totalObjectsProcessed: 10000,
      totalBytesTransferred: 10737418240,
      successfulTransfers: 9950,
      failedTransfers: 50,
      skippedObjects: 0,
      averageTransferSpeed: 10485760,
      peakTransferSpeed: 20971520,
      totalDuration: 3600,
      costSavings: {
        original: 2200.00,
        migrated: 226.80,
        savings: 1973.20,
        savingsPercent: 89.7
      }
    }

    expect(stats.successfulTransfers).toBe(9950)
    expect(stats.failedTransfers).toBe(50)
    expect(stats.costSavings.savingsPercent).toBe(89.7)
  })
})

describe('MigrationConfig Interface', () => {
  test('should configure migration with retry and notification', () => {
    const config: MigrationConfig = {
      concurrency: 10,
      chunkSize: 10485760,
      validateChecksum: true,
      deleteSourceAfterMigration: false,
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
        maxRetryDelay: 60000
      },
      notificationConfig: {
        enabled: true,
        channels: [
          {
            type: 'email',
            endpoint: 'admin@example.com'
          },
          {
            type: 'webhook',
            endpoint: 'https://hooks.slack.com/services/xxx'
          }
        ],
        notifyOnSuccess: true,
        notifyOnFailure: true,
        notifyOnProgress: true,
        progressInterval: 600
      }
    }

    expect(config.concurrency).toBe(10)
    expect(config.retryConfig.maxRetries).toBe(3)
    expect(config.notificationConfig.channels.length).toBe(2)
  })
})

describe('MigrationFilter Interface', () => {
  test('should filter objects by patterns', () => {
    const filter: MigrationFilter = {
      includePatterns: ['*.pdf', '*.docx'],
      excludePatterns: ['temp/*', '*.tmp'],
      minSize: 1024,
      maxSize: 10485760,
      modifiedAfter: new Date('2024-01-01'),
      modifiedBefore: new Date('2024-12-31')
    }

    expect(filter.includePatterns).toContain('*.pdf')
    expect(filter.excludePatterns).toContain('temp/*')
    expect(filter.minSize).toBe(1024)
  })
})

describe('MigrationError Interface', () => {
  test('should record migration errors', () => {
    const error: MigrationError = {
      objectKey: 'document.pdf',
      errorCode: 'TRANSFER_FAILED',
      message: 'Network timeout during transfer',
      timestamp: new Date(),
      retryCount: 3,
      fatal: false
    }

    expect(error.errorCode).toBe('TRANSFER_FAILED')
    expect(error.retryCount).toBe(3)
    expect(error.fatal).toBe(false)
  })

  test('should mark fatal errors', () => {
    const error: MigrationError = {
      objectKey: 'critical.dat',
      errorCode: 'PERMISSION_DENIED',
      message: 'Access denied to source object',
      timestamp: new Date(),
      retryCount: 0,
      fatal: true
    }

    expect(error.fatal).toBe(true)
    expect(error.errorCode).toBe('PERMISSION_DENIED')
  })
})

describe('MigrationVerification Interface', () => {
  test('should verify migration integrity', () => {
    const verification: MigrationVerification = {
      totalObjects: 10000,
      verifiedObjects: 10000,
      mismatchedObjects: 0,
      missingObjects: 0,
      verificationMethod: 'checksum',
      startedAt: new Date(),
      completedAt: new Date(),
      details: [
        {
          objectKey: 'verified-file.txt',
          sourceChecksum: 'abc123',
          targetChecksum: 'abc123',
          match: true
        }
      ]
    }

    expect(verification.verifiedObjects).toBe(10000)
    expect(verification.mismatchedObjects).toBe(0)
    expect(verification.details[0].match).toBe(true)
  })

  test('should detect mismatched objects', () => {
    const verification: MigrationVerification = {
      totalObjects: 100,
      verifiedObjects: 100,
      mismatchedObjects: 2,
      missingObjects: 0,
      verificationMethod: 'checksum',
      startedAt: new Date(),
      completedAt: new Date(),
      details: [
        {
          objectKey: 'corrupted-file.txt',
          sourceChecksum: 'abc123',
          targetChecksum: 'def456',
          match: false
        }
      ]
    }

    expect(verification.mismatchedObjects).toBe(2)
    expect(verification.details[0].match).toBe(false)
  })
})

describe('MigrationSchedule Interface', () => {
  test('should schedule one-time migration', () => {
    const schedule: MigrationSchedule = {
      type: 'once',
      startTime: new Date('2024-12-01T00:00:00Z')
    }

    expect(schedule.type).toBe('once')
    expect(schedule.startTime).toBeInstanceOf(Date)
  })

  test('should schedule recurring migration', () => {
    const schedule: MigrationSchedule = {
      type: 'recurring',
      startTime: new Date('2024-01-01T00:00:00Z'),
      recurrence: {
        frequency: 'daily',
        interval: 1,
        daysOfWeek: [1, 2, 3, 4, 5],
        endTime: new Date('2024-12-31T23:59:59Z')
      }
    }

    expect(schedule.type).toBe('recurring')
    expect(schedule.recurrence?.frequency).toBe('daily')
    expect(schedule.recurrence?.daysOfWeek).toEqual([1, 2, 3, 4, 5])
  })
})

describe('MigrationTemplate Interface', () => {
  test('should create migration template', () => {
    const template: MigrationTemplate = {
      templateId: 'template-s3-to-varity',
      name: 'AWS S3 to Varity Standard',
      description: 'Standard template for migrating from AWS S3',
      sourceType: MigrationSource.AWS_S3,
      targetType: MigrationTarget.VARITY_MULTI_TIER,
      defaultConfig: {
        concurrency: 10,
        chunkSize: 10485760,
        validateChecksum: true,
        deleteSourceAfterMigration: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    expect(template.sourceType).toBe(MigrationSource.AWS_S3)
    expect(template.defaultConfig.concurrency).toBe(10)
  })
})

describe('Migration Type Consistency', () => {
  test('migration sources should be unique', () => {
    const sources = Object.values(MigrationSource)
    const uniqueSources = new Set(sources)
    expect(sources.length).toBe(uniqueSources.size)
  })

  test('migration targets should be unique', () => {
    const targets = Object.values(MigrationTarget)
    const uniqueTargets = new Set(targets)
    expect(targets.length).toBe(uniqueTargets.size)
  })

  test('migration phases should follow logical order', () => {
    const phases = [
      MigrationPhase.DISCOVERY,
      MigrationPhase.TRANSFER,
      MigrationPhase.VERIFICATION,
      MigrationPhase.CLEANUP,
      MigrationPhase.DONE
    ]

    expect(phases).toEqual([
      'discovery',
      'transfer',
      'verification',
      'cleanup',
      'done'
    ])
  })
})
