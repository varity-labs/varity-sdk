/**
 * Filecoin Client - IPFS/Pinata Integration with Lit Protocol Encryption
 * PROPRIETARY - DO NOT DISTRIBUTE
 *
 * Implements Varity's 3-layer encrypted storage architecture with Lit Protocol
 */

import axios, { AxiosInstance } from 'axios';
import { FilecoinConfig, StorageLayer, StorageError } from '../types';
import logger from '../utils/logger';
import crypto from 'crypto';
import LitProtocolClient, { EncryptionResult } from '../crypto/LitProtocol';
import { AccessControlManager } from '../crypto/access-control';

export interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface FileUploadResult {
  cid: string;
  size: number;
  layer: StorageLayer;
  encrypted: boolean;
  timestamp: number;
  encryptionMetadata?: {
    dataToEncryptHash: string;
    accessControlConditions: any[];
  };
}

export interface EncryptedFileMetadata {
  originalFileName: string;
  ciphertext: string;
  dataToEncryptHash: string;
  accessControlConditions: any[];
  layer: StorageLayer;
  encryptedAt: number;
}

/**
 * Filecoin Client with Integrated Lit Protocol Encryption
 */
export class FilecoinClient {
  private pinataApi: AxiosInstance;
  private config: FilecoinConfig;
  private litClient: LitProtocolClient | null = null;
  private accessControlManager: AccessControlManager;

  constructor(config: FilecoinConfig) {
    this.config = config;

    // Initialize Pinata API client
    this.pinataApi = axios.create({
      baseURL: 'https://api.pinata.cloud',
      headers: {
        pinata_api_key: config.pinataApiKey,
        pinata_secret_api_key: config.pinataSecretKey,
      },
    });

    // Initialize Access Control Manager
    this.accessControlManager = new AccessControlManager('ethereum');

    logger.info('FilecoinClient initialized', {
      gatewayUrl: config.gatewayUrl,
    });
  }

  /**
   * Initialize Lit Protocol client for encryption
   */
  async initializeEncryption(): Promise<void> {
    if (!this.litClient) {
      this.litClient = new LitProtocolClient();
      await this.litClient.initialize();
      logger.info('Lit Protocol encryption initialized');
    }
  }

  /**
   * Generate namespace prefix for storage layer
   */
  private getNamespacePrefix(layer: StorageLayer, metadata?: any): string {
    switch (layer) {
      case 'varity-internal':
        return `varity-internal-${metadata?.category || 'general'}`;
      case 'industry-rag':
        return `industry-${metadata?.industry || 'general'}-rag`;
      case 'customer-data':
        return `customer-${metadata?.customerId || 'unknown'}`;
      default:
        throw new StorageError('Invalid storage layer');
    }
  }

