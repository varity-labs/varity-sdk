/**
 * Verify Chain Command
 *
 * CLI command for blockchain chain verification
 */

import chalk from 'chalk';
import ora from 'ora';
import {
  ChainVerifier,
  formatChainVerification,
  formatMigrationVerification
} from '../verification/chainVerifier';
import { VARITY_L3_CHAIN } from '../chains/chainConfig';

interface VerifyChainOptions {
  sourceChain: string;
  destChain?: string;
  sourceRpc?: string;
  destRpc?: string;
  wallet?: string;
}

export async function verifyChainCommand(options: VerifyChainOptions) {
  const spinner = ora('Verifying blockchain chains...').start();

  try {
    const sourceChainId = parseInt(options.sourceChain);
    const destChainId = options.destChain
      ? parseInt(options.destChain)
      : VARITY_L3_CHAIN.chainId;

    const verifier = new ChainVerifier();

    // Verify both chains
    const verification = await verifier.verifyMigrationChains(
      sourceChainId,
      destChainId,
      options.sourceRpc,
      options.destRpc
    );

    spinner.succeed('Chain verification complete');

    // Display results
    console.log(formatMigrationVerification(verification));

    // If wallet provided, check balances
    if (options.wallet) {
      console.log('\n═══ Wallet Balance Check ═══');
      const [sourceBalance, destBalance] = await Promise.all([
        verifier.verifyWalletBalance(sourceChainId, options.wallet, options.sourceRpc),
        verifier.verifyWalletBalance(destChainId, options.wallet, options.destRpc)
      ]);

      if (sourceBalance && destBalance) {
        console.log(`\nSource Chain Balance: ${sourceBalance.balance} ${sourceBalance.symbol}`);
        console.log(`Destination Chain Balance: ${destBalance.balance} ${destBalance.symbol}`);
      } else {
        console.log('\n⚠️  Could not retrieve wallet balances');
      }
    }

    // Exit with appropriate code
    process.exit(verification.migrationAllowed ? 0 : 1);
  } catch (error: any) {
    spinner.fail('Chain verification failed');
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
