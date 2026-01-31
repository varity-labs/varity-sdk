/**
 * Access Key Management Module
 *
 * Handles creation, listing, and revocation of API access keys for
 * S3-compatible and GCS-compatible storage gateway authentication.
 *
 * @module AccessKeyModule
 */
import { randomBytes } from 'crypto';
/**
 * Access Key Management Module
 *
 * Provides methods for managing API access keys used for authentication
 * with S3-compatible and GCS-compatible storage gateways.
 *
 * @example
 * ```typescript
 * // Create a new access key
 * const accessKey = await sdk.accessKeys.createAccessKey({
 *   name: 'Production S3 Access',
 *   description: 'Used by production app for S3 uploads',
 *   expiresInDays: 90
 * })
 *
 * console.log('Access Key ID:', accessKey.accessKeyId)
 * console.log('Secret Key:', accessKey.secretAccessKey) // Only shown once!
 *
 * // List all access keys
 * const keys = await sdk.accessKeys.listAccessKeys()
 *
 * // Revoke a key
 * await sdk.accessKeys.revokeAccessKey(accessKey.accessKeyId)
 * ```
 */
export class AccessKeyModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    /**
     * Create a new access key for the authenticated customer
     *
     * @param options - Configuration for the new access key
     * @returns The created access key (including secret, only shown once!)
     * @throws Error if authentication is missing or API request fails
     *
     * @example
     * ```typescript
     * const key = await sdk.accessKeys.createAccessKey({
     *   name: 'Backup System Key',
     *   description: 'Used by nightly backup job',
     *   permissions: [{
     *     resource: 'bucket:backups/*',
     *     actions: [Action.PUT_OBJECT, Action.GET_OBJECT],
     *     effect: PermissionEffect.ALLOW
     *   }],
     *   expiresInDays: 365
     * })
     * ```
     */
    async createAccessKey(options) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        if (!apiKey) {
            throw new Error('Authentication required to create access keys');
        }
        // Generate access key ID and secret
        const accessKeyId = this.generateAccessKeyId();
        const secretAccessKey = this.generateSecretAccessKey();
        const response = await fetch(`${apiEndpoint}/api/v1/auth/access-keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                accessKeyId,
                secretAccessKey,
                name: options.name,
                description: options.description,
                permissions: options.permissions || this.getDefaultPermissions(),
                expiresAt: options.expiresInDays
                    ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
                    : undefined,
                rateLimit: options.rateLimit || this.getDefaultRateLimit()
            })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to create access key: ${response.statusText}. ${errorData.message || ''}`);
        }
        const data = await response.json();
        return {
            accessKeyId: data.accessKeyId,
            secretAccessKey: data.secretAccessKey,
            customerId: data.customerId,
            name: data.name,
            description: data.description,
            permissions: data.permissions,
            status: data.status,
            createdAt: new Date(data.createdAt),
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
        };
    }
    /**
     * List all access keys for the authenticated customer
     *
     * Note: Secret access keys are redacted in the list response for security.
     * Secrets are only returned once during creation.
     *
     * @returns Array of access keys (without secrets)
     * @throws Error if authentication is missing or API request fails
     *
     * @example
     * ```typescript
     * const keys = await sdk.accessKeys.listAccessKeys()
     * for (const key of keys) {
     *   console.log(`${key.name}: ${key.accessKeyId} (${key.status})`)
     * }
     * ```
     */
    async listAccessKeys() {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        if (!apiKey) {
            throw new Error('Authentication required to list access keys');
        }
        const response = await fetch(`${apiEndpoint}/api/v1/auth/access-keys`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to list access keys: ${response.statusText}. ${errorData.message || ''}`);
        }
        const data = await response.json();
        return data.accessKeys.map((key) => ({
            accessKeyId: key.accessKeyId,
            secretAccessKey: '***REDACTED***', // Never return secret in list
            customerId: key.customerId,
            name: key.name,
            description: key.description,
            permissions: key.permissions,
            status: key.status,
            createdAt: new Date(key.createdAt),
            lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : undefined,
            expiresAt: key.expiresAt ? new Date(key.expiresAt) : undefined
        }));
    }
    /**
     * Get details of a specific access key
     *
     * @param accessKeyId - Access key ID to retrieve
     * @returns Access key details (without secret)
     * @throws Error if authentication is missing or API request fails
     *
     * @example
     * ```typescript
     * const key = await sdk.accessKeys.getAccessKey('VARIETYABC123')
     * console.log('Last used:', key.lastUsedAt)
     * ```
     */
    async getAccessKey(accessKeyId) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        if (!apiKey) {
            throw new Error('Authentication required to get access key');
        }
        const response = await fetch(`${apiEndpoint}/api/v1/auth/access-keys/${accessKeyId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to get access key: ${response.statusText}. ${errorData.message || ''}`);
        }
        const data = await response.json();
        return {
            accessKeyId: data.accessKeyId,
            secretAccessKey: '***REDACTED***',
            customerId: data.customerId,
            name: data.name,
            description: data.description,
            permissions: data.permissions,
            status: data.status,
            createdAt: new Date(data.createdAt),
            lastUsedAt: data.lastUsedAt ? new Date(data.lastUsedAt) : undefined,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
        };
    }
    /**
     * Revoke an access key (permanent, cannot be undone)
     *
     * @param accessKeyId - Access key ID to revoke
     * @throws Error if authentication is missing or API request fails
     *
     * @example
     * ```typescript
     * await sdk.accessKeys.revokeAccessKey('VARIETYABC123')
     * console.log('Key revoked successfully')
     * ```
     */
    async revokeAccessKey(accessKeyId) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        if (!apiKey) {
            throw new Error('Authentication required to revoke access keys');
        }
        const response = await fetch(`${apiEndpoint}/api/v1/auth/access-keys/${accessKeyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to revoke access key: ${response.statusText}. ${errorData.message || ''}`);
        }
    }
    /**
     * Update access key properties
     *
     * @param accessKeyId - Access key ID to update
     * @param updates - Properties to update
     * @returns Updated access key
     * @throws Error if authentication is missing or API request fails
     *
     * @example
     * ```typescript
     * const updated = await sdk.accessKeys.updateAccessKey('VARIETYABC123', {
     *   name: 'New Key Name',
     *   status: AccessKeyStatus.INACTIVE
     * })
     * ```
     */
    async updateAccessKey(accessKeyId, updates) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        if (!apiKey) {
            throw new Error('Authentication required to update access keys');
        }
        const response = await fetch(`${apiEndpoint}/api/v1/auth/access-keys/${accessKeyId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(updates)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to update access key: ${response.statusText}. ${errorData.message || ''}`);
        }
        const data = await response.json();
        return {
            accessKeyId: data.accessKeyId,
            secretAccessKey: '***REDACTED***',
            customerId: data.customerId,
            name: data.name,
            description: data.description,
            permissions: data.permissions,
            status: data.status,
            createdAt: new Date(data.createdAt),
            lastUsedAt: data.lastUsedAt ? new Date(data.lastUsedAt) : undefined,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
        };
    }
    // ============================================================================
    // Private Helper Methods
    // ============================================================================
    /**
     * Generate a random access key ID
     * Format: VARITY + 16 random uppercase alphanumeric characters
     * Example: VARIETYAB12CD34EF56GH78
     */
    generateAccessKeyId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const bytes = randomBytes(16);
        let result = 'VARITY';
        for (let i = 0; i < 16; i++) {
            result += chars[bytes[i] % chars.length];
        }
        return result;
    }
    /**
     * Generate a random secret access key
     * Format: 40 random base64 characters
     */
    generateSecretAccessKey() {
        return randomBytes(30).toString('base64');
    }
    /**
     * Get default permissions for new access keys
     * Grants full storage access to all buckets
     */
    getDefaultPermissions() {
        return [
            {
                resource: 'bucket:*',
                actions: [
                    'storage:GetObject',
                    'storage:PutObject',
                    'storage:DeleteObject',
                    'storage:ListObjects'
                ],
                effect: 'allow'
            }
        ];
    }
    /**
     * Get default rate limit
     * Generous limits suitable for most applications
     */
    getDefaultRateLimit() {
        return {
            requestsPerSecond: 100,
            requestsPerDay: 1_000_000,
            bandwidthPerDay: 100 * 1024 * 1024 * 1024 // 100 GB
        };
    }
}
//# sourceMappingURL=AccessKeyModule.js.map