  /**
   * Upload file to Filecoin with optional Lit Protocol encryption
   */
  async uploadFile(
    content: Buffer | string,
    fileName: string,
    layer: StorageLayer,
    metadata?: any,
    encrypt: boolean = true,
    accessControlConditions?: any[]
  ): Promise<FileUploadResult> {
    try {
      logger.info('Uploading file to Filecoin...', {
        fileName,
        layer,
        size: typeof content === 'string' ? content.length : content.byteLength,
        encrypt,
      });

      let finalContent: Buffer | string = content;
      let encryptionMetadata: { dataToEncryptHash: string; accessControlConditions: any[] } | undefined;

      // Encrypt if requested and conditions provided
      if (encrypt && accessControlConditions) {
        await this.initializeEncryption();

        const buffer = typeof content === 'string' ? Buffer.from(content) : content;

        // Encrypt the content
        const encrypted = await this.litClient!.encryptBuffer(
          buffer,
          accessControlConditions,
          'ethereum'
        );

        // Create encrypted file metadata
        const encryptedMetadata: EncryptedFileMetadata = {
          originalFileName: fileName,
          ciphertext: encrypted.ciphertext,
          dataToEncryptHash: encrypted.dataToEncryptHash,
          accessControlConditions: encrypted.accessControlConditions,
          layer,
          encryptedAt: Date.now(),
        };

        // Store encrypted metadata as JSON
        finalContent = JSON.stringify(encryptedMetadata);
        fileName = `${fileName}.encrypted`;

        encryptionMetadata = {
          dataToEncryptHash: encrypted.dataToEncryptHash,
          accessControlConditions: encrypted.accessControlConditions,
        };

        logger.info('File encrypted successfully', {
          dataToEncryptHash: encrypted.dataToEncryptHash,
        });
      }

      const namespacePrefix = this.getNamespacePrefix(layer, metadata);

      // Prepare form data
      const formData = new FormData();

      const blob = typeof finalContent === 'string'
        ? new Blob([finalContent], { type: 'text/plain' })
        : new Blob([finalContent], { type: 'application/octet-stream' });

      formData.append('file', blob, fileName);

      // Add metadata
      const pinataMetadata = {
        name: `${namespacePrefix}-${fileName}`,
        keyvalues: {
          layer,
          namespace: namespacePrefix,
          uploadedAt: new Date().toISOString(),
          encrypted: encrypt && !!accessControlConditions,
          ...metadata,
        },
      };

      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

      // Pin options
      const pinataOptions = {
        cidVersion: 1,
      };
      formData.append('pinataOptions', JSON.stringify(pinataOptions));

      // Upload to Pinata
      const response = await this.pinataApi.post<PinataResponse>(
        '/pinning/pinFileToIPFS',
        formData,
        {
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      const result: FileUploadResult = {
        cid: response.data.IpfsHash,
        size: response.data.PinSize,
        layer,
        encrypted: encrypt && !!accessControlConditions,
        timestamp: Date.now(),
        encryptionMetadata,
      };

      logger.info('File uploaded successfully', {
        cid: result.cid,
        layer,
        encrypted: result.encrypted,
      });

      return result;
    } catch (error: any) {
      logger.error('File upload failed', {
        error: error.message,
        layer,
      });
      throw new StorageError('Failed to upload file to Filecoin', error);
    }
  }

  /**
   * Upload encrypted file with automatic access control based on layer
   */
  async uploadEncrypted(
    content: Buffer | string,
    fileName: string,
    layer: StorageLayer,
    metadata: any
  ): Promise<FileUploadResult> {
    // Create appropriate access control conditions based on layer
    let accessControlConditions: any[];

    switch (layer) {
      case 'varity-internal':
        if (!metadata.adminWallets || metadata.adminWallets.length === 0) {
          throw new StorageError('Admin wallets required for varity-internal layer');
        }
        accessControlConditions = this.accessControlManager.createAccessControl({
          layer: 'varity-internal',
          adminWallets: metadata.adminWallets,
        });
        break;

      case 'industry-rag':
        if (metadata.industryRegistryContract && metadata.industry) {
          accessControlConditions = this.accessControlManager.createAccessControl({
            layer: 'industry-rag',
            industryRegistryContract: metadata.industryRegistryContract,
            industry: metadata.industry,
            adminWallets: metadata.adminWallets || [],
          });
        } else if (metadata.primaryWallet) {
          accessControlConditions = this.accessControlManager.createAccessControl({
            layer: 'industry-rag',
            primaryWallet: metadata.primaryWallet,
            adminWallets: metadata.adminWallets || [],
          });
        } else {
          throw new StorageError(
            'Either industryRegistryContract+industry or primaryWallet required for industry-rag layer'
          );
        }
        break;

      case 'customer-data':
        if (!metadata.primaryWallet) {
          throw new StorageError('Primary wallet required for customer-data layer');
        }
        accessControlConditions = this.accessControlManager.createAccessControl({
          layer: 'customer-data',
          primaryWallet: metadata.primaryWallet,
          emergencyWallets: metadata.emergencyWallets || [],
        });
        break;

      default:
        throw new StorageError(`Invalid storage layer: ${layer}`);
    }

    return this.uploadFile(
      content,
      fileName,
      layer,
      metadata,
      true,
      accessControlConditions
    );
  }

  /**
   * Upload JSON data to Filecoin with optional encryption
   */
  async uploadJSON(
    data: any,
    fileName: string,
    layer: StorageLayer,
    metadata?: any,
    encrypt: boolean = true,
    accessControlConditions?: any[]
  ): Promise<FileUploadResult> {
    const jsonString = JSON.stringify(data, null, 2);
    return this.uploadFile(
      jsonString,
      fileName,
      layer,
      metadata,
      encrypt,
      accessControlConditions
    );
  }

  /**
   * Download file from Filecoin by CID
   */
  async downloadFile(cid: string): Promise<Buffer> {
    try {
      logger.info('Downloading file from Filecoin...', { cid });

      const url = `${this.config.gatewayUrl}/ipfs/${cid}`;
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
      });

      logger.info('File downloaded successfully', { cid });

      return Buffer.from(response.data);
    } catch (error: any) {
      logger.error('File download failed', {
        error: error.message,
        cid,
      });
      throw new StorageError('Failed to download file from Filecoin', error);
    }
  }

