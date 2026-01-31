/**
 * S3Module Unit Tests
 *
 * Comprehensive test suite for S3-compatible storage module
 * Target: 90%+ code coverage
 */

import { S3Module } from '../S3Module'
import type { VaritySDK } from '../../../core/VaritySDK'
import type { S3CompatibleConfig } from '@varity-labs/types'

// Mock fetch
global.fetch = jest.fn()

// Mock SDK
const mockSDK = {
  getConfig: jest.fn().mockReturnValue({}),
  getNetworkConfig: jest.fn().mockReturnValue({})
} as unknown as VaritySDK

// Test configuration
const testConfig: S3CompatibleConfig = {
  endpoint: 'localhost:3001',
  accessKeyId: 'test-access-key',
  secretAccessKey: 'test-secret-key',
  bucket: 'test-bucket',
  region: 'us-east-1',
  useSSL: false
}

describe('S3Module', () => {
  let s3: S3Module

  beforeEach(() => {
    s3 = new S3Module(mockSDK, testConfig)
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  // ============================================================================
  // Constructor Tests
  // ============================================================================

  describe('Constructor', () => {
    it('should initialize with config', () => {
      expect(s3).toBeInstanceOf(S3Module)
    })

    it('should store SDK reference', () => {
      expect((s3 as any).sdk).toBe(mockSDK)
    })

    it('should store config', () => {
      expect((s3 as any).config).toEqual(testConfig)
    })
  })

  // ============================================================================
  // putObject Tests
  // ============================================================================

  describe('putObject', () => {
    it('should upload string body successfully', async () => {
      const mockResponse = {
        ok: true,
        headers: new Map([
          ['ETag', '"test-etag-123"'],
          ['x-amz-version-id', 'v1']
        ])
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ...mockResponse,
        headers: {
          get: (key: string) => (mockResponse.headers as any).get(key)
        }
      })

      const result = await s3.putObject({
        Bucket: 'test-bucket',
        Key: 'test-file.txt',
        Body: 'Hello, World!',
        ContentType: 'text/plain'
      })

      expect(result.s3Key).toBe('test-file.txt')
      expect(result.bucket).toBe('test-bucket')
      expect(result.etag).toBe('test-etag-123')
      expect(result.versionId).toBe('v1')
      expect(global.fetch).toHaveBeenCalledTimes(1)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      expect(fetchCall[0]).toContain('test-bucket/test-file.txt')
      expect(fetchCall[1].method).toBe('PUT')
    })

    it('should upload Buffer body successfully', async () => {
      const mockResponse = {
        ok: true,
        headers: new Map([['ETag', '"buffer-etag"']])
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ...mockResponse,
        headers: {
          get: (key: string) => (mockResponse.headers as any).get(key) || null
        }
      })

      const buffer = Buffer.from('test data', 'utf-8')

      const result = await s3.putObject({
        Bucket: 'test-bucket',
        Key: 'buffer-file.bin',
        Body: buffer
      })

      expect(result.etag).toBe('buffer-etag')
      expect(result.size).toBe(buffer.length)
    })

    it('should upload Blob body successfully', async () => {
      const mockResponse = {
        ok: true,
        headers: new Map([['ETag', '"blob-etag"']])
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ...mockResponse,
        headers: {
          get: (key: string) => (mockResponse.headers as any).get(key) || null
        }
      })

      const blob = new Blob(['test blob data'], { type: 'text/plain' })

      const result = await s3.putObject({
        Bucket: 'test-bucket',
        Key: 'blob-file.txt',
        Body: blob,
        ContentType: 'text/plain'
      })

      expect(result.etag).toBe('blob-etag')
    })

    it('should include metadata headers', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: () => '"etag"'
        }
      })

      await s3.putObject({
        Bucket: 'test-bucket',
        Key: 'test-file.txt',
        Body: 'test',
        Metadata: {
          'user-id': '12345',
          'custom-field': 'value'
        }
      })

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const headers = fetchCall[1].headers

      expect(headers['x-amz-meta-user-id']).toBe('12345')
      expect(headers['x-amz-meta-custom-field']).toBe('value')
    })

    it('should include storage class header', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: () => '"etag"'
        }
      })

      await s3.putObject({
        Bucket: 'test-bucket',
        Key: 'test-file.txt',
        Body: 'test',
        StorageClass: 'STANDARD_IA' as any
      })

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const headers = fetchCall[1].headers

      expect(headers['x-amz-storage-class']).toBe('STANDARD_IA')
    })

    it('should include server-side encryption headers', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: () => '"etag"'
        }
      })

      await s3.putObject({
        Bucket: 'test-bucket',
        Key: 'encrypted-file.txt',
        Body: 'sensitive data',
        ServerSideEncryption: 'AES256'
      })

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const headers = fetchCall[1].headers

      expect(headers['x-amz-server-side-encryption']).toBe('AES256')
    })

    it('should throw error on failed upload', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
        text: async () => 'Upload failed'
      })

      await expect(
        s3.putObject({
          Bucket: 'test-bucket',
          Key: 'test-file.txt',
          Body: 'test'
        })
      ).rejects.toThrow('S3 putObject failed')
    })
  })

  // ============================================================================
  // getObject Tests
  // ============================================================================

  describe('getObject', () => {
    it('should download object successfully', async () => {
      const testData = 'Hello, World!'
      const mockResponse = {
        ok: true,
        arrayBuffer: async () => Buffer.from(testData).buffer,
        headers: new Map([
          ['Content-Type', 'text/plain'],
          ['Content-Length', testData.length.toString()],
          ['ETag', '"download-etag"'],
          ['Last-Modified', new Date().toUTCString()],
          ['x-amz-version-id', 'v2']
        ])
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ...mockResponse,
        headers: {
          get: (key: string) => (mockResponse.headers as any).get(key) || null
        }
      })

      const result = await s3.getObject({
        Bucket: 'test-bucket',
        Key: 'test-file.txt'
      })

      expect(result.Body.toString()).toBe(testData)
      expect(result.ContentType).toBe('text/plain')
      expect(result.ETag).toBe('download-etag')
      expect(result.VersionId).toBe('v2')
    })

    it('should include range header when specified', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => Buffer.from('partial').buffer,
        headers: {
          get: () => null
        }
      })

      await s3.getObject({
        Bucket: 'test-bucket',
        Key: 'test-file.txt',
        Range: 'bytes=0-1023'
      })

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const headers = fetchCall[1].headers

      expect(headers.Range).toBe('bytes=0-1023')
    })

    it('should extract metadata from response', async () => {
      const mockHeaders = new Map([
        ['Content-Type', 'text/plain'],
        ['Content-Length', '10'],
        ['ETag', '"etag"'],
        ['Last-Modified', new Date().toUTCString()],
        ['x-amz-meta-user-id', '12345'],
        ['x-amz-meta-custom', 'value']
      ])

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => Buffer.from('test').buffer,
        headers: {
          get: (key: string) => mockHeaders.get(key) || null,
          forEach: (callback: any) => {
            mockHeaders.forEach((value, key) => callback(value, key))
          }
        }
      })

      const result = await s3.getObject({
        Bucket: 'test-bucket',
        Key: 'test-file.txt'
      })

      expect(result.Metadata).toBeDefined()
      expect(result.Metadata!['user-id']).toBe('12345')
      expect(result.Metadata!['custom']).toBe('value')
    })

    it('should throw error on failed download', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
        text: async () => 'Object not found'
      })

      await expect(
        s3.getObject({
          Bucket: 'test-bucket',
          Key: 'missing-file.txt'
        })
      ).rejects.toThrow('S3 getObject failed')
    })
  })

  // ============================================================================
  // deleteObject Tests
  // ============================================================================

  describe('deleteObject', () => {
    it('should delete object successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true
      })

      await s3.deleteObject({
        Bucket: 'test-bucket',
        Key: 'test-file.txt'
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      expect(fetchCall[0]).toContain('test-bucket/test-file.txt')
      expect(fetchCall[1].method).toBe('DELETE')
    })

    it('should delete versioned object', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true
      })

      await s3.deleteObject({
        Bucket: 'test-bucket',
        Key: 'test-file.txt',
        VersionId: 'v1'
      })

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      expect(fetchCall[0]).toContain('versionId=v1')
    })

    it('should throw error on failed deletion', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Forbidden',
        text: async () => 'Access denied'
      })

      await expect(
        s3.deleteObject({
          Bucket: 'test-bucket',
          Key: 'protected-file.txt'
        })
      ).rejects.toThrow('S3 deleteObject failed')
    })
  })

  // ============================================================================
  // listObjects Tests
  // ============================================================================

  describe('listObjects', () => {
    it('should list objects successfully', async () => {
      const xmlResponse = `
        <ListBucketResult>
          <IsTruncated>false</IsTruncated>
          <KeyCount>2</KeyCount>
          <Contents>
            <Key>file1.txt</Key>
            <Size>1024</Size>
            <LastModified>2025-01-01T00:00:00.000Z</LastModified>
            <ETag>"etag1"</ETag>
            <StorageClass>STANDARD</StorageClass>
          </Contents>
          <Contents>
            <Key>file2.txt</Key>
            <Size>2048</Size>
            <LastModified>2025-01-02T00:00:00.000Z</LastModified>
            <ETag>"etag2"</ETag>
            <StorageClass>STANDARD_IA</StorageClass>
          </Contents>
        </ListBucketResult>
      `

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => xmlResponse
      })

      const result = await s3.listObjects({
        Bucket: 'test-bucket',
        Prefix: 'files/'
      })

      expect(result.objects).toHaveLength(2)
      expect(result.objects[0].key).toBe('file1.txt')
      expect(result.objects[0].size).toBe(1024)
      expect(result.objects[1].key).toBe('file2.txt')
      expect(result.objects[1].size).toBe(2048)
      expect(result.isTruncated).toBe(false)
      expect(result.keyCount).toBe(2)
    })

    it('should include query parameters', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => '<ListBucketResult><IsTruncated>false</IsTruncated></ListBucketResult>'
      })

      await s3.listObjects({
        Bucket: 'test-bucket',
        Prefix: 'documents/',
        Delimiter: '/',
        MaxKeys: 100,
        StartAfter: 'file10.txt'
      })

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      expect(fetchCall[0]).toContain('prefix=documents%2F')
      expect(fetchCall[0]).toContain('delimiter=%2F')
      expect(fetchCall[0]).toContain('max-keys=100')
      expect(fetchCall[0]).toContain('start-after=file10.txt')
    })

    it('should throw error on failed list', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
        text: async () => 'Invalid request'
      })

      await expect(
        s3.listObjects({
          Bucket: 'test-bucket'
        })
      ).rejects.toThrow('S3 listObjects failed')
    })
  })

  // ============================================================================
  // headObject Tests
  // ============================================================================

  describe('headObject', () => {
    it('should get object metadata successfully', async () => {
      const mockHeaders = new Map([
        ['Content-Type', 'application/pdf'],
        ['Content-Length', '4096'],
        ['ETag', '"head-etag"'],
        ['Last-Modified', new Date('2025-01-01').toUTCString()],
        ['x-amz-version-id', 'v3'],
        ['x-amz-storage-class', 'GLACIER']
      ])

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: (key: string) => mockHeaders.get(key) || null,
          forEach: (callback: any) => {
            mockHeaders.forEach((value, key) => callback(value, key))
          }
        }
      })

      const result = await s3.headObject({
        Bucket: 'test-bucket',
        Key: 'document.pdf'
      })

      expect(result.ContentType).toBe('application/pdf')
      expect(result.ContentLength).toBe(4096)
      expect(result.ETag).toBe('head-etag')
      expect(result.VersionId).toBe('v3')
      expect(result.StorageClass).toBe('GLACIER')
    })

    it('should throw error if object not found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      })

      await expect(
        s3.headObject({
          Bucket: 'test-bucket',
          Key: 'missing.txt'
        })
      ).rejects.toThrow('S3 headObject failed')
    })
  })

  // ============================================================================
  // Presigned URL Tests
  // ============================================================================

  describe('getPresignedUrl', () => {
    it('should generate presigned URL for GET', async () => {
      const result = await s3.getPresignedUrl(
        'test-bucket',
        'document.pdf',
        {
          expiresIn: 3600,
          method: 'GET'
        }
      )

      expect(result.url).toContain('test-bucket/document.pdf')
      expect(result.url).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256')
      expect(result.url).toContain('X-Amz-Expires=3600')
      expect(result.url).toContain('X-Amz-Signature=')
      expect(result.method).toBe('GET')
      expect(result.expiresAt).toBeInstanceOf(Date)
    })

    it('should include response headers in presigned URL', async () => {
      const result = await s3.getPresignedUrl(
        'test-bucket',
        'file.txt',
        {
          expiresIn: 1800,
          method: 'GET',
          responseHeaders: {
            contentType: 'text/plain',
            contentDisposition: 'attachment; filename="file.txt"',
            cacheControl: 'no-cache'
          }
        }
      )

      expect(result.url).toContain('response-content-type=text%2Fplain')
      expect(result.url).toContain('response-content-disposition=')
      expect(result.url).toContain('response-cache-control=no-cache')
    })

    it('should include version ID in presigned URL', async () => {
      const result = await s3.getPresignedUrl(
        'test-bucket',
        'versioned-file.txt',
        {
          expiresIn: 3600,
          versionId: 'v5'
        }
      )

      expect(result.url).toContain('versionId=v5')
    })
  })

  // ============================================================================
  // Multipart Upload Tests
  // ============================================================================

  describe('Multipart Upload', () => {
    describe('createMultipartUpload', () => {
      it('should initiate multipart upload', async () => {
        const xmlResponse = `
          <InitiateMultipartUploadResult>
            <UploadId>test-upload-id-123</UploadId>
          </InitiateMultipartUploadResult>
        `

        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          text: async () => xmlResponse
        })

        const result = await s3.createMultipartUpload(
          'test-bucket',
          'large-file.bin'
        )

        expect(result.uploadId).toBe('test-upload-id-123')
        expect(result.bucket).toBe('test-bucket')
        expect(result.key).toBe('large-file.bin')
        expect(result.parts).toEqual([])
        expect(result.initiated).toBeInstanceOf(Date)
      })

      it('should include metadata in multipart upload', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          text: async () => '<InitiateMultipartUploadResult><UploadId>id</UploadId></InitiateMultipartUploadResult>'
        })

        await s3.createMultipartUpload(
          'test-bucket',
          'file.bin',
          {
            metadata: { 'user-id': '123' },
            storageClass: 'STANDARD_IA' as any
          }
        )

        const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
        const headers = fetchCall[1].headers

        expect(headers['x-amz-meta-user-id']).toBe('123')
        expect(headers['x-amz-storage-class']).toBe('STANDARD_IA')
      })
    })

    describe('uploadPart', () => {
      it('should upload part successfully', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          headers: {
            get: (key: string) => key === 'ETag' ? '"part-etag"' : null
          }
        })

        const partData = Buffer.from('part data', 'utf-8')

        const result = await s3.uploadPart(
          'test-bucket',
          'large-file.bin',
          'upload-id-123',
          1,
          partData
        )

        expect(result.partNumber).toBe(1)
        expect(result.etag).toBe('part-etag')
        expect(result.size).toBe(partData.length)
        expect(result.lastModified).toBeInstanceOf(Date)
      })
    })

    describe('completeMultipartUpload', () => {
      it('should complete multipart upload', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          headers: {
            get: (key: string) => key === 'ETag' ? '"complete-etag"' : null
          }
        })

        const parts = [
          { partNumber: 1, etag: 'etag1', size: 1024, lastModified: new Date() },
          { partNumber: 2, etag: 'etag2', size: 2048, lastModified: new Date() }
        ]

        const result = await s3.completeMultipartUpload(
          'test-bucket',
          'large-file.bin',
          'upload-id-123',
          parts
        )

        expect(result.etag).toBe('complete-etag')
        expect(result.size).toBe(3072) // 1024 + 2048
        expect(result.s3Key).toBe('large-file.bin')
      })
    })

    describe('abortMultipartUpload', () => {
      it('should abort multipart upload', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true
        })

        await s3.abortMultipartUpload(
          'test-bucket',
          'large-file.bin',
          'upload-id-123'
        )

        const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
        expect(fetchCall[0]).toContain('uploadId=upload-id-123')
        expect(fetchCall[1].method).toBe('DELETE')
      })
    })
  })

  // ============================================================================
  // Helper Methods Tests
  // ============================================================================

  describe('Helper Methods', () => {
    it('should build correct endpoint with SSL', () => {
      const sslConfig = { ...testConfig, useSSL: true, port: 443 }
      const sslS3 = new S3Module(mockSDK, sslConfig)

      const endpoint = (sslS3 as any).buildEndpoint()
      expect(endpoint).toBe('https://localhost:3001')
    })

    it('should build correct endpoint without SSL', () => {
      const endpoint = (s3 as any).buildEndpoint()
      expect(endpoint).toBe('http://localhost:3001')
    })

    it('should build correct endpoint with custom port', () => {
      const customPortConfig = { ...testConfig, port: 9000 }
      const customS3 = new S3Module(mockSDK, customPortConfig)

      const endpoint = (customS3 as any).buildEndpoint()
      expect(endpoint).toBe('http://localhost:3001:9000')
    })

    it('should calculate SHA256 hash correctly', () => {
      const data = 'test data'
      const hash = (s3 as any).calculateSHA256(Buffer.from(data))

      expect(hash).toBe('916f0027a575074ce72a331777c3478d6513f786a591bd892da1a577bf2335f9')
    })

    it('should generate AMZ date in correct format', () => {
      const amzDate = (s3 as any).getAmzDate()

      expect(amzDate).toMatch(/^\d{8}T\d{6}Z$/)
    })
  })
})
