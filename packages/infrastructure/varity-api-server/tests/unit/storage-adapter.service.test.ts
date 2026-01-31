/**
 * Unit Tests for Storage Adapter Service
 *
 * Tests the storage adapter service in isolation with mocked dependencies.
 * Covers all CRUD operations, error handling, and edge cases.
 */

import { StorageAdapterService } from '../../src/services/storage-adapter.service';
import { StorageLayer, StorageTier, StorageBackend } from '@varity-labs/types';

// Mock the adapter factory and logger
jest.mock('@varity-labs/sdk/storage/adapters');
jest.mock('../../src/config/logger.config');

describe('StorageAdapterService', () => {
  let service: StorageAdapterService;
  let mockAdapter: any;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock adapter
    mockAdapter = {
      upload: jest.fn(),
      download: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
      exists: jest.fn(),
      getMetadata: jest.fn(),
      getBackendType: jest.fn().mockReturnValue(StorageBackend.FILECOIN_IPFS)
    };

    // Mock AdapterFactory to return our mock adapter
    const { AdapterFactory } = require('@varity-labs/sdk/storage/adapters');
    AdapterFactory.create = jest.fn().mockReturnValue(mockAdapter);

    // Create service instance
    service = new StorageAdapterService();
  });

  describe('upload', () => {
    it('should upload data successfully', async () => {
      const testData = { test: 'data' };
      const mockResult = {
        identifier: 'Qm123abc',
        gatewayUrl: 'https://gateway.pinata.cloud/ipfs/Qm123abc',
        size: 1024,
        hash: 'sha256hash',
        timestamp: Date.now(),
        backend: StorageBackend.FILECOIN_IPFS,
        tier: StorageTier.HOT,
        layer: StorageLayer.CUSTOMER_DATA
      };

      mockAdapter.upload.mockResolvedValue(mockResult);

      const result = await service.upload(testData, {
        layer: StorageLayer.CUSTOMER_DATA,
        tier: StorageTier.HOT,
        metadata: { test: 'metadata' }
      });

      expect(result).toBeDefined();
      expect(result.cid).toBe('Qm123abc');
      expect(result.gatewayUrl).toBe('https://gateway.pinata.cloud/ipfs/Qm123abc');
      expect(result.size).toBe(1024);
      expect(mockAdapter.upload).toHaveBeenCalledTimes(1);
    });

    it('should convert objects to JSON before uploading', async () => {
      const testData = { complex: 'object', nested: { data: 'value' } };

      mockAdapter.upload.mockResolvedValue({
        identifier: 'Qm456def',
        gatewayUrl: 'https://gateway.pinata.cloud/ipfs/Qm456def',
        size: 2048,
        hash: 'hash456',
        timestamp: Date.now(),
        backend: StorageBackend.FILECOIN_IPFS
      });

      await service.upload(testData, {
        layer: StorageLayer.INDUSTRY_RAG
      });

      expect(mockAdapter.upload).toHaveBeenCalled();
      const uploadedData = mockAdapter.upload.mock.calls[0][0];
      expect(Buffer.isBuffer(uploadedData)).toBe(true);
    });

    it('should default to encryption enabled', async () => {
      mockAdapter.upload.mockResolvedValue({
        identifier: 'Qm789ghi',
        gatewayUrl: 'https://gateway.pinata.cloud/ipfs/Qm789ghi',
        size: 512,
        hash: 'hash789',
        timestamp: Date.now(),
        backend: StorageBackend.FILECOIN_IPFS
      });

      await service.upload({ data: 'test' }, {
        layer: StorageLayer.VARITY_INTERNAL
      });

      const options = mockAdapter.upload.mock.calls[0][1];
      expect(options.encrypt).toBe(true);
    });

    it('should handle upload errors', async () => {
      mockAdapter.upload.mockRejectedValue(new Error('Upload failed'));

      await expect(
        service.upload({ data: 'test' }, {
          layer: StorageLayer.CUSTOMER_DATA
        })
      ).rejects.toThrow('Upload failed');
    });

    it('should support all storage layers', async () => {
      const layers = [
        StorageLayer.VARITY_INTERNAL,
        StorageLayer.INDUSTRY_RAG,
        StorageLayer.CUSTOMER_DATA
      ];

      for (const layer of layers) {
        mockAdapter.upload.mockResolvedValue({
          identifier: `Qm${layer}`,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/Qm${layer}`,
          size: 100,
          hash: `hash-${layer}`,
          timestamp: Date.now(),
          backend: StorageBackend.FILECOIN_IPFS,
          layer
        });

        const result = await service.upload({ data: 'test' }, { layer });
        expect(result.cid).toBe(`Qm${layer}`);
      }
    });
  });

  describe('download', () => {
    it('should download data successfully', async () => {
      const testData = Buffer.from('downloaded data');
      mockAdapter.download.mockResolvedValue(testData);

      const result = await service.download('Qm123abc');

      expect(result).toBe(testData);
      expect(mockAdapter.download).toHaveBeenCalledWith('Qm123abc');
    });

    it('should handle download errors', async () => {
      mockAdapter.download.mockRejectedValue(new Error('Not found'));

      await expect(
        service.download('QmInvalid')
      ).rejects.toThrow('Object not found');
    });

    it('should handle missing CIDs', async () => {
      mockAdapter.download.mockRejectedValue(new Error('CID does not exist'));

      await expect(
        service.download('QmMissing')
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete object successfully', async () => {
      mockAdapter.delete.mockResolvedValue(undefined);

      await service.delete('Qm123abc');

      expect(mockAdapter.delete).toHaveBeenCalledWith('Qm123abc');
    });

    it('should handle delete errors', async () => {
      mockAdapter.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(
        service.delete('Qm123abc')
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('list', () => {
    it('should list all objects', async () => {
      const mockItems = [
        {
          identifier: 'Qm1',
          key: 'file1.txt',
          size: 100,
          lastModified: new Date(),
          metadata: { layer: StorageLayer.CUSTOMER_DATA }
        },
        {
          identifier: 'Qm2',
          key: 'file2.txt',
          size: 200,
          lastModified: new Date(),
          metadata: { layer: StorageLayer.CUSTOMER_DATA }
        }
      ];

      mockAdapter.list.mockResolvedValue(mockItems);

      const result = await service.list();

      expect(result).toHaveLength(2);
      expect(mockAdapter.list).toHaveBeenCalled();
    });

    it('should filter by layer', async () => {
      const mockItems = [
        {
          identifier: 'Qm1',
          key: 'varity-internal/file1.txt',
          size: 100,
          lastModified: new Date(),
          metadata: { layer: StorageLayer.VARITY_INTERNAL }
        },
        {
          identifier: 'Qm2',
          key: 'customer-data/file2.txt',
          size: 200,
          lastModified: new Date(),
          metadata: { layer: StorageLayer.CUSTOMER_DATA }
        }
      ];

      mockAdapter.list.mockResolvedValue(mockItems);

      const result = await service.list({
        layer: StorageLayer.VARITY_INTERNAL
      });

      expect(result).toHaveLength(1);
      expect(result[0].metadata?.layer).toBe(StorageLayer.VARITY_INTERNAL);
    });

    it('should support pagination', async () => {
      const mockItems = Array.from({ length: 50 }, (_, i) => ({
        identifier: `Qm${i}`,
        key: `file${i}.txt`,
        size: i * 100,
        lastModified: new Date(),
        metadata: {}
      }));

      mockAdapter.list.mockResolvedValue(mockItems);

      const result = await service.list({
        limit: 50,
        continuationToken: 'token123'
      });

      expect(mockAdapter.list).toHaveBeenCalledWith(
        expect.objectContaining({
          maxResults: 50,
          continuationToken: 'token123'
        })
      );
    });

    it('should handle list errors', async () => {
      mockAdapter.list.mockRejectedValue(new Error('List failed'));

      await expect(
        service.list()
      ).rejects.toThrow('List failed');
    });
  });

  describe('exists', () => {
    it('should return true when object exists', async () => {
      mockAdapter.exists.mockResolvedValue(true);

      const result = await service.exists('Qm123abc');

      expect(result).toBe(true);
      expect(mockAdapter.exists).toHaveBeenCalledWith('Qm123abc');
    });

    it('should return false when object does not exist', async () => {
      mockAdapter.exists.mockResolvedValue(false);

      const result = await service.exists('QmMissing');

      expect(result).toBe(false);
    });

    it('should return false on errors', async () => {
      mockAdapter.exists.mockRejectedValue(new Error('Check failed'));

      const result = await service.exists('QmError');

      expect(result).toBe(false);
    });
  });

  describe('getMetadata', () => {
    it('should return object metadata', async () => {
      const mockMetadata = {
        identifier: 'Qm123abc',
        size: 1024,
        contentType: 'application/json',
        lastModified: new Date(),
        etag: 'etag123',
        customMetadata: { test: 'metadata' },
        tier: StorageTier.HOT,
        layer: StorageLayer.CUSTOMER_DATA
      };

      mockAdapter.getMetadata.mockResolvedValue(mockMetadata);

      const result = await service.getMetadata('Qm123abc');

      expect(result).toEqual(mockMetadata);
      expect(mockAdapter.getMetadata).toHaveBeenCalledWith('Qm123abc');
    });

    it('should handle metadata errors', async () => {
      mockAdapter.getMetadata.mockRejectedValue(new Error('Not found'));

      await expect(
        service.getMetadata('QmMissing')
      ).rejects.toThrow('Object not found');
    });
  });

  describe('getStats', () => {
    it('should calculate storage statistics', async () => {
      const mockItems = [
        {
          identifier: 'Qm1',
          key: 'file1.txt',
          size: 1000,
          lastModified: new Date(),
          metadata: { layer: StorageLayer.CUSTOMER_DATA }
        },
        {
          identifier: 'Qm2',
          key: 'file2.txt',
          size: 2000,
          lastModified: new Date(),
          metadata: { layer: StorageLayer.CUSTOMER_DATA }
        },
        {
          identifier: 'Qm3',
          key: 'file3.txt',
          size: 3000,
          lastModified: new Date(),
          metadata: { layer: StorageLayer.VARITY_INTERNAL }
        }
      ];

      mockAdapter.list.mockResolvedValue(mockItems);

      const result = await service.getStats();

      expect(result.totalFiles).toBe(3);
      expect(result.totalSize).toBe(6000);
      expect(result.byLayer[StorageLayer.CUSTOMER_DATA]).toEqual({
        files: 2,
        size: 3000
      });
      expect(result.byLayer[StorageLayer.VARITY_INTERNAL]).toEqual({
        files: 1,
        size: 3000
      });
    });

    it('should filter stats by layer', async () => {
      const mockItems = [
        {
          identifier: 'Qm1',
          key: 'file1.txt',
          size: 1000,
          lastModified: new Date(),
          metadata: { layer: StorageLayer.INDUSTRY_RAG }
        }
      ];

      mockAdapter.list.mockResolvedValue(mockItems);

      const result = await service.getStats(StorageLayer.INDUSTRY_RAG);

      expect(result.totalFiles).toBe(1);
      expect(result.totalSize).toBe(1000);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      mockAdapter.list.mockResolvedValue([]);

      const result = await service.healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.backend).toBe(StorageBackend.FILECOIN_IPFS);
      expect(result.latency).toBeDefined();
      expect(result.latency).toBeGreaterThan(0);
    });

    it('should return unhealthy on errors', async () => {
      mockAdapter.list.mockRejectedValue(new Error('Backend unavailable'));

      const result = await service.healthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.backend).toBe(StorageBackend.FILECOIN_IPFS);
    });
  });

  describe('getBackendType', () => {
    it('should return correct backend type', () => {
      const result = service.getBackendType();

      expect(result).toBe(StorageBackend.FILECOIN_IPFS);
      expect(mockAdapter.getBackendType).toHaveBeenCalled();
    });
  });
});
