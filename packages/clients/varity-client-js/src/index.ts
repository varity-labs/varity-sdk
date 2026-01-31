/**
 * Varity JavaScript/TypeScript Client Library
 *
 * Comprehensive SDK for Varity L3 blockchain interactions powered by Thirdweb.
 *
 * @packageDocumentation
 */

// Main client
export { VarityClient, VARITY_L3_CHAIN, ARBITRUM_SEPOLIA_CHAIN, ARBITRUM_ONE_CHAIN } from './VarityClient';
export { default as VarityClientClass } from './VarityClient';

// Managers
export { ContractManager } from './contracts/ContractManager';
export { WalletManager } from './wallet/WalletManager';
export { SIWEAuth } from './auth/SIWEAuth';
export { StorageManager } from './storage/StorageManager';

// Types
export type {
  // Configuration types
  VarityClientConfig,
  ChainConfig,
  WalletConnectionOptions,
  WalletInfo,

  // Contract types
  ContractDeployOptions,
  ContractReadOptions,
  ContractWriteOptions,
  ContractEventFilter,
  ContractEvent,

  // SIWE types
  SIWEMessage,
  SIWESignatureResult,
  SIWEVerifyResult,
  SIWESession,

  // Storage types
  StorageUploadOptions,
  StorageUploadResult,
  StorageDownloadOptions,

  // Transaction types
  TransactionOptions,
  TransactionResult,
  TransactionReceipt,

  // USDC types
  USDCAmount,
} from './types';

// Error types
export {
  VarityError,
  WalletError,
  ContractError,
  TransactionError,
  StorageError,
  AuthenticationError,
} from './types';

// Utility functions
export {
  // USDC utilities
  formatUSDC,
  parseUSDC,
  getUSDCAmount,
  USDC_DECIMALS,
  USDC_MULTIPLIER,

  // Address utilities
  isValidAddress,
  formatAddress,
  shortenAddress,

  // Transaction utilities
  shortenTxHash,
  getTxUrl,
  getAddressUrl,

  // Formatting utilities
  formatEther,
  parseEther,
  formatGas,
  formatPercentage,
  formatNumber,
  formatTimestamp,

  // Chain utilities
  getChainName,
  getBlockExplorerUrl,
} from './utils/formatting';

// React hooks (optional)
export {
  useVarityClient,
  useVarityWallet,
  useVarityBalance,
  useVarityContract,
  useVarityAuth,
  useVarityStorage,
  useVarityChain,
} from './react/hooks';

// Default export
export { default } from './VarityClient';
