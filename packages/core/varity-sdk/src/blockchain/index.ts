/**
 * Varity Blockchain Module
 *
 * Production-grade blockchain integration for Varity L3 and other EVM chains.
 * Extracted from generic-template-dashboard production deployment.
 *
 * Features:
 * - thirdweb v5 function-based API
 * - Contract reading and writing
 * - NFT licensing (ERC-1155)
 * - Revenue split distribution (70/30)
 * - Multi-chain support
 *
 * @example
 * ```typescript
 * import {
 *   BlockchainService,
 *   NFTLicensingService,
 *   RevenueSplitService
 * } from '@varity-labs/sdk/blockchain';
 *
 * // Initialize blockchain service
 * const blockchain = new BlockchainService({
 *   rpcUrl: "https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz",
 *   chainId: 33529
 * });
 *
 * // Load contract ABIs
 * blockchain.loadContractABI('ToolLicenseNFT', nftABI);
 * blockchain.initializeContract('ToolLicenseNFT', '0x...');
 *
 * // Use NFT licensing
 * const licensing = new NFTLicensingService(blockchain);
 * const hasLicense = await licensing.hasLicense('0x...', 1);
 *
 * // Use revenue splits
 * const revenue = new RevenueSplitService(blockchain);
 * const [creator, platform] = revenue.calculateSplit(100_000_000n);
 * ```
 *
 * @module blockchain
 * @packageDocumentation
 */

export { BlockchainService } from './BlockchainService';
export { NFTLicensingService } from './NFTLicensingService';
export { RevenueSplitService } from './RevenueSplitService';

export type {
  ContractConfig,
  NFTLicenseMetadata,
  LicenseInfo,
  RevenueSplit,
  TransactionResult,
  BlockchainServiceOptions,
} from './types';
