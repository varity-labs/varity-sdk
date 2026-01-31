/**
 * Comprehensive tests for S3-compatible storage types
 * Target: 20+ tests covering S3-specific types and enums
 */

import {
  S3CompatibleConfig,
  S3UploadResult,
  S3MultipartUpload,
  S3UploadPart,
  S3MultipartUploadOptions,
  S3ListObjectsResult,
  S3Object,
  S3RestoreStatus,
  S3Bucket,
  S3BucketVersioning,
  S3LifecycleRule,
  S3Transition,
  S3Expiration,
  S3StorageClass,
  S3ACL,
  S3BucketPolicy,
  S3PolicyStatement,
  S3CORSConfiguration,
  S3CORSRule,
  S3PresignedUrlOptions,
  S3PresignedUrl,
  S3ServerSideEncryption,
  S3ObjectLock,
  S3ReplicationConfiguration,
  S3ReplicationRule
} from '../s3-compatible'

import { StorageBackend, StorageTier } from '../storage'

describe('S3 Storage Class Enum', () => {
  test('should have all S3 storage classes', () => {
    expect(S3StorageClass.STANDARD).toBe('STANDARD')
    expect(S3StorageClass.STANDARD_IA).toBe('STANDARD_IA')
    expect(S3StorageClass.ONEZONE_IA).toBe('ONEZONE_IA')
    expect(S3StorageClass.INTELLIGENT_TIERING).toBe('INTELLIGENT_TIERING')
    expect(S3StorageClass.GLACIER).toBe('GLACIER')
    expect(S3StorageClass.GLACIER_IR).toBe('GLACIER_IR')
    expect(S3StorageClass.DEEP_ARCHIVE).toBe('DEEP_ARCHIVE')
  })
})

describe('S3 ACL Enum', () => {
  test('should have all canned ACL values', () => {
    expect(S3ACL.PRIVATE).toBe('private')
    expect(S3ACL.PUBLIC_READ).toBe('public-read')
    expect(S3ACL.PUBLIC_READ_WRITE).toBe('public-read-write')
    expect(S3ACL.AUTHENTICATED_READ).toBe('authenticated-read')
    expect(S3ACL.BUCKET_OWNER_READ).toBe('bucket-owner-read')
    expect(S3ACL.BUCKET_OWNER_FULL_CONTROL).toBe('bucket-owner-full-control')
  })
})

describe('S3CompatibleConfig Interface', () => {
  test('should create AWS S3 configuration', () => {
    const config: S3CompatibleConfig = {
      endpoint: 's3.amazonaws.com',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      region: 'us-east-1',
      bucket: 'my-bucket',
      useSSL: true
    }

    expect(config.endpoint).toBe('s3.amazonaws.com')
    expect(config.region).toBe('us-east-1')
    expect(config.useSSL).toBe(true)
  })

  test('should create MinIO configuration with path style', () => {
    const config: S3CompatibleConfig = {
      endpoint: 'minio.example.com',
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
      bucket: 'my-bucket',
      useSSL: true,
      port: 9000,
      pathStyle: true,
      forcePathStyle: true
    }

    expect(config.pathStyle).toBe(true)
    expect(config.port).toBe(9000)
  })

  test('should support temporary credentials with session token', () => {
    const config: S3CompatibleConfig = {
      endpoint: 's3.amazonaws.com',
      accessKeyId: 'ASIAXXX',
      secretAccessKey: 'secret',
      sessionToken: 'FwoGZXIvYXdzEBYaDIz...',
      bucket: 'temp-bucket',
      region: 'us-west-2'
    }

    expect(config.sessionToken).toBeDefined()
    expect(config.region).toBe('us-west-2')
  })
})

describe('S3UploadResult Interface', () => {
  test('should create complete S3 upload result', () => {
    const result: S3UploadResult = {
      identifier: 's3://my-bucket/file.txt',
      gatewayUrl: 'https://my-bucket.s3.amazonaws.com/file.txt',
      size: 1024,
      hash: 'md5:abc123',
      timestamp: Date.now(),
      backend: StorageBackend.S3_COMPATIBLE,
      s3Key: 'file.txt',
      bucket: 'my-bucket',
      region: 'us-east-1',
      etag: '"abc123def456"',
      versionId: 'v1234567890',
      serverSideEncryption: 'AES256',
      storageClass: S3StorageClass.STANDARD
    }

    expect(result.s3Key).toBe('file.txt')
    expect(result.etag).toBe('"abc123def456"')
    expect(result.storageClass).toBe(S3StorageClass.STANDARD)
  })

  test('should support KMS encryption', () => {
    const result: S3UploadResult = {
      identifier: 's3://encrypted-bucket/secure.dat',
      gatewayUrl: 'https://encrypted-bucket.s3.amazonaws.com/secure.dat',
      size: 2048,
      hash: 'sha256:xyz789',
      timestamp: Date.now(),
      backend: StorageBackend.S3_COMPATIBLE,
      s3Key: 'secure.dat',
      bucket: 'encrypted-bucket',
      etag: '"encrypted-etag"',
      serverSideEncryption: 'aws:kms',
      kmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012'
    }

    expect(result.serverSideEncryption).toBe('aws:kms')
    expect(result.kmsKeyId).toBeDefined()
  })
})

