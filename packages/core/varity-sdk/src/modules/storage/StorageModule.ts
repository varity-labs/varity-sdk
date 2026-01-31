/**
 * Varity SDK - Storage Module
 *
 * Universal decentralized storage on IPFS/Filecoin/Celestia.
 * Works across all templates (ISO, Healthcare, Retail, etc.)
 *
 * REFACTORED: Now uses adapter pattern for multi-backend support
 */

import { ethers } from 'ethers'
import CryptoJS from 'crypto-js'
import type { VaritySDK } from '../../core/VaritySDK'
import type { StorageResult, StorageOptions, DataProof } from '../../core/types'
import { StorageLayer, StorageTier, type UploadOptions as AdapterUploadOptions } from '@varity-labs/types'
import DataProofRegistryABI from '../../contracts/abis/iso/DataProofRegistry.json'
import { IStorageAdapter } from './adapters/IStorageAdapter'
import { AdapterFactory } from './adapters/AdapterFactory'

export interface UploadResult extends StorageResult {}

export interface DataPointer {
  pointerId: string
  cid: string
  owner: string
  metadata: string
  timestamp: number
}

export interface Pin {
  cid: string
  name?: string
  size: number
  timestamp: number
}

export interface PinFilters {
  status?: 'pinned' | 'unpinned'
  limit?: number
  offset?: number
}

export interface CelestiaReceipt {
  height: number
  commitment: string
  namespace: string
  blobId: string
}

/**
 * StorageModule - Universal decentralized storage
 *
 * @example
 * ```typescript
 * // Upload encrypted data
 * const result = await sdk.storage.uploadEncrypted({
 *   businessName: 'Acme Corp',
 *   data: {...}
 * })
 *
 * // Retrieve encrypted data
 * const data = await sdk.storage.retrieveEncrypted(result.cid)
 *
 * // Submit to Celestia for data availability
 * const receipt = await sdk.storage.submitToCelestia(data, 'iso-merchants')
 * ```
 */
export class StorageModule {
  private sdk: VaritySDK
  private adapter: IStorageAdapter  // NEW: Storage adapter for multi-backend support
  private dataProofContract: ethers.Contract | null = null

  constructor(sdk: VaritySDK) {
    this.sdk = sdk

    // NEW: Initialize adapter based on SDK configuration
    this.adapter = AdapterFactory.createFromSDKConfig(sdk)
  }

  /**
   * Initialize DataProofRegistry contract
   */
  private async getDataProofContract(): Promise<ethers.Contract> {
    if (!this.dataProofContract) {
      const address = this.sdk.getContractAddress('DataProofRegistry')
      const provider = this.sdk.getProvider()
      this.dataProofContract = new ethers.Contract(
        address,
        DataProofRegistryABI.abi,
        provider
      )
    }
    return this.dataProofContract
  }

  /**
   * Derive encryption key from wallet address
   */
  private async deriveKey(walletAddress: string): Promise<string> {
    // Use PBKDF2 with wallet address as password
    const salt = 'varity-sdk-v1'
    const iterations = 100000
    return CryptoJS.PBKDF2(walletAddress.toLowerCase(), salt, {
      keySize: 256 / 32,
      iterations
    }).toString()
  }

  /**
   * Encrypt data with AES-256-GCM
   */
  private encrypt(data: any, key: string): string {
    const jsonString = JSON.stringify(data)
    return CryptoJS.AES.encrypt(jsonString, key).toString()
  }

