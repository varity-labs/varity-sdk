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

// Import for re-export
import { varityL3, varityL3Testnet } from './varityL3';
import { arbitrum, arbitrumOne, arbitrumSepolia } from './arbitrum';
import { base, baseSepolia } from './base';

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
};
