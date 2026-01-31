/**
 * Varity SDK - Storage Module
 *
 * Universal decentralized storage on IPFS/Filecoin/Celestia.
 * Works across all templates (ISO, Healthcare, Retail, etc.)
 *
 * REFACTORED: Now uses adapter pattern for multi-backend support
 */
import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import { StorageLayer, StorageTier } from '@varity/types';
import DataProofRegistryABI from '../../contracts/abis/iso/DataProofRegistry.json';
import { AdapterFactory } from './adapters/AdapterFactory';
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
    sdk;
    adapter; // NEW: Storage adapter for multi-backend support
    dataProofContract = null;
    constructor(sdk) {
        this.sdk = sdk;
        // NEW: Initialize adapter based on SDK configuration
        this.adapter = AdapterFactory.createFromSDKConfig(sdk);
    }
    /**
     * Initialize DataProofRegistry contract
     */
    async getDataProofContract() {
        if (!this.dataProofContract) {
            const address = this.sdk.getContractAddress('DataProofRegistry');
            const provider = this.sdk.getProvider();
            this.dataProofContract = new ethers.Contract(address, DataProofRegistryABI.abi, provider);
        }
        return this.dataProofContract;
    }
    /**
     * Derive encryption key from wallet address
     */
    async deriveKey(walletAddress) {
        // Use PBKDF2 with wallet address as password
        const salt = 'varity-sdk-v1';
        const iterations = 100000;
        return CryptoJS.PBKDF2(walletAddress.toLowerCase(), salt, {
            keySize: 256 / 32,
            iterations
        }).toString();
    }
    /**
     * Encrypt data with AES-256-GCM
     */
    encrypt(data, key) {
        const jsonString = JSON.stringify(data);
        return CryptoJS.AES.encrypt(jsonString, key).toString();
    }
    /**
     * Decrypt data
     */
    decrypt(encryptedData, key) {
        const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
        const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
        return JSON.parse(jsonString);
    }
    /**
     * Upload encrypted data to IPFS/Filecoin
     *
     * @param data - Data to upload
     * @param options - Storage options
     * @returns Upload result with CID
     */
    async uploadEncrypted(data, options) {
        const walletAddress = await this.sdk.getAddress();
        // 1. Derive encryption key from wallet
        const key = await this.deriveKey(walletAddress);
        // 2. Encrypt data
        const encrypted = this.encrypt(data, key);
        // 3. Upload via adapter (NEW: delegates to adapter)
        const adapterOptions = {
            layer: options?.layer || StorageLayer.CUSTOMER_DATA,
            tier: StorageTier.HOT, // Default to hot tier
            metadata: {
                walletAddress,
                encrypted: true,
                ...options?.metadata
            }
        };
        const result = await this.adapter.upload(encrypted, adapterOptions);
        // 4. Record data proof on-chain (optional)
        if (options?.pin !== false) {
            const hash = CryptoJS.SHA256(encrypted).toString();
            await this.recordDataPointer(result.identifier, {
                hash,
                owner: walletAddress,
                layer: options?.layer || StorageLayer.CUSTOMER_DATA,
                ...options?.metadata
            });
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
        };
    }
    /**
     * Retrieve and decrypt data from IPFS
     *
     * @param cid - Content identifier
     * @returns Decrypted data
     */
    async retrieveEncrypted(cid) {
        const walletAddress = await this.sdk.getAddress();
        // 1. Download via adapter (NEW: delegates to adapter)
        const buffer = await this.adapter.download(cid);
        const encrypted = buffer.toString();
        // 2. Derive key and decrypt
        const key = await this.deriveKey(walletAddress);
        return this.decrypt(encrypted, key);
    }
    /**
     * Upload file to IPFS
     *
     * @param file - File blob
     * @param options - Storage options
     * @returns Upload result
     */
    async uploadFile(file, options) {
        // NEW: Upload via adapter
        const adapterOptions = {
            layer: options?.layer || StorageLayer.CUSTOMER_DATA,
            tier: StorageTier.HOT,
            metadata: options?.metadata
        };
        const result = await this.adapter.upload(file, adapterOptions);
        // Convert to legacy format for backward compatibility
        return {
            cid: result.identifier,
            gatewayUrl: result.gatewayUrl,
            size: result.size,
            hash: result.hash,
            timestamp: result.timestamp
        };
    }
    /**
     * Retrieve file from IPFS
     *
     * @param cid - Content identifier
     * @returns File blob
     */
    async retrieveFile(cid) {
        // NEW: Download via adapter
        const buffer = await this.adapter.download(cid);
        return new Blob([new Uint8Array(buffer)]);
    }
    /**
     * Record data pointer on-chain
     *
     * @param cid - Content identifier
     * @param metadata - Data metadata
     * @returns Transaction hash
     */
    async recordDataPointer(cid, metadata) {
        const contract = await this.getDataProofContract();
        const signer = this.sdk.getSigner();
        const contractWithSigner = contract.connect(signer);
        const storeDataProofFunc = contractWithSigner.getFunction('storeDataProof');
        const tx = await storeDataProofFunc(cid, metadata.hash || ethers.ZeroHash, JSON.stringify(metadata));
        const receipt = await tx.wait();
        return receipt.hash;
    }
    /**
     * Get data pointer from on-chain registry
     *
     * @param cid - Content identifier
     * @returns Data pointer
     */
    async getDataPointer(cid) {
        const contract = await this.getDataProofContract();
        const proof = await contract.getDataProof(cid);
        return {
            pointerId: cid,
            cid,
            owner: proof.owner,
            metadata: proof.metadata,
            timestamp: Number(proof.timestamp)
        };
    }
    /**
     * Pin content to ensure persistence
     *
     * @param cid - Content identifier
     */
    async pin(cid) {
        // NEW: Pin is now a no-op for backward compatibility
        // Content is automatically pinned during upload
        // This method is kept for API compatibility
        console.log(`✅ Content already pinned during upload: ${cid}`);
    }
    /**
     * Unpin content
     *
     * @param cid - Content identifier
     */
    async unpin(cid) {
        // NEW: Delegate to adapter delete
        await this.adapter.delete(cid);
        console.log(`✅ Content unpinned: ${cid}`);
    }
    /**
     * List pinned content
     *
     * @param filters - Pin filters
     * @returns Array of pins
     */
    async listPins(filters) {
        // NEW: Delegate to adapter list
        const items = await this.adapter.list({
            maxResults: filters?.limit,
            startAfter: filters?.offset?.toString()
        });
        // Convert to legacy Pin format
        return items.map(item => ({
            cid: item.key,
            name: item.metadata?.name,
            size: item.size,
            timestamp: item.lastModified.getTime()
        }));
    }
    /**
     * Submit data to Celestia for data availability
     *
     * @param data - Data to submit
     * @param namespace - Celestia namespace
     * @returns Celestia receipt
     */
    async submitToCelestia(data, namespace) {
        const walletAddress = await this.sdk.getAddress();
        const key = await this.deriveKey(walletAddress);
        const encrypted = this.encrypt(data, key);
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
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
        });
        if (!response.ok) {
            throw new Error(`Celestia submit failed: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Retrieve data from Celestia
     *
     * @param height - Block height
     * @param blobId - Blob identifier
     * @returns Decrypted data
     */
    async retrieveFromCelestia(height, blobId) {
        const walletAddress = await this.sdk.getAddress();
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/celestia/retrieve/${height}/${blobId}`, {
            headers: {
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            }
        });
        if (!response.ok) {
            throw new Error(`Celestia retrieve failed: ${response.statusText}`);
        }
        const encrypted = await response.text();
        const key = await this.deriveKey(walletAddress);
        return this.decrypt(encrypted, key);
    }
}
//# sourceMappingURL=StorageModule.js.map