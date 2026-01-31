/**
 * Chain Registry - Multi-Chain Configuration System
 *
 * Central registry for all supported blockchain networks in Varity SDK
 * Supports Varity L3, Arbitrum, Base, and other EVM chains
 */
import { type Chain } from 'thirdweb/chains';
/**
 * Chain Selection Configuration
 */
export interface ChainSelection {
    /**
     * Optimization priority
     */
    optimize: 'cost' | 'speed' | 'security';
    /**
     * Optional requirements for chain selection
     */
    requirements?: {
        /**
         * Maximum acceptable gas price (in wei)
         */
        maxGasPrice?: bigint;
        /**
         * Minimum transactions per second
         */
        minTPS?: number;
        /**
         * Privacy level required
         */
        privacy?: 'none' | 'lit' | 'fhe' | 'tee';
        /**
         * Require testnet
         */
        testnet?: boolean;
    };
}
/**
 * Chain metadata for selection
 */
export interface ChainMetadata {
    chain: Chain;
    averageGasPrice: bigint;
    estimatedTPS: number;
    privacyLevel: 'none' | 'lit' | 'fhe' | 'tee';
    costRating: number;
    speedRating: number;
    securityRating: number;
}
/**
 * Chain Registry Class
 *
 * Provides centralized access to all supported chains and intelligent
 * chain selection based on application requirements
 */
export declare class ChainRegistry {
    private static chains;
    /**
     * Initialize the registry with chain metadata
     */
    static initialize(): void;
    /**
     * Get all supported chains
     */
    static getAllChains(): Chain[];
    /**
     * Get chain by ID
     */
    static getChain(chainId: number): Chain;
    /**
     * Get chain metadata
     */
    static getChainMetadata(chainId: number): ChainMetadata;
    /**
     * Select optimal chain based on requirements
     */
    static selectChain(config: ChainSelection): Chain;
    /**
     * Get testnet chains only
     */
    static getTestnetChains(): Chain[];
    /**
     * Get mainnet chains only
     */
    static getMainnetChains(): Chain[];
    /**
     * Check if chain is supported
     */
    static isSupported(chainId: number): boolean;
    /**
     * Add custom chain to registry
     */
    static addChain(chainId: number, metadata: ChainMetadata): void;
}
/**
 * Convenience exports
 */
export declare const SUPPORTED_CHAINS: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
    rpc: string;
}>[];
export declare const TESTNET_CHAINS: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
    rpc: string;
}>[];
export declare const MAINNET_CHAINS: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
    rpc: string;
}>[];
/**
 * Default chain (Varity L3 Testnet)
 */
export declare const DEFAULT_CHAIN: Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
    rpc: string;
}>;
//# sourceMappingURL=registry.d.ts.map