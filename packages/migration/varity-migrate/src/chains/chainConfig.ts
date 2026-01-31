/**
 * Chain Configuration Module
 *
 * Defines all supported blockchain chains for migration verification
 * and includes chain-specific migration rules.
 */

export interface ChainConfig {
  chainId: number;
  name: string;
  shortName: string;
  network: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet: boolean;
  migrationRules: {
    supportedAsSource: boolean;
    supportedAsDestination: boolean;
    gasTokenDecimals: number;
    requiresGasEstimation: boolean;
    maxContractSize?: number;
    specialConsiderations?: string[];
  };
}

/**
 * Varity L3 Chain Configuration
 * The primary destination chain for migrations
 */
export const VARITY_L3_CHAIN: ChainConfig = {
  chainId: 33529,
  name: 'Varity L3',
  shortName: 'varity',
  network: 'varity-l3',
  rpcUrls: [
    'https://rpc.varity.network',
    'https://rpc-backup.varity.network'
  ],
  blockExplorerUrls: [
    'https://explorer.varity.network'
  ],
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6
  },
  testnet: false,
  migrationRules: {
    supportedAsSource: false,
    supportedAsDestination: true,
    gasTokenDecimals: 6,
    requiresGasEstimation: true,
    maxContractSize: 24576, // 24KB
    specialConsiderations: [
      'Gas paid in USDC (6 decimals)',
      'All storage encrypted with Lit Protocol',
      'Data availability via Celestia',
      'Settlement to Arbitrum One L2'
    ]
  }
};

/**
 * Ethereum Mainnet Configuration
 */
export const ETHEREUM_MAINNET: ChainConfig = {
  chainId: 1,
  name: 'Ethereum Mainnet',
  shortName: 'eth',
  network: 'mainnet',
  rpcUrls: [
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://eth-mainnet.public.blastapi.io'
  ],
  blockExplorerUrls: [
    'https://etherscan.io'
  ],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  testnet: false,
  migrationRules: {
    supportedAsSource: true,
    supportedAsDestination: false,
    gasTokenDecimals: 18,
    requiresGasEstimation: true,
    maxContractSize: 24576
  }
};

/**
 * Polygon (MATIC) Configuration
 */
export const POLYGON_MAINNET: ChainConfig = {
  chainId: 137,
  name: 'Polygon',
  shortName: 'polygon',
  network: 'matic',
  rpcUrls: [
    'https://polygon-rpc.com',
    'https://rpc.ankr.com/polygon',
    'https://polygon-mainnet.public.blastapi.io'
  ],
  blockExplorerUrls: [
    'https://polygonscan.com'
  ],
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  testnet: false,
  migrationRules: {
    supportedAsSource: true,
    supportedAsDestination: false,
    gasTokenDecimals: 18,
    requiresGasEstimation: true,
    maxContractSize: 24576
  }
};

/**
 * Arbitrum One Configuration
 */
export const ARBITRUM_ONE: ChainConfig = {
  chainId: 42161,
  name: 'Arbitrum One',
  shortName: 'arb1',
  network: 'arbitrum',
  rpcUrls: [
    'https://arb1.arbitrum.io/rpc',
    'https://rpc.ankr.com/arbitrum',
    'https://arbitrum-mainnet.public.blastapi.io'
  ],
  blockExplorerUrls: [
    'https://arbiscan.io'
  ],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  testnet: false,
  migrationRules: {
    supportedAsSource: true,
    supportedAsDestination: false,
    gasTokenDecimals: 18,
    requiresGasEstimation: true,
    maxContractSize: 24576,
    specialConsiderations: [
      'Parent chain for Varity L3',
      'Lower gas costs than Ethereum mainnet'
    ]
  }
};

/**
 * Arbitrum Sepolia Configuration (Testnet)
 */
