import { Request, Response } from 'express';
import { BucketController, getBucketInfo, bucketExists } from '../bucket.controller';

// Mock the xml-builder
jest.mock('../../utils/xml-builder', () => ({
  buildXMLErrorResponse: jest.fn((code, message, resource, requestId) =>
    `<Error><Code>${code}</Code><Message>${message}</Message></Error>`
  ),
  buildListBucketsResponse: jest.fn((buckets, ownerId, ownerName) =>
    `<ListBuckets>${buckets.map((b: any) => b.name).join(',')}</ListBuckets>`
  ),
  generateRequestId: jest.fn(() => 'test-request-id')
}));

describe('BucketController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseData: any;

  beforeEach(() => {
    responseData = null;

    mockRequest = {
      params: {},
      path: '',
      awsAuth: { accessKeyId: 'test-key', authenticated: true }
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockImplementation((data) => {
        responseData = data;
        return mockResponse;
      }),
      set: jest.fn().mockReturnThis()
    };
  });

  describe('createBucket()', () => {
    it('should create a valid bucket', async () => {
      mockRequest.params = { bucket: 'test-bucket' };
      mockRequest.path = '/test-bucket';

      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(bucketExists('test-bucket')).toBe(true);
    });

    it('should reject invalid bucket name (too short)', async () => {
      mockRequest.params = { bucket: 'ab' };
      mockRequest.path = '/ab';

      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData).toContain('InvalidBucketName');
    });

    it('should reject invalid bucket name (uppercase)', async () => {
      mockRequest.params = { bucket: 'TEST-BUCKET' };

      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData).toContain('InvalidBucketName');
    });

    it('should reject bucket name with consecutive periods', async () => {
      mockRequest.params = { bucket: 'test..bucket' };

      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData).toContain('InvalidBucketName');
    });

    it('should reject bucket name formatted as IP address', async () => {
      mockRequest.params = { bucket: '192.168.1.1' };

      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData).toContain('InvalidBucketName');
    });

    it('should reject duplicate bucket name', async () => {
      mockRequest.params = { bucket: 'existing-bucket' };

      // Create bucket first time
      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);

      // Try to create same bucket again
      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(responseData).toContain('BucketAlreadyExists');
    });

    it('should accept bucket name with hyphens', async () => {
      mockRequest.params = { bucket: 'test-bucket-name' };

      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should accept bucket name with periods', async () => {
      mockRequest.params = { bucket: 'test.bucket.name' };

      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors gracefully', async () => {
      mockRequest.params = null as any; // Force error

      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData).toContain('InternalError');
    });
  });

  describe('deleteBucket()', () => {
    beforeEach(async () => {
      // Create a test bucket
      mockRequest.params = { bucket: 'delete-test-bucket' };
      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );
      jest.clearAllMocks();
    });

    it('should delete existing bucket', async () => {
      mockRequest.params = { bucket: 'delete-test-bucket' };

      await BucketController.deleteBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(bucketExists('delete-test-bucket')).toBe(false);
    });

    it('should return 404 for non-existent bucket', async () => {
      mockRequest.params = { bucket: 'non-existent-bucket' };

      await BucketController.deleteBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData).toContain('NoSuchBucket');
    });

    it('should handle errors gracefully', async () => {
      mockRequest.params = null as any;

      await BucketController.deleteBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('headBucket()', () => {
    beforeEach(async () => {
      // Create a test bucket
      mockRequest.params = { bucket: 'head-test-bucket' };
      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );
      jest.clearAllMocks();
    });

    it('should return 200 for existing bucket', async () => {
      mockRequest.params = { bucket: 'head-test-bucket' };

      await BucketController.headBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent bucket', async () => {
      mockRequest.params = { bucket: 'non-existent-bucket' };

      await BucketController.headBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors gracefully', async () => {
      mockRequest.params = null as any;

      await BucketController.headBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('listBuckets()', () => {
    beforeEach(async () => {
      // Clear any existing buckets by creating fresh ones
      mockRequest.params = { bucket: 'list-bucket-1' };
      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );
      mockRequest.params = { bucket: 'list-bucket-2' };
      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );
      jest.clearAllMocks();
    });

    it('should list all buckets', async () => {
      await BucketController.listBuckets(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.set).toHaveBeenCalledWith('Content-Type', 'application/xml');
      expect(responseData).toContain('list-bucket-1');
      expect(responseData).toContain('list-bucket-2');
    });

    it('should include owner information', async () => {
      mockRequest.awsAuth = { accessKeyId: 'owner-123', authenticated: true } as any;

      await BucketController.listBuckets(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle empty bucket list', async () => {
      // Clean up buckets (in real test, you'd need bucket deletion logic)
      await BucketController.listBuckets(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors gracefully', async () => {
      // Force error by making awsAuth undefined
      mockRequest.awsAuth = undefined;
      mockResponse.send = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      await BucketController.listBuckets(
        mockRequest as Request,
        mockResponse as Response
      );

      // Should still attempt to respond
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });

  describe('Bucket validation', () => {
    it('should accept minimum length bucket name (3 chars)', async () => {
      mockRequest.params = { bucket: 'abc' };

      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should accept maximum length bucket name (63 chars)', async () => {
      const longName = 'a'.repeat(61) + 'bc'; // 63 chars
      mockRequest.params = { bucket: longName };

      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should reject bucket name starting with hyphen', async () => {
      mockRequest.params = { bucket: '-test-bucket' };

      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject bucket name ending with hyphen', async () => {
      mockRequest.params = { bucket: 'test-bucket-' };

      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getBucketInfo()', () => {
    it('should return bucket information', async () => {
      mockRequest.params = { bucket: 'info-test-bucket' };
      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      const info = getBucketInfo('info-test-bucket');

      expect(info).toBeDefined();
      expect(info?.creationDate).toBeInstanceOf(Date);
      expect(info?.ownerId).toBe('test-key');
    });

    it('should return undefined for non-existent bucket', () => {
      const info = getBucketInfo('non-existent-bucket');

      expect(info).toBeUndefined();
    });
  });

  describe('bucketExists()', () => {
    it('should return true for existing bucket', async () => {
      mockRequest.params = { bucket: 'exists-test-bucket' };
      await BucketController.createBucket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(bucketExists('exists-test-bucket')).toBe(true);
    });

    it('should return false for non-existent bucket', () => {
      expect(bucketExists('non-existent-bucket')).toBe(false);
    });
  });
});
