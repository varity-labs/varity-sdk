/**
 * Wallet-to-GCS Permission Mapping
 * Maps wallet addresses to GCS bucket access and operations
 */

import { StorageLayer } from '../types';

export type GCSPermission = 'read' | 'write' | 'delete' | 'admin' | '*';

export interface WalletPermission {
  address: string;
  buckets: {
    name: string;
    permissions: GCSPermission[];
    storageLayer: StorageLayer;
  }[];
  globalPermissions: GCSPermission[];
  industry?: string;
  customerId?: string;
  isAdmin: boolean;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  storageLayer?: StorageLayer;
}

export class PermissionManager {
  private permissions: Map<string, WalletPermission>;

  constructor() {
    this.permissions = new Map();
    this.loadDefaultPermissions();
  }

  /**
   * Load default permission mappings
   */
  private loadDefaultPermissions(): void {
    // Load from environment or configuration
    const permissionsConfig = process.env.GCS_WALLET_BUCKET_MAPPING;

    if (permissionsConfig) {
      try {
        const config = JSON.parse(permissionsConfig);
        this.loadPermissionsFromConfig(config);
      } catch (error: any) {
        console.error('Failed to load permissions config:', error.message);
      }
    }
  }

  /**
   * Load permissions from configuration object
   */
  loadPermissionsFromConfig(config: any): void {
    if (Array.isArray(config)) {
      config.forEach(perm => {
        this.setWalletPermissions(perm);
      });
    }
  }

  /**
   * Set permissions for a wallet address
   */
  setWalletPermissions(permission: WalletPermission): void {
    this.permissions.set(permission.address.toLowerCase(), permission);
  }

  /**
   * Get permissions for a wallet address
   */
  getWalletPermissions(address: string): WalletPermission | null {
    return this.permissions.get(address.toLowerCase()) || null;
  }

  /**
   * Check if wallet has permission for bucket operation
   */
  checkBucketPermission(
    address: string,
    bucket: string,
    operation: GCSPermission
  ): PermissionCheckResult {
    const walletPerms = this.getWalletPermissions(address);

    if (!walletPerms) {
      return {
        allowed: false,
        reason: 'Wallet not registered for GCS access'
      };
    }

    // Admin users have all permissions
    if (walletPerms.isAdmin || walletPerms.globalPermissions.includes('*')) {
      return {
        allowed: true,
        storageLayer: this.determineBucketLayer(bucket)
      };
    }

    // Check global permissions
    if (walletPerms.globalPermissions.includes(operation)) {
      return {
        allowed: true,
        storageLayer: this.determineBucketLayer(bucket)
      };
    }

    // Check bucket-specific permissions
    const bucketPerm = walletPerms.buckets.find(
      b => b.name === bucket || this.matchesBucketPattern(b.name, bucket)
    );

    if (!bucketPerm) {
      return {
        allowed: false,
        reason: `No permission for bucket: ${bucket}`
      };
    }

    // Check if operation is allowed
    const hasPermission = bucketPerm.permissions.includes(operation) ||
                         bucketPerm.permissions.includes('*');

    if (!hasPermission) {
      return {
        allowed: false,
        reason: `Operation '${operation}' not allowed for bucket: ${bucket}`
      };
    }

    return {
      allowed: true,
      storageLayer: bucketPerm.storageLayer
    };
  }

  /**
   * Match bucket pattern (supports wildcards)
   */
  private matchesBucketPattern(pattern: string, bucket: string): boolean {
    // Convert pattern to regex (simple wildcard support)
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(bucket);
  }

  /**
   * Determine storage layer from bucket name
   */
  private determineBucketLayer(bucket: string): StorageLayer {
    if (bucket.startsWith('varity-internal-')) {
      return 'varity-internal';
    }

    if (bucket.startsWith('industry-')) {
      return 'industry-rag';
    }

    if (bucket.startsWith('customer-')) {
      return 'customer-data';
    }

    // Default to customer data layer
    return 'customer-data';
  }

