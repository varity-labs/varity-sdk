/**
 * Varity SDK - Chains Module
 *
 * Multi-chain configuration system supporting Varity L3, Arbitrum, Base, and more
 */
export { ChainRegistry, SUPPORTED_CHAINS, TESTNET_CHAINS, MAINNET_CHAINS, DEFAULT_CHAIN, type ChainSelection, type ChainMetadata, } from './registry';
export { varityL3, varityL3Testnet, varityL3Wagmi, USDC_DECIMALS, VARITY_USDC_ADDRESS, formatUSDC, parseUSDC, formatAddress, getExplorerUrl as getVarityExplorerUrl, } from './varityL3';
export { arbitrum, arbitrumOne, arbitrumSepolia, arbitrumOneWagmi, arbitrumSepoliaWagmi, getArbitrumExplorerUrl, } from './arbitrum';
export { base, baseSepolia, baseWagmi, baseSepoliaWagmi, getBaseExplorerUrl, } from './base';
/**
 * Quick access to common chains
 */
export declare const chains: {
    varityL3Testnet: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
        rpc: string;
    }>;
    varityL3: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
        rpc: string;
    }>;
    arbitrumSepolia: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
        rpc: string;
    }>;
    arbitrum: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
        rpc: string;
    }>;
    arbitrumOne: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
        rpc: string;
    }>;
    baseSepolia: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
        rpc: string;
    }>;
    base: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
        rpc: string;
    }>;
};
//# sourceMappingURL=index.d.ts.map