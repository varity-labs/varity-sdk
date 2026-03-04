/**
 * Comprehensive tests for GCS-compatible storage types
 * Target: 20+ tests covering GCS-specific types and enums
 */

import {
  GCSCompatibleConfig,
  GCSCredentials,
  GCSUploadResult,
  GCSResumableUpload,
  GCSListObjectsResult,
  GCSObject,
  GCSBucket,
  GCSLifecycleRule,
  GCSCORSConfiguration,
  GCSSignedUrlOptions,
  GCSStorageClass,
  GCSPredefinedACL
} from '../gcs-compatible'

import { StorageBackend } from '../storage'

describe('GCS Storage Class Enum', () => {
  test('should have all GCS storage classes', () => {
    expect(GCSStorageClass.STANDARD).toBe('STANDARD')
    expect(GCSStorageClass.NEARLINE).toBe('NEARLINE')
    expect(GCSStorageClass.COLDLINE).toBe('COLDLINE')
    expect(GCSStorageClass.ARCHIVE).toBe('ARCHIVE')
    expect(GCSStorageClass.MULTI_REGIONAL).toBe('MULTI_REGIONAL')
    expect(GCSStorageClass.REGIONAL).toBe('REGIONAL')
  })
})

describe('GCS Predefined ACL Enum', () => {
  test('should have all predefined ACL values', () => {
    expect(GCSPredefinedACL.PRIVATE).toBe('private')
    expect(GCSPredefinedACL.PUBLIC_READ).toBe('publicRead')
    expect(GCSPredefinedACL.PUBLIC_READ_WRITE).toBe('publicReadWrite')
    expect(GCSPredefinedACL.AUTHENTICATED_READ).toBe('authenticatedRead')
    expect(GCSPredefinedACL.BUCKET_OWNER_READ).toBe('bucketOwnerRead')
    expect(GCSPredefinedACL.BUCKET_OWNER_FULL_CONTROL).toBe('bucketOwnerFullControl')
  })
})

describe('GCSCompatibleConfig Interface', () => {
  test('should create GCS config with service account', () => {
    const config: GCSCompatibleConfig = {
      projectId: 'my-gcp-project',
      credentials: {
        type: 'service_account',
        clientEmail: 'service@my-gcp-project.iam.gserviceaccount.com',
        privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
        privateKeyId: 'key123'
      },
      bucket: 'my-gcs-bucket'
    }

    expect(config.projectId).toBe('my-gcp-project')
    expect(config.credentials.type).toBe('service_account')
  })

  test('should create GCS config with OAuth2', () => {
    const config: GCSCompatibleConfig = {
      projectId: 'my-gcp-project',
      credentials: {
        type: 'oauth2',
        accessToken: 'ya29.abc123',
        refreshToken: 'refresh-token',
        clientId: 'client-id',
        clientSecret: 'client-secret'
      },
      bucket: 'my-bucket'
    }

    expect(config.credentials.type).toBe('oauth2')
    expect(config.credentials.accessToken).toBe('ya29.abc123')
  })

  test('should support custom endpoint and retry config', () => {
    const config: GCSCompatibleConfig = {
      endpoint: 'storage.varity.io',
      projectId: 'varity-project',
      credentials: {
        type: 'api_key',
        apiKey: 'api-key-123'
      },
      bucket: 'varity-bucket',
      timeout: 30000,
      retry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000
      }
    }

    expect(config.endpoint).toBe('storage.varity.io')
    expect(config.retry?.maxRetries).toBe(3)
  })
})

describe('GCSUploadResult Interface', () => {
  test('should create complete GCS upload result', () => {
    const result: GCSUploadResult = {
      identifier: 'gs://my-bucket/file.txt',
      gatewayUrl: 'https://storage.googleapis.com/my-bucket/file.txt',
      size: 1024,
      hash: 'md5:abc123',
      timestamp: Date.now(),
      backend: StorageBackend.GCS_COMPATIBLE,
      gcsName: 'file.txt',
      bucket: 'my-bucket',
      generation: '1234567890',
      metageneration: '1',
      md5Hash: 'abc123',
      crc32c: 'xyz789',
      storageClass: GCSStorageClass.STANDARD
    }

    expect(result.gcsName).toBe('file.txt')
    expect(result.generation).toBe('1234567890')
    expect(result.storageClass).toBe(GCSStorageClass.STANDARD)
  })

  test('should support customer-managed encryption', () => {
    const result: GCSUploadResult = {
      identifier: 'gs://encrypted-bucket/secure.dat',
      gatewayUrl: 'https://storage.googleapis.com/encrypted-bucket/secure.dat',
      size: 2048,
      hash: 'sha256:xyz789',
      timestamp: Date.now(),
      backend: StorageBackend.GCS_COMPATIBLE,
      gcsName: 'secure.dat',
      bucket: 'encrypted-bucket',
      generation: '9876543210',
      metageneration: '1',
      customerEncryption: {
        encryptionAlgorithm: 'AES256',
        keySha256: 'key-hash-base64'
      }
    }

    expect(result.customerEncryption).toBeDefined()
    expect(result.customerEncryption?.encryptionAlgorithm).toBe('AES256')
  })
})

describe('GCS Resumable Upload', () => {
  test('should create resumable upload session', () => {
    const upload: GCSResumableUpload = {
      uploadUrl: 'https://storage.googleapis.com/upload/storage/v1/b/bucket/o?uploadId=xyz',
      bucket: 'my-bucket',
      name: 'large-file.zip',
      initiated: new Date(),
      bytesUploaded: 10485760
    }

    expect(upload.uploadUrl).toContain('uploadId')
    expect(upload.bytesUploaded).toBe(10485760)
  })
})

