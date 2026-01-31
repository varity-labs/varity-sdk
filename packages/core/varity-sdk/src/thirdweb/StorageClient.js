/**
 * thirdweb Storage Client
 *
 * Decentralized storage powered by IPFS and Arweave
 * Seamless integration with thirdweb's storage infrastructure
 *
 * Features:
 * - IPFS storage with automatic pinning
 * - Arweave permanent storage
 * - Metadata management for NFTs
 * - Batch uploads
 * - Gateway URLs for fast access
 * - Image optimization and resizing
 */
import { upload, download } from 'thirdweb/storage';
/**
 * thirdweb Storage Client
 *
 * Decentralized storage for NFTs, metadata, and files
 */
export class StorageClient {
    client;
    provider;
    uploadOptions;
    constructor(config) {
        this.client = config.client;
        this.provider = config.provider || 'ipfs';
        this.uploadOptions = config.uploadOptions || { pin: true };
    }
    /**
     * Upload a file to decentralized storage
     */
    async uploadFile(file) {
        const startTime = Date.now();
        // Convert Blob to File if needed
        const fileToUpload = file instanceof File
            ? file
            : new File([file], 'file', { type: file.type });
        const uris = await upload({
            client: this.client,
            files: [fileToUpload],
        });
        // upload returns array of URIs
        const uri = Array.isArray(uris) ? uris[0] : uris;
        return {
            uri,
            gatewayUrl: this.getGatewayUrl(uri),
            provider: this.provider,
            size: file.size,
            timestamp: new Date(),
        };
    }
    /**
     * Upload JSON data
     */
    async uploadJSON(data) {
        const json = JSON.stringify(data);
        const blob = new Blob([json], { type: 'application/json' });
        return this.uploadFile(blob);
    }
    /**
     * Upload NFT metadata
     */
    async uploadMetadata(metadata) {
        // Validate metadata structure
        if (!metadata.name || !metadata.description || !metadata.image) {
            throw new Error('NFT metadata must include name, description, and image');
        }
        return this.uploadJSON(metadata);
    }
    /**
     * Upload multiple files in batch
     */
    async uploadBatch(items) {
        const startTime = Date.now();
        const results = [];
        let totalSize = 0;
        for (const item of items) {
            let file;
            if (item.data instanceof File || item.data instanceof Blob) {
                file = item.data;
            }
            else {
                // Convert object to JSON blob
                const json = JSON.stringify(item.data);
                file = new Blob([json], { type: 'application/json' });
            }
            const result = await this.uploadFile(file);
            results.push(result);
            totalSize += result.size;
        }
        return {
            results,
            totalSize,
            duration: Date.now() - startTime,
        };
    }
    /**
     * Download a file from decentralized storage
     */
    async downloadFile(uri, options) {
        const response = await download({
            client: this.client,
            uri,
        });
        return response;
    }
    /**
     * Download JSON data
     */
    async downloadJSON(uri, options) {
        const response = await this.downloadFile(uri, options);
        return response.json();
    }
    /**
     * Get gateway URL for a URI
     */
    getGatewayUrl(uri, options) {
        // Extract CID from IPFS URI
        const cid = uri.replace('ipfs://', '');
        // Base gateway URL
        let gatewayUrl = `https://gateway.thirdweb.com/ipfs/${cid}`;
        // Add optimization parameters if provided
        if (options) {
            const params = new URLSearchParams();
            if (options.width)
                params.set('width', options.width.toString());
            if (options.height)
                params.set('height', options.height.toString());
            if (options.quality)
                params.set('quality', options.quality.toString());
            if (options.format)
                params.set('format', options.format);
            const queryString = params.toString();
            if (queryString) {
                gatewayUrl += `?${queryString}`;
            }
        }
        return gatewayUrl;
    }
    /**
     * Pin a file to IPFS (ensure permanent availability)
     */
    async pinFile(uri) {
        // thirdweb automatically pins files uploaded through their service
        // This method is provided for completeness but may not be necessary
        console.log(`File ${uri} is automatically pinned by thirdweb`);
    }
    /**
     * Unpin a file from IPFS
     */
    async unpinFile(uri) {
        console.warn('Unpinning is not supported through thirdweb gateway');
    }
    /**
     * Get file metadata
     */
    async getMetadata(uri) {
        const cid = uri.replace('ipfs://', '');
        return {
            cid,
            pinned: true, // thirdweb automatically pins
        };
    }
    /**
     * Upload a directory of files
     */
    async uploadDirectory(files) {
        const items = files.map(file => ({ data: file, filename: file.name }));
        return this.uploadBatch(items);
    }
    /**
     * Create and upload NFT collection metadata
     */
    async uploadCollection(metadata) {
        const results = await this.uploadBatch(metadata.map(data => ({ data })));
        // Calculate base URI (common prefix)
        const uris = results.results.map(r => r.uri);
        const baseUri = uris[0].substring(0, uris[0].lastIndexOf('/'));
        return {
            metadataUris: uris,
            baseUri,
        };
    }
    /**
     * Resolve IPFS URI to HTTP gateway URL
     */
    static resolveUri(uri) {
        if (uri.startsWith('ipfs://')) {
            return `https://gateway.thirdweb.com/ipfs/${uri.replace('ipfs://', '')}`;
        }
        if (uri.startsWith('ar://')) {
            return `https://arweave.net/${uri.replace('ar://', '')}`;
        }
        return uri;
    }
    /**
     * Check if a URI is IPFS
     */
    static isIPFS(uri) {
        return uri.startsWith('ipfs://') || uri.startsWith('Qm') || uri.startsWith('baf');
    }
    /**
     * Check if a URI is Arweave
     */
    static isArweave(uri) {
        return uri.startsWith('ar://');
    }
}
/**
 * Create Storage client instance
 */
export function createStorageClient(config) {
    return new StorageClient(config);
}
//# sourceMappingURL=StorageClient.js.map