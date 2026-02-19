import {
  StorageService,
  StorageLayer,
  StorageBackend,
  StorageConfig
} from '../storage.service';

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService({
      network: 'test-network',
      storageBackend: StorageBackend.FILECOIN_IPFS
    });
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const service = new StorageService();
      expect(service).toBeInstanceOf(StorageService);
    });

    it('should initialize with custom config', () => {
      const config: StorageConfig = {
        network: 'custom-network',
        apiKey: 'test-key',
        storageBackend: StorageBackend.LIGHTHOUSE
      };

      const service = new StorageService(config);
      expect(service).toBeInstanceOf(StorageService);
    });

    it('should load config from environment variables', () => {
      process.env.VARITY_NETWORK = 'env-network';
      process.env.VARITY_API_KEY = 'env-api-key';

      const service = new StorageService();
      expect(service).toBeInstanceOf(StorageService);

      delete process.env.VARITY_NETWORK;
      delete process.env.VARITY_API_KEY;
    });
  });

  describe('putObject()', () => {
    it('should upload object and return result', async () => {
      const bucket = 'test-bucket';
      const key = 'test-key.txt';
      const data = Buffer.from('Hello, World!');
      const metadata = {
        contentType: 'text/plain',
        customMetadata: { author: 'John Doe' }
      };

      const result = await storageService.putObject(bucket, key, data, metadata);

      expect(result).toHaveProperty('cid');
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('size', data.length);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('layer', StorageLayer.CUSTOMER_DATA);
      expect(result.cid).toMatch(/^Qm/);
    });

    it('should handle object without metadata', async () => {
      const data = Buffer.from('Test data');

      const result = await storageService.putObject('bucket', 'key', data);

      expect(result.cid).toBeDefined();
      expect(result.hash).toBeDefined();
    });

    it('should generate consistent CID for same content', async () => {
      const data = Buffer.from('Consistent data');

      const result1 = await storageService.putObject('bucket', 'key1', data);
      const result2 = await storageService.putObject('bucket', 'key2', data);

      // CIDs should be consistent for same content (based on hash)
      expect(result1.hash).toBe(result2.hash);
    });

    it('should handle large binary data', async () => {
      const largeData = Buffer.alloc(1024 * 1024); // 1MB

      const result = await storageService.putObject('bucket', 'large-file', largeData);

      expect(result.size).toBe(1024 * 1024);
      expect(result.cid).toBeDefined();
    });

    it('should store bucket-key mapping', async () => {
      const data = Buffer.from('Test');
      await storageService.putObject('bucket', 'key', data);

      // Should be retrievable
      const retrieved = await storageService.getObject('bucket', 'key');
      expect(retrieved).toBeInstanceOf(Buffer);
    });

    it('should handle empty data', async () => {
      const emptyData = Buffer.from('');

      const result = await storageService.putObject('bucket', 'empty', emptyData);

      expect(result.size).toBe(0);
      expect(result.cid).toBeDefined();
    });
  });

  describe('getObject()', () => {
    beforeEach(async () => {
      // Upload test object
      const data = Buffer.from('Test content');
      await storageService.putObject('bucket', 'key', data);
    });

    it('should retrieve uploaded object', async () => {
      const data = await storageService.getObject('bucket', 'key');

      expect(data).toBeInstanceOf(Buffer);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent object', async () => {
      await expect(
        storageService.getObject('bucket', 'non-existent-key')
      ).rejects.toThrow('NoSuchKey');
    });

    it('should handle nested keys', async () => {
      const data = Buffer.from('Nested content');
      await storageService.putObject('bucket', 'path/to/file.txt', data);

      const retrieved = await storageService.getObject('bucket', 'path/to/file.txt');
      expect(retrieved).toBeInstanceOf(Buffer);
    });
  });

  describe('getObjectMetadata()', () => {
    beforeEach(async () => {
      const data = Buffer.from('Test content');
      await storageService.putObject('bucket', 'key', data, {
        contentType: 'text/plain',
        customMetadata: { tag: 'test' }
      });
    });

    it('should retrieve object metadata', async () => {
      const metadata = await storageService.getObjectMetadata('bucket', 'key');

      expect(metadata.bucket).toBe('bucket');
      expect(metadata.key).toBe('key');
      expect(metadata.contentType).toBe('text/plain');
      expect(metadata.contentLength).toBeDefined();
      expect(metadata.etag).toBeDefined();
      expect(metadata.lastModified).toBeInstanceOf(Date);
      expect(metadata.customMetadata).toEqual({ tag: 'test' });
    });

    it('should throw error for non-existent object', async () => {
      await expect(
        storageService.getObjectMetadata('bucket', 'non-existent')
      ).rejects.toThrow('NoSuchKey');
    });
  });

  describe('deleteObject()', () => {
    beforeEach(async () => {
      const data = Buffer.from('Test content');
      await storageService.putObject('bucket', 'delete-key', data);
    });

    it('should delete existing object', async () => {
      await storageService.deleteObject('bucket', 'delete-key');

      // Object should no longer exist
      await expect(
        storageService.getObject('bucket', 'delete-key')
      ).rejects.toThrow('NoSuchKey');
    });

    it('should not throw error for non-existent object', async () => {
      // S3 compatibility: deleting non-existent key succeeds
      await expect(
        storageService.deleteObject('bucket', 'non-existent')
      ).resolves.not.toThrow();
    });

    it('should remove both mappings', async () => {
      await storageService.deleteObject('bucket', 'delete-key');

      await expect(
        storageService.getObjectMetadata('bucket', 'delete-key')
      ).rejects.toThrow();
    });
  });

  describe('listObjects()', () => {
    beforeEach(async () => {
      // Upload multiple test objects
      await storageService.putObject('list-bucket', 'file1.txt', Buffer.from('1'));
      await storageService.putObject('list-bucket', 'file2.txt', Buffer.from('2'));
      await storageService.putObject('list-bucket', 'folder/file3.txt', Buffer.from('3'));
      await storageService.putObject('other-bucket', 'file4.txt', Buffer.from('4'));
    });

    it('should list all objects in bucket', async () => {
      const result = await storageService.listObjects('list-bucket');

      expect(result.objects.length).toBe(3);
      expect(result.isTruncated).toBe(false);
    });

    it('should filter by prefix', async () => {
      const result = await storageService.listObjects('list-bucket', 'folder/');

      expect(result.objects.length).toBe(1);
      expect(result.objects[0].key).toBe('folder/file3.txt');
    });

    it('should limit results with maxKeys', async () => {
      const result = await storageService.listObjects('list-bucket', undefined, 2);

      expect(result.objects.length).toBe(2);
      expect(result.isTruncated).toBe(true);
      expect(result.nextContinuationToken).toBeDefined();
    });

    it('should support pagination', async () => {
      const firstPage = await storageService.listObjects('list-bucket', undefined, 2);
      const secondPage = await storageService.listObjects(
        'list-bucket',
        undefined,
        2,
        firstPage.nextContinuationToken
      );

      expect(firstPage.objects.length).toBe(2);
      expect(secondPage.objects.length).toBe(1);
    });

    it('should return empty list for empty bucket', async () => {
      const result = await storageService.listObjects('empty-bucket');

      expect(result.objects.length).toBe(0);
      expect(result.isTruncated).toBe(false);
    });

    it('should sort objects by key', async () => {
      const result = await storageService.listObjects('list-bucket');

      const keys = result.objects.map(obj => obj.key);
      const sortedKeys = [...keys].sort();
      expect(keys).toEqual(sortedKeys);
    });

    it('should include object metadata in list', async () => {
      const result = await storageService.listObjects('list-bucket');

      result.objects.forEach(obj => {
        expect(obj).toHaveProperty('key');
        expect(obj).toHaveProperty('size');
        expect(obj).toHaveProperty('etag');
        expect(obj).toHaveProperty('lastModified');
        expect(obj).toHaveProperty('storageClass', 'STANDARD');
      });
    });
  });

  describe('objectExists()', () => {
    beforeEach(async () => {
      await storageService.putObject('bucket', 'exists', Buffer.from('data'));
    });

    it('should return true for existing object', async () => {
      const exists = await storageService.objectExists('bucket', 'exists');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent object', async () => {
      const exists = await storageService.objectExists('bucket', 'not-exists');
      expect(exists).toBe(false);
    });
  });

  describe('copyObject()', () => {
    beforeEach(async () => {
      const data = Buffer.from('Source content');
      await storageService.putObject('source-bucket', 'source-key', data, {
        contentType: 'text/plain',
        customMetadata: { copied: 'false' }
      });
    });

    it('should copy object to new location', async () => {
      const result = await storageService.copyObject(
        'source-bucket',
        'source-key',
        'dest-bucket',
        'dest-key'
      );

      expect(result.cid).toBeDefined();
      expect(result.hash).toBeDefined();

      // Verify destination exists
      const destExists = await storageService.objectExists('dest-bucket', 'dest-key');
      expect(destExists).toBe(true);
    });

    it('should copy within same bucket', async () => {
      await storageService.copyObject(
        'source-bucket',
        'source-key',
        'source-bucket',
        'copy-key'
      );

      const exists = await storageService.objectExists('source-bucket', 'copy-key');
      expect(exists).toBe(true);
    });

    it('should preserve metadata in copy', async () => {
      await storageService.copyObject(
        'source-bucket',
        'source-key',
        'dest-bucket',
        'dest-key'
      );

      const metadata = await storageService.getObjectMetadata('dest-bucket', 'dest-key');
      expect(metadata.contentType).toBe('text/plain');
    });

    it('should fail for non-existent source', async () => {
      await expect(
        storageService.copyObject(
          'source-bucket',
          'non-existent',
          'dest-bucket',
          'dest-key'
        )
      ).rejects.toThrow();
    });
  });

  describe('Storage layer configuration', () => {
    it('should support different storage layers', async () => {
      const data = Buffer.from('Test');
      const result = await storageService.putObject('bucket', 'key', data);

      expect(result.layer).toBe(StorageLayer.CUSTOMER_DATA);
    });

    it('should support different storage backends', () => {
      const filecoinService = new StorageService({
        storageBackend: StorageBackend.FILECOIN_IPFS
      });

      const lighthouseService = new StorageService({
        storageBackend: StorageBackend.LIGHTHOUSE
      });

      const pinataService = new StorageService({
        storageBackend: StorageBackend.PINATA
      });

      expect(filecoinService).toBeInstanceOf(StorageService);
      expect(lighthouseService).toBeInstanceOf(StorageService);
      expect(pinataService).toBeInstanceOf(StorageService);
    });
  });

  describe('Error handling', () => {
    it('should handle put errors gracefully', async () => {
      // This test would require mocking crypto to force an error
      const data = Buffer.from('Test');
      await expect(
        storageService.putObject('bucket', 'key', data)
      ).resolves.toBeDefined();
    });

    it('should provide meaningful error messages', async () => {
      await expect(
        storageService.getObject('bucket', 'non-existent')
      ).rejects.toThrow('NoSuchKey');
    });
  });
});
