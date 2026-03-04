#!/usr/bin/env node

/**
 * Thirdweb IPFS Download Script
 * Downloads files from IPFS using Thirdweb storage
 */

import { ThirdwebStorage } from '@thirdweb-dev/storage';
import { program } from 'commander';
import { writeFileSync } from 'fs';

program
  .option('--uri <uri>', 'IPFS URI to download')
  .option('--client-id <clientId>', 'Thirdweb client ID')
  .option('--output <output>', 'Output file path (optional)')
  .parse();

const options = program.opts();

async function download() {
  try {
    // Validate inputs
    if (!options.uri || !options.clientId) {
      throw new Error('Missing required parameters');
    }

    // Initialize storage
    const storage = new ThirdwebStorage({
      clientId: options.clientId,
    });

    // Download from IPFS
    const data = await storage.download(options.uri);
    const text = await data.text();

    if (options.output) {
      // Save to file
      writeFileSync(options.output, text);
      console.log(`Downloaded to: ${options.output}`);
    } else {
      // Output to console
      console.log(text);
    }

    process.exit(0);

  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

download();
