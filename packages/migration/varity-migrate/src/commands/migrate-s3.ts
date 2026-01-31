import chalk from 'chalk';
import ora from 'ora';
import { MigrationService } from '../services/migration.service';
import { CostEstimator } from '../utils/cost-estimator';
import { S3SourceService } from '../services/s3-source.service';

export async function migrateS3Command(options: any): Promise<void> {
  const spinner = ora('Initializing S3 migration...').start();

  try {
    const migrationService = new MigrationService();

    // Calculate cost estimate
    spinner.text = 'Calculating cost estimate...';
    const source = new S3SourceService({
      bucket: options.bucket,
      region: options.region
    });

    const totalSize = await source.getTotalSize(options.prefix);
    const storageGB = totalSize / (1024 * 1024 * 1024);

    const costEstimator = new CostEstimator();
    const estimate = costEstimator.estimateS3Cost(storageGB);

    spinner.stop();
    console.log(chalk.cyan('\n=== Migration Configuration ==='));
    console.log(`Source: AWS S3 (${options.bucket})`);
    console.log(`Region: ${options.region}`);
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
      region: options.region,
      targetLayer: options.targetLayer,
      concurrency: parseInt(options.concurrency, 10),
      dryRun: options.dryRun || false,
      verify: options.verify || false
    };

    const job = await migrationService.migrateS3(config);

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
