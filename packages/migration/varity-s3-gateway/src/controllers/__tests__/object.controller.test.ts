import { Request, Response } from 'express';
import { ObjectController } from '../object.controller';
import { BucketController } from '../bucket.controller';

// Mock dependencies
jest.mock('../../services/storage.service');
jest.mock('../../utils/xml-builder', () => ({
  buildXMLErrorResponse: jest.fn((code, message) =>
    `<Error><Code>${code}</Code><Message>${message}</Message></Error>`
  ),
  buildListObjectsV2Response: jest.fn(() => '<ListObjects></ListObjects>'),
  generateRequestId: jest.fn(() => 'test-request-id')
}));
jest.mock('../../utils/etag', () => ({
  generateETag: jest.fn(() => '"abc123"'),
  checkETagConditions: jest.fn(() => ({ match: true, statusCode: 200 }))
}));

import { StorageService } from '../../services/storage.service';

describe('ObjectController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockStorageService: jest.Mocked<StorageService>;
  let responseData: any;

  beforeEach(async () => {
    responseData = null;

    mockRequest = {
      params: {},
      headers: {},
      body: null,
      query: {},
      path: '',
      method: 'GET',
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

    // Setup storage service mock
    mockStorageService = new StorageService() as jest.Mocked<StorageService>;
    mockStorageService.putObject = jest.fn().mockResolvedValue({
      cid: 'Qmtest',
      hash: 'abc123',
      size: 1024,
      timestamp: new Date()
    });
    mockStorageService.getObject = jest.fn().mockResolvedValue(Buffer.from('test data'));
    mockStorageService.getObjectMetadata = jest.fn().mockResolvedValue({
      bucket: 'test-bucket',
      key: 'test-key',
      contentType: 'text/plain',
      contentLength: 9,
      etag: '"abc123"',
      lastModified: new Date()
    });
    mockStorageService.deleteObject = jest.fn().mockResolvedValue(undefined);
    mockStorageService.listObjects = jest.fn().mockResolvedValue({
      objects: [],
      isTruncated: false
    });
    mockStorageService.copyObject = jest.fn().mockResolvedValue({
      cid: 'Qmcopy',
      hash: 'def456',
      size: 1024,
      timestamp: new Date()
    });

    // Create a test bucket
    const bucketRequest = { params: { bucket: 'test-bucket' }, awsAuth: mockRequest.awsAuth } as any;
    await BucketController.createBucket(bucketRequest, mockResponse as Response);
    jest.clearAllMocks();
  });

  describe('putObject()', () => {
    beforeEach(() => {
      mockRequest.params = { bucket: 'test-bucket', key: 'test-key.txt' };
      mockRequest.body = Buffer.from('test content');
      mockRequest.headers = { 'content-type': 'text/plain' };
    });

    it('should upload object successfully', async () => {
      await ObjectController.putObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.set).toHaveBeenCalledWith('ETag', expect.stringContaining('"'));
      expect(mockResponse.set).toHaveBeenCalledWith('x-amz-request-id', expect.any(String));
    });

    it('should return 404 for non-existent bucket', async () => {
      mockRequest.params = { bucket: 'non-existent', key: 'test.txt' };

      await ObjectController.putObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData).toContain('NoSuchBucket');
    });

    it('should extract metadata from headers', async () => {
      mockRequest.headers = {
        'content-type': 'application/json',
        'x-amz-meta-author': 'John Doe',
        'x-amz-meta-version': '1.0'
      };

      await ObjectController.putObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle nested key paths', async () => {
      mockRequest.params = { bucket: 'test-bucket', key: 'path/to/file.txt' };

      await ObjectController.putObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle storage errors', async () => {
      mockStorageService.putObject = jest.fn().mockRejectedValue(new Error('Storage error'));

      await ObjectController.putObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData).toContain('InternalError');
    });
  });

  describe('getObject()', () => {
    beforeEach(() => {
      mockRequest.params = { bucket: 'test-bucket', key: 'test-key.txt' };
    });

    it('should download object successfully', async () => {
      await ObjectController.getObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.set).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(mockResponse.set).toHaveBeenCalledWith('ETag', expect.any(String));
      expect(mockResponse.send).toHaveBeenCalledWith(expect.any(Buffer));
    });

    it('should return 404 for non-existent bucket', async () => {
      mockRequest.params = { bucket: 'non-existent', key: 'test.txt' };

      await ObjectController.getObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData).toContain('NoSuchBucket');
    });

    it('should return 404 for non-existent key', async () => {
      mockStorageService.getObjectMetadata = jest.fn().mockRejectedValue(new Error('NoSuchKey'));

      await ObjectController.getObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData).toContain('NoSuchKey');
    });

    it('should include custom metadata in response headers', async () => {
      mockStorageService.getObjectMetadata = jest.fn().mockResolvedValue({
        bucket: 'test-bucket',
        key: 'test-key',
        contentType: 'text/plain',
        contentLength: 9,
        etag: '"abc123"',
        lastModified: new Date(),
        customMetadata: {
          author: 'John Doe',
          version: '1.0'
        }
      });

      await ObjectController.getObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.set).toHaveBeenCalledWith('x-amz-meta-author', 'John Doe');
      expect(mockResponse.set).toHaveBeenCalledWith('x-amz-meta-version', '1.0');
    });

    it('should handle If-Match header', async () => {
      mockRequest.headers = { 'if-match': '"abc123"' };

      await ObjectController.getObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle If-None-Match header with 304 response', async () => {
      const { checkETagConditions } = require('../../utils/etag');
      checkETagConditions.mockReturnValue({ match: false, statusCode: 304 });

      mockRequest.headers = { 'if-none-match': '"abc123"' };

      await ObjectController.getObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(304);
    });

    it('should handle storage errors', async () => {
      mockStorageService.getObject = jest.fn().mockRejectedValue(new Error('Storage error'));

      await ObjectController.getObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteObject()', () => {
    beforeEach(() => {
      mockRequest.params = { bucket: 'test-bucket', key: 'test-key.txt' };
    });

    it('should delete object successfully', async () => {
      await ObjectController.deleteObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.set).toHaveBeenCalledWith('x-amz-request-id', expect.any(String));
    });

    it('should return 404 for non-existent bucket', async () => {
      mockRequest.params = { bucket: 'non-existent', key: 'test.txt' };

      await ObjectController.deleteObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData).toContain('NoSuchBucket');
    });

    it('should handle deletion of non-existent key (S3 returns 204)', async () => {
      await ObjectController.deleteObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(204);
    });

    it('should handle storage errors', async () => {
      mockStorageService.deleteObject = jest.fn().mockRejectedValue(new Error('Storage error'));

      await ObjectController.deleteObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('headObject()', () => {
    beforeEach(() => {
      mockRequest.params = { bucket: 'test-bucket', key: 'test-key.txt' };
    });

    it('should return object metadata', async () => {
      await ObjectController.headObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.set).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(mockResponse.set).toHaveBeenCalledWith('Content-Length', '9');
      expect(mockResponse.set).toHaveBeenCalledWith('ETag', expect.any(String));
    });

    it('should return 404 for non-existent bucket', async () => {
      mockRequest.params = { bucket: 'non-existent', key: 'test.txt' };

      await ObjectController.headObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 for non-existent key', async () => {
      mockStorageService.getObjectMetadata = jest.fn().mockRejectedValue(new Error('NoSuchKey'));

      await ObjectController.headObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should include custom metadata in headers', async () => {
      mockStorageService.getObjectMetadata = jest.fn().mockResolvedValue({
        bucket: 'test-bucket',
        key: 'test-key',
        contentType: 'text/plain',
        contentLength: 9,
        etag: '"abc123"',
        lastModified: new Date(),
        customMetadata: {
          tag: 'important'
        }
      });

      await ObjectController.headObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.set).toHaveBeenCalledWith('x-amz-meta-tag', 'important');
    });

    it('should handle storage errors', async () => {
      mockStorageService.getObjectMetadata = jest.fn().mockRejectedValue(new Error('Storage error'));

      await ObjectController.headObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('listObjects()', () => {
    beforeEach(() => {
      mockRequest.params = { bucket: 'test-bucket' };
      mockRequest.query = {};
    });

    it('should list objects successfully', async () => {
      mockStorageService.listObjects = jest.fn().mockResolvedValue({
        objects: [
          { key: 'file1.txt', size: 100, etag: '"e1"', lastModified: new Date(), storageClass: 'STANDARD' }
        ],
        isTruncated: false
      });

      await ObjectController.listObjects(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.set).toHaveBeenCalledWith('Content-Type', 'application/xml');
    });

    it('should handle prefix parameter', async () => {
      mockRequest.query = { prefix: 'folder/' };

      await ObjectController.listObjects(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle max-keys parameter', async () => {
      mockRequest.query = { 'max-keys': '50' };

      await ObjectController.listObjects(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle pagination with continuation token', async () => {
      mockRequest.query = { 'continuation-token': 'token123' };
      mockStorageService.listObjects = jest.fn().mockResolvedValue({
        objects: [],
        isTruncated: true,
        nextContinuationToken: 'token456'
      });

      await ObjectController.listObjects(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent bucket', async () => {
      mockRequest.params = { bucket: 'non-existent' };

      await ObjectController.listObjects(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData).toContain('NoSuchBucket');
    });

    it('should handle storage errors', async () => {
      mockStorageService.listObjects = jest.fn().mockRejectedValue(new Error('Storage error'));

      await ObjectController.listObjects(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('copyObject()', () => {
    beforeEach(() => {
      mockRequest.params = { bucket: 'test-bucket', key: 'dest-key.txt' };
      mockRequest.headers = { 'x-amz-copy-source': '/source-bucket/source-key.txt' };
    });

    it('should copy object successfully', async () => {
      // Create source bucket
      const sourceBucketRequest = { params: { bucket: 'source-bucket' }, awsAuth: mockRequest.awsAuth } as any;
      await BucketController.createBucket(sourceBucketRequest, mockResponse as Response);
      jest.clearAllMocks();

      await ObjectController.copyObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.set).toHaveBeenCalledWith('x-amz-request-id', expect.any(String));
    });

    it('should return 400 when copy source header is missing', async () => {
      mockRequest.headers = {};

      await ObjectController.copyObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData).toContain('InvalidArgument');
    });

    it('should return 404 for non-existent source bucket', async () => {
      mockRequest.headers = { 'x-amz-copy-source': '/non-existent/key.txt' };

      await ObjectController.copyObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData).toContain('NoSuchBucket');
    });

    it('should return 404 for non-existent destination bucket', async () => {
      const sourceBucketRequest = { params: { bucket: 'source-bucket' }, awsAuth: mockRequest.awsAuth } as any;
      await BucketController.createBucket(sourceBucketRequest, mockResponse as Response);
      jest.clearAllMocks();

      mockRequest.params = { bucket: 'non-existent-dest', key: 'dest-key.txt' };

      await ObjectController.copyObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData).toContain('NoSuchBucket');
    });

    it('should handle copy within same bucket', async () => {
      mockRequest.headers = { 'x-amz-copy-source': '/test-bucket/source-key.txt' };

      await ObjectController.copyObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle storage errors', async () => {
      const sourceBucketRequest = { params: { bucket: 'source-bucket' }, awsAuth: mockRequest.awsAuth } as any;
      await BucketController.createBucket(sourceBucketRequest, mockResponse as Response);
      jest.clearAllMocks();

      mockStorageService.copyObject = jest.fn().mockRejectedValue(new Error('Copy error'));

      await ObjectController.copyObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});
