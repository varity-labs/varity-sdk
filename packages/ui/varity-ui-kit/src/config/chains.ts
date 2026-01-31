/**
 * Varity UI Kit - Chain Configuration
 *
 * Re-exports chain configuration from @varity-labs/sdk for use in React components
 * Provides multi-chain support for Varity L3, Arbitrum, Base, and more
 */

// Import for use in this file
import { ChainRegistry } from '@varity-labs/sdk';

// Re-export all chain configuration from @varity-labs/sdk
export {
  // Chain Registry
  ChainRegistry,
  SUPPORTED_CHAINS,
  TESTNET_CHAINS,
  MAINNET_CHAINS,
  DEFAULT_CHAIN,
  chains,
  // Varity L3
  varityL3,
  varityL3Testnet,
  varityL3Wagmi,
  USDC_DECIMALS,
  VARITY_USDC_ADDRESS,
  formatUSDC,
  parseUSDC,
  formatAddress,
  getVarityExplorerUrl,
  // Arbitrum
  arbitrum,
  arbitrumOne,
  arbitrumSepolia,
  arbitrumOneWagmi,
  arbitrumSepoliaWagmi,
  getArbitrumExplorerUrl,
  // Base
  base,
  baseSepolia,
  baseWagmi,
  baseSepoliaWagmi,
  getBaseExplorerUrl,
  // Types
  type ChainSelection,
  type ChainMetadata,
} from '@varity-labs/sdk';

/**
 * Thirdweb Client ID (for UI components)
 */
export const THIRDWEB_CLIENT_ID = 'acb17e07e34ab2b8317aa40cbb1b5e1d';

/**
 * Get block explorer URL for any supported chain
 * @param chainId - Chain ID
 * @param type - Type of explorer link (tx, address, block)
 * @param hash - Transaction hash, address, or block number
 * @returns Block explorer URL
 */
export function getBlockExplorerUrl(
  chainId: number,
  type: 'tx' | 'address' | 'block',
  hash: string
): string {
  // Try to get chain from registry
  try {
    const chain = ChainRegistry.getChain(chainId);
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
  } catch {
    return '';
  }
}