describe('S3 Multipart Upload', () => {
  test('should create multipart upload session', () => {
    const upload: S3MultipartUpload = {
      uploadId: 'EXAMPLEJZ6e0YupT2h66iePQCc9IEbYbDUy4RTpMeoSMLPRp8Z5o1u8feSRonpvn',
      bucket: 'my-bucket',
      key: 'large-file.zip',
      parts: [
        { partNumber: 1, etag: '"part1-etag"', size: 5242880 },
        { partNumber: 2, etag: '"part2-etag"', size: 5242880 }
      ],
      initiated: new Date()
    }

    expect(upload.uploadId).toBeDefined()
    expect(upload.parts.length).toBe(2)
  })

  test('should create multipart upload options', () => {
    const options: S3MultipartUploadOptions = {
      partSize: 10485760, // 10MB
      concurrency: 4,
      leavePartsOnError: false,
      serverSideEncryption: 'AES256',
      storageClass: S3StorageClass.INTELLIGENT_TIERING,
      metadata: { 'x-amz-meta-user': 'john' },
      tags: { 'project': 'varity' }
    }

    expect(options.partSize).toBe(10485760)
    expect(options.concurrency).toBe(4)
    expect(options.storageClass).toBe(S3StorageClass.INTELLIGENT_TIERING)
  })
})

describe('S3 List Operations', () => {
  test('should create list objects result', () => {
    const result: S3ListObjectsResult = {
      objects: [
        {
          key: 'document1.pdf',
          size: 1024,
          lastModified: new Date(),
          etag: '"etag1"',
          storageClass: S3StorageClass.STANDARD
        },
        {
          key: 'document2.pdf',
          size: 2048,
          lastModified: new Date(),
          etag: '"etag2"',
          storageClass: S3StorageClass.STANDARD_IA
        }
      ],
      isTruncated: false,
      keyCount: 2,
      maxKeys: 1000
    }

    expect(result.objects.length).toBe(2)
    expect(result.isTruncated).toBe(false)
  })

  test('should handle paginated results', () => {
    const result: S3ListObjectsResult = {
      objects: [],
      isTruncated: true,
      continuationToken: 'token1',
      nextContinuationToken: 'token2',
      keyCount: 1000,
      maxKeys: 1000
    }

    expect(result.isTruncated).toBe(true)
    expect(result.nextContinuationToken).toBe('token2')
  })
})

describe('S3 Bucket Configuration', () => {
  test('should create bucket configuration', () => {
    const bucket: S3Bucket = {
      name: 'my-varity-bucket',
      creationDate: new Date(),
      region: 'us-east-1',
      locationConstraint: 'us-east-1'
    }

    expect(bucket.name).toBe('my-varity-bucket')
    expect(bucket.region).toBe('us-east-1')
  })

  test('should configure bucket versioning', () => {
    const versioning: S3BucketVersioning = {
      status: 'Enabled',
      mfaDelete: 'Disabled'
    }

    expect(versioning.status).toBe('Enabled')
  })
})

describe('S3 Lifecycle Rules', () => {
  test('should create lifecycle rule with transitions', () => {
    const rule: S3LifecycleRule = {
      id: 'archive-old-files',
      status: 'Enabled',
      prefix: 'logs/',
      transitions: [
        { days: 30, storageClass: S3StorageClass.STANDARD_IA },
        { days: 90, storageClass: S3StorageClass.GLACIER },
        { days: 365, storageClass: S3StorageClass.DEEP_ARCHIVE }
      ]
    }

    expect(rule.transitions?.length).toBe(3)
    expect(rule.status).toBe('Enabled')
  })

  test('should create lifecycle rule with expiration', () => {
    const rule: S3LifecycleRule = {
      id: 'delete-old-logs',
      status: 'Enabled',
      prefix: 'temp/',
      expiration: {
        days: 7
      }
    }

    expect(rule.expiration?.days).toBe(7)
  })

  test('should handle multipart upload abortion', () => {
    const rule: S3LifecycleRule = {
      id: 'cleanup-incomplete-uploads',
      status: 'Enabled',
      abortIncompleteMultipartUpload: {
        daysAfterInitiation: 7
      }
    }

    expect(rule.abortIncompleteMultipartUpload?.daysAfterInitiation).toBe(7)
  })
})

