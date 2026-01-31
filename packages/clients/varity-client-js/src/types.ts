/**
 * Type definitions for Varity Client
 */

import type { ThirdwebClient, Chain } from 'thirdweb';
import type { Account } from 'thirdweb/wallets';
import type { PreparedTransaction } from 'thirdweb/transaction';

// Chain configurations
export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer?: string;
}

// Client configuration
export interface VarityClientConfig {
  clientId?: string;
  secretKey?: string;
  chain?: 'varity-l3' | 'arbitrum-sepolia' | 'arbitrum-one' | Chain;
  customChain?: ChainConfig;
}

// Wallet types
export interface WalletConnectionOptions {
  walletType: 'metamask' | 'walletconnect' | 'coinbase' | 'injected' | 'embedded';
  walletConnectProjectId?: string;
}

export interface WalletInfo {
  address: string;
  balance: string;
  balanceFormatted: string;
  chainId: number;
}

// Contract types
export interface ContractDeployOptions {
  abi: any[];
  bytecode: string;
  constructorArgs?: any[];
}

export interface ContractReadOptions {
  address: string;
  abi: any[];
  functionName: string;
  args?: any[];
}

export interface ContractWriteOptions {
  address: string;
  abi: any[];
  functionName: string;
  args?: any[];
  value?: bigint;
}

export interface ContractEventFilter {
  address: string;
  abi: any[];
  eventName: string;
  fromBlock?: number;
  toBlock?: number;
}

export interface ContractEvent {
  eventName: string;
  args: any;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

// SIWE types
export interface SIWEMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

export interface SIWESignatureResult {
  message: string;
  signature: string;
}

export interface SIWEVerifyResult {
  success: boolean;
  address?: string;
  error?: string;
}

export interface SIWESession {
  address: string;
  chainId: number;
  issuedAt: Date;
  expiresAt: Date;
  signature: string;
}

// Storage types
export interface StorageUploadOptions {
  metadata?: Record<string, any>;
  onProgress?: (progress: number) => void;
}

export interface StorageUploadResult {
  cid: string;
  url: string;
  gateway: string;
}

export interface StorageDownloadOptions {
  gateway?: string;
}

// Transaction types
export interface TransactionOptions {
  value?: bigint;
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface TransactionResult {
  transactionHash: string;
  blockNumber: number;
  from: string;
  to?: string;
  gasUsed: bigint;
  status: 'success' | 'failed';
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  from: string;
  to?: string;
  gasUsed: bigint;
  cumulativeGasUsed: bigint;
  contractAddress?: string;
  logs: any[];
  status: 'success' | 'failed';
}

// USDC specific types
export interface USDCAmount {
  raw: bigint;
  formatted: string;
  decimals: number;
}

// Error types
export class VarityError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'VarityError';
  }
}

export class WalletError extends VarityError {
  constructor(message: string, details?: any) {
    super(message, 'WALLET_ERROR', details);
    this.name = 'WalletError';
  }
}

export class ContractError extends VarityError {
  constructor(message: string, details?: any) {
    super(message, 'CONTRACT_ERROR', details);
    this.name = 'ContractError';
  }
}

export class TransactionError extends VarityError {
  constructor(message: string, details?: any) {
    super(message, 'TRANSACTION_ERROR', details);
    this.name = 'TransactionError';
  }
}

export class StorageError extends VarityError {
  constructor(message: string, details?: any) {
    super(message, 'STORAGE_ERROR', details);
    this.name = 'StorageError';
  }
}

export class AuthenticationError extends VarityError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}
