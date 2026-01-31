/**
 * Varity L3 Chain Configuration
 *
 * Varity L3 is an Arbitrum Orbit rollup deployed on Conduit
 * Chain ID: 33529
 * Native Token: Bridged USDC (6 decimals - NOT 18!)
 */
import { defineChain } from 'thirdweb/chains';
/**
 * Varity L3 Testnet Configuration
 *
 * CRITICAL NOTES:
 * - Native token is USDC with 6 decimals (not 18 like ETH)
 * - All token amounts must account for 6 decimals: 1 USDC = 1_000_000 (not 10^18)
 * - Chain ID 33529 is unique to Varity L3 testnet
 * - RPC URL is Conduit-hosted (managed Arbitrum Orbit)
 */
export const varityL3Testnet = defineChain({
    id: 33529,
    name: 'Varity L3 Testnet',
    nativeCurrency: {
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6, // CRITICAL: 6 decimals, NOT 18!
    },
    rpc: 'https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz',
    blockExplorers: [
        {
            name: 'Varity Explorer',
            url: 'https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz',
        },
    ],
    testnet: true,
});
/**
 * Alias for varityL3Testnet (for backwards compatibility)
 */
export const varityL3 = varityL3Testnet;
/**
 * USDC decimals constant
 */
export const USDC_DECIMALS = 6;
/**
 * USDC Contract Address on Varity L3
 * CRITICAL: This is bridged USDC with 6 decimals
 */
export const VARITY_USDC_ADDRESS = '0x6Fd8ee6B4C2193e9E2e0E2EC5D295689B607c0cE';
/**
 * Format USDC amount (6 decimals)
 */
export function formatUSDC(amount, decimals = 2) {
    const amountBigInt = typeof amount === 'bigint' ? amount : BigInt(amount);
    const divisor = BigInt(10 ** USDC_DECIMALS);
    const wholePart = amountBigInt / divisor;
    const fractionalPart = amountBigInt % divisor;
    const fractionalStr = fractionalPart.toString().padStart(USDC_DECIMALS, '0');
    const truncatedFractional = fractionalStr.slice(0, decimals);
    return `${wholePart}.${truncatedFractional}`;
}
/**
 * Parse USDC amount to bigint (6 decimals)
 */
export function parseUSDC(amount) {
    const amountStr = typeof amount === 'number' ? amount.toString() : amount;
    const [whole, fractional = ''] = amountStr.split('.');
    const paddedFractional = fractional.padEnd(USDC_DECIMALS, '0').slice(0, USDC_DECIMALS);
    return BigInt(whole + paddedFractional);
}
/**
 * Block explorer URL builder
 */
export function getExplorerUrl(type, hash) {
    const baseUrl = varityL3Testnet.blockExplorers?.[0]?.url;
    if (!baseUrl)
        return '';
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
}
/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address, startChars = 6, endChars = 4) {
    if (!address || address.length < startChars + endChars) {
        return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
/**
 * Wagmi-compatible chain configuration for Privy integration
 * NOTE: nativeCurrency should NOT have an address field - that's non-standard
 * and can cause issues with wallet_switchEthereumChain
 */
export const varityL3Wagmi = {
    id: 33529,
    name: 'Varity L3 Testnet',
    network: 'varity-testnet',
    nativeCurrency: {
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz'],
        },
        public: {
            http: ['https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Varity Explorer',
            url: 'https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz',
        },
    },
    testnet: true,
};
//# sourceMappingURL=varityL3.js.map