// Import IPFS client dynamically to avoid module issues
let createIPFSClient: any;
try {
  createIPFSClient = require('ipfs-http-client').create;
} catch (error) {
  // Fallback for environments where IPFS client is not available
  createIPFSClient = null;
}
import { createHash } from 'crypto';
import { VarityOptions } from '../types';
import axios from 'axios';

export class VarityTargetService {
  private ipfs: any;
  private targetLayer: string;
  private apiEndpoint: string;
  private encryptionEnabled: boolean;

  constructor(options?: VarityOptions) {
    this.targetLayer = options?.targetLayer || 'customer-data';
    this.apiEndpoint = options?.apiEndpoint || 'http://localhost:8080';
    this.encryptionEnabled = options?.encryptionEnabled || true;

    // Initialize IPFS client
    const ipfsEndpoint = options?.ipfsEndpoint || 'http://localhost:5001';
    if (createIPFSClient) {
      this.ipfs = createIPFSClient({ url: ipfsEndpoint });
    } else {
      throw new Error('IPFS HTTP client not available. Please ensure ipfs-http-client is properly installed.');
    }
  }

  async putObject(
    key: string,
    data: Buffer,
    metadata?: Record<string, string>
  ): Promise<{ cid: string; size: number }> {
    // Encrypt data if enabled
    const dataToStore = this.encryptionEnabled
      ? await this.encryptData(data)
      : data;

    // Add to IPFS
    const result = await this.ipfs.add(dataToStore, {
      pin: true,
      cidVersion: 1
    });

    // Store metadata with CID mapping
    await this.storeMetadata(key, result.cid.toString(), metadata);

    return {
      cid: result.cid.toString(),
      size: result.size
    };
  }

  async getObject(cid: string): Promise<Buffer> {
    const chunks: Uint8Array[] = [];

    for await (const chunk of this.ipfs.cat(cid)) {
      chunks.push(chunk);
    }

    const data = Buffer.concat(chunks);

    // Decrypt if encryption is enabled
    return this.encryptionEnabled ? await this.decryptData(data) : data;
  }

  async getObjectHash(cid: string): Promise<string> {
    const data = await this.getObject(cid);
    return createHash('sha256').update(data).digest('hex');
  }

  async verifyObject(cid: string): Promise<boolean> {
    try {
      // Try to retrieve the object to verify it exists
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.ipfs.cat(cid)) {
        chunks.push(chunk);
        break; // Just check if we can read the first chunk
      }
      return chunks.length > 0;
    } catch {
      return false;
    }
  }

  private async encryptData(data: Buffer): Promise<Buffer> {
    // Placeholder for Lit Protocol encryption
    // In production, this would use Lit Protocol for encryption
    // For now, return data as-is
    return data;
  }

  private async decryptData(data: Buffer): Promise<Buffer> {
    // Placeholder for Lit Protocol decryption
    // In production, this would use Lit Protocol for decryption
    // For now, return data as-is
    return data;
  }

  private async storeMetadata(
    key: string,
    cid: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    try {
      await axios.post(`${this.apiEndpoint}/api/storage/metadata`, {
        key,
        cid,
        layer: this.targetLayer,
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Log error but don't fail migration
      console.warn(`Failed to store metadata for ${key}:`, error);
    }
  }

  async getCIDForKey(key: string): Promise<string | null> {
    try {
      const response = await axios.get(
        `${this.apiEndpoint}/api/storage/metadata/${encodeURIComponent(key)}`
      );
      return response.data.cid || null;
    } catch {
      return null;
    }
  }

  getTargetLayer(): string {
    return this.targetLayer;
  }
}
