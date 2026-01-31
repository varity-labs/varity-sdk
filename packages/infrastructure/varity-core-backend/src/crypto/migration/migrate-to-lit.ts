/**
 * Migration Script: AES Encryption → Lit Protocol
 * PROPRIETARY - DO NOT DISTRIBUTE
 *
 * Migrates existing AES-encrypted data to Lit Protocol encryption
 */

import crypto from 'crypto';
import LitProtocolClient from '../LitProtocol';
import { StorageLayer } from '../../types';
import logger from '../../utils/logger';

export interface LegacyAESData {
  encryptedData: Buffer;
  iv: Buffer;
  symmetricKey?: Buffer; // If available
}

export interface MigrationResult {
  success: boolean;
  originalSize: number;
  newSize: number;
  ciphertext: string;
  dataToEncryptHash: string;
  accessControlConditions: any[];
  error?: string;
}

/**
 * Legacy AES Decryption (for migration only)
 */
export class LegacyAESDecryption {
  /**
   * Decrypt AES-256-CBC encrypted data
   */
  static decrypt(
    encryptedData: Buffer,
    symmetricKey: Buffer
  ): Buffer {
    try {
      // Extract IV (first 16 bytes)
      const iv = encryptedData.subarray(0, 16);
      const encrypted = encryptedData.subarray(16);

      // Decrypt
      const decipher = crypto.createDecipheriv('aes-256-cbc', symmetricKey, iv);
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted;
    } catch (error: any) {
      logger.error('Legacy AES decryption failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Decrypt with known key
   */
  static decryptWithKey(
    encryptedData: Buffer,
    key: string
  ): Buffer {
    const symmetricKey = Buffer.from(key, 'hex');
    return this.decrypt(encryptedData, symmetricKey);
  }
}

/**
 * Migration Manager
 */
export class MigrationManager {
  private litClient: LitProtocolClient;

  constructor(litClient?: LitProtocolClient) {
    this.litClient = litClient || new LitProtocolClient();
  }

  /**
   * Initialize Lit Protocol client
   */
  async initialize(): Promise<void> {
    await this.litClient.initialize();
    logger.info('Migration manager initialized with Lit Protocol');
  }

  /**
   * Migrate single file from AES to Lit Protocol
   */
  async migrateFile(
    encryptedData: Buffer,
    symmetricKey: Buffer,
    accessControlConditions: any[]
  ): Promise<MigrationResult> {
    try {
      logger.info('Starting file migration...', {
        originalSize: encryptedData.length,
      });

      // Step 1: Decrypt with legacy AES
      const decryptedData = LegacyAESDecryption.decrypt(
        encryptedData,
        symmetricKey
      );

      logger.info('Legacy AES decryption successful', {
        decryptedSize: decryptedData.length,
      });

      // Step 2: Re-encrypt with Lit Protocol
      const litEncrypted = await this.litClient.encryptBuffer(
        decryptedData,
        accessControlConditions,
        'ethereum'
      );

      logger.info('Lit Protocol encryption successful', {
        ciphertextLength: litEncrypted.ciphertext.length,
        dataToEncryptHash: litEncrypted.dataToEncryptHash,
      });

      return {
        success: true,
        originalSize: encryptedData.length,
        newSize: litEncrypted.ciphertext.length,
        ciphertext: litEncrypted.ciphertext,
        dataToEncryptHash: litEncrypted.dataToEncryptHash,
        accessControlConditions: litEncrypted.accessControlConditions,
      };
    } catch (error: any) {
      logger.error('Migration failed', {
        error: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        originalSize: encryptedData.length,
        newSize: 0,
        ciphertext: '',
        dataToEncryptHash: '',
        accessControlConditions: [],
        error: error.message,
      };
    }
  }

  /**
   * Migrate batch of files
   */
  async migrateBatch(
    files: Array<{
      encryptedData: Buffer;
      symmetricKey: Buffer;
      accessControlConditions: any[];
      fileId: string;
    }>
  ): Promise<Map<string, MigrationResult>> {
    const results = new Map<string, MigrationResult>();

    logger.info('Starting batch migration...', {
      fileCount: files.length,
    });

    for (const file of files) {
      const result = await this.migrateFile(
        file.encryptedData,
        file.symmetricKey,
        file.accessControlConditions
      );

      results.set(file.fileId, result);

      if (result.success) {
        logger.info('File migrated successfully', {
          fileId: file.fileId,
          originalSize: result.originalSize,
          newSize: result.newSize,
        });
      } else {
        logger.error('File migration failed', {
          fileId: file.fileId,
          error: result.error,
        });
      }
    }

    const successCount = Array.from(results.values()).filter(r => r.success).length;
    logger.info('Batch migration complete', {
      total: files.length,
      successful: successCount,
      failed: files.length - successCount,
    });

    return results;
  }

  /**
   * Verify migration by decrypting with Lit Protocol
   */
  async verifyMigration(
    ciphertext: string,
    dataToEncryptHash: string,
    accessControlConditions: any[],
    authSig: any,
    expectedContent: Buffer
  ): Promise<boolean> {
    try {
      logger.info('Verifying migration...', {
        dataToEncryptHash,
      });

      const decrypted = await this.litClient.decryptToBuffer(
        ciphertext,
        dataToEncryptHash,
        accessControlConditions,
        authSig,
        'ethereum'
      );

      const isValid = decrypted.equals(expectedContent);

      if (isValid) {
        logger.info('Migration verification successful');
      } else {
        logger.error('Migration verification failed: content mismatch');
      }

      return isValid;
    } catch (error: any) {
      logger.error('Migration verification failed', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Generate migration report
   */
  generateReport(results: Map<string, MigrationResult>): {
    totalFiles: number;
    successful: number;
    failed: number;
    totalOriginalSize: number;
    totalNewSize: number;
    compressionRatio: number;
    failedFiles: string[];
  } {
    const allResults = Array.from(results.entries());
    const successful = allResults.filter(([, r]) => r.success);
    const failed = allResults.filter(([, r]) => !r.success);

    const totalOriginalSize = successful.reduce((sum, [, r]) => sum + r.originalSize, 0);
    const totalNewSize = successful.reduce((sum, [, r]) => sum + r.newSize, 0);
    const compressionRatio = totalOriginalSize > 0 ? totalNewSize / totalOriginalSize : 0;

    return {
      totalFiles: allResults.length,
      successful: successful.length,
      failed: failed.length,
      totalOriginalSize,
      totalNewSize,
      compressionRatio,
      failedFiles: failed.map(([fileId]) => fileId),
    };
  }

  /**
   * Disconnect Lit Protocol client
   */
  async disconnect(): Promise<void> {
    await this.litClient.disconnect();
  }
}

/**
 * Example migration workflow
 */
export async function runMigrationExample() {
  const manager = new MigrationManager();
  await manager.initialize();

  // Example: Migrate a single file
  const legacyEncryptedData = Buffer.from('...'); // Your legacy encrypted data
  const symmetricKey = Buffer.from('...', 'hex'); // Your AES key
  const accessControlConditions = [
    {
      conditionType: 'evmBasic',
      contractAddress: '',
      standardContractType: '',
      chain: 'ethereum',
      method: '',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '=',
        value: '0xYourWalletAddress',
      },
    },
  ];

  const result = await manager.migrateFile(
    legacyEncryptedData,
    symmetricKey,
    accessControlConditions
  );

  if (result.success) {
    console.log('Migration successful!');
    console.log('New ciphertext:', result.ciphertext);
    console.log('Data hash:', result.dataToEncryptHash);
  } else {
    console.error('Migration failed:', result.error);
  }

  await manager.disconnect();
}

export default MigrationManager;
