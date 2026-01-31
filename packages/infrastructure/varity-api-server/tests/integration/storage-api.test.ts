/**
 * Integration Tests for Storage API
 *
 * Tests the complete API endpoints with real HTTP requests.
 * Verifies request/response cycle, validation, and error handling.
 */

import request from 'supertest';
import express, { Express } from 'express';
import storageRoutes from '../../src/routes/storage.routes';
import { StorageLayer, StorageTier } from '@varity-labs/types';

// Mock the storage adapter service
jest.mock('../../src/services/storage-adapter.service');
jest.mock('../../src/config/logger.config');

describe('Storage API Integration Tests', () => {
  let app: Express;
  let mockStorageService: any;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/v1/storage', storageRoutes);

    // Get mock service
    const { storageAdapterService } = require('../../src/services/storage-adapter.service');
    mockStorageService = storageAdapterService;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/storage/upload', () => {
    it('should upload data successfully', async () => {
      const mockResult = {
        cid: 'Qm123abc',
        gatewayUrl: 'https://gateway.pinata.cloud/ipfs/Qm123abc',
        size: 1024,
        hash: 'sha256hash',
        timestamp: Date.now()
      };

      mockStorageService.upload.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/storage/upload')
        .send({
          data: { test: 'data' },
          layer: StorageLayer.CUSTOMER_DATA,
          namespace: 'test-namespace'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cid).toBe('Qm123abc');
      expect(mockStorageService.upload).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/storage/upload')
        .send({
          layer: StorageLayer.CUSTOMER_DATA
          // Missing 'data' field
        });

      expect(response.status).toBe(400);
    });

    it('should validate storage layer', async () => {
      const response = await request(app)
        .post('/api/v1/storage/upload')
        .send({
          data: { test: 'data' },
          layer: 'invalid-layer'
        });

      expect(response.status).toBe(400);
    });

    it('should support all storage layers', async () => {
      const layers = [
        StorageLayer.VARITY_INTERNAL,
        StorageLayer.INDUSTRY_RAG,
        StorageLayer.CUSTOMER_DATA
      ];

      for (const layer of layers) {
        mockStorageService.upload.mockResolvedValue({
          cid: `Qm${layer}`,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/Qm${layer}`,
          size: 100,
          hash: `hash-${layer}`,
          timestamp: Date.now()
        });

        const response = await request(app)
          .post('/api/v1/storage/upload')
          .send({
            data: { test: 'data' },
            layer
          });

        expect(response.status).toBe(201);
        expect(response.body.data.cid).toBe(`Qm${layer}`);
      }
    });

    it('should support custom metadata', async () => {
      mockStorageService.upload.mockResolvedValue({
        cid: 'Qm456def',
        gatewayUrl: 'https://gateway.pinata.cloud/ipfs/Qm456def',
        size: 2048,
        hash: 'hash456',
        timestamp: Date.now()
      });

      const response = await request(app)
        .post('/api/v1/storage/upload')
        .send({
          data: { test: 'data' },
          layer: StorageLayer.INDUSTRY_RAG,
          metadata: {
            industry: 'finance',
            category: 'compliance'
          }
        });

      expect(response.status).toBe(201);
      expect(mockStorageService.upload).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          metadata: expect.objectContaining({
            industry: 'finance',
            category: 'compliance'
          })
        })
      );
    });
  });

  describe('GET /api/v1/storage/download/:cid', () => {
    it('should download data successfully', async () => {
      const testData = Buffer.from('downloaded data');
      mockStorageService.download.mockResolvedValue(testData);

      const response = await request(app)
        .get('/api/v1/storage/download/Qm123abc');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockStorageService.download).toHaveBeenCalledWith('Qm123abc');
    });

    it('should handle not found errors', async () => {
      mockStorageService.download.mockRejectedValue(new Error('Object not found'));

      const response = await request(app)
        .get('/api/v1/storage/download/QmMissing');

      expect(response.status).toBe(404);
    });

    it('should validate CID parameter', async () => {
      const response = await request(app)
        .get('/api/v1/storage/download/invalid');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/storage/exists/:cid', () => {
    it('should check if object exists', async () => {
      mockStorageService.exists.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/v1/storage/exists/Qm123abc');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.exists).toBe(true);
    });

    it('should return false for non-existent objects', async () => {
      mockStorageService.exists.mockResolvedValue(false);

      const response = await request(app)
        .get('/api/v1/storage/exists/QmMissing');

      expect(response.status).toBe(200);
      expect(response.body.data.exists).toBe(false);
    });
  });

  describe('GET /api/v1/storage/metadata/:cid', () => {
    it('should get object metadata', async () => {
      const mockMetadata = {
        identifier: 'Qm123abc',
        size: 1024,
        contentType: 'application/json',
        lastModified: new Date(),
        tier: StorageTier.HOT,
        layer: StorageLayer.CUSTOMER_DATA
      };

      mockStorageService.getMetadata.mockResolvedValue(mockMetadata);

      const response = await request(app)
        .get('/api/v1/storage/metadata/Qm123abc');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.identifier).toBe('Qm123abc');
      expect(response.body.data.size).toBe(1024);
    });

    it('should handle metadata not found', async () => {
      mockStorageService.getMetadata.mockRejectedValue(new Error('Object not found'));

      const response = await request(app)
        .get('/api/v1/storage/metadata/QmMissing');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/storage/list', () => {
    it('should list all objects', async () => {
      const mockItems = [
        {
          identifier: 'Qm1',
          key: 'file1.txt',
          size: 100,
          lastModified: new Date()
        },
        {
          identifier: 'Qm2',
          key: 'file2.txt',
          size: 200,
          lastModified: new Date()
        }
      ];

      mockStorageService.list.mockResolvedValue(mockItems);

      const response = await request(app)
        .get('/api/v1/storage/list');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.count).toBe(2);
    });

    it('should filter by layer', async () => {
      mockStorageService.list.mockResolvedValue([
        {
          identifier: 'Qm1',
          key: 'file1.txt',
          size: 100,
          lastModified: new Date(),
          metadata: { layer: StorageLayer.INDUSTRY_RAG }
        }
      ]);

      const response = await request(app)
        .get('/api/v1/storage/list')
        .query({ layer: StorageLayer.INDUSTRY_RAG });

      expect(response.status).toBe(200);
      expect(mockStorageService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          layer: StorageLayer.INDUSTRY_RAG
        })
      );
    });

    it('should support pagination', async () => {
      mockStorageService.list.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/storage/list')
        .query({
          limit: 50,
          continuationToken: 'token123'
        });

      expect(response.status).toBe(200);
      expect(mockStorageService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
          continuationToken: 'token123'
        })
      );
    });
  });

  describe('GET /api/v1/storage/stats', () => {
    it('should get storage statistics', async () => {
      const mockStats = {
        totalFiles: 10,
        totalSize: 10240,
        byLayer: {
          [StorageLayer.CUSTOMER_DATA]: { files: 5, size: 5000 },
          [StorageLayer.INDUSTRY_RAG]: { files: 3, size: 3000 },
          [StorageLayer.VARITY_INTERNAL]: { files: 2, size: 2240 }
        }
      };

      mockStorageService.getStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/v1/storage/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalFiles).toBe(10);
      expect(response.body.data.totalSize).toBe(10240);
    });

    it('should filter stats by layer', async () => {
      mockStorageService.getStats.mockResolvedValue({
        totalFiles: 5,
        totalSize: 5000,
        byLayer: {
          [StorageLayer.CUSTOMER_DATA]: { files: 5, size: 5000 }
        }
      });

      const response = await request(app)
        .get('/api/v1/storage/stats')
        .query({ layer: StorageLayer.CUSTOMER_DATA });

      expect(response.status).toBe(200);
      expect(mockStorageService.getStats).toHaveBeenCalledWith(StorageLayer.CUSTOMER_DATA);
    });
  });

  describe('DELETE /api/v1/storage/:cid', () => {
    it('should delete object successfully', async () => {
      mockStorageService.delete.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/v1/storage/Qm123abc');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);
      expect(mockStorageService.delete).toHaveBeenCalledWith('Qm123abc');
    });

    it('should handle delete errors', async () => {
      mockStorageService.delete.mockRejectedValue(new Error('Delete failed'));

      const response = await request(app)
        .delete('/api/v1/storage/Qm123abc');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/v1/storage/health', () => {
    it('should return healthy status', async () => {
      mockStorageService.healthCheck.mockResolvedValue({
        status: 'healthy',
        backend: 'filecoin-ipfs',
        latency: 150
      });

      const response = await request(app)
        .get('/api/v1/storage/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.latency).toBeDefined();
    });

    it('should return unhealthy status on backend failure', async () => {
      mockStorageService.healthCheck.mockResolvedValue({
        status: 'unhealthy',
        backend: 'filecoin-ipfs'
      });

      const response = await request(app)
        .get('/api/v1/storage/health');

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('unhealthy');
    });
  });
});
