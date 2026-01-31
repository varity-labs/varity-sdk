/**
 * Thirdweb Type Definitions for Varity L3 Arbitrum Rollup
 *
 * This module provides comprehensive type definitions for Thirdweb SDK integration
 * with the Varity L3 testnet (Chain ID: 33529).
 *
 * CRITICAL: Varity L3 uses USDC as the native gas token with 6 decimals.
 *
 * @packageDocumentation
 */
/**
 * Type guard to check if a value is a valid Varity chain configuration
 */
export function isVarityChain(chain) {
    return (typeof chain === 'object' &&
        chain !== null &&
        typeof chain.id === 'number' &&
        typeof chain.name === 'string' &&
        typeof chain.nativeCurrency === 'object' &&
        chain.nativeCurrency.decimals === 6 && // CRITICAL: Must be 6 for USDC
        typeof chain.rpc === 'string' &&
        typeof chain.testnet === 'boolean');
}
/**
 * Type guard to check if a value is a valid SIWE message
 */
export function isSIWEMessage(message) {
    return (typeof message === 'object' &&
        message !== null &&
        typeof message.address === 'string' &&
        typeof message.chainId === 'number' &&
        typeof message.domain === 'string' &&
        typeof message.uri === 'string' &&
        typeof message.nonce === 'string' &&
        typeof message.issuedAt === 'string');
}
// ============================================================================
// Constants
// ============================================================================
/**
 * Varity L3 Testnet Chain Constants
 */
export const VARITY_L3_TESTNET = {
    CHAIN_ID: 33529,
    NATIVE_CURRENCY_SYMBOL: 'USDC',
    NATIVE_CURRENCY_DECIMALS: 6,
    IS_TESTNET: true
};
/**
 * USDC Decimals Constant
 * CRITICAL: Always use this constant when handling USDC amounts
 */
export const USDC_DECIMALS = 6;
/**
 * Helper to format USDC amounts
 *
 * @param amount - Raw USDC amount (6 decimals)
 * @returns Formatted USDC amount object
 *
 * @example
 * ```typescript
 * const formatted = formatUSDC(1500000n)
 * // Returns: { raw: 1500000n, formatted: "1.50 USDC", value: 1.5, decimals: 6 }
 * ```
 */
export function formatUSDC(amount) {
    const value = Number(amount) / Math.pow(10, USDC_DECIMALS);
    const formatted = `${value.toFixed(2)} USDC`;
    return {
        raw: amount,
        formatted,
        value,
        decimals: USDC_DECIMALS
    };
}
/**
 * Helper to parse USDC amounts from human-readable format
 *
 * @param amount - Human-readable amount (e.g., "1.5" or 1.5)
 * @returns Raw USDC amount (6 decimals)
 *
 * @example
 * ```typescript
 * const raw = parseUSDC("1.5")
 * // Returns: 1500000n
 * ```
 */
export function parseUSDC(amount) {
    const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
    return BigInt(Math.round(numValue * Math.pow(10, USDC_DECIMALS)));
}
//# sourceMappingURL=thirdweb.js.map