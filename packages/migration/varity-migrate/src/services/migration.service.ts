import {
  MigrationJob,
  MigrationStatus,
  MigrationProgress,
  MigrationResult,
  MigrationConfig,
  SourceType,
  TargetType,
  ObjectMetadata
} from '../types';
import { S3SourceService } from './s3-source.service';
import { GCSSourceService } from './gcs-source.service';
import { VarityTargetService } from './varity-target.service';
import { MigrationDatabase } from '../db/migration-db';
import { ProgressTracker, SpeedCalculator } from '../utils/progress';
import { Verifier } from '../utils/verification';
import { CheckpointManager } from '../utils/checkpoint';

export class MigrationService {
  private db: MigrationDatabase;
  private progress: ProgressTracker;
  private verifier: Verifier;
  private checkpointManager: CheckpointManager;

  constructor(dbPath?: string) {
    this.db = new MigrationDatabase(dbPath);
    this.progress = new ProgressTracker();
    this.verifier = new Verifier();
    this.checkpointManager = new CheckpointManager(this.db);
  }

  async migrateS3(options: MigrationConfig): Promise<MigrationJob> {
    const job = await this.db.createJob({
      source: SourceType.AWS_S3,
      target: TargetType.VARITY_FILECOIN,
      config: options
    });

    try {
      await this.db.updateJob(job.id, { status: MigrationStatus.IN_PROGRESS });

      const source = new S3SourceService({
        bucket: options.bucket,
        region: options.region || 'us-east-1'
      });

      const target = new VarityTargetService({
        targetLayer: options.targetLayer
      });

      const results = await this.performMigration(
        job.id,
        source,
        target,
        options
      );

      if (options.verify && !options.dryRun) {
        console.log('\nVerifying migration...');
        const verification = await this.verifier.verifyBatch(results);
        console.log(this.verifier.generateVerificationReport(results));

        if (verification.failed > 0) {
          throw new Error(`Verification failed for ${verification.failed} objects`);
        }
      }

      await this.db.updateJob(job.id, { status: MigrationStatus.COMPLETED });
      return await this.db.getJob(job.id);
    } catch (error) {
      await this.db.updateJob(job.id, {
        status: MigrationStatus.FAILED,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async migrateGCS(options: MigrationConfig): Promise<MigrationJob> {
    const job = await this.db.createJob({
      source: SourceType.GOOGLE_GCS,
      target: TargetType.VARITY_FILECOIN,
      config: options
    });

    try {
      await this.db.updateJob(job.id, { status: MigrationStatus.IN_PROGRESS });

      const source = new GCSSourceService({
        bucket: options.bucket,
        project: options.project
      });

      const target = new VarityTargetService({
        targetLayer: options.targetLayer
      });

      const results = await this.performMigration(
        job.id,
        source,
        target,
        options
      );

      if (options.verify && !options.dryRun) {
        console.log('\nVerifying migration...');
        const verification = await this.verifier.verifyBatch(results);
        console.log(this.verifier.generateVerificationReport(results));

        if (verification.failed > 0) {
          throw new Error(`Verification failed for ${verification.failed} objects`);
        }
      }

      await this.db.updateJob(job.id, { status: MigrationStatus.COMPLETED });
      return await this.db.getJob(job.id);
    } catch (error) {
      await this.db.updateJob(job.id, {
        status: MigrationStatus.FAILED,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async performMigration(
    jobId: string,
    source: S3SourceService | GCSSourceService,
    target: VarityTargetService,
    options: MigrationConfig
  ): Promise<MigrationResult[]> {
    // List all objects
    console.log(`\nListing objects from ${source.getBucketName()}...`);
    const objects = await source.listObjects(options.prefix);
    const totalSize = objects.reduce((sum, obj) => sum + obj.size, 0);

    console.log(`Found ${objects.length} objects (${(totalSize / (1024 * 1024)).toFixed(2)} MB)`);

    if (options.dryRun) {
      console.log('\nDry run mode - no data will be transferred');
    }

    // Update job progress
    await this.db.updateJob(jobId, {
      progress: {
        totalObjects: objects.length,
        totalBytes: totalSize,
        processedObjects: 0,
        processedBytes: 0,
        failedObjects: 0,
        startTime: new Date()
      }
    });

    // Check for existing checkpoints (resume capability)
    const processedKeys = this.checkpointManager.getProcessedKeys(jobId);
    const remainingObjects = objects.filter(obj => !processedKeys.has(obj.key));

    if (processedKeys.size > 0) {
      console.log(`\nResuming from checkpoint: ${processedKeys.size} objects already processed`);
    }

    // Migrate objects
    const results = await this.migrateObjects(
      jobId,
      source,
      target,
      remainingObjects,
      options.concurrency,
      options.dryRun
    );

    // Add already processed objects to results
    for (const key of processedKeys) {
      results.unshift({
        key,
        success: true,
        cid: 'cached'
      });
    }

    return results;
  }

  private async migrateObjects(
    jobId: string,
    source: S3SourceService | GCSSourceService,
    target: VarityTargetService,
    objects: ObjectMetadata[],
    concurrency: number,
    dryRun: boolean
  ): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    const progressBar = this.progress.create(objects.length, 'Migration Progress');
    const speedCalc = new SpeedCalculator();

    let processedCount = 0;
    let processedBytes = 0;

    for (let i = 0; i < objects.length; i += concurrency) {
      const batch = objects.slice(i, i + concurrency);

      const batchResults = await Promise.all(
        batch.map(async (obj) => {
          try {
            let result: MigrationResult = {
              key: obj.key,
              success: true
            };

            if (!dryRun) {
              // Download from source
              const data = await source.getObject(obj.key);
              const sourceHash = this.verifier.calculateHash(data);

              // Upload to target
              const uploadResult = await target.putObject(obj.key, data, obj.metadata);

              // Verify immediately if small object
              let targetHash: string | undefined;
              if (data.length < 10 * 1024 * 1024) {
                // Only verify small objects inline
                targetHash = await target.getObjectHash(uploadResult.cid);
              }

              result = {
                key: obj.key,
                success: true,
                cid: uploadResult.cid,
                sourceHash,
                targetHash
              };

              // Save checkpoint
              await this.checkpointManager.save(jobId, obj.key, uploadResult.cid);
            }

            // Update progress
            processedCount++;
            processedBytes += obj.size;
            speedCalc.update(processedCount);

            await this.db.updateJob(jobId, {
              progress: {
                processedObjects: processedCount,
                processedBytes: processedBytes,
                failedObjects: 0,
                totalObjects: objects.length,
                totalBytes: objects.reduce((sum, o) => sum + o.size, 0)
              }
            });

            this.progress.update(processedCount, speedCalc.getSpeed());

            return result;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            await this.db.logError(jobId, obj.key, errorMsg);

            processedCount++;
            await this.db.updateJob(jobId, {
              progress: {
                processedObjects: processedCount,
                processedBytes: processedBytes,
                failedObjects: (await this.db.getJob(jobId)).progress.failedObjects + 1,
                totalObjects: objects.length,
                totalBytes: objects.reduce((sum, o) => sum + o.size, 0)
              }
            });

            this.progress.update(processedCount, speedCalc.getSpeed());

            return {
              key: obj.key,
              success: false,
              error: errorMsg
            };
          }
        })
      );

      results.push(...batchResults);
    }

    this.progress.stop();

    return results;
  }

  async getJobStatus(jobId: string): Promise<MigrationJob> {
    return this.db.getJob(jobId);
  }

  async verifyJob(jobId: string): Promise<void> {
    const job = this.db.getJob(jobId);
    const checkpoints = this.db.getCheckpoints(jobId);

    console.log(`\nVerifying ${checkpoints.length} migrated objects...`);

    const target = new VarityTargetService({
      targetLayer: job.config.targetLayer
    });

    let source: S3SourceService | GCSSourceService;
    if (job.source === SourceType.AWS_S3) {
      source = new S3SourceService({
        bucket: job.config.bucket,
        region: job.config.region || 'us-east-1'
      });
    } else {
      source = new GCSSourceService({
        bucket: job.config.bucket,
        project: job.config.project
      });
    }

    const results: MigrationResult[] = [];
    const progressBar = this.progress.create(checkpoints.length, 'Verification Progress');

    for (const checkpoint of checkpoints) {
      try {
        const sourceHash = await source.getObjectHash(checkpoint.objectKey);
        const targetHash = await target.getObjectHash(checkpoint.cid);

        const verification = await this.verifier.verifyIntegrity(
          sourceHash,
          targetHash,
          checkpoint.objectKey
        );

        results.push({
          key: checkpoint.objectKey,
          success: verification.valid,
          sourceHash,
          targetHash,
          error: verification.error
        });

        progressBar.increment();
      } catch (error) {
        results.push({
          key: checkpoint.objectKey,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        progressBar.increment();
      }
    }

    this.progress.stop();
    console.log(this.verifier.generateVerificationReport(results));
  }

  close(): void {
    this.db.close();
  }
}
