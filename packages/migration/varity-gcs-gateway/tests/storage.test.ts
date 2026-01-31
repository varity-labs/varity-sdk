/**
 * Storage Service Tests
 */

import { StorageService } from '../src/services';
import { StorageBackendConfig } from '../src/types';

describe('StorageService', () => {
  let storageService: StorageService;

  beforeAll(() => {
    const config: StorageBackendConfig = {
      pinataApiKey: 'test-key',
      pinataSecretKey: 'test-secret',
      ipfsGateway: 'https://gateway.pinata.cloud/ipfs',
      litProtocolEnabled: false,
      celestiaDAEnabled: false
    };

    storageService = new StorageService(config);
  });

  describe('Bucket Operations', () => {
    it('should have default bucket', async () => {
      const bucket = await storageService.getBucket('varity-default');
      expect(bucket).toBeDefined();
      expect(bucket?.name).toBe('varity-default');
    });

    it('should create new bucket', async () => {
      const bucket = await storageService.createBucket('test-bucket');
      expect(bucket).toBeDefined();
      expect(bucket.name).toBe('test-bucket');
      expect(bucket.kind).toBe('storage#bucket');
    });

    it('should list buckets', async () => {
      const result = await storageService.listBuckets();
      expect(result.kind).toBe('storage#buckets');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should not create duplicate bucket', async () => {
      await expect(
        storageService.createBucket('test-bucket')
      ).rejects.toThrow('already exists');
    });

    it('should delete empty bucket', async () => {
      await storageService.createBucket('delete-test');
      const result = await storageService.deleteBucket('delete-test');
      expect(result).toBe(true);
    });
  });

  describe('Object Operations', () => {
    beforeAll(async () => {
      await storageService.createBucket('object-test-bucket');
    });

    it('should list objects in bucket', async () => {
      const result = await storageService.listObjects('object-test-bucket');
      expect(result.kind).toBe('storage#objects');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should return null for non-existent object', async () => {
      const obj = await storageService.getObject('object-test-bucket', 'non-existent.txt');
      expect(obj).toBeNull();
    });

    it('should store object in memory cache', async () => {
      const data = Buffer.from('test data');
      const obj = await storageService['toGCSObject']({
        name: 'test.txt',
        bucket: 'object-test-bucket',
        data,
        contentType: 'text/plain',
        size: data.length,
        md5Hash: 'abc123',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(obj.kind).toBe('storage#object');
      expect(obj.name).toBe('test.txt');
      expect(obj.bucket).toBe('object-test-bucket');
    });
  });
});
