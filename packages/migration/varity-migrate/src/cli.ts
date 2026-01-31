#!/usr/bin/env node

import { Command } from 'commander';
import { migrateS3Command } from './commands/migrate-s3';
import { migrateGCSCommand } from './commands/migrate-gcs';
import { statusCommand } from './commands/status';
import { verifyCommand } from './commands/verify';
import { verifyChainCommand } from './commands/verify-chain';
import { preflightCommand } from './commands/preflight';
import { chainsCommand } from './commands/chains';
import { reportCommand } from './commands/report';

const program = new Command();

program
  .name('varity-migrate')
  .description('Migrate data from AWS S3 or Google Cloud Storage to Varity infrastructure with blockchain verification')
  .version('1.0.0');

// Data migration commands
program
  .command('s3')
  .description('Migrate from AWS S3 to Varity')
  .requiredOption('--bucket <bucket>', 'Source S3 bucket')
  .option('--prefix <prefix>', 'Object prefix filter')
  .option('--region <region>', 'AWS region', 'us-east-1')
  .option('--target-layer <layer>', 'Varity storage layer', 'customer-data')
  .option('--concurrency <n>', 'Concurrent transfers', '10')
  .option('--dry-run', 'Simulate migration without transferring')
  .option('--verify', 'Verify all transfers')
  .action(migrateS3Command);

program
  .command('gcs')
  .description('Migrate from Google Cloud Storage to Varity')
  .requiredOption('--bucket <bucket>', 'Source GCS bucket')
  .option('--prefix <prefix>', 'Object prefix filter')
  .option('--project <project>', 'GCP project ID')
  .option('--target-layer <layer>', 'Varity storage layer', 'customer-data')
  .option('--concurrency <n>', 'Concurrent transfers', '10')
  .option('--dry-run', 'Simulate migration')
  .option('--verify', 'Verify all transfers')
  .action(migrateGCSCommand);

program
  .command('status')
  .description('Check migration job status')
  .requiredOption('--job-id <id>', 'Migration job ID')
  .action(statusCommand);

program
  .command('verify')
  .description('Verify migration integrity')
  .requiredOption('--job-id <id>', 'Migration job ID')
  .action(verifyCommand);

// Blockchain verification commands
program
  .command('verify-chain')
  .description('Verify blockchain chain connectivity and compatibility')
  .requiredOption('--source-chain <chainId>', 'Source blockchain chain ID')
  .option('--dest-chain <chainId>', 'Destination chain ID (default: Varity L3 - 33529)')
  .option('--source-rpc <url>', 'Source chain RPC URL override')
  .option('--dest-rpc <url>', 'Destination chain RPC URL override')
  .option('--wallet <address>', 'Wallet address to check balance')
  .action(verifyChainCommand);

program
  .command('preflight')
  .description('Run comprehensive pre-flight checks before migration')
  .requiredOption('--source-chain <chainId>', 'Source blockchain chain ID')
  .option('--dest-chain <chainId>', 'Destination chain ID (default: Varity L3 - 33529)')
  .option('--wallet <address>', 'Wallet address for balance checks')
  .option('--contracts <addresses>', 'Comma-separated contract addresses to verify')
  .option('--source-rpc <url>', 'Source chain RPC URL override')
  .option('--dest-rpc <url>', 'Destination chain RPC URL override')
  .option('--min-gas <amount>', 'Minimum gas balance required')
  .action(preflightCommand);

program
  .command('chains')
  .description('List all supported blockchain chains')
  .action(chainsCommand);

program
  .command('report')
  .description('Generate comprehensive migration compatibility report')
  .requiredOption('--source-chain <chainId>', 'Source blockchain chain ID')
  .option('--dest-chain <chainId>', 'Destination chain ID (default: Varity L3 - 33529)')
  .option('--contracts <addresses>', 'Comma-separated contract addresses to analyze')
  .option('--wallet <address>', 'Wallet address for balance analysis')
  .option('--source-rpc <url>', 'Source chain RPC URL override')
  .option('--dest-rpc <url>', 'Destination chain RPC URL override')
  .option('--output <file>', 'Output file path for report')
  .option('--format <format>', 'Report format: console, json, markdown', 'console')
  .action(reportCommand);

program.parse();
