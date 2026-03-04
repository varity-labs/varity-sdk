/**
 * Varity L3 Chain Definition for Thirdweb SDK v5
 *
 * Chain ID: 33529
 * RPC: https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz
 * Explorer: https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz
 *
 * CRITICAL: Native token is USDC with 6 decimals (NOT 18!)
 */

import { defineChain } from 'thirdweb/chains';

/**
 * Varity Testnet L3 Chain Configuration
 * Built on Arbitrum Orbit framework
 */
export const varietyTestnet = defineChain({
  id: 33529,
  name: 'Varity Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6, // CRITICAL: 6 decimals, not 18!
  },
  blockExplorers: [
    {
      name: 'Varity Explorer',
      url: 'https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz',
      apiUrl: 'https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz/api',
    },
  ],
  testnet: true,
});

/**
 * Varity Testnet RPC Configuration
 */
export const VARITY_TESTNET_RPC = 'https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz';

/**
 * Varity Chain Metadata
 */
export const VARITY_CHAIN_METADATA = {
  chainId: 33529,
  chainName: 'Varity Testnet',
  rpcUrl: VARITY_TESTNET_RPC,
  explorerUrl: 'https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz',
  nativeToken: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
  isTestnet: true,
  l1Chain: 'Arbitrum One',
  framework: 'Arbitrum Orbit',
};

/**
 * Helper function to get chain configuration
 */
export function getVarityChain() {
  return varietyTestnet;
}

/**
 * Helper function to validate chain ID
 */
export function isVarityChain(chainId: number): boolean {
  return chainId === 33529;
}
