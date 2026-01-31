import { MigrationDatabase } from '../db/migration-db';
import { Checkpoint } from '../types';

export class CheckpointManager {
  private db: MigrationDatabase;

  constructor(db: MigrationDatabase) {
    this.db = db;
  }

  async save(jobId: string, objectKey: string, cid: string): Promise<void> {
    await this.db.saveCheckpoint(jobId, objectKey, cid);
  }

  getProcessedKeys(jobId: string): Set<string> {
    const checkpoints = this.db.getCheckpoints(jobId);
    return new Set(checkpoints.map(c => c.objectKey));
  }

  hasCheckpoint(jobId: string, objectKey: string): boolean {
    const processed = this.getProcessedKeys(jobId);
    return processed.has(objectKey);
  }

  getCheckpointCount(jobId: string): number {
    return this.db.getCheckpoints(jobId).length;
  }

  getLastCheckpoint(jobId: string): Checkpoint | null {
    const checkpoints = this.db.getCheckpoints(jobId);
    if (checkpoints.length === 0) return null;

    return checkpoints.reduce((latest, current) => {
      return current.timestamp > latest.timestamp ? current : latest;
    });
  }
}