describe('GCS List Operations', () => {
  test('should create list objects result', () => {
    const result: GCSListObjectsResult = {
      items: [
        {
          name: 'document1.pdf',
          bucket: 'my-bucket',
          size: 1024,
          updated: new Date(),
          generation: '123',
          metageneration: '1',
          storageClass: GCSStorageClass.STANDARD
        }
      ],
      prefixes: ['folder1/', 'folder2/'],
      nextPageToken: 'token123'
    }

    expect(result.items.length).toBe(1)
    expect(result.prefixes).toEqual(['folder1/', 'folder2/'])
  })
})

describe('GCS Bucket Operations', () => {
  test('should create bucket configuration', () => {
    const bucket: GCSBucket = {
      name: 'my-varity-bucket',
      location: 'US',
      storageClass: GCSStorageClass.STANDARD,
      created: new Date(),
      updated: new Date()
    }

    expect(bucket.name).toBe('my-varity-bucket')
    expect(bucket.location).toBe('US')
  })

  test('should configure bucket lifecycle', () => {
    const rule: GCSLifecycleRule = {
      action: {
        type: 'Delete'
      },
      condition: {
        age: 365
      }
    }

    expect(rule.action.type).toBe('Delete')
    expect(rule.condition.age).toBe(365)
  })
})

describe('GCS CORS Configuration', () => {
  test('should create CORS configuration', () => {
    const cors: GCSCORSConfiguration = {
      cors: [
        {
          origin: ['https://example.com'],
          method: ['GET', 'POST'],
          responseHeader: ['Content-Type'],
          maxAgeSeconds: 3600
        }
      ]
    }

    expect(cors.cors.length).toBe(1)
    expect(cors.cors[0].maxAgeSeconds).toBe(3600)
  })
})

describe('GCS Signed URLs', () => {
  test('should create signed URL options', () => {
    const options: GCSSignedUrlOptions = {
      version: 'v4',
      action: 'read',
      expires: new Date(Date.now() + 3600000)
    }

    expect(options.version).toBe('v4')
    expect(options.action).toBe('read')
  })

  test('should support write action with content type', () => {
    const options: GCSSignedUrlOptions = {
      version: 'v4',
      action: 'write',
      expires: new Date(Date.now() + 3600000),
      contentType: 'application/pdf'
    }

    expect(options.action).toBe('write')
    expect(options.contentType).toBe('application/pdf')
  })
})

describe('GCS Credentials Types', () => {
  test('should create service account credentials', () => {
    const credentials: GCSCredentials = {
      type: 'service_account',
      clientEmail: 'service@project.iam.gserviceaccount.com',
      privateKey: '-----BEGIN PRIVATE KEY-----\n...',
      privateKeyId: 'key-id-123'
    }

    expect(credentials.type).toBe('service_account')
    expect(credentials.clientEmail).toContain('gserviceaccount.com')
  })

  test('should create OAuth2 credentials', () => {
    const credentials: GCSCredentials = {
      type: 'oauth2',
      accessToken: 'ya29.abc',
      refreshToken: 'refresh',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      expiryDate: Date.now() + 3600000
    }

    expect(credentials.type).toBe('oauth2')
    expect(credentials.expiryDate).toBeDefined()
  })

  test('should create API key credentials', () => {
    const credentials: GCSCredentials = {
      type: 'api_key',
      apiKey: 'AIzaSyAbc123'
    }

    expect(credentials.type).toBe('api_key')
    expect(credentials.apiKey).toBe('AIzaSyAbc123')
  })

  test('should create external account credentials', () => {
    const credentials: GCSCredentials = {
      type: 'external_account',
      externalAccount: {
        audience: 'aud://example',
        subjectTokenType: 'urn:ietf:params:oauth:token-type:jwt',
        tokenUrl: 'https://sts.googleapis.com/v1/token',
        serviceAccountImpersonationUrl: 'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/sa@project.iam.gserviceaccount.com:generateAccessToken'
      }
    }

    expect(credentials.type).toBe('external_account')
    expect(credentials.externalAccount).toBeDefined()
  })
})

describe('GCS Object Operations', () => {
  test('should create GCS object with metadata', () => {
    const object: GCSObject = {
      name: 'report.pdf',
      bucket: 'documents',
      size: 5242880,
      updated: new Date(),
      generation: '1234567890',
      metageneration: '1',
      storageClass: GCSStorageClass.NEARLINE,
      contentType: 'application/pdf',
      metadata: {
        'user': 'john',
        'project': 'varity'
      }
    }

    expect(object.name).toBe('report.pdf')
    expect(object.storageClass).toBe(GCSStorageClass.NEARLINE)
    expect(object.metadata?.['project']).toBe('varity')
  })

  test('should support object access control', () => {
    const object: GCSObject = {
      name: 'public-file.txt',
      bucket: 'public-bucket',
      size: 1024,
      updated: new Date(),
      generation: '123',
      metageneration: '1',
      acl: [
        {
          entity: 'allUsers',
          role: 'READER'
        }
      ]
    }

    expect(object.acl).toBeDefined()
    expect(object.acl?.[0].entity).toBe('allUsers')
  })
})

describe('GCS Storage Type Validation', () => {
  test('storage classes should be mutually exclusive', () => {
    const classes = Object.values(GCSStorageClass)
    const uniqueClasses = new Set(classes)
    expect(classes.length).toBe(uniqueClasses.size)
  })

  test('predefined ACLs should be mutually exclusive', () => {
    const acls = Object.values(GCSPredefinedACL)
    const uniqueAcls = new Set(acls)
    expect(acls.length).toBe(uniqueAcls.size)
  })
})
