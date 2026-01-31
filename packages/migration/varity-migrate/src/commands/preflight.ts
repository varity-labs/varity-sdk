/**
 * Pre-Flight Check Command
 *
 * CLI command for running comprehensive pre-flight checks
 */

import chalk from 'chalk';
import ora from 'ora';
import { PreFlightChecker, formatPreFlightCheckResult } from '../preflight/checks';
import { VARITY_L3_CHAIN } from '../chains/chainConfig';

interface PreFlightOptions {
  sourceChain: string;
  destChain?: string;
  wallet?: string;
  contracts?: string;
  sourceRpc?: string;
  destRpc?: string;
  minGas?: string;
}

export async function preflightCommand(options: PreFlightOptions) {
  const spinner = ora('Running pre-flight checks...').start();

  try {
    const sourceChainId = parseInt(options.sourceChain);
    const destChainId = options.destChain
      ? parseInt(options.destChain)
      : VARITY_L3_CHAIN.chainId;

    const contractAddresses = options.contracts
      ? options.contracts.split(',').map(addr => addr.trim())
      : undefined;

    const checker = new PreFlightChecker();

    const result = await checker.runPreFlightChecks({
      sourceChainId,
      destinationChainId: destChainId,
      walletAddress: options.wallet,
      contractAddresses,
      minimumGasBalance: options.minGas,
      sourceRpcUrl: options.sourceRpc,
      destRpcUrl: options.destRpc
    });

    spinner.succeed('Pre-flight checks complete');

    // Display results
    console.log(formatPreFlightCheckResult(result));

    // Exit with appropriate code
    process.exit(result.passed ? 0 : 1);
  } catch (error: any) {
    spinner.fail('Pre-flight checks failed');
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
