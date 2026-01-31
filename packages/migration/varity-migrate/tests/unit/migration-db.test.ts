import { MigrationDatabase } from '../../src/db/migration-db';
import { MigrationStatus, SourceType, TargetType } from '../../src/types';
import * as fs from 'fs';

describe('MigrationDatabase', () => {
  let db: MigrationDatabase;
  const testDbPath = './test-migrate.db';

  beforeEach(() => {
    // Remove existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new MigrationDatabase(testDbPath);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('createJob', () => {
    it('should create a new migration job', async () => {
      const job = await db.createJob({
        source: SourceType.AWS_S3,
        target: TargetType.VARITY_FILECOIN,
        config: {
          bucket: 'test-bucket',
          targetLayer: 'customer-data',
          concurrency: 10,
          dryRun: false,
          verify: false
        }
      });

      expect(job.id).toBeDefined();
      expect(job.source).toBe(SourceType.AWS_S3);
      expect(job.target).toBe(TargetType.VARITY_FILECOIN);
      expect(job.status).toBe(MigrationStatus.PENDING);
      expect(job.config.bucket).toBe('test-bucket');
    });
  });

  describe('getJob', () => {
    it('should retrieve an existing job', async () => {
      const created = await db.createJob({
        source: SourceType.AWS_S3,
        target: TargetType.VARITY_FILECOIN,
        config: {
          bucket: 'test-bucket',
          targetLayer: 'customer-data',
          concurrency: 10,
          dryRun: false,
          verify: false
        }
      });

      const retrieved = db.getJob(created.id);
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.config.bucket).toBe('test-bucket');
    });

    it('should throw error for non-existent job', () => {
      expect(() => db.getJob('non-existent')).toThrow('Job not found');
    });
  });

  describe('updateJob', () => {
    it('should update job status', async () => {
      const job = await db.createJob({
        source: SourceType.AWS_S3,
        target: TargetType.VARITY_FILECOIN,
        config: {
          bucket: 'test-bucket',
          targetLayer: 'customer-data',
          concurrency: 10,
          dryRun: false,
          verify: false
        }
      });

      await db.updateJob(job.id, { status: MigrationStatus.IN_PROGRESS });

      const updated = db.getJob(job.id);
      expect(updated.status).toBe(MigrationStatus.IN_PROGRESS);
    });

    it('should update job progress', async () => {
      const job = await db.createJob({
        source: SourceType.AWS_S3,
        target: TargetType.VARITY_FILECOIN,
        config: {
          bucket: 'test-bucket',
          targetLayer: 'customer-data',
          concurrency: 10,
          dryRun: false,
          verify: false
        }
      });

      await db.updateJob(job.id, {
        progress: {
          totalObjects: 100,
          totalBytes: 1000000,
          processedObjects: 50,
          processedBytes: 500000,
          failedObjects: 2
        }
      });

      const updated = db.getJob(job.id);
      expect(updated.progress.totalObjects).toBe(100);
      expect(updated.progress.processedObjects).toBe(50);
      expect(updated.progress.failedObjects).toBe(2);
    });
  });

  describe('saveCheckpoint', () => {
    it('should save a checkpoint', async () => {
      const job = await db.createJob({
        source: SourceType.AWS_S3,
        target: TargetType.VARITY_FILECOIN,
        config: {
          bucket: 'test-bucket',
          targetLayer: 'customer-data',
          concurrency: 10,
          dryRun: false,
          verify: false
        }
      });

      await db.saveCheckpoint(job.id, 'file1.txt', 'QmTest123');

      const checkpoints = db.getCheckpoints(job.id);
      expect(checkpoints.length).toBe(1);
      expect(checkpoints[0].objectKey).toBe('file1.txt');
      expect(checkpoints[0].cid).toBe('QmTest123');
    });

    it('should replace existing checkpoint for same key', async () => {
      const job = await db.createJob({
        source: SourceType.AWS_S3,
        target: TargetType.VARITY_FILECOIN,
        config: {
          bucket: 'test-bucket',
          targetLayer: 'customer-data',
          concurrency: 10,
          dryRun: false,
          verify: false
        }
      });

      await db.saveCheckpoint(job.id, 'file1.txt', 'QmTest123');
      await db.saveCheckpoint(job.id, 'file1.txt', 'QmTest456');

      const checkpoints = db.getCheckpoints(job.id);
      expect(checkpoints.length).toBe(1);
      expect(checkpoints[0].cid).toBe('QmTest456');
    });
  });

  describe('logError', () => {
    it('should log migration errors', async () => {
      const job = await db.createJob({
        source: SourceType.AWS_S3,
        target: TargetType.VARITY_FILECOIN,
        config: {
          bucket: 'test-bucket',
          targetLayer: 'customer-data',
          concurrency: 10,
          dryRun: false,
          verify: false
        }
      });

      await db.logError(job.id, 'file1.txt', 'Upload failed');
      await db.logError(job.id, 'file2.txt', 'Connection timeout');

      const errors = db.getErrors(job.id);
      expect(errors.length).toBe(2);
      expect(errors[0].objectKey).toBe('file1.txt');
      expect(errors[0].error).toBe('Upload failed');
    });
  });

  describe('listJobs', () => {
    it('should list all jobs', async () => {
      await db.createJob({
        source: SourceType.AWS_S3,
        target: TargetType.VARITY_FILECOIN,
        config: {
          bucket: 'test-bucket-1',
          targetLayer: 'customer-data',
          concurrency: 10,
          dryRun: false,
          verify: false
        }
      });

      await db.createJob({
        source: SourceType.GOOGLE_GCS,
        target: TargetType.VARITY_FILECOIN,
        config: {
          bucket: 'test-bucket-2',
          targetLayer: 'customer-data',
          concurrency: 10,
          dryRun: false,
          verify: false
        }
      });

      const jobs = db.listJobs();
      expect(jobs.length).toBe(2);
    });

    it('should filter jobs by status', async () => {
      const job1 = await db.createJob({
        source: SourceType.AWS_S3,
        target: TargetType.VARITY_FILECOIN,
        config: {
          bucket: 'test-bucket-1',
          targetLayer: 'customer-data',
          concurrency: 10,
          dryRun: false,
          verify: false
        }
      });

      const job2 = await db.createJob({
        source: SourceType.GOOGLE_GCS,
        target: TargetType.VARITY_FILECOIN,
        config: {
          bucket: 'test-bucket-2',
          targetLayer: 'customer-data',
          concurrency: 10,
          dryRun: false,
          verify: false
        }
      });

      await db.updateJob(job1.id, { status: MigrationStatus.COMPLETED });

      const completedJobs = db.listJobs(MigrationStatus.COMPLETED);
      expect(completedJobs.length).toBe(1);
      expect(completedJobs[0].id).toBe(job1.id);

      const pendingJobs = db.listJobs(MigrationStatus.PENDING);
      expect(pendingJobs.length).toBe(1);
      expect(pendingJobs[0].id).toBe(job2.id);
    });
  });
});
