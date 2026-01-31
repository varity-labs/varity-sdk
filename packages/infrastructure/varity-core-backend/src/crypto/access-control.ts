/**
 * Access Control Utilities for Varity 3-Layer Storage
 * PROPRIETARY - DO NOT DISTRIBUTE
 *
 * Provides helper functions for creating and managing access control conditions
 */

import { AccessControlBuilder } from './LitProtocol';
import { StorageLayer } from '../types';
import logger from '../utils/logger';

export interface AccessControlConfig {
  layer: StorageLayer;
  primaryWallet?: string;
  adminWallets?: string[];
  industryRegistryContract?: string;
  industry?: string;
  emergencyWallets?: string[];
  expirationTimestamp?: number;
  nftContract?: string;
  tokenId?: string;
  chain?: string;
}

/**
 * Access Control Manager for 3-Layer Storage
 */
export class AccessControlManager {
  private chain: string;

  constructor(chain: string = 'ethereum') {
    this.chain = chain;
  }

  /**
   * Create access control conditions based on storage layer
   */
  createAccessControl(config: AccessControlConfig): any[] {
    const { layer } = config;

    logger.info('Creating access control conditions', {
      layer,
      chain: config.chain || this.chain,
    });

    switch (layer) {
      case 'varity-internal':
        return this.createLayer1Access(config);
      case 'industry-rag':
        return this.createLayer2Access(config);
      case 'customer-data':
        return this.createLayer3Access(config);
      default:
        throw new Error(`Invalid storage layer: ${layer}`);
    }
  }

  /**
   * Layer 1: Varity Internal Storage
   * Access: Varity admins only
   */
  private createLayer1Access(config: AccessControlConfig): any[] {
    if (!config.adminWallets || config.adminWallets.length === 0) {
      throw new Error('Admin wallets are required for Varity Internal storage');
    }

    const builder = new AccessControlBuilder();
    const chain = config.chain || this.chain;

    // Create OR conditions for all admin wallets
    config.adminWallets.forEach((wallet, index) => {
      builder.walletOwnership(wallet, chain);
      if (index < config.adminWallets!.length - 1) {
        builder.or();
      }
    });

    return builder.build();
  }

  /**
   * Layer 2: Industry RAG Storage
   * Access: All customers in industry + Varity admins
   */
  private createLayer2Access(config: AccessControlConfig): any[] {
    const chain = config.chain || this.chain;

    // Option 1: Industry registry contract (recommended for production)
    if (config.industryRegistryContract && config.industry) {
      const builder = new AccessControlBuilder();

      // Industry members can access
      builder.customContract(
        config.industryRegistryContract,
        'isIndustryMember',
        [':userAddress', config.industry],
        { comparator: '=', value: 'true' },
        chain
      );

      // OR Varity admins can access
      if (config.adminWallets && config.adminWallets.length > 0) {
        config.adminWallets.forEach((wallet) => {
          builder.or().walletOwnership(wallet, chain);
        });
      }

      return builder.build();
    }

    // Option 2: Simple wallet-based access (for testing/development)
    if (config.primaryWallet) {
      const builder = new AccessControlBuilder();
      builder.walletOwnership(config.primaryWallet, chain);

      if (config.adminWallets && config.adminWallets.length > 0) {
        config.adminWallets.forEach((wallet) => {
          builder.or().walletOwnership(wallet, chain);
        });
      }

      return builder.build();
    }

    throw new Error(
      'Either industryRegistryContract+industry or primaryWallet is required for Industry RAG storage'
    );
  }

  /**
   * Layer 3: Customer Data Storage
   * Access: Single customer wallet + emergency admin wallets
   */
  private createLayer3Access(config: AccessControlConfig): any[] {
    if (!config.primaryWallet) {
      throw new Error('Primary wallet is required for Customer Data storage');
    }

    const builder = new AccessControlBuilder();
    const chain = config.chain || this.chain;

    // Primary customer wallet
    builder.walletOwnership(config.primaryWallet, chain);

    // Emergency admin wallets (multisig access)
    if (config.emergencyWallets && config.emergencyWallets.length > 0) {
      config.emergencyWallets.forEach((wallet) => {
        builder.or().walletOwnership(wallet, chain);
      });
    }

    // Time-based expiration (optional)
    if (config.expirationTimestamp) {
      builder.and().timelock(config.expirationTimestamp, chain);
    }

    return builder.build();
  }

