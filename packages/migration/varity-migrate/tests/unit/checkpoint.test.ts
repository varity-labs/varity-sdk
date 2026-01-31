import { CheckpointManager } from '../../src/utils/checkpoint';
import { MigrationDatabase } from '../../src/db/migration-db';
import { SourceType, TargetType } from '../../src/types';
import * as fs from 'fs';

describe('CheckpointManager', () => {
  let db: MigrationDatabase;
  let checkpointManager: CheckpointManager;
  const testDbPath = './test-checkpoint.db';
  let jobId: string;

  beforeEach(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new MigrationDatabase(testDbPath);
    checkpointManager = new CheckpointManager(db);

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
    jobId = job.id;
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('save', () => {
    it('should save a checkpoint', async () => {
      await checkpointManager.save(jobId, 'file1.txt', 'QmTest123');

      const checkpoints = db.getCheckpoints(jobId);
      expect(checkpoints.length).toBe(1);
      expect(checkpoints[0].objectKey).toBe('file1.txt');
    });

    it('should save multiple checkpoints', async () => {
      await checkpointManager.save(jobId, 'file1.txt', 'QmTest123');
      await checkpointManager.save(jobId, 'file2.txt', 'QmTest456');
      await checkpointManager.save(jobId, 'file3.txt', 'QmTest789');

      const checkpoints = db.getCheckpoints(jobId);
      expect(checkpoints.length).toBe(3);
    });
  });

  describe('getProcessedKeys', () => {
    it('should return empty set for job with no checkpoints', () => {
      const processed = checkpointManager.getProcessedKeys(jobId);

      expect(processed.size).toBe(0);
    });

    it('should return set of processed keys', async () => {
      await checkpointManager.save(jobId, 'file1.txt', 'QmTest123');
      await checkpointManager.save(jobId, 'file2.txt', 'QmTest456');

      const processed = checkpointManager.getProcessedKeys(jobId);

      expect(processed.size).toBe(2);
      expect(processed.has('file1.txt')).toBe(true);
      expect(processed.has('file2.txt')).toBe(true);
      expect(processed.has('file3.txt')).toBe(false);
    });
  });

  describe('hasCheckpoint', () => {
    it('should return false for non-existent checkpoint', () => {
      const exists = checkpointManager.hasCheckpoint(jobId, 'file1.txt');

      expect(exists).toBe(false);
    });

    it('should return true for existing checkpoint', async () => {
      await checkpointManager.save(jobId, 'file1.txt', 'QmTest123');

      const exists = checkpointManager.hasCheckpoint(jobId, 'file1.txt');

      expect(exists).toBe(true);
    });
  });

  describe('getCheckpointCount', () => {
    it('should return 0 for job with no checkpoints', () => {
      const count = checkpointManager.getCheckpointCount(jobId);

      expect(count).toBe(0);
    });

    it('should return correct count', async () => {
      await checkpointManager.save(jobId, 'file1.txt', 'QmTest123');
      await checkpointManager.save(jobId, 'file2.txt', 'QmTest456');
      await checkpointManager.save(jobId, 'file3.txt', 'QmTest789');

      const count = checkpointManager.getCheckpointCount(jobId);

      expect(count).toBe(3);
    });
  });

  describe('getLastCheckpoint', () => {
    it('should return null for job with no checkpoints', () => {
      const last = checkpointManager.getLastCheckpoint(jobId);

      expect(last).toBeNull();
    });

    it('should return most recent checkpoint', async () => {
      await checkpointManager.save(jobId, 'file1.txt', 'QmTest123');
      await new Promise(resolve => setTimeout(resolve, 10));
      await checkpointManager.save(jobId, 'file2.txt', 'QmTest456');
      await new Promise(resolve => setTimeout(resolve, 10));
      await checkpointManager.save(jobId, 'file3.txt', 'QmTest789');

      const last = checkpointManager.getLastCheckpoint(jobId);

      expect(last).not.toBeNull();
      expect(last?.objectKey).toBe('file3.txt');
      expect(last?.cid).toBe('QmTest789');
    });
  });
});
