#!/usr/bin/env node

/**
 * Thirdweb IPFS Upload Script
 * Uploads files to IPFS using Thirdweb storage
 */

import { ThirdwebStorage } from '@thirdweb-dev/storage';
import { program } from 'commander';
import { readFileSync, statSync } from 'fs';

program
  .option('--file <file>', 'File path to upload')
  .option('--client-id <clientId>', 'Thirdweb client ID')
  .parse();

const options = program.opts();

async function upload() {
  try {
    // Validate inputs
    if (!options.file || !options.clientId) {
      throw new Error('Missing required parameters');
    }

    // Initialize storage
    const storage = new ThirdwebStorage({
      clientId: options.clientId,
    });

    // Check if file or directory
    const stats = statSync(options.file);

    let uri;
    if (stats.isDirectory()) {
      // Upload directory
      uri = await storage.uploadFolder(options.file);
    } else {
      // Upload single file
      const fileData = readFileSync(options.file);
      uri = await storage.upload(fileData);
    }

    // Output URI
    console.log(uri);
    process.exit(0);

  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

upload();
