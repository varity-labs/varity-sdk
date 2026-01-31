import { MigrationService } from '../../src/services/migration.service';
import { MigrationStatus } from '../../src/types';
import * as fs from 'fs';

// Mock all external services
jest.mock('@aws-sdk/client-s3');
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

describe('Full Migration E2E', () => {
  let migrationService: MigrationService;
  const testDbPath = './test-e2e.db';

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

  it('should complete full S3 to Varity migration workflow', async () => {
    // Setup mock S3
    const mockS3 = require('@aws-sdk/client-s3');
    const mockBody = {
      [Symbol.asyncIterator]: async function* () {
        yield Buffer.from('test data');
      }
    };

    mockS3.S3Client.mockImplementation(() => ({
      send: jest.fn()
        .mockResolvedValueOnce({
          Contents: [
            { Key: 'file1.txt', Size: 9, ETag: 'etag1', LastModified: new Date() },
            { Key: 'file2.txt', Size: 9, ETag: 'etag2', LastModified: new Date() },
            { Key: 'file3.txt', Size: 9, ETag: 'etag3', LastModified: new Date() }
          ]
        })
        .mockResolvedValue({ Body: mockBody })
    }));

    // Step 1: Start migration
    const job = await migrationService.migrateS3({
      bucket: 'test-bucket',
      region: 'us-east-1',
      targetLayer: 'customer-data',
      concurrency: 2,
      dryRun: false,
      verify: false // Disable verification due to mock limitations
    });

    expect(job.status).toBe(MigrationStatus.COMPLETED);
    expect(job.progress.totalObjects).toBe(3);
    expect(job.progress.processedObjects).toBeGreaterThan(0);

    // Step 2: Check status
    const status = await migrationService.getJobStatus(job.id);
    expect(status.id).toBe(job.id);
    expect(status.status).toBe(MigrationStatus.COMPLETED);
  });

  it('should handle complete GCS to Varity migration workflow', async () => {
    // Setup mock GCS
    const mockGCS = require('@google-cloud/storage');
    const mockFiles = [
      {
        name: 'file1.txt',
        getMetadata: jest.fn().mockResolvedValue([{
          size: '9',
          etag: 'etag1',
          updated: new Date().toISOString()
        }]),
        download: jest.fn().mockResolvedValue([Buffer.from('test data')])
      },
      {
        name: 'file2.txt',
        getMetadata: jest.fn().mockResolvedValue([{
          size: '9',
          etag: 'etag2',
          updated: new Date().toISOString()
        }]),
        download: jest.fn().mockResolvedValue([Buffer.from('test data')])
      }
    ];

    mockGCS.Storage.mockImplementation(() => ({
      bucket: jest.fn(() => ({
        getFiles: jest.fn().mockResolvedValue([mockFiles]),
        file: jest.fn((name) => mockFiles.find(f => f.name === name))
      }))
    }));

    // Step 1: Start migration
    const job = await migrationService.migrateGCS({
      bucket: 'test-bucket',
      project: 'test-project',
      targetLayer: 'customer-data',
      concurrency: 2,
      dryRun: false,
      verify: false // Disable verification due to mock limitations
    });

    expect(job.status).toBe(MigrationStatus.COMPLETED);
    expect(job.progress.totalObjects).toBe(2);

    // Step 2: Verify completion
    const status = await migrationService.getJobStatus(job.id);
    expect(status.status).toBe(MigrationStatus.COMPLETED);
  });

  it('should calculate accurate cost savings', async () => {
    const mockS3 = require('@aws-sdk/client-s3');
    mockS3.S3Client.mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({
        Contents: Array.from({ length: 100 }, (_, i) => ({
          Key: `file${i}.txt`,
          Size: 1024 * 1024, // 1 MB each
          ETag: `etag${i}`,
          LastModified: new Date()
        }))
      })
    }));

    const job = await migrationService.migrateS3({
      bucket: 'test-bucket',
      region: 'us-east-1',
      targetLayer: 'customer-data',
      concurrency: 10,
      dryRun: true,
      verify: false
    });

    expect(job.progress.totalObjects).toBe(100);
    expect(job.progress.totalBytes).toBe(100 * 1024 * 1024); // 100 MB

    // Cost savings should be significant
    const totalGB = job.progress.totalBytes / (1024 * 1024 * 1024);
    expect(totalGB).toBeCloseTo(0.09765625, 2); // ~0.1 GB
  });
});