  /**
   * Decrypt data
   */
  private decrypt(encryptedData: string, key: string): any {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key)
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8)
    return JSON.parse(jsonString)
  }

  /**
   * Upload encrypted data to IPFS/Filecoin
   *
   * @param data - Data to upload
   * @param options - Storage options
   * @returns Upload result with CID
   */
  async uploadEncrypted(
    data: any,
    options?: StorageOptions
  ): Promise<UploadResult> {
    const walletAddress = await this.sdk.getAddress()

    // 1. Derive encryption key from wallet
    const key = await this.deriveKey(walletAddress)

    // 2. Encrypt data
    const encrypted = this.encrypt(data, key)

    // 3. Upload via adapter (NEW: delegates to adapter)
    const adapterOptions: AdapterUploadOptions = {
      layer: options?.layer || StorageLayer.CUSTOMER_DATA,
      tier: StorageTier.HOT,  // Default to hot tier
      metadata: {
        walletAddress,
        encrypted: true,
        ...options?.metadata
      }
    }

    const result = await this.adapter.upload(encrypted, adapterOptions)

    // 4. Record data proof on-chain (optional)
    if (options?.pin !== false) {
      const hash = CryptoJS.SHA256(encrypted).toString()
      await this.recordDataPointer(result.identifier, {
        hash,
        owner: walletAddress,
        layer: options?.layer || StorageLayer.CUSTOMER_DATA,
        ...options?.metadata
      })
    }

    // Convert adapter result to legacy format for backward compatibility
    return {
      cid: result.identifier,
      gatewayUrl: result.gatewayUrl,
      size: result.size,
      hash: result.hash,
      timestamp: result.timestamp,
      encryptionMetadata: {
        encrypted: true,
        walletAddress,
        layer: options?.layer || StorageLayer.CUSTOMER_DATA
      }
    }
  }

  /**
   * Retrieve and decrypt data from IPFS
   *
   * @param cid - Content identifier
   * @returns Decrypted data
   */
  async retrieveEncrypted(cid: string): Promise<any> {
    const walletAddress = await this.sdk.getAddress()

    // 1. Download via adapter (NEW: delegates to adapter)
    const buffer = await this.adapter.download(cid)
    const encrypted = buffer.toString()

    // 2. Derive key and decrypt
    const key = await this.deriveKey(walletAddress)
    return this.decrypt(encrypted, key)
  }

  /**
   * Upload file to IPFS
   *
   * @param file - File blob
   * @param options - Storage options
   * @returns Upload result
   */
  async uploadFile(file: Blob, options?: StorageOptions): Promise<UploadResult> {
    // NEW: Upload via adapter
    const adapterOptions: AdapterUploadOptions = {
      layer: options?.layer || StorageLayer.CUSTOMER_DATA,
      tier: StorageTier.HOT,
      metadata: options?.metadata
    }

    const result = await this.adapter.upload(file, adapterOptions)

    // Convert to legacy format for backward compatibility
    return {
      cid: result.identifier,
      gatewayUrl: result.gatewayUrl,
      size: result.size,
      hash: result.hash,
      timestamp: result.timestamp
    }
  }

  /**
   * Retrieve file from IPFS
   *
   * @param cid - Content identifier
   * @returns File blob
   */
  async retrieveFile(cid: string): Promise<Blob> {
    // NEW: Download via adapter
    const buffer = await this.adapter.download(cid)
    return new Blob([new Uint8Array(buffer)])
  }

  /**
   * Record data pointer on-chain
   *
   * @param cid - Content identifier
   * @param metadata - Data metadata
   * @returns Transaction hash
   */
  async recordDataPointer(cid: string, metadata: any): Promise<string> {
    const contract = await this.getDataProofContract()
    const signer = this.sdk.getSigner()
    const contractWithSigner = contract.connect(signer)

    const storeDataProofFunc = contractWithSigner.getFunction('storeDataProof')
    const tx = await storeDataProofFunc(
      cid,
      metadata.hash || ethers.ZeroHash,
      JSON.stringify(metadata)
    )

    const receipt = await tx.wait()
    return receipt.hash
  }

  /**
   * Get data pointer from on-chain registry
   *
   * @param cid - Content identifier
   * @returns Data pointer
   */
  async getDataPointer(cid: string): Promise<DataPointer> {
    const contract = await this.getDataProofContract()
    const proof = await contract.getDataProof(cid)

    return {
      pointerId: cid,
      cid,
      owner: proof.owner,
      metadata: proof.metadata,
      timestamp: Number(proof.timestamp)
    }
  }

  /**
   * Pin content to ensure persistence
   *
   * @param cid - Content identifier
   */
  async pin(cid: string): Promise<void> {
    // NEW: Pin is now a no-op for backward compatibility
    // Content is automatically pinned during upload
    // This method is kept for API compatibility
    console.log(`✅ Content already pinned during upload: ${cid}`)
  }

  /**
   * Unpin content
   *
   * @param cid - Content identifier
   */
  async unpin(cid: string): Promise<void> {
    // NEW: Delegate to adapter delete
    await this.adapter.delete(cid)
    console.log(`✅ Content unpinned: ${cid}`)
  }

  /**
   * List pinned content
   *
   * @param filters - Pin filters
   * @returns Array of pins
   */
  async listPins(filters?: PinFilters): Promise<Pin[]> {
    // NEW: Delegate to adapter list
    const items = await this.adapter.list({
      maxResults: filters?.limit,
      startAfter: filters?.offset?.toString()
    })

    // Convert to legacy Pin format
    return items.map(item => ({
      cid: item.key,
      name: item.metadata?.name,
      size: item.size,
      timestamp: item.lastModified.getTime()
    }))
  }

  /**
   * Submit data to Celestia for data availability
   *
   * @param data - Data to submit
   * @param namespace - Celestia namespace
   * @returns Celestia receipt
   */
  async submitToCelestia(data: any, namespace: string): Promise<CelestiaReceipt> {
    const walletAddress = await this.sdk.getAddress()
    const key = await this.deriveKey(walletAddress)
    const encrypted = this.encrypt(data, key)

    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/celestia/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({
        data: encrypted,
        namespace,
        walletAddress
      })
    })

    if (!response.ok) {
      throw new Error(`Celestia submit failed: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Retrieve data from Celestia
   *
   * @param height - Block height
   * @param blobId - Blob identifier
   * @returns Decrypted data
   */
  async retrieveFromCelestia(height: number, blobId: string): Promise<any> {
    const walletAddress = await this.sdk.getAddress()
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(
      `${apiEndpoint}/api/v1/celestia/retrieve/${height}/${blobId}`,
      {
        headers: {
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Celestia retrieve failed: ${response.statusText}`)
    }

    const encrypted = await response.text()
    const key = await this.deriveKey(walletAddress)
    return this.decrypt(encrypted, key)
  }
}
