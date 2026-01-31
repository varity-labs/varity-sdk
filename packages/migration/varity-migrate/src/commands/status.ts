import chalk from 'chalk';
import { MigrationService } from '../services/migration.service';

export async function statusCommand(options: any): Promise<void> {
  try {
    const migrationService = new MigrationService();
    const job = await migrationService.getJobStatus(options.jobId);

    console.log(chalk.cyan('\n=== Migration Job Status ==='));
    console.log(`Job ID: ${job.id}`);
    console.log(`Source: ${job.source}`);
    console.log(`Target: ${job.target}`);
    console.log(`Status: ${getStatusColor(job.status)(job.status)}`);

    console.log(chalk.cyan('\n=== Configuration ==='));
    console.log(`Bucket: ${job.config.bucket}`);
    if (job.config.prefix) console.log(`Prefix: ${job.config.prefix}`);
    if (job.config.region) console.log(`Region: ${job.config.region}`);
    console.log(`Target Layer: ${job.config.targetLayer}`);

    console.log(chalk.cyan('\n=== Progress ==='));
    console.log(`Total Objects: ${job.progress.totalObjects}`);
    console.log(`Processed: ${job.progress.processedObjects} (${getProgressPercentage(job.progress)}%)`);
    console.log(`Failed: ${job.progress.failedObjects}`);
    console.log(`Total Size: ${(job.progress.totalBytes / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Processed Size: ${(job.progress.processedBytes / (1024 * 1024)).toFixed(2)} MB`);

    console.log(chalk.cyan('\n=== Timestamps ==='));
    console.log(`Created: ${job.createdAt.toISOString()}`);
    console.log(`Updated: ${job.updatedAt.toISOString()}`);
    if (job.completedAt) {
      console.log(`Completed: ${job.completedAt.toISOString()}`);
    }

    if (job.progress.startTime) {
      const elapsed = job.progress.endTime
        ? (job.progress.endTime.getTime() - job.progress.startTime.getTime()) / 1000
        : (Date.now() - job.progress.startTime.getTime()) / 1000;
      console.log(`Duration: ${elapsed.toFixed(2)} seconds`);
    }

    if (job.error) {
      console.log(chalk.red('\n=== Error ==='));
      console.log(chalk.red(job.error));
    }

    migrationService.close();
  } catch (error) {
    console.error(chalk.red('\n✗ Failed to get job status:'), error);
    process.exit(1);
  }
}

function getStatusColor(status: string): (text: string) => string {
  switch (status) {
    case 'COMPLETED':
      return chalk.green;
    case 'FAILED':
      return chalk.red;
    case 'IN_PROGRESS':
      return chalk.yellow;
    default:
      return chalk.gray;
  }
}

function getProgressPercentage(progress: any): string {
  if (progress.totalObjects === 0) return '0';
  return ((progress.processedObjects / progress.totalObjects) * 100).toFixed(2);
}
