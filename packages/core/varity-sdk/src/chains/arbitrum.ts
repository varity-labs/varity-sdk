/**
 * Arbitrum Chain Configuration
 *
 * Arbitrum is an Optimistic Rollup on Ethereum providing fast, low-cost transactions
 * Supports both testnet (Sepolia) and mainnet (Arbitrum One)
 */

import { defineChain } from 'thirdweb/chains';

/**
 * Arbitrum Sepolia Testnet Configuration
 * Chain ID: 421614
 * Native Token: ETH (18 decimals)
 */
export const arbitrumSepolia = defineChain({
  id: 421614,
  name: 'Arbitrum Sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpc: 'https://sepolia-rollup.arbitrum.io/rpc',
  blockExplorers: [
    {
      name: 'Arbiscan',
      url: 'https://sepolia.arbiscan.io',
    },
  ],
  testnet: true,
});

/**
 * Arbitrum One Mainnet Configuration
 * Chain ID: 42161
 * Native Token: ETH (18 decimals)
 */
export const arbitrum = defineChain({
  id: 42161,
  name: 'Arbitrum One',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://arb1.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://arbiscan.io',
    },
  },
  testnet: false,
});

/**
 * Alias for arbitrum (mainnet)
 */
export const arbitrumOne = arbitrum;

/**
 * Get explorer URL for Arbitrum chains
 */
export function getArbitrumExplorerUrl(
  chainId: number,
  type: 'tx' | 'address' | 'block',
  hash: string
): string {
  const chain = chainId === 421614 ? arbitrumSepolia : arbitrum;
  const baseUrl = chain.blockExplorers?.[0]?.url;
  if (!baseUrl) return '';

  switch (type) {
    case 'tx':
      return `${baseUrl}/tx/${hash}`;
    case 'address':
      return `${baseUrl}/address/${hash}`;
    case 'block':
      return `${baseUrl}/block/${hash}`;
    default:
      return baseUrl;
  }
}

/**
 * Wagmi-compatible configuration for Arbitrum Sepolia
 */
export const arbitrumSepoliaWagmi = {
  id: 421614,
  name: 'Arbitrum Sepolia',
  network: 'arbitrum-sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
    public: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://sepolia.arbiscan.io',
    },
  },
  testnet: true,
} as const;

/**
 * Wagmi-compatible configuration for Arbitrum One
 */
export const arbitrumOneWagmi = {
  id: 42161,
  name: 'Arbitrum One',
  network: 'arbitrum',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://arb1.arbitrum.io/rpc'],
    },
    public: {
      http: ['https://arb1.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://arbiscan.io',
    },
  },
  testnet: false,
} as const;
