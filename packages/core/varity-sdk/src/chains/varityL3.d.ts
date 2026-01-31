/**
 * Varity L3 Chain Configuration
 *
 * Varity L3 is an Arbitrum Orbit rollup deployed on Conduit
 * Chain ID: 33529
 * Native Token: Bridged USDC (6 decimals - NOT 18!)
 */
/**
 * Varity L3 Testnet Configuration
 *
 * CRITICAL NOTES:
 * - Native token is USDC with 6 decimals (not 18 like ETH)
 * - All token amounts must account for 6 decimals: 1 USDC = 1_000_000 (not 10^18)
 * - Chain ID 33529 is unique to Varity L3 testnet
 * - RPC URL is Conduit-hosted (managed Arbitrum Orbit)
 */
export declare const varityL3Testnet: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
    rpc: string;
}>;
/**
 * Alias for varityL3Testnet (for backwards compatibility)
 */
export declare const varityL3: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
    rpc: string;
}>;
/**
 * USDC decimals constant
 */
export declare const USDC_DECIMALS = 6;
/**
 * USDC Contract Address on Varity L3
 * CRITICAL: This is bridged USDC with 6 decimals
 */
export declare const VARITY_USDC_ADDRESS = "0x6Fd8ee6B4C2193e9E2e0E2EC5D295689B607c0cE";
/**
 * Format USDC amount (6 decimals)
 */
export declare function formatUSDC(amount: bigint | string | number, decimals?: number): string;
/**
 * Parse USDC amount to bigint (6 decimals)
 */
export declare function parseUSDC(amount: string | number): bigint;
/**
 * Block explorer URL builder
 */
export declare function getExplorerUrl(type: 'tx' | 'address' | 'block', hash: string): string;
/**
 * Format address for display (0x1234...5678)
 */
export declare function formatAddress(address: string, startChars?: number, endChars?: number): string;
/**
 * Wagmi-compatible chain configuration for Privy integration
 * NOTE: nativeCurrency should NOT have an address field - that's non-standard
 * and can cause issues with wallet_switchEthereumChain
 */
export declare const varityL3Wagmi: {
    readonly id: 33529;
    readonly name: "Varity L3 Testnet";
    readonly network: "varity-testnet";
    readonly nativeCurrency: {
        readonly name: "USDC";
        readonly symbol: "USDC";
        readonly decimals: 6;
    };
    readonly rpcUrls: {
        readonly default: {
            readonly http: readonly ["https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz"];
        };
        readonly public: {
            readonly http: readonly ["https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz"];
        };
    };
    readonly blockExplorers: {
        readonly default: {
            readonly name: "Varity Explorer";
            readonly url: "https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz";
        };
    };
    readonly testnet: true;
};
//# sourceMappingURL=varityL3.d.ts.map