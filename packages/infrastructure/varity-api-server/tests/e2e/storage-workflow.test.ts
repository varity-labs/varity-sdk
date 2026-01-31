/**
 * End-to-End Tests for Storage Workflow
 *
 * Tests complete workflows from upload to download to deletion.
 * Verifies the entire storage lifecycle works correctly.
 */

import request from 'supertest';
import express, { Express } from 'express';
import storageRoutes from '../../src/routes/storage.routes';
import { StorageLayer, StorageTier } from '@varity-labs/types';

// Mock the storage adapter service
jest.mock('../../src/services/storage-adapter.service');
jest.mock('../../src/config/logger.config');

describe('Storage Workflow E2E Tests', () => {
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

  describe('Complete Upload-Download-Delete Workflow', () => {
    it('should complete full storage lifecycle', async () => {
      const testData = {
        businessName: 'Acme Corp',
        data: {
          revenue: 1000000,
          employees: 50
        }
      };

      const uploadResult = {
        cid: 'QmTestCID123',
        gatewayUrl: 'https://gateway.pinata.cloud/ipfs/QmTestCID123',
        size: 2048,
        hash: 'sha256testhash',
        timestamp: Date.now()
      };

      // Step 1: Upload object
      mockStorageService.upload.mockResolvedValue(uploadResult);

      const uploadResponse = await request(app)
        .post('/api/v1/storage/upload')
        .send({
          data: testData,
          layer: StorageLayer.CUSTOMER_DATA,
          tier: StorageTier.HOT,
          namespace: 'test-workflow'
        });

      expect(uploadResponse.status).toBe(201);
      expect(uploadResponse.body.success).toBe(true);
      const cid = uploadResponse.body.data.cid;
      expect(cid).toBe('QmTestCID123');

      // Step 2: Verify object exists
      mockStorageService.exists.mockResolvedValue(true);

      const existsResponse = await request(app)
        .get(`/api/v1/storage/exists/${cid}`);

      expect(existsResponse.status).toBe(200);
      expect(existsResponse.body.data.exists).toBe(true);

      // Step 3: Get metadata
      mockStorageService.getMetadata.mockResolvedValue({
        identifier: cid,
        size: 2048,
        contentType: 'application/json',
        lastModified: new Date(),
        tier: StorageTier.HOT,
        layer: StorageLayer.CUSTOMER_DATA
      });

      const metadataResponse = await request(app)
        .get(`/api/v1/storage/metadata/${cid}`);

      expect(metadataResponse.status).toBe(200);
      expect(metadataResponse.body.data.size).toBe(2048);
      expect(metadataResponse.body.data.tier).toBe(StorageTier.HOT);

      // Step 4: Download object
      mockStorageService.download.mockResolvedValue(testData);

      const downloadResponse = await request(app)
        .get(`/api/v1/storage/download/${cid}`);

      expect(downloadResponse.status).toBe(200);
      expect(downloadResponse.body.success).toBe(true);
      expect(downloadResponse.body.data).toEqual(testData);

      // Step 5: List objects (verify it appears)
      mockStorageService.list.mockResolvedValue([
        {
          identifier: cid,
          key: 'test-workflow/data.json',
          size: 2048,
          lastModified: new Date(),
          metadata: { layer: StorageLayer.CUSTOMER_DATA }
        }
      ]);

      const listResponse = await request(app)
        .get('/api/v1/storage/list')
        .query({ layer: StorageLayer.CUSTOMER_DATA });

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data.items).toHaveLength(1);
      expect(listResponse.body.data.items[0].identifier).toBe(cid);

      // Step 6: Delete object
      mockStorageService.delete.mockResolvedValue(undefined);

      const deleteResponse = await request(app)
        .delete(`/api/v1/storage/${cid}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.data.deleted).toBe(true);

      // Step 7: Verify object no longer exists
      mockStorageService.exists.mockResolvedValue(false);

      const existsAfterDeleteResponse = await request(app)
        .get(`/api/v1/storage/exists/${cid}`);

      expect(existsAfterDeleteResponse.status).toBe(200);
      expect(existsAfterDeleteResponse.body.data.exists).toBe(false);
    });
  });

  describe('Multi-Layer Storage Workflow', () => {
    it('should handle uploads to all storage layers', async () => {
      const layers = [
        { layer: StorageLayer.VARITY_INTERNAL, data: { type: 'internal-doc' } },
        { layer: StorageLayer.INDUSTRY_RAG, data: { type: 'industry-knowledge' } },
        { layer: StorageLayer.CUSTOMER_DATA, data: { type: 'customer-data' } }
      ];

      const uploadedCIDs: string[] = [];

      // Upload to all layers
      for (const { layer, data } of layers) {
        const cid = `Qm${layer}TestCID`;
        mockStorageService.upload.mockResolvedValue({
          cid,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
          size: 1024,
          hash: `hash-${layer}`,
          timestamp: Date.now()
        });

        const response = await request(app)
          .post('/api/v1/storage/upload')
          .send({ data, layer });

        expect(response.status).toBe(201);
        uploadedCIDs.push(cid);
      }

      expect(uploadedCIDs).toHaveLength(3);

      // List all objects across layers
      mockStorageService.list.mockResolvedValue(
        uploadedCIDs.map((cid, index) => ({
          identifier: cid,
          key: `file-${index}.json`,
          size: 1024,
          lastModified: new Date(),
          metadata: { layer: layers[index].layer }
        }))
      );

      const listResponse = await request(app)
        .get('/api/v1/storage/list');

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data.items).toHaveLength(3);
    });
  });

  describe('Storage Statistics Workflow', () => {
    it('should track and report storage statistics accurately', async () => {
      // Upload multiple objects
      const uploads = [
        { layer: StorageLayer.CUSTOMER_DATA, size: 1000 },
        { layer: StorageLayer.CUSTOMER_DATA, size: 2000 },
        { layer: StorageLayer.INDUSTRY_RAG, size: 3000 },
        { layer: StorageLayer.VARITY_INTERNAL, size: 4000 }
      ];

      for (let i = 0; i < uploads.length; i++) {
        mockStorageService.upload.mockResolvedValue({
          cid: `QmTest${i}`,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/QmTest${i}`,
          size: uploads[i].size,
          hash: `hash${i}`,
          timestamp: Date.now()
        });

        await request(app)
          .post('/api/v1/storage/upload')
          .send({
            data: { test: `data${i}` },
            layer: uploads[i].layer
          });
      }

      // Get statistics
      mockStorageService.getStats.mockResolvedValue({
        totalFiles: 4,
        totalSize: 10000,
        byLayer: {
          [StorageLayer.CUSTOMER_DATA]: { files: 2, size: 3000 },
          [StorageLayer.INDUSTRY_RAG]: { files: 1, size: 3000 },
          [StorageLayer.VARITY_INTERNAL]: { files: 1, size: 4000 }
        }
      });

      const statsResponse = await request(app)
        .get('/api/v1/storage/stats');

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.data.totalFiles).toBe(4);
      expect(statsResponse.body.data.totalSize).toBe(10000);
      expect(statsResponse.body.data.byLayer[StorageLayer.CUSTOMER_DATA].files).toBe(2);
      expect(statsResponse.body.data.byLayer[StorageLayer.CUSTOMER_DATA].size).toBe(3000);
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle upload failures gracefully', async () => {
      mockStorageService.upload.mockRejectedValue(new Error('Upload failed'));

      const response = await request(app)
        .post('/api/v1/storage/upload')
        .send({
          data: { test: 'data' },
          layer: StorageLayer.CUSTOMER_DATA
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle download of non-existent object', async () => {
      mockStorageService.download.mockRejectedValue(new Error('Object not found'));

      const response = await request(app)
        .get('/api/v1/storage/download/QmNonExistent');

      expect(response.status).toBe(404);
    });

    it('should handle metadata retrieval errors', async () => {
      mockStorageService.getMetadata.mockRejectedValue(new Error('Metadata not found'));

      const response = await request(app)
        .get('/api/v1/storage/metadata/QmMissing');

      expect(response.status).toBe(404);
    });

    it('should handle delete failures', async () => {
      mockStorageService.delete.mockRejectedValue(new Error('Delete failed'));

      const response = await request(app)
        .delete('/api/v1/storage/QmTest123');

      expect(response.status).toBe(500);
    });
  });

  describe('Pagination Workflow', () => {
    it('should handle large result sets with pagination', async () => {
      // Create mock data for 150 items
      const mockItems = Array.from({ length: 150 }, (_, i) => ({
        identifier: `Qm${i}`,
        key: `file${i}.json`,
        size: i * 100,
        lastModified: new Date(),
        metadata: { layer: StorageLayer.CUSTOMER_DATA }
      }));

      // First page
      mockStorageService.list.mockResolvedValue(mockItems.slice(0, 100));

      const firstPageResponse = await request(app)
        .get('/api/v1/storage/list')
        .query({ limit: 100 });

      expect(firstPageResponse.status).toBe(200);
      expect(firstPageResponse.body.data.items).toHaveLength(100);

      // Second page
      mockStorageService.list.mockResolvedValue(mockItems.slice(100, 150));

      const secondPageResponse = await request(app)
        .get('/api/v1/storage/list')
        .query({
          limit: 100,
          continuationToken: 'token-page-2'
        });

      expect(secondPageResponse.status).toBe(200);
      expect(secondPageResponse.body.data.items).toHaveLength(50);
    });
  });

  describe('Health Check Workflow', () => {
    it('should monitor storage backend health', async () => {
      // Healthy backend
      mockStorageService.healthCheck.mockResolvedValue({
        status: 'healthy',
        backend: 'filecoin-ipfs',
        latency: 120
      });

      const healthyResponse = await request(app)
        .get('/api/v1/storage/health');

      expect(healthyResponse.status).toBe(200);
      expect(healthyResponse.body.data.status).toBe('healthy');
      expect(healthyResponse.body.data.latency).toBeLessThan(1000);

      // Unhealthy backend
      mockStorageService.healthCheck.mockResolvedValue({
        status: 'unhealthy',
        backend: 'filecoin-ipfs'
      });

      const unhealthyResponse = await request(app)
        .get('/api/v1/storage/health');

      expect(unhealthyResponse.status).toBe(200);
      expect(unhealthyResponse.body.data.status).toBe('unhealthy');
    });
  });

  describe('Concurrent Operations Workflow', () => {
    it('should handle multiple concurrent uploads', async () => {
      const uploadPromises = Array.from({ length: 5 }, (_, i) => {
        mockStorageService.upload.mockResolvedValue({
          cid: `QmConcurrent${i}`,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/QmConcurrent${i}`,
          size: i * 1000,
          hash: `hash${i}`,
          timestamp: Date.now()
        });

        return request(app)
          .post('/api/v1/storage/upload')
          .send({
            data: { test: `concurrent-${i}` },
            layer: StorageLayer.CUSTOMER_DATA
          });
      });

      const responses = await Promise.all(uploadPromises);

      responses.forEach((response, i) => {
        expect(response.status).toBe(201);
        expect(response.body.data.cid).toBe(`QmConcurrent${i}`);
      });
    });
  });
});
