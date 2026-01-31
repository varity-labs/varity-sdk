#!/usr/bin/env node

/**
 * Thirdweb Contract Deployment Script
 * Deploys a smart contract using the Thirdweb SDK
 */

import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { program } from 'commander';

program
  .option('--abi <abi>', 'Contract ABI (JSON string)')
  .option('--bytecode <bytecode>', 'Contract bytecode')
  .option('--name <name>', 'Contract name')
  .option('--constructor-args <args>', 'Constructor arguments (JSON array)')
  .option('--chain-id <chainId>', 'Chain ID', '33529')
  .option('--rpc <rpc>', 'RPC URL')
  .option('--client-id <clientId>', 'Thirdweb client ID')
  .option('--private-key <privateKey>', 'Private key for deployment')
  .parse();

const options = program.opts();

async function deploy() {
  try {
    // Validate inputs
    if (!options.abi || !options.bytecode || !options.clientId || !options.privateKey) {
      throw new Error('Missing required parameters');
    }

    // Parse ABI
    const abi = JSON.parse(options.abi);
    const constructorArgs = options.constructorArgs
      ? JSON.parse(options.constructorArgs)
      : [];

    // Initialize SDK
    const sdk = ThirdwebSDK.fromPrivateKey(
      options.privateKey,
      {
        chainId: parseInt(options.chainId),
        rpc: [options.rpc],
        clientId: options.clientId,
      }
    );

    // Deploy contract
    const address = await sdk.deployer.deployContract({
      name: options.name || 'DeployedContract',
      abi,
      bytecode: options.bytecode,
      constructorArgs,
    });

    // Output address
    console.log(address);
    process.exit(0);

  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

deploy();
