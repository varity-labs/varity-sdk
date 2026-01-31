/**
 * Varity SDK - Auth Module
 *
 * Universal authentication, permissions, and access control.
 * Works across all templates (ISO, Healthcare, Retail, etc.)
 */
import type { VaritySDK } from '../../core/VaritySDK';
import type { Role, UserProfile, AccessCondition } from '../../core/types';
export interface LoginCredentials {
    address?: string;
    signature?: string;
    message?: string;
}
export interface AuthToken {
    token: string;
    expiresAt: number;
    user: string;
}
export interface User {
    address: string;
    roles: Role[];
    profile?: UserProfile;
}
/**
 * AuthModule - Universal authentication and access control
 *
 * @example
 * ```typescript
 * // Login with wallet
 * const token = await sdk.auth.login({ address: '0x...' })
 *
 * // Check permissions
 * const canAccess = await sdk.auth.checkPermission('0x...', 'merchants')
 *
 * // Assign role
 * await sdk.auth.assignRole('0x...', Role.MANAGER)
 * ```
 */
export declare class AuthModule {
    private sdk;
    private accessControlContract;
    constructor(sdk: VaritySDK);
    /**
     * Initialize Access Control contract
     */
    private getAccessControlContract;
    /**
     * Login with wallet signature
     *
     * @param credentials - Login credentials
     * @returns Authentication token
     */
    login(credentials: LoginCredentials): Promise<AuthToken>;
    /**
     * Logout current user
     */
    logout(): Promise<void>;
    /**
     * Get current authenticated user
     *
     * @returns Current user info
     */
    getCurrentUser(): Promise<User>;
    /**
     * Check if user has permission to access a resource
     *
     * @param user - User address
     * @param resource - Resource identifier
     * @returns True if user has access
     */
    checkPermission(user: string, resource: string): Promise<boolean>;
    /**
     * Assign role to user
     *
     * @param user - User address
     * @param role - Role to assign
     * @param metadata - Optional metadata
     */
    assignRole(user: string, role: Role, metadata?: string): Promise<void>;
    /**
     * Revoke role from user
     *
     * @param user - User address
     * @param role - Role to revoke
     */
    revokeRole(user: string, role: Role): Promise<void>;
    /**
     * Get all roles for a user
     *
     * @param user - User address
     * @returns Array of roles
     */
    getUserRoles(user: string): Promise<Role[]>;
    /**
     * Get user profile
     *
     * @param user - User address
     * @returns User profile
     */
    getUserProfile(user: string): Promise<UserProfile>;
    /**
     * Set Lit Protocol access condition for a role
     *
     * @param role - Role
     * @param condition - Lit Protocol condition JSON
     * @param encryptedKey - Encrypted symmetric key
     */
    setAccessCondition(role: Role, condition: string, encryptedKey: string): Promise<void>;
    /**
     * Get Lit Protocol access condition for a role
     *
     * @param role - Role
     * @returns Access condition
     */
    getAccessCondition(role: Role): Promise<AccessCondition>;
    /**
     * Check if user has a specific role
     *
     * @param user - User address
     * @param role - Role to check
     * @returns True if user has the role
     */
    hasRole(user: string, role: Role): Promise<boolean>;
    /**
     * Check if user has any of the specified roles
     *
     * @param user - User address
     * @param roles - Roles to check
     * @returns True if user has any of the roles
     */
    hasAnyRole(user: string, roles: Role[]): Promise<boolean>;
}
//# sourceMappingURL=AuthModule.d.ts.map