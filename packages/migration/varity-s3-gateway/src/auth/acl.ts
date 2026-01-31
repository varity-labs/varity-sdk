/**
 * Access Control List (ACL) System for Wallet-based Permissions
 * Maps wallet addresses to S3 bucket/object permissions
 */

export enum S3Permission {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  READ_ACP = 'READ_ACP', // Read Access Control Policy
  WRITE_ACP = 'WRITE_ACP', // Write Access Control Policy
  FULL_CONTROL = 'FULL_CONTROL'
}

export enum S3Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  WRITE = 'WRITE',
  READ = 'READ',
  NONE = 'NONE'
}

export interface AccessControlEntry {
  walletAddress: string;
  role: S3Role;
  permissions: S3Permission[];
  buckets?: string[]; // Specific buckets, undefined means all
  grantedAt: Date;
  grantedBy?: string; // Wallet address of grantor
  expiresAt?: Date;
}

export interface BucketPolicy {
  bucket: string;
  owner: string;
  acl: AccessControlEntry[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * In-memory ACL store (use database in production)
 */
const aclStore = new Map<string, BucketPolicy>();

/**
 * Default permissions by role
 */
const rolePermissions: Record<S3Role, S3Permission[]> = {
  [S3Role.OWNER]: [S3Permission.FULL_CONTROL],
  [S3Role.ADMIN]: [
    S3Permission.READ,
    S3Permission.WRITE,
    S3Permission.DELETE,
    S3Permission.READ_ACP,
    S3Permission.WRITE_ACP
  ],
  [S3Role.WRITE]: [S3Permission.READ, S3Permission.WRITE],
  [S3Role.READ]: [S3Permission.READ],
  [S3Role.NONE]: []
};

/**
 * Access Control List Service
 */
export class AccessControlService {
  /**
   * Create bucket policy with owner
   */
  static createBucketPolicy(bucket: string, ownerAddress: string): BucketPolicy {
    const policy: BucketPolicy = {
      bucket,
      owner: ownerAddress.toLowerCase(),
      acl: [
        {
          walletAddress: ownerAddress.toLowerCase(),
          role: S3Role.OWNER,
          permissions: rolePermissions[S3Role.OWNER],
          grantedAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    aclStore.set(bucket, policy);
    return policy;
  }

  /**
   * Get bucket policy
   */
  static getBucketPolicy(bucket: string): BucketPolicy | undefined {
    return aclStore.get(bucket);
  }

  /**
   * Delete bucket policy
   */
  static deleteBucketPolicy(bucket: string): boolean {
    return aclStore.delete(bucket);
  }

  /**
   * Grant access to wallet address
   */
  static grantAccess(
    bucket: string,
    walletAddress: string,
    role: S3Role,
    grantedBy: string,
    options?: {
      permissions?: S3Permission[];
      buckets?: string[];
      expiresAt?: Date;
    }
  ): boolean {
    const policy = aclStore.get(bucket);

    if (!policy) {
      console.error(`Bucket policy not found for: ${bucket}`);
      return false;
    }

    // Check if grantor has permission
    if (!this.hasPermission(bucket, grantedBy, S3Permission.WRITE_ACP)) {
      console.error(`Grantor ${grantedBy} does not have WRITE_ACP permission`);
      return false;
    }

    // Remove existing entry for this address
    policy.acl = policy.acl.filter(
      entry => entry.walletAddress.toLowerCase() !== walletAddress.toLowerCase()
    );

    // Add new entry
    const entry: AccessControlEntry = {
      walletAddress: walletAddress.toLowerCase(),
      role,
      permissions: options?.permissions || rolePermissions[role],
      buckets: options?.buckets,
      grantedAt: new Date(),
      grantedBy: grantedBy.toLowerCase(),
      expiresAt: options?.expiresAt
    };

    policy.acl.push(entry);
    policy.updatedAt = new Date();

    return true;
  }

  /**
   * Revoke access from wallet address
   */
  static revokeAccess(bucket: string, walletAddress: string, revokedBy: string): boolean {
    const policy = aclStore.get(bucket);

    if (!policy) {
      return false;
    }

    // Check if revoker has permission
    if (!this.hasPermission(bucket, revokedBy, S3Permission.WRITE_ACP)) {
      console.error(`Revoker ${revokedBy} does not have WRITE_ACP permission`);
      return false;
    }

    // Prevent owner removal
    if (walletAddress.toLowerCase() === policy.owner.toLowerCase()) {
      console.error('Cannot revoke access from bucket owner');
      return false;
    }

    const initialLength = policy.acl.length;
    policy.acl = policy.acl.filter(
      entry => entry.walletAddress.toLowerCase() !== walletAddress.toLowerCase()
    );

    if (policy.acl.length < initialLength) {
      policy.updatedAt = new Date();
      return true;
    }

    return false;
  }

  /**
   * Check if wallet has specific permission
   */
  static hasPermission(
    bucket: string,
    walletAddress: string,
    permission: S3Permission
  ): boolean {
    const policy = aclStore.get(bucket);

    if (!policy) {
      return false;
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Find ACL entry for this wallet
    const entry = policy.acl.find(
      e => e.walletAddress.toLowerCase() === normalizedAddress
    );

    if (!entry) {
      return false;
    }

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      return false;
    }

    // Check bucket restriction
    if (entry.buckets && !entry.buckets.includes(bucket)) {
      return false;
    }

    // Check permission
    return (
      entry.permissions.includes(permission) ||
      entry.permissions.includes(S3Permission.FULL_CONTROL)
    );
  }

  /**
   * Check if wallet has any of the specified permissions
   */
  static hasAnyPermission(
    bucket: string,
    walletAddress: string,
    permissions: S3Permission[]
  ): boolean {
    return permissions.some(permission =>
      this.hasPermission(bucket, walletAddress, permission)
    );
  }

  /**
   * Check if wallet has all specified permissions
   */
  static hasAllPermissions(
    bucket: string,
    walletAddress: string,
    permissions: S3Permission[]
  ): boolean {
    return permissions.every(permission =>
      this.hasPermission(bucket, walletAddress, permission)
    );
  }

  /**
   * Get wallet's role for bucket
   */
  static getWalletRole(bucket: string, walletAddress: string): S3Role {
    const policy = aclStore.get(bucket);

    if (!policy) {
      return S3Role.NONE;
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const entry = policy.acl.find(
      e => e.walletAddress.toLowerCase() === normalizedAddress
    );

    return entry?.role || S3Role.NONE;
  }

  /**
   * Get wallet's permissions for bucket
   */
  static getWalletPermissions(bucket: string, walletAddress: string): S3Permission[] {
    const policy = aclStore.get(bucket);

    if (!policy) {
      return [];
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const entry = policy.acl.find(
      e => e.walletAddress.toLowerCase() === normalizedAddress
    );

    if (!entry) {
      return [];
    }

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      return [];
    }

    return entry.permissions;
  }

  /**
   * List all buckets accessible by wallet
   */
  static listAccessibleBuckets(walletAddress: string): string[] {
    const buckets: string[] = [];
    const normalizedAddress = walletAddress.toLowerCase();

    for (const [bucket, policy] of aclStore.entries()) {
      const entry = policy.acl.find(
        e => e.walletAddress.toLowerCase() === normalizedAddress
      );

      if (entry && (!entry.expiresAt || entry.expiresAt > new Date())) {
        // Check bucket restrictions
        if (!entry.buckets || entry.buckets.includes(bucket)) {
          buckets.push(bucket);
        }
      }
    }

    return buckets;
  }

  /**
   * Get bucket ACL (only if user has READ_ACP permission)
   */
  static getBucketAcl(bucket: string, requesterAddress: string): AccessControlEntry[] | null {
    const policy = aclStore.get(bucket);

    if (!policy) {
      return null;
    }

    // Check READ_ACP permission
    if (!this.hasPermission(bucket, requesterAddress, S3Permission.READ_ACP)) {
      return null;
    }

    return policy.acl;
  }

  /**
   * Set bucket ACL (only if user has WRITE_ACP permission)
   */
  static setBucketAcl(
    bucket: string,
    acl: AccessControlEntry[],
    requesterAddress: string
  ): boolean {
    const policy = aclStore.get(bucket);

    if (!policy) {
      return false;
    }

    // Check WRITE_ACP permission
    if (!this.hasPermission(bucket, requesterAddress, S3Permission.WRITE_ACP)) {
      return false;
    }

    // Ensure owner is in ACL
    const ownerEntry = acl.find(
      e => e.walletAddress.toLowerCase() === policy.owner.toLowerCase()
    );

    if (!ownerEntry) {
      console.error('ACL must include owner with OWNER role');
      return false;
    }

    policy.acl = acl;
    policy.updatedAt = new Date();

    return true;
  }

  /**
   * Transfer bucket ownership
   */
  static transferOwnership(
    bucket: string,
    newOwnerAddress: string,
    currentOwnerAddress: string
  ): boolean {
    const policy = aclStore.get(bucket);

    if (!policy) {
      return false;
    }

    // Verify current owner
    if (policy.owner.toLowerCase() !== currentOwnerAddress.toLowerCase()) {
      console.error('Only bucket owner can transfer ownership');
      return false;
    }

    // Update owner
    policy.owner = newOwnerAddress.toLowerCase();

    // Update ACL: remove old owner's entry and add new owner
    policy.acl = policy.acl.filter(
      e => e.walletAddress.toLowerCase() !== currentOwnerAddress.toLowerCase()
    );

    policy.acl.push({
      walletAddress: newOwnerAddress.toLowerCase(),
      role: S3Role.OWNER,
      permissions: rolePermissions[S3Role.OWNER],
      grantedAt: new Date(),
      grantedBy: currentOwnerAddress.toLowerCase()
    });

    policy.updatedAt = new Date();

    return true;
  }

  /**
   * Get all buckets (for admin purposes)
   */
  static getAllBuckets(): string[] {
    return Array.from(aclStore.keys());
  }

  /**
   * Get statistics
   */
  static getStats(): {
    totalBuckets: number;
    totalAclEntries: number;
    averageEntriesPerBucket: number;
  } {
    const totalBuckets = aclStore.size;
    let totalAclEntries = 0;

    for (const policy of aclStore.values()) {
      totalAclEntries += policy.acl.length;
    }

    return {
      totalBuckets,
      totalAclEntries,
      averageEntriesPerBucket: totalBuckets > 0 ? totalAclEntries / totalBuckets : 0
    };
  }

  /**
   * Clear all ACLs (for testing only)
   */
  static clearAll(): void {
    aclStore.clear();
  }
}
