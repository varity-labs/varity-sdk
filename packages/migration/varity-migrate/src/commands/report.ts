/**
 * Report Command
 *
 * CLI command to generate migration compatibility report
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import { ChainVerifier } from '../verification/chainVerifier';
import { ContractVerifier } from '../verification/contractVerifier';
import { DataIntegrityVerifier } from '../verification/dataIntegrity';
import { PreFlightChecker } from '../preflight/checks';
import {
  MigrationReportGenerator,
  formatMigrationReport
} from '../reports/migrationReport';
import { VARITY_L3_CHAIN } from '../chains/chainConfig';

interface ReportOptions {
  sourceChain: string;
  destChain?: string;
  contracts?: string;
  wallet?: string;
  sourceRpc?: string;
  destRpc?: string;
  output?: string;
  format?: 'console' | 'json' | 'markdown';
}

export async function reportCommand(options: ReportOptions) {
  const spinner = ora('Generating migration report...').start();

  try {
    const sourceChainId = parseInt(options.sourceChain);
    const destChainId = options.destChain
      ? parseInt(options.destChain)
      : VARITY_L3_CHAIN.chainId;

    const contractAddresses = options.contracts
      ? options.contracts.split(',').map(addr => addr.trim())
      : undefined;

    // Initialize verifiers
    const chainVerifier = new ChainVerifier();
    const contractVerifier = new ContractVerifier();
    const preFlightChecker = new PreFlightChecker();
    const reportGenerator = new MigrationReportGenerator();

    spinner.text = 'Verifying chains...';

    // Verify chains
    const chainVerification = await chainVerifier.verifyMigrationChains(
      sourceChainId,
      destChainId,
      options.sourceRpc,
      options.destRpc
    );

    // Verify contracts if provided
    let contractResults;
    if (contractAddresses && contractAddresses.length > 0) {
      spinner.text = 'Verifying contracts...';
      contractResults = await contractVerifier.batchVerifyContracts(
        contractAddresses,
        sourceChainId,
        destChainId,
        options.sourceRpc,
        options.destRpc
      );
    }

    // Run pre-flight checks
    spinner.text = 'Running pre-flight checks...';
    const preFlightResult = await preFlightChecker.runPreFlightChecks({
      sourceChainId,
      destinationChainId: destChainId,
      walletAddress: options.wallet,
      contractAddresses,
      sourceRpcUrl: options.sourceRpc,
      destRpcUrl: options.destRpc
    });

    // Generate report
    spinner.text = 'Generating report...';
    const report = await reportGenerator.generateReport(
      sourceChainId,
      destChainId,
      chainVerification,
      contractResults,
      undefined,
      preFlightResult
    );

    spinner.succeed('Migration report generated');

    // Output report
    const format = options.format || 'console';

    if (format === 'console') {
      console.log(formatMigrationReport(report));
    } else if (format === 'json') {
      const json = reportGenerator.exportAsJson(report);
      if (options.output) {
        await fs.writeFile(options.output, json);
        console.log(chalk.green(`\nReport saved to: ${options.output}`));
      } else {
        console.log(json);
      }
    } else if (format === 'markdown') {
      const markdown = reportGenerator.exportAsMarkdown(report);
      if (options.output) {
        await fs.writeFile(options.output, markdown);
        console.log(chalk.green(`\nReport saved to: ${options.output}`));
      } else {
        console.log(markdown);
      }
    }

    process.exit(report.summary.migrationAllowed ? 0 : 1);
  } catch (error: any) {
    spinner.fail('Report generation failed');
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
