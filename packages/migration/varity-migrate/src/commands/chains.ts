/**
 * Chains Command
 *
 * CLI command to list supported blockchain chains
 */

import chalk from 'chalk';
import { SUPPORTED_CHAINS, getSourceChains, getDestinationChains } from '../chains/chainConfig';

export function chainsCommand() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║         SUPPORTED BLOCKCHAIN CHAINS                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log(chalk.bold('All Supported Chains:\n'));

  Object.values(SUPPORTED_CHAINS).forEach(chain => {
    console.log(chalk.cyan(`${chain.name} (${chain.shortName})`));
    console.log(`  Chain ID: ${chain.chainId}`);
    console.log(`  Network: ${chain.network}`);
    console.log(`  Gas Token: ${chain.nativeCurrency.symbol} (${chain.nativeCurrency.decimals} decimals)`);
    console.log(`  Testnet: ${chain.testnet ? 'Yes' : 'No'}`);
    console.log(`  Source Support: ${chain.migrationRules.supportedAsSource ? '✅ Yes' : '❌ No'}`);
    console.log(`  Destination Support: ${chain.migrationRules.supportedAsDestination ? '✅ Yes' : '❌ No'}`);
    console.log(`  RPC URLs: ${chain.rpcUrls.length} available`);

    if (chain.migrationRules.specialConsiderations) {
      console.log('  Special Considerations:');
      chain.migrationRules.specialConsiderations.forEach(note => {
        console.log(`    • ${note}`);
      });
    }
    console.log('');
  });

  console.log(chalk.bold('\nMigration Source Chains:\n'));
  getSourceChains().forEach(chain => {
    console.log(`  • ${chain.name} (${chain.chainId})`);
  });

  console.log(chalk.bold('\nMigration Destination Chains:\n'));
  getDestinationChains().forEach(chain => {
    console.log(`  • ${chain.name} (${chain.chainId})`);
  });

  console.log('');
}
