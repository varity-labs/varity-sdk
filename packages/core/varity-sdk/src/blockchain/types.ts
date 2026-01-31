/**
 * Type definitions for Varity blockchain module
 *
 * Production patterns extracted from generic-template-dashboard
 */

/**
 * Configuration for a smart contract
 */
export interface ContractConfig {
  name: string;
  address: string;
  abi: any[];
  chainId: number;
}

/**
 * Metadata for an NFT License (ERC-1155)
 */
export interface NFTLicenseMetadata {
  toolId: number;
  name: string;
  description: string;
  price: bigint;
  creator: string;
  isActive: boolean;
}

/**
 * Information about a user's NFT license
 */
export interface LicenseInfo {
  toolId: number;
  balance: bigint;
  expiresAt?: number;
  isValid: boolean;
}

/**
 * Revenue split configuration
 */
export interface RevenueSplit {
  creatorPercentage: number; // e.g., 70 for 70%
  platformPercentage: number; // e.g., 30 for 30%
  creatorAddress: string;
  platformAddress: string;
}

/**
 * Result of a blockchain transaction
 */
export interface TransactionResult {
  txHash: string;
  blockNumber?: number;
  gasUsed?: bigint;
  status: number; // 1 = success, 0 = failure
}

/**
 * Options for blockchain service initialization
 */
export interface BlockchainServiceOptions {
  rpcUrl: string;
  chainId: number;
  engineUrl?: string;
  engineAccessToken?: string;
  backendWallet?: string;
}
