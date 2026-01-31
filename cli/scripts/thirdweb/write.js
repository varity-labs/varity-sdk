#!/usr/bin/env node

/**
 * Thirdweb Contract Write Script
 * Sends a transaction to a deployed contract using the Thirdweb SDK
 */

import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { program } from 'commander';

program
  .option('--address <address>', 'Contract address')
  .option('--method <method>', 'Method name to call')
  .option('--params <params>', 'Method parameters (JSON array)')
  .option('--chain-id <chainId>', 'Chain ID', '33529')
  .option('--rpc <rpc>', 'RPC URL')
  .option('--client-id <clientId>', 'Thirdweb client ID')
  .option('--private-key <privateKey>', 'Private key for signing')
  .option('--value <value>', 'Native token value to send (wei)', '0')
  .parse();

const options = program.opts();

async function write() {
  try {
    // Validate inputs
    if (!options.address || !options.method || !options.params ||
        !options.clientId || !options.privateKey) {
      throw new Error('Missing required parameters');
    }

    // Parse parameters
    const params = JSON.parse(options.params);

    // Initialize SDK
    const sdk = ThirdwebSDK.fromPrivateKey(
      options.privateKey,
      {
        chainId: parseInt(options.chainId),
        rpc: [options.rpc],
        clientId: options.clientId,
      }
    );

    // Get contract instance
    const contract = await sdk.getContract(options.address);

    // Prepare transaction options
    const txOptions = {};
    if (options.value !== '0') {
      txOptions.value = options.value;
    }

    // Send transaction
    const tx = await contract.call(options.method, params, txOptions);

    // Output transaction hash
    console.log(tx.receipt.transactionHash);
    process.exit(0);

  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

write();
