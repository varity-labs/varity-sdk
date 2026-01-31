/**
 * Celestia Backup Worker
 * PROPRIETARY - DO NOT DISTRIBUTE
 *
 * Automatically backs up PostgreSQL database changes to Celestia DA layer
 * Implements continuous backup for disaster recovery
 */

import { CelestiaClient, BlobSubmissionResult } from './CelestiaClient';
import { CelestiaConfig } from '../types';
import logger from '../utils/logger';
import { generateCustomerNamespace, generateIndustryNamespace } from './namespace';

/**
 * Backup record structure
 */
export interface BackupRecord {
  id: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
  namespace: string;
}

/**
 * Backup result tracking
 */
export interface BackupResult {
  recordId: string;
  blobId: string;
  height: number;
  commitment: string;
  timestamp: number;
  success: boolean;
  error?: string;
}

/**
 * Backup worker configuration
 */
export interface BackupWorkerConfig {
  celestiaConfig: CelestiaConfig;
  batchSize: number; // Number of records to batch before submitting
  batchInterval: number; // Interval in ms to submit batches (e.g., 5000 = 5 seconds)
  retryAttempts: number; // Number of retry attempts for failed submissions
  retryDelay: number; // Delay in ms between retries
  enableCompression: boolean; // Compress data before submission
}

/**
 * Celestia Backup Worker
 * Continuously backs up database changes to Celestia DA layer
 */
export class CelestiaBackupWorker {
  private celestiaClient: CelestiaClient;
  private config: BackupWorkerConfig;
  private recordQueue: BackupRecord[] = [];
  private isRunning: boolean = false;
  private intervalHandle?: NodeJS.Timeout;

  constructor(config: BackupWorkerConfig) {
    this.config = config;
    this.celestiaClient = new CelestiaClient(config.celestiaConfig);

    logger.info('CelestiaBackupWorker initialized', {
      batchSize: config.batchSize,
      batchInterval: config.batchInterval,
      compression: config.enableCompression,
    });
  }

  /**
   * Start the backup worker
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Backup worker already running');
      return;
    }

    this.isRunning = true;

    // Process backup queue at regular intervals
    this.intervalHandle = setInterval(() => {
      this.processBackupQueue().catch((error) => {
        logger.error('Error processing backup queue', {
          error: error.message,
        });
      });
    }, this.config.batchInterval);

    logger.info('Backup worker started');
  }

  /**
   * Stop the backup worker
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Backup worker not running');
      return;
    }

    this.isRunning = false;

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }

    // Process remaining records before stopping
    this.processBackupQueue()
      .then(() => {
        logger.info('Backup worker stopped, remaining records processed');
      })
      .catch((error) => {
        logger.error('Error processing remaining records', {
          error: error.message,
        });
      });
  }

  /**
   * Add a record to the backup queue
   *
   * @param record - The backup record to queue
   */
  queueBackup(record: BackupRecord): void {
    this.recordQueue.push(record);

    logger.debug('Record queued for backup', {
      id: record.id,
      table: record.table,
      operation: record.operation,
      queueSize: this.recordQueue.length,
    });

    // If queue reaches batch size, process immediately
    if (this.recordQueue.length >= this.config.batchSize) {
      this.processBackupQueue().catch((error) => {
        logger.error('Error processing full queue', {
          error: error.message,
        });
      });
    }
  }

  /**
   * Process the backup queue and submit to Celestia
   */
  private async processBackupQueue(): Promise<BackupResult[]> {
    if (this.recordQueue.length === 0) {
      return [];
    }

    const batchSize = Math.min(this.recordQueue.length, this.config.batchSize);
    const batch = this.recordQueue.splice(0, batchSize);

    logger.info('Processing backup batch', {
      batchSize: batch.length,
      remainingQueue: this.recordQueue.length,
    });

    const results: BackupResult[] = [];

    try {
      // Group records by namespace for efficient submission
      const namespaceGroups = this.groupByNamespace(batch);

      for (const [namespace, records] of Object.entries(namespaceGroups)) {
        const batchResults = await this.submitBatch(namespace, records);
        results.push(...batchResults);
      }

      logger.info('Backup batch processed successfully', {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      });
    } catch (error: any) {
      logger.error('Failed to process backup batch', {
        error: error.message,
        batchSize: batch.length,
      });

      // Re-queue failed records for retry
      this.recordQueue.unshift(...batch);
    }

    return results;
  }

  /**
   * Group backup records by namespace
   */
  private groupByNamespace(
    records: BackupRecord[]
  ): Record<string, BackupRecord[]> {
    const groups: Record<string, BackupRecord[]> = {};

    for (const record of records) {
      if (!groups[record.namespace]) {
        groups[record.namespace] = [];
      }
      groups[record.namespace].push(record);
    }

    return groups;
  }

