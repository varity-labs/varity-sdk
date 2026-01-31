/**
 * Base Chain Configuration
 *
 * Base is a secure, low-cost, builder-friendly Ethereum L2 built on the OP Stack
 * Built by Coinbase, designed to onboard 1 billion users to crypto
 * Supports both testnet (Sepolia) and mainnet
 */
/**
 * Base Sepolia Testnet Configuration
 * Chain ID: 84532
 * Native Token: ETH (18 decimals)
 */
export declare const baseSepolia: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
    rpc: string;
}>;
/**
 * Base Mainnet Configuration
 * Chain ID: 8453
 * Native Token: ETH (18 decimals)
 */
export declare const base: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
    rpc: string;
}>;
/**
 * Get explorer URL for Base chains
 */
export declare function getBaseExplorerUrl(chainId: number, type: 'tx' | 'address' | 'block', hash: string): string;
/**
 * Wagmi-compatible configuration for Base Sepolia
 */
export declare const baseSepoliaWagmi: {
    readonly id: 84532;
    readonly name: "Base Sepolia";
    readonly network: "base-sepolia";
    readonly nativeCurrency: {
        readonly name: "Ether";
        readonly symbol: "ETH";
        readonly decimals: 18;
    };
    readonly rpcUrls: {
        readonly default: {
            readonly http: readonly ["https://sepolia.base.org"];
        };
        readonly public: {
            readonly http: readonly ["https://sepolia.base.org"];
        };
    };
    readonly blockExplorers: {
        readonly default: {
            readonly name: "Basescan";
            readonly url: "https://sepolia.basescan.org";
        };
    };
    readonly testnet: true;
};
/**
 * Wagmi-compatible configuration for Base mainnet
 */
export declare const baseWagmi: {
    readonly id: 8453;
    readonly name: "Base";
    readonly network: "base";
    readonly nativeCurrency: {
        readonly name: "Ether";
        readonly symbol: "ETH";
        readonly decimals: 18;
    };
    readonly rpcUrls: {
        readonly default: {
            readonly http: readonly ["https://mainnet.base.org"];
        };
        readonly public: {
            readonly http: readonly ["https://mainnet.base.org"];
        };
    };
    readonly blockExplorers: {
        readonly default: {
            readonly name: "Basescan";
            readonly url: "https://basescan.org";
        };
    };
    readonly testnet: false;
};
//# sourceMappingURL=base.d.ts.map