  /**
   * Create NFT-gated access control
   */
  createNFTGatedAccess(
    nftContract: string,
    tokenId: string,
    chain?: string
  ): any[] {
    const _chain = chain || this.chain;
    return new AccessControlBuilder()
      .nftOwnership(nftContract, tokenId, _chain)
      .build();
  }

  /**
   * Create token-gated access control
   */
  createTokenGatedAccess(
    tokenContract: string,
    minBalance: string,
    chain?: string
  ): any[] {
    const _chain = chain || this.chain;
    return new AccessControlBuilder()
      .tokenBalance(tokenContract, minBalance, _chain)
      .build();
  }

  /**
   * Create temporary access (time-limited)
   */
  createTemporaryAccess(
    walletAddress: string,
    expirationTimestamp: number,
    chain?: string
  ): any[] {
    const _chain = chain || this.chain;
    return new AccessControlBuilder()
      .walletOwnership(walletAddress, _chain)
      .and()
      .timelock(expirationTimestamp, _chain)
      .build();
  }

  /**
   * Create multi-signature access (requires multiple wallets)
   */
  createMultisigAccess(wallets: string[], chain?: string): any[] {
    if (wallets.length === 0) {
      throw new Error('At least one wallet is required for multisig access');
    }

    const builder = new AccessControlBuilder();
    const _chain = chain || this.chain;

    wallets.forEach((wallet, index) => {
      builder.walletOwnership(wallet, _chain);
      if (index < wallets.length - 1) {
        builder.or();
      }
    });

    return builder.build();
  }

  /**
   * Create custom access control with builder
   */
  createCustomAccess(
    builderFn: (builder: AccessControlBuilder) => AccessControlBuilder
  ): any[] {
    const builder = new AccessControlBuilder();
    return builderFn(builder).build();
  }
}

/**
 * Varity-specific access control presets
 */
export class VarityAccessPresets {
  /**
   * Admin-only access (Layer 1)
   */
  static adminOnly(adminWallets: string[], chain: string = 'ethereum'): any[] {
    return new AccessControlManager(chain).createAccessControl({
      layer: 'varity-internal',
      adminWallets,
      chain,
    });
  }

  /**
   * Industry-shared access (Layer 2)
   */
  static industryShared(
    industryRegistryContract: string,
    industry: string,
    adminWallets: string[] = [],
    chain: string = 'ethereum'
  ): any[] {
    return new AccessControlManager(chain).createAccessControl({
      layer: 'industry-rag',
      industryRegistryContract,
      industry,
      adminWallets,
      chain,
    });
  }

  /**
   * Customer private access with emergency override (Layer 3)
   */
  static customerPrivate(
    customerWallet: string,
    emergencyWallets: string[] = [],
    chain: string = 'ethereum'
  ): any[] {
    return new AccessControlManager(chain).createAccessControl({
      layer: 'customer-data',
      primaryWallet: customerWallet,
      emergencyWallets,
      chain,
    });
  }

  /**
   * Temporary customer access (expires after timestamp)
   */
  static temporaryCustomerAccess(
    customerWallet: string,
    expirationTimestamp: number,
    emergencyWallets: string[] = [],
    chain: string = 'ethereum'
  ): any[] {
    return new AccessControlManager(chain).createAccessControl({
      layer: 'customer-data',
      primaryWallet: customerWallet,
      emergencyWallets,
      expirationTimestamp,
      chain,
    });
  }
}

/**
 * Validate access control conditions
 */
export function validateAccessControl(conditions: any[]): boolean {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return false;
  }

  // Check that conditions are properly formatted
  for (const condition of conditions) {
    if (condition.operator) {
      // Operator check
      if (!['and', 'or'].includes(condition.operator)) {
        return false;
      }
    } else {
      // Condition check
      if (!condition.conditionType) {
        return false;
      }
      if (!condition.returnValueTest) {
        return false;
      }
      if (!condition.returnValueTest.comparator || !condition.returnValueTest.value) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Serialize access control conditions for storage
 */
export function serializeAccessControl(conditions: any[]): string {
  return JSON.stringify(conditions);
}

/**
 * Deserialize access control conditions from storage
 */
export function deserializeAccessControl(serialized: string): any[] {
  try {
    const conditions = JSON.parse(serialized);
    if (!validateAccessControl(conditions)) {
      throw new Error('Invalid access control conditions format');
    }
    return conditions;
  } catch (error: any) {
    logger.error('Failed to deserialize access control conditions', {
      error: error.message,
    });
    throw error;
  }
}

export default AccessControlManager;