  /**
   * Get storage layer access for wallet
   */
  getStorageLayerAccess(address: string): {
    varityInternal: boolean;
    industryRag: boolean;
    customerData: boolean;
  } {
    const walletPerms = this.getWalletPermissions(address);

    if (!walletPerms) {
      return {
        varityInternal: false,
        industryRag: false,
        customerData: false
      };
    }

    // Admin has all access
    if (walletPerms.isAdmin) {
      return {
        varityInternal: true,
        industryRag: true,
        customerData: true
      };
    }

    // Check bucket-level access
    const layers = {
      varityInternal: false,
      industryRag: false,
      customerData: false
    };

    walletPerms.buckets.forEach(bucket => {
      switch (bucket.storageLayer) {
        case 'varity-internal':
          layers.varityInternal = true;
          break;
        case 'industry-rag':
          layers.industryRag = true;
          break;
        case 'customer-data':
          layers.customerData = true;
          break;
      }
    });

    return layers;
  }

  /**
   * Create default permissions for new customer wallet
   */
  createCustomerPermissions(
    address: string,
    customerId: string,
    industry?: string
  ): WalletPermission {
    const permissions: WalletPermission = {
      address: address.toLowerCase(),
      buckets: [
        {
          name: `customer-${customerId}-*`,
          permissions: ['read', 'write', 'delete'],
          storageLayer: 'customer-data'
        }
      ],
      globalPermissions: [],
      customerId,
      isAdmin: false
    };

    // Add industry RAG access if industry specified
    if (industry) {
      permissions.industry = industry;
      permissions.buckets.push({
        name: `industry-${industry}-rag-*`,
        permissions: ['read'],
        storageLayer: 'industry-rag'
      });
    }

    this.setWalletPermissions(permissions);
    return permissions;
  }

  /**
   * Create admin permissions
   */
  createAdminPermissions(address: string): WalletPermission {
    const permissions: WalletPermission = {
      address: address.toLowerCase(),
      buckets: [],
      globalPermissions: ['*'],
      isAdmin: true
    };

    this.setWalletPermissions(permissions);
    return permissions;
  }

  /**
   * Add bucket permission to existing wallet
   */
  addBucketPermission(
    address: string,
    bucket: string,
    permissions: GCSPermission[],
    storageLayer: StorageLayer
  ): boolean {
    const walletPerms = this.getWalletPermissions(address);

    if (!walletPerms) {
      return false;
    }

    // Check if bucket permission already exists
    const existingIndex = walletPerms.buckets.findIndex(b => b.name === bucket);

    if (existingIndex >= 0) {
      // Update existing permissions
      walletPerms.buckets[existingIndex].permissions = permissions;
      walletPerms.buckets[existingIndex].storageLayer = storageLayer;
    } else {
      // Add new bucket permission
      walletPerms.buckets.push({
        name: bucket,
        permissions,
        storageLayer
      });
    }

    this.setWalletPermissions(walletPerms);
    return true;
  }

  /**
   * Remove bucket permission
   */
  removeBucketPermission(address: string, bucket: string): boolean {
    const walletPerms = this.getWalletPermissions(address);

    if (!walletPerms) {
      return false;
    }

    const index = walletPerms.buckets.findIndex(b => b.name === bucket);

    if (index >= 0) {
      walletPerms.buckets.splice(index, 1);
      this.setWalletPermissions(walletPerms);
      return true;
    }

    return false;
  }

  /**
   * List all wallet permissions
   */
  listAllPermissions(): WalletPermission[] {
    return Array.from(this.permissions.values());
  }

  /**
   * Export permissions to JSON
   */
  exportPermissions(): string {
    return JSON.stringify(this.listAllPermissions(), null, 2);
  }

  /**
   * Import permissions from JSON
   */
  importPermissions(json: string): void {
    try {
      const permissions = JSON.parse(json);
      this.loadPermissionsFromConfig(permissions);
    } catch (error: any) {
      throw new Error(`Failed to import permissions: ${error.message}`);
    }
  }

  /**
   * Clear all permissions
   */
  clearPermissions(): void {
    this.permissions.clear();
  }
}

export default PermissionManager;
