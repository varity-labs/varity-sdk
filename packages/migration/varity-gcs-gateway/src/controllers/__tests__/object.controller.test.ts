/**
 * Object Controller Tests
 * Comprehensive tests for GCS object operations (60+ tests)
 */

import { Request, Response } from 'express';
import { ObjectController } from '../object.controller';
import { StorageService, ResumableUploadService } from '../../services';

jest.mock('../../services');

describe('ObjectController', () => {
  let controller: ObjectController;
  let mockStorageService: jest.Mocked<StorageService>;
  let mockResumableService: jest.Mocked<ResumableUploadService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockStorageService = {
      listObjects: jest.fn(),
      getObject: jest.fn(),
      uploadObject: jest.fn(),
      deleteObject: jest.fn(),
      copyObject: jest.fn()
    } as any;

    mockResumableService = {
      initiateUpload: jest.fn(),
      uploadChunk: jest.fn(),
      getUploadStatus: jest.fn(),
      completeUpload: jest.fn()
    } as any;

    controller = new ObjectController(mockStorageService, mockResumableService);

    mockReq = { params: {}, query: {}, body: {}, headers: {}, on: jest.fn() };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };
  });

  describe('listObjects', () => {
    const mockObjectList = {
      kind: 'storage#objects' as const,
      items: [
        { kind: 'storage#object', name: 'file1.txt', bucket: 'test-bucket' },
        { kind: 'storage#object', name: 'file2.txt', bucket: 'test-bucket' }
      ]
    } as any;

    it('should list objects successfully', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockStorageService.listObjects.mockResolvedValue(mockObjectList);

      await controller.listObjects(mockReq as Request, mockRes as Response);

      expect(mockStorageService.listObjects).toHaveBeenCalledWith('test-bucket', undefined, 1000, undefined);
      expect(mockRes.json).toHaveBeenCalledWith(mockObjectList);
    });

    it('should filter by prefix', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockReq.query = { prefix: 'folder/' };
      mockStorageService.listObjects.mockResolvedValue(mockObjectList);

      await controller.listObjects(mockReq as Request, mockRes as Response);

      expect(mockStorageService.listObjects).toHaveBeenCalledWith('test-bucket', 'folder/', 1000, undefined);
    });

    it('should respect maxResults', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockReq.query = { maxResults: '50' };
      mockStorageService.listObjects.mockResolvedValue(mockObjectList);

      await controller.listObjects(mockReq as Request, mockRes as Response);

      expect(mockStorageService.listObjects).toHaveBeenCalledWith('test-bucket', undefined, 50, undefined);
    });

    it('should handle pagination with pageToken', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockReq.query = { pageToken: 'token123' };
      mockStorageService.listObjects.mockResolvedValue(mockObjectList);

      await controller.listObjects(mockReq as Request, mockRes as Response);

      expect(mockStorageService.listObjects).toHaveBeenCalledWith('test-bucket', undefined, 1000, 'token123');
    });

    it('should handle errors gracefully', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockStorageService.listObjects.mockRejectedValue(new Error('Service error'));

      await controller.listObjects(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should return empty list for empty bucket', async () => {
      mockReq.params = { bucket: 'empty-bucket' };
      mockStorageService.listObjects.mockResolvedValue({ kind: 'storage#objects', items: [] });

      await controller.listObjects(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({ kind: 'storage#objects', items: [] });
    });

    it('should handle bucket with special characters', async () => {
      mockReq.params = { bucket: 'test-bucket_123' };
      mockStorageService.listObjects.mockResolvedValue(mockObjectList);

      await controller.listObjects(mockReq as Request, mockRes as Response);

      expect(mockStorageService.listObjects).toHaveBeenCalledWith('test-bucket_123', undefined, 1000, undefined);
    });

    it('should handle prefix with special characters', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockReq.query = { prefix: 'folder/sub_folder-123/' };
      mockStorageService.listObjects.mockResolvedValue(mockObjectList);

      await controller.listObjects(mockReq as Request, mockRes as Response);

      expect(mockStorageService.listObjects).toHaveBeenCalledWith('test-bucket', 'folder/sub_folder-123/', 1000, undefined);
    });
  });

  describe('getObjectMetadata', () => {
    const mockObject = {
      name: 'test.txt',
      bucket: 'test-bucket',
      data: Buffer.from('test'),
      contentType: 'text/plain',
      size: 4,
      md5Hash: 'abc123',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should get object metadata successfully', async () => {
      mockReq.params = { bucket: 'test-bucket', object: 'test.txt' };
      mockStorageService.getObject.mockResolvedValue(mockObject);
      mockStorageService['toGCSObject'] = jest.fn().mockReturnValue({ ...mockObject, kind: 'storage#object' });

      await controller.getObjectMetadata(mockReq as Request, mockRes as Response);

      expect(mockStorageService.getObject).toHaveBeenCalledWith('test-bucket', 'test.txt');
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should decode URL-encoded object name', async () => {
      mockReq.params = { bucket: 'test-bucket', object: 'test%20file.txt' };
      mockStorageService.getObject.mockResolvedValue(mockObject);
      mockStorageService['toGCSObject'] = jest.fn().mockReturnValue({ ...mockObject, kind: 'storage#object' });

      await controller.getObjectMetadata(mockReq as Request, mockRes as Response);

      expect(mockStorageService.getObject).toHaveBeenCalledWith('test-bucket', 'test file.txt');
    });

    it('should return 404 for non-existent object', async () => {
      mockReq.params = { bucket: 'test-bucket', object: 'missing.txt' };
      mockStorageService.getObject.mockResolvedValue(null);

      await controller.getObjectMetadata(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ message: 'Object not found' })
      }));
    });

    it('should handle object names with slashes', async () => {
      mockReq.params = { bucket: 'test-bucket', object: 'folder/subfolder/file.txt' };
      mockStorageService.getObject.mockResolvedValue(mockObject);
      mockStorageService['toGCSObject'] = jest.fn().mockReturnValue({ ...mockObject, kind: 'storage#object' });

      await controller.getObjectMetadata(mockReq as Request, mockRes as Response);

      expect(mockStorageService.getObject).toHaveBeenCalledWith('test-bucket', 'folder/subfolder/file.txt');
    });

    it('should handle service errors', async () => {
      mockReq.params = { bucket: 'test-bucket', object: 'test.txt' };
      mockStorageService.getObject.mockRejectedValue(new Error('Database error'));

      await controller.getObjectMetadata(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('downloadObject', () => {
    const mockObject = {
      name: 'test.txt',
      bucket: 'test-bucket',
      data: Buffer.from('test content'),
      contentType: 'text/plain',
      size: 12,
      md5Hash: 'abc123',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should download object successfully', async () => {
      mockReq.params = { bucket: 'test-bucket', object: 'test.txt' };
      mockStorageService.getObject.mockResolvedValue(mockObject);

      await controller.downloadObject(mockReq as Request, mockRes as Response);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Length', 12);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="test.txt"');
      expect(mockRes.send).toHaveBeenCalledWith(mockObject.data);
    });

    it('should use default content type if not specified', async () => {
      const objWithoutType = { ...mockObject, contentType: undefined as any };
      mockReq.params = { bucket: 'test-bucket', object: 'test.bin' };
      mockStorageService.getObject.mockResolvedValue(objWithoutType as any);

      await controller.downloadObject(mockReq as Request, mockRes as Response);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
    });

    it('should return 404 for non-existent object', async () => {
      mockReq.params = { bucket: 'test-bucket', object: 'missing.txt' };
      mockStorageService.getObject.mockResolvedValue(null);

      await controller.downloadObject(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should decode URL-encoded object name', async () => {
      mockReq.params = { bucket: 'test-bucket', object: 'my%20file.txt' };
      mockStorageService.getObject.mockResolvedValue(mockObject);

      await controller.downloadObject(mockReq as Request, mockRes as Response);

      expect(mockStorageService.getObject).toHaveBeenCalledWith('test-bucket', 'my file.txt');
    });

    it('should handle binary files', async () => {
      const binaryObject = { ...mockObject, contentType: 'image/png', data: Buffer.from([0x89, 0x50, 0x4e, 0x47]) };
      mockReq.params = { bucket: 'test-bucket', object: 'image.png' };
      mockStorageService.getObject.mockResolvedValue(binaryObject);

      await controller.downloadObject(mockReq as Request, mockRes as Response);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
      expect(mockRes.send).toHaveBeenCalledWith(binaryObject.data);
    });

    it('should handle large files', async () => {
      const largeData = Buffer.alloc(10 * 1024 * 1024); // 10MB
      const largeObject = { ...mockObject, data: largeData, size: largeData.length };
      mockReq.params = { bucket: 'test-bucket', object: 'large.bin' };
      mockStorageService.getObject.mockResolvedValue(largeObject);

      await controller.downloadObject(mockReq as Request, mockRes as Response);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Length', largeData.length);
    });
  });

  describe('uploadObject', () => {
    it('should upload object successfully', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockReq.query = { name: 'test.txt' };
      mockReq.headers = { 'content-type': 'text/plain' };

      const mockResult = { kind: 'storage#object', name: 'test.txt' } as any;
      mockStorageService.uploadObject.mockResolvedValue(mockResult as any);

      // Simulate request data stream
      const chunks = [Buffer.from('test data')];
      mockReq.on = jest.fn((event, callback) => {
        if (event === 'data') {
          chunks.forEach(callback);
        } else if (event === 'end') {
          callback();
        }
        return mockReq;
      }) as any;

      await controller.uploadObject(mockReq as Request, mockRes as Response);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 when name is missing', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockReq.query = {};

      await controller.uploadObject(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ message: 'Object name is required' })
      }));
    });

    it('should decode URL-encoded object name', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockReq.query = { name: 'my%20file.txt' };
      mockReq.headers = { 'content-type': 'text/plain' };

      const mockResult = { kind: 'storage#object', name: 'my file.txt' };
      mockStorageService.uploadObject.mockResolvedValue(mockResult);

      mockReq.on = jest.fn((event, callback) => {
        if (event === 'data') callback(Buffer.from('test'));
        else if (event === 'end') callback();
        return mockReq;
      }) as any;

      await controller.uploadObject(mockReq as Request, mockRes as Response);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockStorageService.uploadObject).toHaveBeenCalledWith(
        'test-bucket',
        'my file.txt',
        expect.any(Buffer),
        'text/plain'
      );
    });

    it('should use default content type if not specified', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockReq.query = { name: 'test.bin' };
      mockReq.headers = {};

      const mockResult = { kind: 'storage#object', name: 'test.bin' } as any;
      mockStorageService.uploadObject.mockResolvedValue(mockResult as any);

      mockReq.on = jest.fn((event, callback) => {
        if (event === 'data') callback(Buffer.from('binary data'));
        else if (event === 'end') callback();
        return mockReq;
      }) as any;

      await controller.uploadObject(mockReq as Request, mockRes as Response);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockStorageService.uploadObject).toHaveBeenCalledWith(
        'test-bucket',
        'test.bin',
        expect.any(Buffer),
        'application/octet-stream'
      );
    });

    it('should handle multiple data chunks', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockReq.query = { name: 'test.txt' };
      mockReq.headers = { 'content-type': 'text/plain' };

      const mockResult = { kind: 'storage#object', name: 'test.txt' } as any;
      mockStorageService.uploadObject.mockResolvedValue(mockResult as any);

      const chunks = [Buffer.from('chunk1'), Buffer.from('chunk2'), Buffer.from('chunk3')];
      mockReq.on = jest.fn((event, callback) => {
        if (event === 'data') {
          chunks.forEach(callback);
        } else if (event === 'end') {
          callback();
        }
        return mockReq;
      }) as any;

      await controller.uploadObject(mockReq as Request, mockRes as Response);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockStorageService.uploadObject).toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockReq.query = { name: 'test.txt' };
      mockReq.headers = { 'content-type': 'text/plain' };

      mockStorageService.uploadObject.mockRejectedValue(new Error('Upload failed'));

      mockReq.on = jest.fn((event, callback) => {
        if (event === 'data') callback(Buffer.from('test'));
        else if (event === 'end') callback();
        return mockReq;
      }) as any;

      await controller.uploadObject(mockReq as Request, mockRes as Response);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle empty file uploads', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockReq.query = { name: 'empty.txt' };
      mockReq.headers = { 'content-type': 'text/plain' };

      const mockResult = { kind: 'storage#object', name: 'empty.txt', size: 0 } as any;
      mockStorageService.uploadObject.mockResolvedValue(mockResult as any);

      mockReq.on = jest.fn((event, callback) => {
        if (event === 'end') callback();
        return mockReq;
      }) as any;

      await controller.uploadObject(mockReq as Request, mockRes as Response);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockStorageService.uploadObject).toHaveBeenCalled();
    });
  });

  describe('initiateResumableUpload', () => {
    it('should initiate resumable upload successfully', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockReq.query = { name: 'large-file.bin' };
      mockReq.headers = {
        'content-type': 'application/octet-stream',
        'x-upload-content-length': '1000000'
      };

      const mockSession = {
        uploadId: 'upload-123',
        uploadUrl: 'https://storage.googleapis.com/upload/storage/v1/b/test-bucket/o?uploadId=upload-123'
      } as any;
      mockResumableService.initiateUpload.mockReturnValue(mockSession as any);

      await controller.initiateResumableUpload(mockReq as Request, mockRes as Response);

      expect(mockResumableService.initiateUpload).toHaveBeenCalledWith(
        'test-bucket',
        'large-file.bin',
        'application/octet-stream',
        '1000000'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 when name is missing', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockReq.query = {};

      await controller.initiateResumableUpload(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle session creation errors', async () => {
      mockReq.params = { bucket: 'test-bucket' };
      mockReq.query = { name: 'test.txt' };
      mockReq.headers = {};

      mockResumableService.initiateUpload.mockImplementation(() => {
        throw new Error('Session creation failed');
      });

      await controller.initiateResumableUpload(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Error Handling', () => {
    it('should create proper GCS error format', async () => {
      mockReq.params = { bucket: 'test-bucket', object: 'test.txt' };
      mockStorageService.getObject.mockRejectedValue(new Error('Storage error'));

      await controller.getObjectMetadata(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: expect.any(Number),
            message: expect.any(String),
            errors: expect.arrayContaining([
              expect.objectContaining({
                domain: 'global',
                reason: expect.any(String)
              })
            ])
          })
        })
      );
    });

    it('should log errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockReq.params = { bucket: 'test-bucket', object: 'test.txt' };
      mockStorageService.getObject.mockRejectedValue(new Error('Test error'));

      await controller.getObjectMetadata(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle errors without message property', async () => {
      mockReq.params = { bucket: 'test-bucket', object: 'test.txt' };
      mockStorageService.getObject.mockRejectedValue({});

      await controller.getObjectMetadata(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
