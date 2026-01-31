/**
 * Varity SDK - Filecoin/IPFS Storage Adapter
 *
 * Implements IStorageAdapter for Filecoin/IPFS storage via Pinata API.
 * Extracted from StorageModule to enable multi-backend support.
 */
import { StorageBackend, StorageTier } from '@varity/types';
import { BaseStorageAdapter } from './IStorageAdapter';
/**
 * Filecoin/IPFS adapter implementation using Pinata API
 *
 * This adapter handles all Filecoin/IPFS operations including:
 * - Pinning content to IPFS
 * - Retrieving content via IPFS gateways
 * - Managing pins (list, delete)
 * - Gateway URL generation
 *
 * @example
 * ```typescript
 * const adapter = new FilecoinAdapter(sdk)
 * const result = await adapter.upload(Buffer.from('Hello World'), {
 *   layer: StorageLayer.CUSTOMER_DATA,
 *   tier: StorageTier.HOT,
 *   pin: true
 * })
 * console.log('CID:', result.identifier)
 * ```
 */
export class FilecoinAdapter extends BaseStorageAdapter {
    sdk;
    constructor(sdk) {
        super(StorageBackend.FILECOIN_IPFS);
        this.sdk = sdk;
    }
    /**
     * Upload data to Filecoin/IPFS via backend API
     *
     * @param data - Data to upload (Buffer, string, Blob)
     * @param options - Upload options including layer, tier, metadata
     * @returns Storage result with CID and gateway URL
     */
    async upload(data, options) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        // Convert data to appropriate format
        let uploadData;
        if (data instanceof Buffer) {
            uploadData = data.toString('base64');
        }
        else if (data instanceof Blob) {
            const buffer = await data.arrayBuffer();
            uploadData = Buffer.from(buffer).toString('base64');
        }
        else {
            uploadData = data;
        }
        // Call backend API to pin to IPFS
        const response = await fetch(`${apiEndpoint}/api/v1/storage/pin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify({
                data: uploadData,
                metadata: {
                    layer: options.layer,
                    tier: options.tier || StorageTier.HOT,
                    timestamp: Date.now(),
                    contentType: options.contentType || 'application/octet-stream',
                    ...options.metadata
                }
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
        }
        const result = await response.json();
        return {
            identifier: result.cid,
            gatewayUrl: result.gatewayUrl || `https://gateway.pinata.cloud/ipfs/${result.cid}`,
            size: result.size || 0,
            hash: result.hash || result.cid,
            timestamp: Date.now(),
            backend: StorageBackend.FILECOIN_IPFS,
            tier: options.tier || StorageTier.HOT,
            layer: options.layer
        };
    }
    /**
     * Download data from Filecoin/IPFS
     *
     * @param identifier - CID (Content Identifier)
     * @returns Downloaded data as Buffer
     */
    async download(identifier) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/storage/retrieve/${identifier}`, {
            method: 'GET',
            headers: {
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Download failed: ${response.statusText} - ${errorText}`);
        }
        // Check content type to determine if it's binary or text
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json') || contentType.includes('text/')) {
            const text = await response.text();
            return Buffer.from(text);
        }
        else {
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        }
    }
    /**
     * Delete (unpin) data from Filecoin/IPFS
     *
     * @param identifier - CID to unpin
     */
    async delete(identifier) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/storage/unpin/${identifier}`, {
            method: 'DELETE',
            headers: {
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Delete failed: ${response.statusText} - ${errorText}`);
        }
    }
    /**
     * Check if data exists on Filecoin/IPFS
     *
     * @param identifier - CID to check
     * @returns True if exists, false otherwise
     */
    async exists(identifier) {
        try {
            await this.getMetadata(identifier);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * List pinned objects
     *
     * @param options - List filtering options
     * @returns Array of storage items
     */
    async list(options) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const queryParams = new URLSearchParams();
        if (options?.prefix)
            queryParams.append('prefix', options.prefix);
        if (options?.maxResults)
            queryParams.append('limit', options.maxResults.toString());
        if (options?.continuationToken)
            queryParams.append('pageToken', options.continuationToken);
        if (options?.startAfter)
            queryParams.append('startAfter', options.startAfter);
        const response = await fetch(`${apiEndpoint}/api/v1/storage/list?${queryParams}`, {
            headers: {
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`List failed: ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        return (data.items || []).map((item) => ({
            identifier: item.cid,
            key: item.cid,
            size: item.size || 0,
            lastModified: new Date(item.timestamp || Date.now()),
            etag: item.hash || item.cid,
            metadata: item.metadata,
            tier: item.metadata?.tier,
            encrypted: item.metadata?.encrypted || false
        }));
    }
    /**
     * Get metadata for a pinned object
     *
     * @param identifier - CID to get metadata for
     * @returns Storage metadata
     */
    async getMetadata(identifier) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/storage/metadata/${identifier}`, {
            headers: {
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Get metadata failed: ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        return {
            identifier: identifier,
            size: data.size || 0,
            contentType: data.contentType || 'application/octet-stream',
            lastModified: new Date(data.timestamp || Date.now()),
            etag: data.hash || identifier,
            customMetadata: data.metadata || {},
            tier: data.metadata?.tier,
            layer: data.metadata?.layer,
            encrypted: data.metadata?.encrypted || false
        };
    }
    /**
     * Get access URL for a CID
     *
     * @param identifier - CID
     * @param expiresIn - Not used for IPFS (always public)
     * @returns Gateway URL
     */
    async getAccessUrl(identifier, expiresIn) {
        // For IPFS, always return public gateway URL
        // Note: expiresIn is ignored since IPFS gateways are public
        return `https://gateway.pinata.cloud/ipfs/${identifier}`;
    }
    /**
     * Health check for Filecoin/IPFS backend
     *
     * @returns Health status with latency
     */
    async healthCheck() {
        const startTime = Date.now();
        try {
            const apiEndpoint = this.sdk.getAPIEndpoint();
            const response = await fetch(`${apiEndpoint}/health`, {
                method: 'GET'
            });
            const latencyMs = Date.now() - startTime;
            return {
                healthy: response.ok,
                latencyMs,
                error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
            };
        }
        catch (error) {
            return {
                healthy: false,
                latencyMs: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
//# sourceMappingURL=FilecoinAdapter.js.map