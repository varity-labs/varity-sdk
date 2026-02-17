/**
 * Varity Client - Main entry point for Varity L3 blockchain interactions
 *
 * This client provides a comprehensive SDK for interacting with Varity L3,
 * including wallet management, contract interactions, authentication, and storage.
 */

import { createThirdwebClient, defineChain, type ThirdwebClient, type Chain } from 'thirdweb';
import type { Account } from 'thirdweb/wallets';
import { ContractManager } from './contracts/ContractManager';
import { WalletManager } from './wallet/WalletManager';
import { SIWEAuth } from './auth/SIWEAuth';
import { StorageManager } from './storage/StorageManager';
import type { VarityClientConfig, ChainConfig } from './types';

// Default Thirdweb Client ID for Varity
const DEFAULT_CLIENT_ID = 'a35636133eb5ec6f30eb9f4c15fce2f3';

// Varity L3 Chain Configuration
export const VARITY_L3_CHAIN: ChainConfig = {
  chainId: 33529,
  name: 'Varity L3',
  rpcUrl: 'https://rpc-varity-l3-testnet-wkkzw3oqsj.t.conduit.xyz',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
  blockExplorer: 'https://explorer-varity-l3-testnet-wkkzw3oqsj.t.conduit.xyz',
};

// Arbitrum Sepolia Configuration
export const ARBITRUM_SEPOLIA_CHAIN: ChainConfig = {
  chainId: 421614,
  name: 'Arbitrum Sepolia',
  rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  blockExplorer: 'https://sepolia.arbiscan.io',
};

// Arbitrum One Configuration
export const ARBITRUM_ONE_CHAIN: ChainConfig = {
  chainId: 42161,
  name: 'Arbitrum One',
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  blockExplorer: 'https://arbiscan.io',
};

/**
 * Main Varity Client Class
 *
 * Provides comprehensive SDK for Varity L3 blockchain interactions.
 *
 * @example
 * ```typescript
 * // Initialize client
 * const client = new VarityClient({
 *   clientId: 'your-thirdweb-client-id',
 *   chain: 'varity-l3'
 * });
 *
 * // Connect wallet
 * await client.wallet.connect({ walletType: 'metamask' });
 *
 * // Read from contract
 * const balance = await client.contracts.read({
 *   address: '0x...',
 *   abi: [...],
 *   functionName: 'balanceOf',
 *   args: ['0x...']
 * });
 * ```
 */
export class VarityClient {
  private readonly thirdwebClient: ThirdwebClient;
  private readonly activeChain: Chain;

  public readonly contracts: ContractManager;
  public readonly wallet: WalletManager;
  public readonly auth: SIWEAuth;
  public readonly storage: StorageManager;

  constructor(config: VarityClientConfig = {}) {
    // Create Thirdweb client
    const clientId = config.clientId || DEFAULT_CLIENT_ID;

    this.thirdwebClient = createThirdwebClient({
      clientId,
      secretKey: config.secretKey,
    });

    // Setup chain
    this.activeChain = this.getChainFromConfig(config);

    // Initialize managers
    this.contracts = new ContractManager(this.thirdwebClient, this.activeChain);
    this.wallet = new WalletManager(this.thirdwebClient, this.activeChain);
    this.auth = new SIWEAuth(this.thirdwebClient, this.activeChain);
    this.storage = new StorageManager(this.thirdwebClient);
  }

  /**
   * Get chain configuration from config
   */
  private getChainFromConfig(config: VarityClientConfig): Chain {
    // If custom chain provided
    if (config.customChain) {
      return defineChain({
        id: config.customChain.chainId,
        name: config.customChain.name,
        rpc: config.customChain.rpcUrl,
        nativeCurrency: config.customChain.nativeCurrency,
      });
    }

    // If Chain object provided directly
    if (typeof config.chain === 'object') {
      return config.chain;
    }

    // Use predefined chains
    const chainName = config.chain || 'varity-l3';

    switch (chainName) {
      case 'varity-l3':
        return defineChain({
          id: VARITY_L3_CHAIN.chainId,
          name: VARITY_L3_CHAIN.name,
          rpc: VARITY_L3_CHAIN.rpcUrl,
          nativeCurrency: VARITY_L3_CHAIN.nativeCurrency,
        });

      case 'arbitrum-sepolia':
        return defineChain({
          id: ARBITRUM_SEPOLIA_CHAIN.chainId,
          name: ARBITRUM_SEPOLIA_CHAIN.name,
          rpc: ARBITRUM_SEPOLIA_CHAIN.rpcUrl,
          nativeCurrency: ARBITRUM_SEPOLIA_CHAIN.nativeCurrency,
        });

      case 'arbitrum-one':
        return defineChain({
          id: ARBITRUM_ONE_CHAIN.chainId,
          name: ARBITRUM_ONE_CHAIN.name,
          rpc: ARBITRUM_ONE_CHAIN.rpcUrl,
          nativeCurrency: ARBITRUM_ONE_CHAIN.nativeCurrency,
        });

      default:
        // Default to Varity L3
        return defineChain({
          id: VARITY_L3_CHAIN.chainId,
          name: VARITY_L3_CHAIN.name,
          rpc: VARITY_L3_CHAIN.rpcUrl,
          nativeCurrency: VARITY_L3_CHAIN.nativeCurrency,
        });
    }
  }

  /**
   * Get the Thirdweb client instance
   */
  getThirdwebClient(): ThirdwebClient {
    return this.thirdwebClient;
  }

  /**
   * Get the active chain
   */
  getChain(): Chain {
    return this.activeChain;
  }

  /**
   * Get chain ID
   */
  getChainId(): number {
    return this.activeChain.id;
  }

  /**
   * Get chain name
   */
  getChainName(): string {
    return this.activeChain.name || `Chain ${this.activeChain.id}`;
  }

  /**
   * Get RPC URL
   */
  getRpcUrl(): string {
    return this.activeChain.rpc || '';
  }

  /**
   * Check if connected to Varity L3
   */
  isVarityL3(): boolean {
    return this.activeChain.id === VARITY_L3_CHAIN.chainId;
  }

  /**
   * Get native currency info
   */
  getNativeCurrency() {
    return this.activeChain.nativeCurrency || {
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
    };
  }

  /**
   * Get client configuration
   */
  getConfig() {
    return {
      chainId: this.getChainId(),
      chainName: this.getChainName(),
      rpcUrl: this.getRpcUrl(),
      nativeCurrency: this.getNativeCurrency(),
      isVarityL3: this.isVarityL3(),
    };
  }

  /**
   * Dispose and cleanup resources
   */
  dispose() {
    // Cleanup any active connections or subscriptions
    this.wallet.disconnect();
  }
}

export default VarityClient;
