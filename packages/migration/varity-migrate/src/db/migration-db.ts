import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import {
  MigrationJob,
  MigrationStatus,
  SourceType,
  TargetType,
  MigrationConfig,
  MigrationProgress,
  Checkpoint
} from '../types';

export class MigrationDatabase {
  private db: Database.Database;

  constructor(dbPath: string = './varity-migrate.db') {
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    // Create jobs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migration_jobs (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        target TEXT NOT NULL,
        config TEXT NOT NULL,
        status TEXT NOT NULL,
        progress TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        error TEXT
      )
    `);

    // Create checkpoints table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS checkpoints (
        job_id TEXT NOT NULL,
        object_key TEXT NOT NULL,
        cid TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        PRIMARY KEY (job_id, object_key),
        FOREIGN KEY (job_id) REFERENCES migration_jobs(id)
      )
    `);

    // Create errors table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migration_errors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL,
        object_key TEXT NOT NULL,
        error_message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (job_id) REFERENCES migration_jobs(id)
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON migration_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_checkpoints_job_id ON checkpoints(job_id);
      CREATE INDEX IF NOT EXISTS idx_errors_job_id ON migration_errors(job_id);
    `);
  }

  async createJob(params: {
    source: SourceType;
    target: TargetType;
    config: MigrationConfig;
  }): Promise<MigrationJob> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const progress: MigrationProgress = {
      totalObjects: 0,
      totalBytes: 0,
      processedObjects: 0,
      processedBytes: 0,
      failedObjects: 0
    };

    const stmt = this.db.prepare(`
      INSERT INTO migration_jobs (
        id, source, target, config, status, progress, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      params.source,
      params.target,
      JSON.stringify(params.config),
      MigrationStatus.PENDING,
      JSON.stringify(progress),
      now,
      now
    );

    return this.getJob(id);
  }

  getJob(id: string): MigrationJob {
    const stmt = this.db.prepare('SELECT * FROM migration_jobs WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      throw new Error(`Job not found: ${id}`);
    }

    return {
      id: row.id,
      source: row.source as SourceType,
      target: row.target as TargetType,
      config: JSON.parse(row.config),
      status: row.status as MigrationStatus,
      progress: JSON.parse(row.progress),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      error: row.error
    };
  }

  async updateJob(id: string, updates: Partial<MigrationJob>): Promise<void> {
    const current = this.getJob(id);
    const now = new Date().toISOString();

    const newStatus = updates.status || current.status;
    const newProgress = updates.progress
      ? JSON.stringify({ ...current.progress, ...updates.progress })
      : JSON.stringify(current.progress);
    const completedAt = newStatus === MigrationStatus.COMPLETED ? now : current.completedAt?.toISOString();

    const stmt = this.db.prepare(`
      UPDATE migration_jobs
      SET status = ?, progress = ?, updated_at = ?, completed_at = ?, error = ?
      WHERE id = ?
    `);

    stmt.run(
      newStatus,
      newProgress,
      now,
      completedAt,
      updates.error || null,
      id
    );
  }

  async saveCheckpoint(jobId: string, objectKey: string, cid: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO checkpoints (job_id, object_key, cid, timestamp)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(jobId, objectKey, cid, new Date().toISOString());
  }

  getCheckpoints(jobId: string): Checkpoint[] {
    const stmt = this.db.prepare('SELECT * FROM checkpoints WHERE job_id = ?');
    const rows = stmt.all(jobId) as any[];

    return rows.map(row => ({
      jobId: row.job_id,
      objectKey: row.object_key,
      cid: row.cid,
      timestamp: new Date(row.timestamp)
    }));
  }

  async logError(jobId: string, objectKey: string, errorMessage: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO migration_errors (job_id, object_key, error_message, timestamp)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(jobId, objectKey, errorMessage, new Date().toISOString());
  }

  getErrors(jobId: string): Array<{ objectKey: string; error: string; timestamp: Date }> {
    const stmt = this.db.prepare('SELECT * FROM migration_errors WHERE job_id = ?');
    const rows = stmt.all(jobId) as any[];

    return rows.map(row => ({
      objectKey: row.object_key,
      error: row.error_message,
      timestamp: new Date(row.timestamp)
    }));
  }

  listJobs(status?: MigrationStatus): MigrationJob[] {
    let stmt;
    let rows;

    if (status) {
      stmt = this.db.prepare('SELECT * FROM migration_jobs WHERE status = ? ORDER BY created_at DESC');
      rows = stmt.all(status) as any[];
    } else {
      stmt = this.db.prepare('SELECT * FROM migration_jobs ORDER BY created_at DESC');
      rows = stmt.all() as any[];
    }

    return rows.map(row => ({
      id: row.id,
      source: row.source as SourceType,
      target: row.target as TargetType,
      config: JSON.parse(row.config),
      status: row.status as MigrationStatus,
      progress: JSON.parse(row.progress),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      error: row.error
    }));
  }

  close(): void {
    this.db.close();
  }
}