  /**
   * Download and decrypt file from Filecoin
   */
  async downloadAndDecrypt(
    cid: string,
    authSig: any
  ): Promise<Buffer> {
    try {
      // Download encrypted metadata
      const encryptedData = await this.downloadFile(cid);
      const metadataStr = encryptedData.toString('utf-8');

      let metadata: EncryptedFileMetadata;
      try {
        metadata = JSON.parse(metadataStr);
      } catch (e) {
        // If not encrypted metadata, return raw data
        logger.info('File is not encrypted, returning raw data');
        return encryptedData;
      }

      // Check if it's encrypted metadata
      if (!metadata.ciphertext || !metadata.dataToEncryptHash || !metadata.accessControlConditions) {
        logger.info('File is not encrypted, returning raw data');
        return encryptedData;
      }

      logger.info('Decrypting file...', {
        cid,
        dataToEncryptHash: metadata.dataToEncryptHash,
      });

      await this.initializeEncryption();

      // Decrypt the content
      const decryptedBuffer = await this.litClient!.decryptToBuffer(
        metadata.ciphertext,
        metadata.dataToEncryptHash,
        metadata.accessControlConditions,
        authSig,
        'ethereum'
      );

      logger.info('File decrypted successfully', {
        cid,
        size: decryptedBuffer.length,
      });

      return decryptedBuffer;
    } catch (error: any) {
      logger.error('Download and decrypt failed', {
        error: error.message,
        cid,
      });
      throw new StorageError('Failed to download and decrypt file', error);
    }
  }

  /**
   * Download and parse JSON from Filecoin
   */
  async downloadJSON<T = any>(cid: string): Promise<T> {
    const buffer = await this.downloadFile(cid);
    const jsonString = buffer.toString('utf-8');
    return JSON.parse(jsonString);
  }

  /**
   * Download and decrypt JSON from Filecoin
   */
  async downloadAndDecryptJSON<T = any>(
    cid: string,
    authSig: any
  ): Promise<T> {
    const buffer = await this.downloadAndDecrypt(cid, authSig);
    const jsonString = buffer.toString('utf-8');
    return JSON.parse(jsonString);
  }

