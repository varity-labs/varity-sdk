/**
 * Varity L3 Chain Definition for Thirdweb SDK v5
 *
 * Chain ID: 33529
 * RPC: https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz
 * Explorer: https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz
 *
 * CRITICAL: Native token is USDC with 6 decimals (NOT 18!)
 */
/**
 * Varity Testnet L3 Chain Configuration
 * Built on Arbitrum Orbit framework
 */
export declare const varietyTestnet: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
    rpc: string;
}>;
/**
 * Varity Testnet RPC Configuration
 */
export declare const VARITY_TESTNET_RPC = "https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz";
/**
 * Varity Chain Metadata
 */
export declare const VARITY_CHAIN_METADATA: {
    chainId: number;
    chainName: string;
    rpcUrl: string;
    explorerUrl: string;
    nativeToken: {
        name: string;
        symbol: string;
        decimals: number;
    };
    isTestnet: boolean;
    l1Chain: string;
    framework: string;
};
/**
 * Helper function to get chain configuration
 */
export declare function getVarityChain(): Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
    rpc: string;
}>;
/**
 * Helper function to validate chain ID
 */
export declare function isVarityChain(chainId: number): boolean;
//# sourceMappingURL=varity-chain.d.ts.map