describe('S3 Access Control', () => {
  test('should create bucket policy', () => {
    const policy: S3BucketPolicy = {
      version: '2012-10-17',
      id: 'PublicReadPolicy',
      statements: [
        {
          sid: 'PublicRead',
          effect: 'Allow',
          principal: '*',
          action: 's3:GetObject',
          resource: 'arn:aws:s3:::my-bucket/*'
        }
      ]
    }

    expect(policy.statements.length).toBe(1)
    expect(policy.statements[0].effect).toBe('Allow')
  })

  test('should create policy with conditions', () => {
    const statement: S3PolicyStatement = {
      sid: 'IPRestriction',
      effect: 'Allow',
      principal: { 'AWS': 'arn:aws:iam::123456789012:user/alice' },
      action: ['s3:GetObject', 's3:PutObject'],
      resource: 'arn:aws:s3:::secure-bucket/*',
      condition: {
        'IpAddress': {
          'aws:SourceIp': '203.0.113.0/24'
        }
      }
    }

    expect(statement.condition).toBeDefined()
    expect(Array.isArray(statement.action)).toBe(true)
  })
})

describe('S3 CORS Configuration', () => {
  test('should create CORS configuration', () => {
    const cors: S3CORSConfiguration = {
      corsRules: [
        {
          allowedOrigins: ['https://example.com'],
          allowedMethods: ['GET', 'PUT', 'POST'],
          allowedHeaders: ['*'],
          exposeHeaders: ['ETag', 'x-amz-version-id'],
          maxAgeSeconds: 3600
        }
      ]
    }

    expect(cors.corsRules.length).toBe(1)
    expect(cors.corsRules[0].maxAgeSeconds).toBe(3600)
  })
})

describe('S3 Presigned URLs', () => {
  test('should create presigned URL options', () => {
    const options: S3PresignedUrlOptions = {
      expiresIn: 3600,
      method: 'GET',
      responseHeaders: {
        contentType: 'application/pdf',
        contentDisposition: 'attachment; filename="report.pdf"'
      }
    }

    expect(options.expiresIn).toBe(3600)
    expect(options.method).toBe('GET')
  })

  test('should create presigned URL result', () => {
    const presignedUrl: S3PresignedUrl = {
      url: 'https://my-bucket.s3.amazonaws.com/file.txt?X-Amz-Algorithm=AWS4-HMAC-SHA256&...',
      expiresAt: new Date(Date.now() + 3600000),
      method: 'GET'
    }

    expect(presignedUrl.url).toContain('X-Amz-Algorithm')
    expect(presignedUrl.expiresAt).toBeInstanceOf(Date)
  })
})

describe('S3 Server-Side Encryption', () => {
  test('should create SSE-S3 configuration', () => {
    const sse: S3ServerSideEncryption = {
      type: 'AES256'
    }

    expect(sse.type).toBe('AES256')
  })

  test('should create SSE-KMS configuration', () => {
    const sse: S3ServerSideEncryption = {
      type: 'aws:kms',
      kmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678',
      kmsEncryptionContext: { 'project': 'varity' },
      bucketKeyEnabled: true
    }

    expect(sse.type).toBe('aws:kms')
    expect(sse.bucketKeyEnabled).toBe(true)
  })
})

describe('S3 Object Lock', () => {
  test('should create object lock configuration', () => {
    const lock: S3ObjectLock = {
      mode: 'COMPLIANCE',
      retainUntilDate: new Date('2025-12-31'),
      legalHold: 'ON'
    }

    expect(lock.mode).toBe('COMPLIANCE')
    expect(lock.legalHold).toBe('ON')
  })

  test('should support governance mode', () => {
    const lock: S3ObjectLock = {
      mode: 'GOVERNANCE',
      retainUntilDate: new Date('2024-12-31')
    }

    expect(lock.mode).toBe('GOVERNANCE')
  })
})

describe('S3 Replication', () => {
  test('should create replication configuration', () => {
    const replication: S3ReplicationConfiguration = {
      role: 'arn:aws:iam::123456789012:role/ReplicationRole',
      rules: [
        {
          id: 'replicate-all',
          status: 'Enabled',
          priority: 1,
          destination: {
            bucket: 'arn:aws:s3:::backup-bucket',
            storageClass: S3StorageClass.STANDARD_IA
          }
        }
      ]
    }

    expect(replication.rules.length).toBe(1)
    expect(replication.rules[0].status).toBe('Enabled')
  })

  test('should support replication with metrics', () => {
    const rule: S3ReplicationRule = {
      id: 'replicate-with-metrics',
      status: 'Enabled',
      destination: {
        bucket: 'arn:aws:s3:::replica-bucket',
        replicationTime: {
          status: 'Enabled',
          time: { minutes: 15 }
        },
        metrics: {
          status: 'Enabled',
          eventThreshold: { minutes: 15 }
        }
      }
    }

    expect(rule.destination.replicationTime?.status).toBe('Enabled')
    expect(rule.destination.metrics?.status).toBe('Enabled')
  })
})
