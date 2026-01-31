/**
 * Varity SDK - Auth Module
 *
 * Universal authentication, permissions, and access control.
 * Works across all templates (ISO, Healthcare, Retail, etc.)
 */

import { ethers } from 'ethers'
import type { VaritySDK } from '../../core/VaritySDK'
import type { Role, UserProfile, AccessCondition } from '../../core/types'
import AccessControlRegistryABI from '../../contracts/abis/iso/AccessControlRegistry.json'

export interface LoginCredentials {
  address?: string
  signature?: string
  message?: string
}

export interface AuthToken {
  token: string
  expiresAt: number
  user: string
}

export interface User {
  address: string
  roles: Role[]
  profile?: UserProfile
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
export class AuthModule {
  private sdk: VaritySDK
  private accessControlContract: ethers.Contract | null = null

  constructor(sdk: VaritySDK) {
    this.sdk = sdk
  }

  /**
   * Initialize Access Control contract
   */
  private async getAccessControlContract(): Promise<ethers.Contract> {
    if (!this.accessControlContract) {
      const address = this.sdk.getContractAddress('AccessControlRegistry')
      const provider = this.sdk.getProvider()
      this.accessControlContract = new ethers.Contract(
        address,
        AccessControlRegistryABI.abi,
        provider
      )
    }
    return this.accessControlContract
  }

  /**
   * Login with wallet signature
   *
   * @param credentials - Login credentials
   * @returns Authentication token
   */
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    const signer = this.sdk.getSigner()
    const address = await signer.getAddress()

    // Generate signature message
    const message = credentials.message || `Login to Varity at ${Date.now()}`
    const signature = credentials.signature || await signer.signMessage(message)

    // Call backend API for token
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const response = await fetch(`${apiEndpoint}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, signature, message })
    })

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    // Clear any cached tokens/sessions
    // Implementation depends on storage strategy
    console.log('Logged out')
  }

  /**
   * Get current authenticated user
   *
   * @returns Current user info
   */
  async getCurrentUser(): Promise<User> {
    const address = await this.sdk.getAddress()
    const roles = await this.getUserRoles(address)
    const profile = await this.getUserProfile(address)

    return { address, roles, profile }
  }

  /**
   * Check if user has permission to access a resource
   *
   * @param user - User address
   * @param resource - Resource identifier
   * @returns True if user has access
   */
  async checkPermission(user: string, resource: string): Promise<boolean> {
    const contract = await this.getAccessControlContract()

    // Check if user has any required roles for the resource
    // This is a simplified check - real implementation would be more sophisticated
    const roles = await this.getUserRoles(user)

    // Resource-based access control logic
    // Could be extended with more granular permissions
    return roles.length > 0
  }

  /**
   * Assign role to user
   *
   * @param user - User address
   * @param role - Role to assign
   * @param metadata - Optional metadata
   */
  async assignRole(user: string, role: Role, metadata?: string): Promise<void> {
    const contract = await this.getAccessControlContract()
    const signer = this.sdk.getSigner()
    const contractWithSigner = contract.connect(signer)

    const assignRoleFunc = contractWithSigner.getFunction('assignRole')
    const tx = await assignRoleFunc(
      user,
      role,
      metadata || ''
    )

    await tx.wait()
    console.log(`✅ Role ${role} assigned to ${user}`)
  }

  /**
   * Revoke role from user
   *
   * @param user - User address
   * @param role - Role to revoke
   */
  async revokeRole(user: string, role: Role): Promise<void> {
    const contract = await this.getAccessControlContract()
    const signer = this.sdk.getSigner()
    const contractWithSigner = contract.connect(signer)

    const revokeRoleFunc = contractWithSigner.getFunction('revokeRole')
    const tx = await revokeRoleFunc(user, role)
    await tx.wait()
    console.log(`✅ Role ${role} revoked from ${user}`)
  }

  /**
   * Get all roles for a user
   *
   * @param user - User address
   * @returns Array of roles
   */
  async getUserRoles(user: string): Promise<Role[]> {
    const contract = await this.getAccessControlContract()
    const profile = await contract.getUserProfile(user)

    // Return primary role (could be extended to return all roles)
    return profile.primaryRole ? [profile.primaryRole] : []
  }

  /**
   * Get user profile
   *
   * @param user - User address
   * @returns User profile
   */
  async getUserProfile(user: string): Promise<UserProfile> {
    const contract = await this.getAccessControlContract()
    const profile = await contract.getUserProfile(user)

    return {
      userAddress: profile.userAddress,
      primaryRole: profile.primaryRole,
      metadata: profile.metadata,
      createdAt: Number(profile.createdAt),
      lastUpdated: Number(profile.lastUpdated),
      isActive: profile.isActive
    }
  }

  /**
   * Set Lit Protocol access condition for a role
   *
   * @param role - Role
   * @param condition - Lit Protocol condition JSON
   * @param encryptedKey - Encrypted symmetric key
   */
  async setAccessCondition(
    role: Role,
    condition: string,
    encryptedKey: string
  ): Promise<void> {
    const contract = await this.getAccessControlContract()
    const signer = this.sdk.getSigner()
    const contractWithSigner = contract.connect(signer)

    const setAccessConditionFunc = contractWithSigner.getFunction('setAccessCondition')
    const tx = await setAccessConditionFunc(
      role,
      condition,
      ethers.toUtf8Bytes(encryptedKey)
    )

    await tx.wait()
    console.log(`✅ Access condition set for role ${role}`)
  }

  /**
   * Get Lit Protocol access condition for a role
   *
   * @param role - Role
   * @returns Access condition
   */
  async getAccessCondition(role: Role): Promise<AccessCondition> {
    const contract = await this.getAccessControlContract()
    const condition = await contract.getAccessCondition(role)

    return {
      condition: condition.condition,
      encryptedKey: ethers.toUtf8String(condition.encryptedKey),
      isActive: condition.isActive,
      lastUpdated: Number(condition.lastUpdated)
    }
  }

  /**
   * Check if user has a specific role
   *
   * @param user - User address
   * @param role - Role to check
   * @returns True if user has the role
   */
  async hasRole(user: string, role: Role): Promise<boolean> {
    const roles = await this.getUserRoles(user)
    return roles.includes(role)
  }

  /**
   * Check if user has any of the specified roles
   *
   * @param user - User address
   * @param roles - Roles to check
   * @returns True if user has any of the roles
   */
  async hasAnyRole(user: string, roles: Role[]): Promise<boolean> {
    const userRoles = await this.getUserRoles(user)
    return roles.some(role => userRoles.includes(role))
  }
}
