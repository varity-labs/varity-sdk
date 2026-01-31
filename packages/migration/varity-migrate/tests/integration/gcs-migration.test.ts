import { MigrationService } from '../../src/services/migration.service';
import { MigrationStatus } from '../../src/types';
import * as fs from 'fs';

// Mock Google Cloud Storage
jest.mock('@google-cloud/storage');

// Mock VarityTargetService to avoid IPFS dependency
jest.mock('../../src/services/varity-target.service', () => ({
  VarityTargetService: jest.fn().mockImplementation(() => ({
    putObject: jest.fn().mockResolvedValue({ cid: 'QmTest123', size: 100 }),
    getObject: jest.fn().mockResolvedValue(Buffer.from('test data')),
    getObjectHash: jest.fn().mockResolvedValue('abc123'),
    verifyObject: jest.fn().mockResolvedValue(true),
    getTargetLayer: jest.fn().mockReturnValue('customer-data')
  }))
}));

describe('GCS Migration Integration', () => {
  let migrationService: MigrationService;
  const testDbPath = './test-integration-gcs.db';

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    migrationService = new MigrationService(testDbPath);
  });

  afterEach(() => {
    migrationService.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('migrateGCS', () => {
    it('should complete GCS migration in dry-run mode', async () => {
      // Mock GCS client
      const mockGCS = require('@google-cloud/storage');
      const mockFile = {
        name: 'file1.txt',
        getMetadata: jest.fn().mockResolvedValue([{
          size: '100',
          etag: 'etag1',
          updated: new Date().toISOString(),
          contentType: 'text/plain',
          metadata: {}
        }])
      };

      mockGCS.Storage.mockImplementation(() => ({
        bucket: jest.fn(() => ({
          getFiles: jest.fn().mockResolvedValue([[mockFile]])
        }))
      }));

      const job = await migrationService.migrateGCS({
        bucket: 'test-bucket',
        project: 'test-project',
        targetLayer: 'customer-data',
        concurrency: 2,
        dryRun: true,
        verify: false
      });

      expect(job.status).toBe(MigrationStatus.COMPLETED);
      expect(job.progress.totalObjects).toBe(1);
      expect(job.config.bucket).toBe('test-bucket');
    });

    it('should handle GCS migration with actual transfer', async () => {
      const mockGCS = require('@google-cloud/storage');
      const mockFile = {
        name: 'file1.txt',
        getMetadata: jest.fn().mockResolvedValue([{
          size: '9',
          etag: 'etag1',
          updated: new Date().toISOString()
        }]),
        download: jest.fn().mockResolvedValue([Buffer.from('test data')])
      };

      mockGCS.Storage.mockImplementation(() => ({
        bucket: jest.fn(() => ({
          getFiles: jest.fn().mockResolvedValue([[mockFile]]),
          file: jest.fn(() => mockFile)
        }))
      }));

      const job = await migrationService.migrateGCS({
        bucket: 'test-bucket',
        project: 'test-project',
        targetLayer: 'customer-data',
        concurrency: 1,
        dryRun: false,
        verify: false
      });

      expect(job.status).toBe(MigrationStatus.COMPLETED);
      expect(job.progress.processedObjects).toBeGreaterThan(0);
    });

    it('should handle multiple files', async () => {
      const mockGCS = require('@google-cloud/storage');
      const mockFiles = [
        {
          name: 'file1.txt',
          getMetadata: jest.fn().mockResolvedValue([{
            size: '100',
            etag: 'etag1',
            updated: new Date().toISOString()
          }])
        },
        {
          name: 'file2.txt',
          getMetadata: jest.fn().mockResolvedValue([{
            size: '200',
            etag: 'etag2',
            updated: new Date().toISOString()
          }])
        }
      ];

      mockGCS.Storage.mockImplementation(() => ({
        bucket: jest.fn(() => ({
          getFiles: jest.fn().mockResolvedValue([mockFiles])
        }))
      }));

      const job = await migrationService.migrateGCS({
        bucket: 'test-bucket',
        project: 'test-project',
        targetLayer: 'customer-data',
        concurrency: 2,
        dryRun: true,
        verify: false
      });

      expect(job.status).toBe(MigrationStatus.COMPLETED);
      expect(job.progress.totalObjects).toBe(2);
    });
  });
});
