/**
 * Avalanche Custom L1 Chain Configuration
 *
 * Varity Avalanche L1 is a sovereign Avalanche L1 chain deployed on Fluence VM
 * Chain ID: 43214
 * Native Token: USDC (18 decimals — different from Varity L3's 6 decimals!)
 */

import { defineChain } from 'thirdweb/chains';

/**
 * Avalanche L1 Testnet Configuration
 *
 * CRITICAL NOTES:
 * - Native token is USDC with 18 decimals (gas token mechanism)
 * - Chain ID 43214 is unique to this Varity Avalanche L1 testnet
 * - RPC is Fluence VM-hosted (81.15.150.164:9654) — use domain when DNS is configured
 * - Sovereign privacy: chain data is not shared with other chains
 * - ~2s block time, ~4500 TPS capacity
 */
export const avaxL1Testnet = defineChain({
  id: 43214,
  name: 'Varity Avalanche L1 Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18, // Avalanche L1 uses 18 decimals for native gas token
  },
  rpc: 'http://81.15.150.164:9654/ext/bc/MZqKVUw3VeGVjL3DDgzRwWoKGXxJ4F168GKewvKt6CruzDpAH/rpc',
  blockExplorers: [
    {
      name: 'Avalanche L1 Explorer',
      url: 'http://81.15.150.164:4000',
    },
  ],
  testnet: true,
});

/**
 * Alias for avaxL1Testnet
 */
export const avaxL1 = avaxL1Testnet;

/**
 * Deployed contract addresses on Avalanche L1 Testnet
 */
export const AVAX_L1_CONTRACTS = {
  /** ERC-4337 EntryPoint v0.7.0 */
  entryPoint: '0xA4cD3b0Eb6E5Ab5d8CE4065BcCD70040ADAB1F00' as const,
  /** SimpleAccountFactory */
  accountFactory: '0xa4DfF80B4a1D748BF28BC4A271eD834689Ea3407' as const,
  /** ApproveAllPaymaster (gas sponsorship) */
  paymaster: '0xe336d36FacA76840407e6836d26119E1EcE0A2b4' as const,
  /** Multicall3 */
  multicall3: '0xE3573540ab8A1C4c754Fd958Dc1db39BBE81b208' as const,
  /** VarityAppRegistry */
  appRegistry: '0x55a4eDd8A2c051079b426E9fbdEe285368824a89' as const,
  /** TemplateMarketplace (90/10 revenue split) */
  templateMarketplace: '0x8B3BC4270BE2abbB25BC04717830bd1Cc493a461' as const,
  /** TemplateRegistry */
  templateRegistry: '0x7B4982e1F7ee384F206417Fb851a1EB143c513F9' as const,
  /** EntryPoint Simulations v7 (for Alto bundler) */
  entryPointSimulations: '0x789a5FDac2b37FCD290fb2924382297A6AE65860' as const,
} as const;

/**
 * Avalanche L1 infrastructure endpoints
 *
 * Internal monitoring (Prometheus, Grafana) omitted — see ops documentation
 */
export const AVAX_L1_ENDPOINTS = {
  rpc: 'http://81.15.150.164:9654/ext/bc/MZqKVUw3VeGVjL3DDgzRwWoKGXxJ4F168GKewvKt6CruzDpAH/rpc',
  bundler: 'http://81.15.150.164:4337',
  explorer: 'http://81.15.150.164:4000',
  graphql: 'http://81.15.150.164:8000/subgraphs/name/varity/app-registry',
} as const;

/**
 * Block explorer URL builder for Avalanche L1
 */
export function getAvaxL1ExplorerUrl(type: 'tx' | 'address' | 'block', hash: string): string {
  const baseUrl = avaxL1Testnet.blockExplorers?.[0]?.url;
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
 * Wagmi-compatible chain configuration for Privy integration
 */
export const avaxL1Wagmi = {
  id: 43214,
  name: 'Varity Avalanche L1 Testnet',
  network: 'avax-l1-testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://81.15.150.164:9654/ext/bc/MZqKVUw3VeGVjL3DDgzRwWoKGXxJ4F168GKewvKt6CruzDpAH/rpc'],
    },
    public: {
      http: ['http://81.15.150.164:9654/ext/bc/MZqKVUw3VeGVjL3DDgzRwWoKGXxJ4F168GKewvKt6CruzDpAH/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Avalanche L1 Explorer',
      url: 'http://81.15.150.164:4000',
    },
  },
  testnet: true,
} as const;
