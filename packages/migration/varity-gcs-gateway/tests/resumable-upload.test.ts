/**
 * Resumable Upload Service Tests
 */

import { ResumableUploadService } from '../src/services';

describe('ResumableUploadService', () => {
  let service: ResumableUploadService;

  beforeEach(() => {
    service = new ResumableUploadService();
  });

  describe('Session Management', () => {
    it('should initiate upload session', () => {
      const session = service.initiateUpload(
        'test-bucket',
        'test-file.txt',
        'text/plain',
        { key: 'value' },
        1000
      );

      expect(session).toBeDefined();
      expect(session.bucket).toBe('test-bucket');
      expect(session.objectName).toBe('test-file.txt');
      expect(session.bytesReceived).toBe(0);
      expect(session.totalSize).toBe(1000);
    });

    it('should track active sessions', () => {
      service.initiateUpload('bucket1', 'file1.txt');
      service.initiateUpload('bucket2', 'file2.txt');

      expect(service.getActiveSessionCount()).toBe(2);
    });
  });

  describe('Chunk Upload', () => {
    it('should upload chunk successfully', () => {
      const session = service.initiateUpload('bucket', 'file.txt', 'text/plain', {}, 1000);
      const chunk = Buffer.from('test data');

      const result = service.uploadChunk(
        session.uploadId,
        chunk,
        `bytes 0-${chunk.length - 1}/1000`
      );

      expect(result.success).toBe(true);
      expect(result.bytesReceived).toBe(chunk.length);
      expect(result.complete).toBe(false);
    });

    it('should detect completed upload', () => {
      const session = service.initiateUpload('bucket', 'file.txt', 'text/plain', {}, 100);
      const chunk = Buffer.alloc(100);

      const result = service.uploadChunk(
        session.uploadId,
        chunk,
        'bytes 0-99/100'
      );

      expect(result.success).toBe(true);
      expect(result.bytesReceived).toBe(100);
      expect(result.complete).toBe(true);
    });

    it('should reject invalid range', () => {
      const session = service.initiateUpload('bucket', 'file.txt');
      const chunk = Buffer.from('test');

      expect(() => {
        service.uploadChunk(session.uploadId, chunk, 'bytes 10-13/100');
      }).toThrow('Invalid range');
    });

    it('should reject non-existent session', () => {
      const chunk = Buffer.from('test');

      expect(() => {
        service.uploadChunk('invalid-id', chunk, 'bytes 0-3/100');
      }).toThrow('Upload session not found');
    });
  });

  describe('Upload Status', () => {
    it('should return upload status', () => {
      const session = service.initiateUpload('bucket', 'file.txt', 'text/plain', {}, 1000);
      const chunk = Buffer.alloc(500);

      service.uploadChunk(session.uploadId, chunk, 'bytes 0-499/1000');

      const status = service.getUploadStatus(session.uploadId);
      expect(status).toBeDefined();
      expect(status?.bytesReceived).toBe(500);
      expect(status?.complete).toBe(false);
    });

    it('should return null for non-existent session', () => {
      const status = service.getUploadStatus('invalid-id');
      expect(status).toBeNull();
    });
  });

  describe('Session Cancellation', () => {
    it('should cancel upload session', () => {
      const session = service.initiateUpload('bucket', 'file.txt');
      const result = service.cancelUpload(session.uploadId);

      expect(result).toBe(true);
      expect(service.getUploadStatus(session.uploadId)).toBeNull();
    });

    it('should return false for non-existent session', () => {
      const result = service.cancelUpload('invalid-id');
      expect(result).toBe(false);
    });
  });
});
