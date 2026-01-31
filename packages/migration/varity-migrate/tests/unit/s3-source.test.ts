import { S3SourceService } from '../../src/services/s3-source.service';
import { S3Client } from '@aws-sdk/client-s3';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');

describe('S3SourceService', () => {
  let service: S3SourceService;
  let mockS3Client: jest.Mocked<S3Client>;

  beforeEach(() => {
    mockS3Client = new S3Client({}) as jest.Mocked<S3Client>;
    service = new S3SourceService({
      bucket: 'test-bucket',
      region: 'us-east-1'
    });
  });

  describe('constructor', () => {
    it('should create service with bucket name', () => {
      expect(service.getBucketName()).toBe('test-bucket');
    });
  });

  describe('listObjects', () => {
    it('should handle empty bucket', async () => {
      mockS3Client.send = jest.fn().mockResolvedValue({ Contents: [] });
      (service as any).client = mockS3Client;

      const objects = await service.listObjects();

      expect(objects.length).toBe(0);
    });

    it('should list objects without prefix', async () => {
      mockS3Client.send = jest.fn().mockResolvedValue({
        Contents: [
          { Key: 'file1.txt', Size: 100, ETag: 'etag1', LastModified: new Date() },
          { Key: 'file2.txt', Size: 200, ETag: 'etag2', LastModified: new Date() }
        ]
      });
      (service as any).client = mockS3Client;

      const objects = await service.listObjects();

      expect(objects.length).toBe(2);
      expect(objects[0].key).toBe('file1.txt');
      expect(objects[0].size).toBe(100);
    });

    it('should handle pagination', async () => {
      mockS3Client.send = jest
        .fn()
        .mockResolvedValueOnce({
          Contents: [{ Key: 'file1.txt', Size: 100, ETag: 'etag1', LastModified: new Date() }],
          NextContinuationToken: 'token1'
        })
        .mockResolvedValueOnce({
          Contents: [{ Key: 'file2.txt', Size: 200, ETag: 'etag2', LastModified: new Date() }]
        });
      (service as any).client = mockS3Client;

      const objects = await service.listObjects();

      expect(objects.length).toBe(2);
      expect(mockS3Client.send).toHaveBeenCalledTimes(2);
    });

    it('should filter by prefix', async () => {
      mockS3Client.send = jest.fn().mockResolvedValue({
        Contents: [{ Key: 'data/file1.txt', Size: 100, ETag: 'etag1', LastModified: new Date() }]
      });
      (service as any).client = mockS3Client;

      const objects = await service.listObjects('data/');

      expect(objects.length).toBe(1);
      expect(objects[0].key).toContain('data/');
    });
  });

  describe('getObject', () => {
    it('should download object data', async () => {
      const mockBody = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('test data');
        }
      };

      mockS3Client.send = jest.fn().mockResolvedValue({ Body: mockBody });
      (service as any).client = mockS3Client;

      const data = await service.getObject('test.txt');

      expect(data).toBeInstanceOf(Buffer);
      expect(data.toString()).toBe('test data');
    });

    it('should throw error for missing object', async () => {
      mockS3Client.send = jest.fn().mockResolvedValue({ Body: null });
      (service as any).client = mockS3Client;

      await expect(service.getObject('missing.txt')).rejects.toThrow('No data returned');
    });
  });

  describe('getObjectMetadata', () => {
    it('should retrieve object metadata', async () => {
      mockS3Client.send = jest.fn().mockResolvedValue({
        ContentLength: 1024,
        ETag: 'etag123',
        LastModified: new Date('2024-01-01'),
        ContentType: 'text/plain',
        Metadata: { custom: 'value' }
      });
      (service as any).client = mockS3Client;

      const metadata = await service.getObjectMetadata('test.txt');

      expect(metadata.key).toBe('test.txt');
      expect(metadata.size).toBe(1024);
      expect(metadata.contentType).toBe('text/plain');
      expect(metadata.metadata?.custom).toBe('value');
    });
  });

  describe('getTotalSize', () => {
    it('should calculate total size of all objects', async () => {
      mockS3Client.send = jest.fn().mockResolvedValue({
        Contents: [
          { Key: 'file1.txt', Size: 100, ETag: 'etag1', LastModified: new Date() },
          { Key: 'file2.txt', Size: 200, ETag: 'etag2', LastModified: new Date() },
          { Key: 'file3.txt', Size: 300, ETag: 'etag3', LastModified: new Date() }
        ]
      });
      (service as any).client = mockS3Client;

      const totalSize = await service.getTotalSize();

      expect(totalSize).toBe(600);
    });
  });
});
