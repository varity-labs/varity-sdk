/**
 * Varity SDK - Chains Module
 *
 * Multi-chain configuration system supporting Varity L3, Arbitrum, Base, and more
 */

// Chain Registry
export {
  ChainRegistry,
  SUPPORTED_CHAINS,
  TESTNET_CHAINS,
  MAINNET_CHAINS,
  DEFAULT_CHAIN,
  type ChainSelection,
  type ChainMetadata,
} from './registry';

// Varity L3
export {
  varityL3,
  varityL3Testnet,
  varityL3Wagmi,
  USDC_DECIMALS,
  VARITY_USDC_ADDRESS,
  formatUSDC,
  parseUSDC,
  formatAddress,
  getExplorerUrl as getVarityExplorerUrl,
} from './varityL3';

// Arbitrum
export {
  arbitrum,
  arbitrumOne,
  arbitrumSepolia,
  arbitrumOneWagmi,
  arbitrumSepoliaWagmi,
  getArbitrumExplorerUrl,
} from './arbitrum';

// Base
export {
  base,
  baseSepolia,
  baseWagmi,
  baseSepoliaWagmi,
  getBaseExplorerUrl,
} from './base';

// Avalanche L1
export {
  avaxL1,
  avaxL1Testnet,
  avaxL1Wagmi,
  AVAX_L1_CONTRACTS,
  AVAX_L1_ENDPOINTS,
  getAvaxL1ExplorerUrl,
} from './avaxL1';

// Import for re-export
import { varityL3, varityL3Testnet } from './varityL3';
import { arbitrum, arbitrumOne, arbitrumSepolia } from './arbitrum';
import { base, baseSepolia } from './base';
import { avaxL1, avaxL1Testnet } from './avaxL1';

/**
 * Quick access to common chains
 */
export const chains = {
  // Varity L3
  varityL3Testnet,
  varityL3,

  // Arbitrum
  arbitrumSepolia,
  arbitrum,
  arbitrumOne,

  // Base
  baseSepolia,
  base,

  // Avalanche L1
  avaxL1Testnet,
  avaxL1,
};