export const ARBITRUM_SEPOLIA: ChainConfig = {
  chainId: 421614,
  name: 'Arbitrum Sepolia',
  shortName: 'arb-sepolia',
  network: 'arbitrum-sepolia',
  rpcUrls: [
    'https://sepolia-rollup.arbitrum.io/rpc',
    'https://arbitrum-sepolia.public.blastapi.io'
  ],
  blockExplorerUrls: [
    'https://sepolia.arbiscan.io'
  ],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  testnet: true,
  migrationRules: {
    supportedAsSource: true,
    supportedAsDestination: false,
    gasTokenDecimals: 18,
    requiresGasEstimation: true,
    maxContractSize: 24576,
    specialConsiderations: [
      'Testnet for development purposes',
      'Parent chain for Varity L3 testnet'
    ]
  }
};

/**
 * Base Configuration
 */
export const BASE_MAINNET: ChainConfig = {
  chainId: 8453,
  name: 'Base',
  shortName: 'base',
  network: 'base',
  rpcUrls: [
    'https://mainnet.base.org',
    'https://base-mainnet.public.blastapi.io'
  ],
  blockExplorerUrls: [
    'https://basescan.org'
  ],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  testnet: false,
  migrationRules: {
    supportedAsSource: true,
    supportedAsDestination: false,
    gasTokenDecimals: 18,
    requiresGasEstimation: true,
    maxContractSize: 24576
  }
};

/**
 * Optimism Configuration
 */
export const OPTIMISM_MAINNET: ChainConfig = {
  chainId: 10,
  name: 'Optimism',
  shortName: 'op',
  network: 'optimism',
  rpcUrls: [
    'https://mainnet.optimism.io',
    'https://optimism-mainnet.public.blastapi.io'
  ],
  blockExplorerUrls: [
    'https://optimistic.etherscan.io'
  ],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  testnet: false,
  migrationRules: {
    supportedAsSource: true,
    supportedAsDestination: false,
    gasTokenDecimals: 18,
    requiresGasEstimation: true,
    maxContractSize: 24576
  }
};

/**
 * All supported chains
 */
export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  [VARITY_L3_CHAIN.chainId]: VARITY_L3_CHAIN,
  [ETHEREUM_MAINNET.chainId]: ETHEREUM_MAINNET,
  [POLYGON_MAINNET.chainId]: POLYGON_MAINNET,
  [ARBITRUM_ONE.chainId]: ARBITRUM_ONE,
  [ARBITRUM_SEPOLIA.chainId]: ARBITRUM_SEPOLIA,
  [BASE_MAINNET.chainId]: BASE_MAINNET,
  [OPTIMISM_MAINNET.chainId]: OPTIMISM_MAINNET
};

/**
 * Get chain configuration by chain ID
 */
export function getChainConfig(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS[chainId];
}

/**
 * Get all chains that can be used as migration sources
 */
export function getSourceChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter(
    chain => chain.migrationRules.supportedAsSource
  );
}

/**
 * Get all chains that can be used as migration destinations
 */
export function getDestinationChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter(
    chain => chain.migrationRules.supportedAsDestination
  );
}

/**
 * Validate if a chain is supported for migration
 */
export function isChainSupported(chainId: number): boolean {
  return chainId in SUPPORTED_CHAINS;
}

/**
 * Get RPC URL for a chain with fallback
 */
export function getChainRpcUrl(chainId: number, index: number = 0): string | undefined {
  const chain = getChainConfig(chainId);
  if (!chain || !chain.rpcUrls[index]) {
    return undefined;
  }
  return chain.rpcUrls[index];
}

/**
 * Check if migration is allowed between two chains
 */
export function isMigrationAllowed(sourceChainId: number, destChainId: number): boolean {
  const sourceChain = getChainConfig(sourceChainId);
  const destChain = getChainConfig(destChainId);

  if (!sourceChain || !destChain) {
    return false;
  }

  return sourceChain.migrationRules.supportedAsSource &&
         destChain.migrationRules.supportedAsDestination;
}
