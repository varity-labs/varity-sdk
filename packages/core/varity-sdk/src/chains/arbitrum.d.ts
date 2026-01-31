/**
 * Arbitrum Chain Configuration
 *
 * Arbitrum is an Optimistic Rollup on Ethereum providing fast, low-cost transactions
 * Supports both testnet (Sepolia) and mainnet (Arbitrum One)
 */
/**
 * Arbitrum Sepolia Testnet Configuration
 * Chain ID: 421614
 * Native Token: ETH (18 decimals)
 */
export declare const arbitrumSepolia: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
    rpc: string;
}>;
/**
 * Arbitrum One Mainnet Configuration
 * Chain ID: 42161
 * Native Token: ETH (18 decimals)
 */
export declare const arbitrum: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
    rpc: string;
}>;
/**
 * Alias for arbitrum (mainnet)
 */
export declare const arbitrumOne: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
    rpc: string;
}>;
/**
 * Get explorer URL for Arbitrum chains
 */
export declare function getArbitrumExplorerUrl(chainId: number, type: 'tx' | 'address' | 'block', hash: string): string;
/**
 * Wagmi-compatible configuration for Arbitrum Sepolia
 */
export declare const arbitrumSepoliaWagmi: {
    readonly id: 421614;
    readonly name: "Arbitrum Sepolia";
    readonly network: "arbitrum-sepolia";
    readonly nativeCurrency: {
        readonly name: "Ether";
        readonly symbol: "ETH";
        readonly decimals: 18;
    };
    readonly rpcUrls: {
        readonly default: {
            readonly http: readonly ["https://sepolia-rollup.arbitrum.io/rpc"];
        };
        readonly public: {
            readonly http: readonly ["https://sepolia-rollup.arbitrum.io/rpc"];
        };
    };
    readonly blockExplorers: {
        readonly default: {
            readonly name: "Arbiscan";
            readonly url: "https://sepolia.arbiscan.io";
        };
    };
    readonly testnet: true;
};
/**
 * Wagmi-compatible configuration for Arbitrum One
 */
export declare const arbitrumOneWagmi: {
    readonly id: 42161;
    readonly name: "Arbitrum One";
    readonly network: "arbitrum";
    readonly nativeCurrency: {
        readonly name: "Ether";
        readonly symbol: "ETH";
        readonly decimals: 18;
    };
    readonly rpcUrls: {
        readonly default: {
            readonly http: readonly ["https://arb1.arbitrum.io/rpc"];
        };
        readonly public: {
            readonly http: readonly ["https://arb1.arbitrum.io/rpc"];
        };
    };
    readonly blockExplorers: {
        readonly default: {
            readonly name: "Arbiscan";
            readonly url: "https://arbiscan.io";
        };
    };
    readonly testnet: false;
};
//# sourceMappingURL=arbitrum.d.ts.map