  /**
   * Pin an existing CID (already on IPFS)
   */
  async pinByCID(
    cid: string,
    layer: StorageLayer,
    metadata?: any
  ): Promise<void> {
    try {
      logger.info('Pinning CID...', { cid, layer });

      const namespacePrefix = this.getNamespacePrefix(layer, metadata);

      await this.pinataApi.post('/pinning/pinByHash', {
        hashToPin: cid,
        pinataMetadata: {
          name: `${namespacePrefix}-${cid}`,
          keyvalues: {
            layer,
            namespace: namespacePrefix,
            pinnedAt: new Date().toISOString(),
            ...metadata,
          },
        },
      });

      logger.info('CID pinned successfully', { cid });
    } catch (error: any) {
      logger.error('Pin by CID failed', {
        error: error.message,
        cid,
      });
      throw new StorageError('Failed to pin CID', error);
    }
  }

  /**
   * Unpin a CID (remove from Pinata)
   */
  async unpin(cid: string): Promise<void> {
    try {
      logger.info('Unpinning CID...', { cid });

      await this.pinataApi.delete(`/pinning/unpin/${cid}`);

      logger.info('CID unpinned successfully', { cid });
    } catch (error: any) {
      logger.error('Unpin failed', {
        error: error.message,
        cid,
      });
      throw new StorageError('Failed to unpin CID', error);
    }
  }

  /**
   * List pinned files by layer
   */
  async listPinnedFiles(
    layer?: StorageLayer,
    limit: number = 100
  ): Promise<any[]> {
    try {
      logger.info('Listing pinned files...', { layer, limit });

      const params: any = {
        status: 'pinned',
        pageLimit: limit,
      };

      if (layer) {
        params.metadata = {
          keyvalues: {
            layer: {
              value: layer,
              op: 'eq',
            },
          },
        };
      }

      const response = await this.pinataApi.get('/data/pinList', { params });

      logger.info('Files listed successfully', {
        count: response.data.count,
      });

      return response.data.rows;
    } catch (error: any) {
      logger.error('List files failed', {
        error: error.message,
      });
      throw new StorageError('Failed to list pinned files', error);
    }
  }

  /**
   * Get pin status and metadata
   */
  async getPinStatus(cid: string): Promise<any> {
    try {
      const response = await this.pinataApi.get('/data/pinList', {
        params: {
          hashContains: cid,
        },
      });

      if (response.data.count === 0) {
        throw new StorageError('CID not found');
      }

      return response.data.rows[0];
    } catch (error: any) {
      logger.error('Get pin status failed', {
        error: error.message,
        cid,
      });
      throw new StorageError('Failed to get pin status', error);
    }
  }

  /**
   * Test authentication with Pinata
   */
  async testAuthentication(): Promise<boolean> {
    try {
      await this.pinataApi.get('/data/testAuthentication');
      logger.info('Pinata authentication successful');
      return true;
    } catch (error: any) {
      logger.error('Pinata authentication failed', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get storage statistics for a specific layer
   */
  async getStorageStats(layer: StorageLayer): Promise<{
    fileCount: number;
    totalSize: number;
  }> {
    try {
      const files = await this.listPinnedFiles(layer, 1000);

      const fileCount = files.length;
      const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

      logger.info('Storage stats retrieved', {
        layer,
        fileCount,
        totalSize,
      });

      return {
        fileCount,
        totalSize,
      };
    } catch (error: any) {
      logger.error('Get storage stats failed', {
        error: error.message,
        layer,
      });
      throw new StorageError('Failed to get storage stats', error);
    }
  }

  /**
   * Calculate storage cost estimate
   */
  calculateStorageCost(sizeGB: number): number {
    // Filecoin storage costs approximately $0.0000001/GB/month
    // This is 10,000x cheaper than traditional cloud storage
    const costPerGBPerMonth = 0.0000001;
    return sizeGB * costPerGBPerMonth;
  }

  /**
   * Generate content hash for verification
   */
  static generateContentHash(content: Buffer | string): string {
    const buffer = typeof content === 'string' ? Buffer.from(content) : content;
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Disconnect Lit Protocol client
   */
  async disconnect(): Promise<void> {
    if (this.litClient) {
      await this.litClient.disconnect();
      this.litClient = null;
    }
  }
}

export default FilecoinClient;
