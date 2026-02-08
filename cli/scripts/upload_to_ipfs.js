#!/usr/bin/env node

/**
 * IPFS Upload Script
 *
 * Bridges Python CLI to TypeScript SDK for IPFS uploads via thirdweb Storage.
 * This script is called by the Python CLI to upload directories to IPFS.
 *
 * Usage:
 *   node upload_to_ipfs.js <build_directory> [thirdweb_client_id]
 *
 * Returns JSON:
 *   {
 *     "success": true,
 *     "cid": "Qm...",
 *     "gatewayUrl": "https://ipfs.io/ipfs/Qm...",
 *     "thirdwebUrl": "https://Qm....ipfscdn.io",
 *     "files": ["index.html", "assets/app.js", ...],
 *     "totalSize": 1234567
 *   }
 *
 * Error output (to stderr):
 *   {
 *     "success": false,
 *     "error": "Error message",
 *     "stack": "Stack trace"
 *   }
 */

const { createThirdwebClient } = require('thirdweb');
const { upload } = require('thirdweb/storage');
const fs = require('fs');
const path = require('path');

/**
 * Get all files recursively from a directory
 * @param {string} dirPath - Directory path
 * @param {string} basePath - Base path for relative naming
 * @param {Array} fileList - Accumulator for files
 * @returns {Array<{name: string, path: string, size: number}>} List of files with metadata
 */
function getAllFiles(dirPath, basePath = dirPath, fileList = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recurse into subdirectories
      getAllFiles(filePath, basePath, fileList);
    } else {
      // Calculate relative path from base directory
      const relativePath = path.relative(basePath, filePath);

      fileList.push({
        name: relativePath,
        path: filePath,
        size: stat.size
      });
    }
  });

  return fileList;
}

/**
 * Get content type for a file based on extension
 * @param {string} filename - Filename
 * @returns {string} MIME type
 */
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
    '.zip': 'application/zip'
  };

  return types[ext] || 'application/octet-stream';
}

/**
 * Upload directory to IPFS using thirdweb Storage
 * @param {string} directory - Directory path to upload
 * @param {string} clientId - thirdweb client ID
 */
async function uploadToIPFS(directory, clientId) {
  const startTime = Date.now();

  try {
    // 1. Validate directory exists
    if (!fs.existsSync(directory)) {
      throw new Error(`Directory not found: ${directory}`);
    }

    const stat = fs.statSync(directory);
    if (!stat.isDirectory()) {
      throw new Error(`Path is not a directory: ${directory}`);
    }

    // 2. Get client ID from argument or environment
    const thirdwebClientId = clientId || process.env.THIRDWEB_CLIENT_ID;
    if (!thirdwebClientId) {
      throw new Error(
        'THIRDWEB_CLIENT_ID required. Set as environment variable or pass as argument.'
      );
    }

    // 3. Create thirdweb client
    const client = createThirdwebClient({
      clientId: thirdwebClientId
    });

    // 4. Collect all files from directory
    const fileMetadata = getAllFiles(directory);

    if (fileMetadata.length === 0) {
      throw new Error(`No files found in directory: ${directory}`);
    }

    // Log to stderr (not stdout, so it doesn't interfere with JSON output)
    console.error(`Uploading ${fileMetadata.length} files to IPFS...`);

    // 5. Create File objects for upload
    const files = fileMetadata.map(meta => {
      const content = fs.readFileSync(meta.path);
      const contentType = getContentType(meta.name);

      // Use File API (available in Node.js 18+)
      return new File([content], meta.name, {
        type: contentType
      });
    });

    // 6. Upload to IPFS via thirdweb
    const uris = await upload({
      client,
      files: files
    });

    // 7. Extract root CID from URI
    // thirdweb returns ipfs:// URIs - when uploading multiple files,
    // each file gets its own URI like ipfs://QmXXX/404/index.html
    // We need just the root CID (QmXXX), not the full file path
    const uri = Array.isArray(uris) ? uris[0] : uris;
    const fullPath = uri.replace('ipfs://', '');
    const cid = fullPath.includes('/') ? fullPath.split('/')[0] : fullPath;

    // 8. Calculate total size
    const totalSize = fileMetadata.reduce((sum, file) => sum + file.size, 0);

    // 9. Generate URLs
    const gatewayUrl = `https://ipfs.io/ipfs/${cid}`;
    const thirdwebUrl = `https://${cid}.ipfscdn.io`;

    // 10. Return success result as JSON to stdout
    const result = {
      success: true,
      cid: cid,
      gatewayUrl: gatewayUrl,
      thirdwebUrl: thirdwebUrl,
      files: fileMetadata.map(f => f.name),
      totalSize: totalSize,
      fileCount: fileMetadata.length,
      uploadTime: Date.now() - startTime
    };

    console.log(JSON.stringify(result));

  } catch (error) {
    // Return error as JSON to stderr
    const errorResult = {
      success: false,
      error: error.message,
      stack: error.stack
    };

    console.error(JSON.stringify(errorResult));
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node upload_to_ipfs.js <directory> [thirdweb_client_id]');
    process.exit(1);
  }

  const [directory, clientId] = args;
  uploadToIPFS(directory, clientId);
}

module.exports = { uploadToIPFS };
