#!/usr/bin/env node

/**
 * Thirdweb Contract Read Script
 * Reads data from a deployed contract using the Thirdweb SDK
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
  .parse();

const options = program.opts();

async function read() {
  try {
    // Validate inputs
    if (!options.address || !options.method || !options.clientId) {
      throw new Error('Missing required parameters');
    }

    // Parse parameters
    const params = options.params ? JSON.parse(options.params) : [];

    // Initialize SDK (read-only)
    const sdk = new ThirdwebSDK({
      chainId: parseInt(options.chainId),
      rpc: [options.rpc],
      clientId: options.clientId,
    });

    // Get contract instance
    const contract = await sdk.getContract(options.address);

    // Call method
    const result = await contract.call(options.method, params);

    // Output result
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);

  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

read();