  /**
   * Submit a batch of records to Celestia
   */
  private async submitBatch(
    namespace: string,
    records: BackupRecord[]
  ): Promise<BackupResult[]> {
    const results: BackupResult[] = [];

    try {
      // Serialize records to JSON
      const batchData = {
        version: 1,
        timestamp: Date.now(),
        namespace,
        recordCount: records.length,
        records: records.map((r) => ({
          id: r.id,
          table: r.table,
          operation: r.operation,
          data: r.data,
          timestamp: r.timestamp,
        })),
      };

      const jsonData = JSON.stringify(batchData);
      const dataBuffer = Buffer.from(jsonData, 'utf-8');

      // Optional: Compress data
      const finalBuffer = this.config.enableCompression
        ? await this.compressData(dataBuffer)
        : dataBuffer;

      logger.info('Submitting backup batch to Celestia', {
        namespace,
        recordCount: records.length,
        dataSize: finalBuffer.byteLength,
        compressed: this.config.enableCompression,
      });

      // Submit to Celestia
      const submission = await this.submitWithRetry(finalBuffer, namespace);

      // Create results for all records in batch
      for (const record of records) {
        results.push({
          recordId: record.id,
          blobId: submission.blobId,
          height: submission.height,
          commitment: submission.commitment,
          timestamp: submission.timestamp,
          success: true,
        });
      }

      logger.info('Batch submitted successfully to Celestia', {
        blobId: submission.blobId,
        height: submission.height,
        recordCount: records.length,
      });
    } catch (error: any) {
      logger.error('Failed to submit batch to Celestia', {
        error: error.message,
        namespace,
        recordCount: records.length,
      });

      // Mark all records in failed batch
      for (const record of records) {
        results.push({
          recordId: record.id,
          blobId: '',
          height: 0,
          commitment: '',
          timestamp: Date.now(),
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Submit blob with retry logic
   */
  private async submitWithRetry(
    data: Buffer,
    namespace: string
  ): Promise<BlobSubmissionResult> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        logger.info('Submitting blob to Celestia', {
          attempt,
          maxAttempts: this.config.retryAttempts,
          namespace,
          dataSize: data.byteLength,
        });

        const result = await this.celestiaClient.submitBlob(data, namespace);
        return result;
      } catch (error: any) {
        lastError = error;

        logger.warn('Blob submission failed, retrying...', {
          attempt,
          maxAttempts: this.config.retryAttempts,
          error: error.message,
        });

        if (attempt < this.config.retryAttempts) {
          // Wait before retrying
          await this.delay(this.config.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Failed to submit blob after all retries');
  }

  /**
   * Compress data using gzip (placeholder - implement with zlib in production)
   */
  private async compressData(data: Buffer): Promise<Buffer> {
    // TODO: Implement actual compression using Node.js zlib
    // For now, return data as-is
    logger.debug('Data compression not yet implemented');
    return data;
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get worker statistics
   */
  getStats(): {
    isRunning: boolean;
    queueSize: number;
    batchSize: number;
    batchInterval: number;
  } {
    return {
      isRunning: this.isRunning,
      queueSize: this.recordQueue.length,
      batchSize: this.config.batchSize,
      batchInterval: this.config.batchInterval,
    };
  }

  /**
   * Recover database state from Celestia backups
   *
   * @param namespace - The namespace to recover from
   * @param startHeight - Starting block height (optional)
   * @param endHeight - Ending block height (optional)
   * @returns Array of recovered backup records
   */
  async recoverFromCelestia(
    namespace: string,
    startHeight?: number,
    endHeight?: number
  ): Promise<BackupRecord[]> {
    logger.info('Starting database recovery from Celestia', {
      namespace,
      startHeight,
      endHeight,
    });

    const recoveredRecords: BackupRecord[] = [];

    try {
      // NOTE: This requires scanning blocks which is not yet implemented
      // In production, you would:
      // 1. Query Celestia for all blobs in namespace between heights
      // 2. Retrieve and decompress each blob
      // 3. Parse JSON data and extract records
      // 4. Sort records by timestamp
      // 5. Apply records in order to rebuild database state

      logger.warn('Database recovery from Celestia not yet fully implemented');

      return recoveredRecords;
    } catch (error: any) {
      logger.error('Failed to recover from Celestia', {
        error: error.message,
        namespace,
      });
      throw error;
    }
  }
}

/**
 * Create a backup worker with default configuration
 */
export function createBackupWorker(
  celestiaConfig: CelestiaConfig
): CelestiaBackupWorker {
  const config: BackupWorkerConfig = {
    celestiaConfig,
    batchSize: 100, // Batch 100 records before submitting
    batchInterval: 10000, // Submit every 10 seconds
    retryAttempts: 3, // Retry up to 3 times
    retryDelay: 2000, // 2 second delay between retries
    enableCompression: false, // Disable compression for now
  };

  return new CelestiaBackupWorker(config);
}

export default CelestiaBackupWorker;
