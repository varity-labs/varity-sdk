import chalk from 'chalk';
import ora from 'ora';
import { MigrationService } from '../services/migration.service';

export async function verifyCommand(options: any): Promise<void> {
  const spinner = ora('Starting verification...').start();

  try {
    const migrationService = new MigrationService();

    spinner.stop();
    await migrationService.verifyJob(options.jobId);

    console.log(chalk.green('\n✓ Verification complete!'));

    migrationService.close();
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('\n✗ Verification failed:'), error);
    process.exit(1);
  }
}
