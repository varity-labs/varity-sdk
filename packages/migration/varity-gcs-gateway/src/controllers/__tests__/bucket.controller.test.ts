/**
 * Bucket Controller Tests
 * Comprehensive tests for GCS bucket operations
 */

import { Request, Response } from 'express';
import { BucketController } from '../bucket.controller';
import { StorageService } from '../../services';
import { GCSBucket } from '../../types';

jest.mock('../../services');

describe('BucketController', () => {
  let controller: BucketController;
  let mockStorageService: jest.Mocked<StorageService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockStorageService = new StorageService({
      pinataApiKey: 'test',
      pinataSecretKey: 'test',
      ipfsGateway: 'test',
      litProtocolEnabled: false,
      celestiaDAEnabled: false
    }) as jest.Mocked<StorageService>;

    controller = new BucketController(mockStorageService);

    mockReq = {
      params: {},
      query: {},
      body: {}
    };

    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listBuckets', () => {
    const mockBucketList = {
      kind: 'storage#buckets',
      items: [
        { kind: 'storage#bucket', name: 'bucket1', id: 'bucket1' },
        { kind: 'storage#bucket', name: 'bucket2', id: 'bucket2' }
      ]
    };

    it('should list all buckets successfully', async () => {
      mockStorageService.listBuckets = jest.fn().mockResolvedValue(mockBucketList);

      await controller.listBuckets(mockReq as Request, mockRes as Response);

      expect(mockStorageService.listBuckets).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockBucketList);
    });

    it('should list buckets with project filter', async () => {
      mockReq.query = { project: 'test-project' };
      mockStorageService.listBuckets = jest.fn().mockResolvedValue(mockBucketList);

      await controller.listBuckets(mockReq as Request, mockRes as Response);

      expect(mockStorageService.listBuckets).toHaveBeenCalledWith('test-project', 1000);
      expect(mockRes.json).toHaveBeenCalledWith(mockBucketList);
    });

    it('should respect maxResults parameter', async () => {
      mockReq.query = { maxResults: '50' };
      mockStorageService.listBuckets = jest.fn().mockResolvedValue(mockBucketList);

      await controller.listBuckets(mockReq as Request, mockRes as Response);

      expect(mockStorageService.listBuckets).toHaveBeenCalledWith(undefined, 50);
    });

    it('should use default maxResults of 1000', async () => {
      mockStorageService.listBuckets = jest.fn().mockResolvedValue(mockBucketList);

      await controller.listBuckets(mockReq as Request, mockRes as Response);

      expect(mockStorageService.listBuckets).toHaveBeenCalledWith(undefined, 1000);
    });

    it('should handle errors gracefully', async () => {
      mockStorageService.listBuckets = jest.fn().mockRejectedValue(new Error('Service error'));

      await controller.listBuckets(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 500,
            message: 'Service error'
          })
        })
      );
    });

    it('should return empty list when no buckets exist', async () => {
      const emptyList = { kind: 'storage#buckets', items: [] };
      mockStorageService.listBuckets = jest.fn().mockResolvedValue(emptyList);

      await controller.listBuckets(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(emptyList);
    });

    it('should handle invalid maxResults parameter', async () => {
      mockReq.query = { maxResults: 'invalid' };
      mockStorageService.listBuckets = jest.fn().mockResolvedValue(mockBucketList);

      await controller.listBuckets(mockReq as Request, mockRes as Response);

      expect(mockStorageService.listBuckets).toHaveBeenCalledWith(undefined, NaN);
    });
  });

  describe('getBucket', () => {
    const mockBucket: GCSBucket = {
      kind: 'storage#bucket',
      id: 'test-bucket',
      name: 'test-bucket',
      timeCreated: '2024-01-01T00:00:00Z',
      updated: '2024-01-01T00:00:00Z',
      location: 'FILECOIN',
      storageClass: 'STANDARD',
      etag: 'abc123'
    };

    it('should get bucket successfully', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockStorageService.getBucket = jest.fn().mockResolvedValue(mockBucket);

      await controller.getBucket(mockReq as Request, mockRes as Response);

      expect(mockStorageService.getBucket).toHaveBeenCalledWith('test-bucket');
      expect(mockRes.json).toHaveBeenCalledWith(mockBucket);
    });

    it('should return 404 for non-existent bucket', async () => {
      mockReq.params = { bucket: 'non-existent' };
      mockStorageService.getBucket = jest.fn().mockResolvedValue(null);

      await controller.getBucket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 404,
            message: 'Bucket not found'
          })
        })
      );
    });

    it('should handle service errors', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockStorageService.getBucket = jest.fn().mockRejectedValue(new Error('Database error'));

      await controller.getBucket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle bucket names with special characters', async () => {
      mockReq.params = { bucket: 'test-bucket-123_special' };
      mockStorageService.getBucket = jest.fn().mockResolvedValue(mockBucket);

      await controller.getBucket(mockReq as Request, mockRes as Response);

      expect(mockStorageService.getBucket).toHaveBeenCalledWith('test-bucket-123_special');
    });
  });

  describe('createBucket', () => {
    const mockBucket: GCSBucket = {
      kind: 'storage#bucket',
      id: 'new-bucket',
      name: 'new-bucket',
      timeCreated: '2024-01-01T00:00:00Z',
      updated: '2024-01-01T00:00:00Z',
      location: 'FILECOIN',
      storageClass: 'STANDARD',
      etag: 'abc123'
    };

    it('should create bucket successfully', async () => {
      mockReq.query = { project: 'test-project' };
      mockReq.body = { name: 'new-bucket' };
      mockStorageService.createBucket = jest.fn().mockResolvedValue(mockBucket);

      await controller.createBucket(mockReq as Request, mockRes as Response);

      expect(mockStorageService.createBucket).toHaveBeenCalledWith('new-bucket', 'FILECOIN', 'STANDARD');
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockBucket);
    });

    it('should return 400 when bucket name is missing', async () => {
      mockReq.body = {};

      await controller.createBucket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Bucket name is required'
          })
        })
      );
    });

    it('should create bucket with custom location', async () => {
      mockReq.body = { name: 'new-bucket', location: 'US-EAST1' };
      mockStorageService.createBucket = jest.fn().mockResolvedValue(mockBucket);

      await controller.createBucket(mockReq as Request, mockRes as Response);

      expect(mockStorageService.createBucket).toHaveBeenCalledWith('new-bucket', 'US-EAST1', 'STANDARD');
    });

    it('should create bucket with custom storage class', async () => {
      mockReq.body = { name: 'new-bucket', storageClass: 'COLDLINE' };
      mockStorageService.createBucket = jest.fn().mockResolvedValue(mockBucket);

      await controller.createBucket(mockReq as Request, mockRes as Response);

      expect(mockStorageService.createBucket).toHaveBeenCalledWith('new-bucket', 'FILECOIN', 'COLDLINE');
    });

    it('should return 409 for duplicate bucket', async () => {
      mockReq.body = { name: 'existing-bucket' };
      mockStorageService.createBucket = jest.fn().mockRejectedValue(new Error('Bucket already exists'));

      await controller.createBucket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it('should validate bucket naming conventions', async () => {
      mockReq.body = { name: 'valid-bucket-name-123' };
      mockStorageService.createBucket = jest.fn().mockResolvedValue(mockBucket);

      await controller.createBucket(mockReq as Request, mockRes as Response);

      expect(mockStorageService.createBucket).toHaveBeenCalled();
    });

    it('should handle null name gracefully', async () => {
      mockReq.body = { name: null };

      await controller.createBucket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle empty string name', async () => {
      mockReq.body = { name: '' };

      await controller.createBucket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteBucket', () => {
    it('should delete bucket successfully', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockStorageService.deleteBucket = jest.fn().mockResolvedValue(true);

      await controller.deleteBucket(mockReq as Request, mockRes as Response);

      expect(mockStorageService.deleteBucket).toHaveBeenCalledWith('test-bucket');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should return 404 for non-existent bucket', async () => {
      mockReq.params = { bucket: 'non-existent' };
      mockStorageService.deleteBucket = jest.fn().mockResolvedValue(false);

      await controller.deleteBucket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 409 for non-empty bucket', async () => {
      mockReq.params = { bucket: 'non-empty-bucket' };
      mockStorageService.deleteBucket = jest.fn().mockRejectedValue(new Error('Bucket is not empty'));

      await controller.deleteBucket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it('should handle service errors during deletion', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockStorageService.deleteBucket = jest.fn().mockRejectedValue(new Error('Service unavailable'));

      await controller.deleteBucket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle bucket with special characters', async () => {
      mockReq.params = { bucket: 'test-bucket_123-special' };
      mockStorageService.deleteBucket = jest.fn().mockResolvedValue(true);

      await controller.deleteBucket(mockReq as Request, mockRes as Response);

      expect(mockStorageService.deleteBucket).toHaveBeenCalledWith('test-bucket_123-special');
    });
  });

  describe('Error Handling', () => {
    it('should create proper error response structure', async () => {
      mockReq.params = { bucket: 'test' };
      mockStorageService.getBucket = jest.fn().mockRejectedValue(new Error('Test error'));

      await controller.getBucket(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: expect.any(Number),
            message: expect.any(String),
            errors: expect.arrayContaining([
              expect.objectContaining({
                domain: 'global',
                reason: expect.any(String),
                message: expect.any(String)
              })
            ])
          })
        })
      );
    });

    it('should log errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockReq.params = { bucket: 'test' };
      mockStorageService.getBucket = jest.fn().mockRejectedValue(new Error('Test error'));

      await controller.getBucket(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle errors without message property', async () => {
      mockReq.params = { bucket: 'test' };
      mockStorageService.getBucket = jest.fn().mockRejectedValue({});

      await controller.getBucket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Internal server error'
          })
        })
      );
    });
  });
});
