/**
 * Utility functions for formatting addresses, amounts, and other data
 */

import type { USDCAmount } from '../types';

// USDC has 6 decimals on Varity L3
export const USDC_DECIMALS = 6;
export const USDC_MULTIPLIER = BigInt(10 ** USDC_DECIMALS);

/**
 * Format USDC amount from raw value (6 decimals)
 * @param amount Raw USDC amount in smallest unit
 * @returns Formatted USDC string
 * @example
 * formatUSDC(1000000n) // "1.000000"
 * formatUSDC(1500000n) // "1.500000"
 */
export function formatUSDC(amount: bigint): string {
  const wholePart = amount / USDC_MULTIPLIER;
  const fractionalPart = amount % USDC_MULTIPLIER;
  const fractionalStr = fractionalPart.toString().padStart(USDC_DECIMALS, '0');
  return `${wholePart}.${fractionalStr}`;
}

/**
 * Parse USDC amount from string to raw value
 * @param amount USDC amount as string (e.g., "1.5", "10", "0.000001")
 * @returns Raw USDC amount in smallest unit
 * @example
 * parseUSDC("1.5") // 1500000n
 * parseUSDC("10") // 10000000n
 */
export function parseUSDC(amount: string): bigint {
  const [whole = '0', fractional = ''] = amount.split('.');
  const paddedFractional = fractional.padEnd(USDC_DECIMALS, '0').slice(0, USDC_DECIMALS);
  return BigInt(whole) * USDC_MULTIPLIER + BigInt(paddedFractional);
}

/**
 * Get USDC amount with both raw and formatted values
 * @param amount Raw USDC amount or string
 * @returns USDCAmount object
 */
export function getUSDCAmount(amount: bigint | string): USDCAmount {
  const raw = typeof amount === 'string' ? parseUSDC(amount) : amount;
  return {
    raw,
    formatted: formatUSDC(raw),
    decimals: USDC_DECIMALS,
  };
}

/**
 * Validate Ethereum address
 * @param address Address to validate
 * @returns True if valid
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format Ethereum address (checksum)
 * @param address Address to format
 * @returns Checksummed address
 */
export function formatAddress(address: string): string {
  if (!isValidAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
  // Simple checksum - in production, use ethers.getAddress()
  return address.toLowerCase();
}

/**
 * Shorten address for display
 * @param address Full address
 * @param chars Number of characters to show on each side
 * @returns Shortened address
 * @example
 * shortenAddress("0x1234567890123456789012345678901234567890") // "0x1234...7890"
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!isValidAddress(address)) {
    return address;
  }
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
}

/**
 * Format transaction hash for display
 * @param hash Transaction hash
 * @param chars Number of characters to show on each side
 * @returns Shortened hash
 */
export function shortenTxHash(hash: string, chars: number = 6): string {
  if (!hash || hash.length < 10) {
    return hash;
  }
  return `${hash.substring(0, chars + 2)}...${hash.substring(hash.length - chars)}`;
}

/**
 * Convert Wei to Ether
 * @param wei Amount in Wei
 * @returns Amount in Ether as string
 */
export function formatEther(wei: bigint): string {
  const ether = wei / BigInt(10 ** 18);
  const remainder = wei % BigInt(10 ** 18);
  const remainderStr = remainder.toString().padStart(18, '0');
  return `${ether}.${remainderStr}`;
}

/**
 * Parse Ether to Wei
 * @param ether Amount in Ether as string
 * @returns Amount in Wei
 */
export function parseEther(ether: string): bigint {
  const [whole = '0', fractional = ''] = ether.split('.');
  const paddedFractional = fractional.padEnd(18, '0').slice(0, 18);
  return BigInt(whole) * BigInt(10 ** 18) + BigInt(paddedFractional);
}

/**
 * Get chain name from chain ID
 * @param chainId Chain ID
 * @returns Chain name
 */
export function getChainName(chainId: number): string {
  const chains: Record<number, string> = {
    33529: 'Varity L3',
    421614: 'Arbitrum Sepolia',
    42161: 'Arbitrum One',
    1: 'Ethereum Mainnet',
    11155111: 'Sepolia',
  };
  return chains[chainId] || `Chain ${chainId}`;
}

/**
 * Get block explorer URL
 * @param chainId Chain ID
 * @returns Block explorer URL
 */
export function getBlockExplorerUrl(chainId: number): string {
  const explorers: Record<number, string> = {
    33529: 'https://explorer.varity.network',
    421614: 'https://sepolia.arbiscan.io',
    42161: 'https://arbiscan.io',
    1: 'https://etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
  };
  return explorers[chainId] || '';
}

/**
 * Get transaction URL in block explorer
 * @param chainId Chain ID
 * @param txHash Transaction hash
 * @returns Transaction URL
 */
export function getTxUrl(chainId: number, txHash: string): string {
  const explorerUrl = getBlockExplorerUrl(chainId);
  return explorerUrl ? `${explorerUrl}/tx/${txHash}` : '';
}

/**
 * Get address URL in block explorer
 * @param chainId Chain ID
 * @param address Address
 * @returns Address URL
 */
export function getAddressUrl(chainId: number, address: string): string {
  const explorerUrl = getBlockExplorerUrl(chainId);
  return explorerUrl ? `${explorerUrl}/address/${address}` : '';
}

/**
 * Format timestamp to date string
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Format gas amount for display
 * @param gas Gas amount in wei
 * @returns Formatted gas string
 */
export function formatGas(gas: bigint): string {
  const gwei = gas / BigInt(10 ** 9);
  const remainder = gas % BigInt(10 ** 9);
  if (remainder === BigInt(0)) {
    return `${gwei} Gwei`;
  }
  const decimal = Number(remainder) / 10 ** 9;
  return `${Number(gwei) + decimal} Gwei`;
}

/**
 * Calculate percentage
 * @param value Current value
 * @param total Total value
 * @param decimals Number of decimal places
 * @returns Percentage string
 */
export function formatPercentage(value: number, total: number, decimals: number = 2): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format large numbers with K, M, B suffixes
 * @param num Number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(num: number, decimals: number = 2): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(decimals)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(decimals)}K`;
  }
  return num.toFixed(decimals);
}
