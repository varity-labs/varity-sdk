import chalk from 'chalk';
import ora from 'ora';
import { MigrationService } from '../services/migration.service';
import { CostEstimator } from '../utils/cost-estimator';
import { GCSSourceService } from '../services/gcs-source.service';

export async function migrateGCSCommand(options: any): Promise<void> {
  const spinner = ora('Initializing GCS migration...').start();

  try {
    const migrationService = new MigrationService();

    // Calculate cost estimate
    spinner.text = 'Calculating cost estimate...';
    const source = new GCSSourceService({
      bucket: options.bucket,
      project: options.project
    });

    const totalSize = await source.getTotalSize(options.prefix);
    const storageGB = totalSize / (1024 * 1024 * 1024);

    const costEstimator = new CostEstimator();
    const estimate = costEstimator.estimateGCSCost(storageGB);

    spinner.stop();
    console.log(chalk.cyan('\n=== Migration Configuration ==='));
    console.log(`Source: Google Cloud Storage (${options.bucket})`);
    if (options.project) console.log(`Project: ${options.project}`);
    if (options.prefix) console.log(`Prefix: ${options.prefix}`);
    console.log(`Target Layer: ${options.targetLayer}`);
    console.log(`Concurrency: ${options.concurrency}`);
    console.log(`Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
    console.log(`Verify: ${options.verify ? 'Yes' : 'No'}`);

    console.log(costEstimator.generateCostReport(estimate));

    spinner.start('Starting migration...');

    const config = {
      bucket: options.bucket,
      prefix: options.prefix,
      project: options.project,
      targetLayer: options.targetLayer,
      concurrency: parseInt(options.concurrency, 10),
      dryRun: options.dryRun || false,
      verify: options.verify || false
    };

    const job = await migrationService.migrateGCS(config);

    spinner.stop();

    if (job.status === 'COMPLETED') {
      console.log(chalk.green('\n✓ Migration completed successfully!'));
      console.log(chalk.cyan('\n=== Migration Summary ==='));
      console.log(`Job ID: ${job.id}`);
      console.log(`Total Objects: ${job.progress.totalObjects}`);
      console.log(`Processed: ${job.progress.processedObjects}`);
      console.log(`Failed: ${job.progress.failedObjects}`);
      console.log(`Total Size: ${(job.progress.totalBytes / (1024 * 1024)).toFixed(2)} MB`);

      if (job.progress.startTime && job.progress.endTime) {
        const duration = (job.progress.endTime.getTime() - job.progress.startTime.getTime()) / 1000;
        console.log(`Duration: ${duration.toFixed(2)} seconds`);
      }
    } else {
      console.log(chalk.red('\n✗ Migration failed'));
      if (job.error) {
        console.log(chalk.red(`Error: ${job.error}`));
      }
    }

    migrationService.close();
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('\n✗ Migration failed:'), error);
    process.exit(1);
  }
}
