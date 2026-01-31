/**
 * Access Key Management Module
 *
 * Handles creation, listing, and revocation of API access keys for
 * S3-compatible and GCS-compatible storage gateway authentication.
 *
 * @module AccessKeyModule
 */
import type { AccessKey, AccessKeyStatus, Permission, RateLimit } from '@varity-labs/types';
/**
 * Configuration for the Varity SDK
 * (Will be defined in SDK core, imported here for type safety)
 */
export interface VaritySDKConfig {
    apiEndpoint?: string;
    apiKey?: string;
    network?: string;
}
/**
 * Minimal SDK interface for dependency injection
 */
export interface VaritySDK {
    getAPIEndpoint(): string;
    getAPIKey(): string | null;
    getNetwork(): string;
}
/**
 * Options for creating a new access key
 */
export interface CreateAccessKeyOptions {
    /** Human-readable name for the key */
    name: string;
    /** Optional description */
    description?: string;
    /** Permissions to grant (defaults to full storage access) */
    permissions?: Permission[];
    /** Number of days until key expires (optional) */
    expiresInDays?: number;
    /** Rate limiting configuration (optional, uses defaults) */
    rateLimit?: RateLimit;
}
/**
 * Options for updating an access key
 */
export interface UpdateAccessKeyOptions {
    /** Update the name */
    name?: string;
    /** Update the description */
    description?: string;
    /** Update permissions */
    permissions?: Permission[];
    /** Update status */
    status?: AccessKeyStatus;
}
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
export declare class AccessKeyModule {
    private sdk;
    constructor(sdk: VaritySDK);
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
    createAccessKey(options: CreateAccessKeyOptions): Promise<AccessKey>;
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
    listAccessKeys(): Promise<AccessKey[]>;
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
    getAccessKey(accessKeyId: string): Promise<AccessKey>;
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
    revokeAccessKey(accessKeyId: string): Promise<void>;
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
    updateAccessKey(accessKeyId: string, updates: UpdateAccessKeyOptions): Promise<AccessKey>;
    /**
     * Generate a random access key ID
     * Format: VARITY + 16 random uppercase alphanumeric characters
     * Example: VARIETYAB12CD34EF56GH78
     */
    private generateAccessKeyId;
    /**
     * Generate a random secret access key
     * Format: 40 random base64 characters
     */
    private generateSecretAccessKey;
    /**
     * Get default permissions for new access keys
     * Grants full storage access to all buckets
     */
    private getDefaultPermissions;
    /**
     * Get default rate limit
     * Generous limits suitable for most applications
     */
    private getDefaultRateLimit;
}
//# sourceMappingURL=AccessKeyModule.d.ts.map