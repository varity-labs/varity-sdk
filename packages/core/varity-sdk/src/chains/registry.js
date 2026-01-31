/**
 * Chain Registry - Multi-Chain Configuration System
 *
 * Central registry for all supported blockchain networks in Varity SDK
 * Supports Varity L3, Arbitrum, Base, and other EVM chains
 */
import { varityL3Testnet } from './varityL3';
import { arbitrumSepolia, arbitrum } from './arbitrum';
import { baseSepolia, base } from './base';
/**
 * Chain Registry Class
 *
 * Provides centralized access to all supported chains and intelligent
 * chain selection based on application requirements
 */
export class ChainRegistry {
    static chains = new Map();
    /**
     * Initialize the registry with chain metadata
     */
    static initialize() {
        // Varity L3 Testnet
        this.chains.set(33529, {
            chain: varityL3Testnet,
            averageGasPrice: BigInt(100000000), // 0.1 gwei (very low)
            estimatedTPS: 500,
            privacyLevel: 'none',
            costRating: 1, // Cheapest
            speedRating: 8,
            securityRating: 7,
        });
        // Arbitrum Sepolia (testnet)
        this.chains.set(421614, {
            chain: arbitrumSepolia,
            averageGasPrice: BigInt(100000000), // 0.1 gwei
            estimatedTPS: 4000,
            privacyLevel: 'none',
            costRating: 2,
            speedRating: 9,
            securityRating: 8,
        });
        // Arbitrum One (mainnet)
        this.chains.set(42161, {
            chain: arbitrum,
            averageGasPrice: BigInt(100000000), // 0.1 gwei
            estimatedTPS: 4000,
            privacyLevel: 'none',
            costRating: 3,
            speedRating: 9,
            securityRating: 9,
        });
        // Base Sepolia (testnet)
        this.chains.set(84532, {
            chain: baseSepolia,
            averageGasPrice: BigInt(100000000), // 0.1 gwei
            estimatedTPS: 2000,
            privacyLevel: 'none',
            costRating: 2,
            speedRating: 8,
            securityRating: 8,
        });
        // Base (mainnet)
        this.chains.set(8453, {
            chain: base,
            averageGasPrice: BigInt(100000000), // 0.1 gwei
            estimatedTPS: 2000,
            privacyLevel: 'none',
            costRating: 3,
            speedRating: 8,
            securityRating: 9,
        });
    }
    /**
     * Get all supported chains
     */
    static getAllChains() {
        if (this.chains.size === 0) {
            this.initialize();
        }
        return Array.from(this.chains.values()).map(meta => meta.chain);
    }
    /**
     * Get chain by ID
     */
    static getChain(chainId) {
        if (this.chains.size === 0) {
            this.initialize();
        }
        const metadata = this.chains.get(chainId);
        if (!metadata) {
            throw new Error(`Chain ${chainId} not found in registry`);
        }
        return metadata.chain;
    }
    /**
     * Get chain metadata
     */
    static getChainMetadata(chainId) {
        if (this.chains.size === 0) {
            this.initialize();
        }
        const metadata = this.chains.get(chainId);
        if (!metadata) {
            throw new Error(`Chain ${chainId} not found in registry`);
        }
        return metadata;
    }
    /**
     * Select optimal chain based on requirements
     */
    static selectChain(config) {
        if (this.chains.size === 0) {
            this.initialize();
        }
        let candidates = Array.from(this.chains.values());
        // Filter by requirements
        if (config.requirements) {
            const { maxGasPrice, minTPS, privacy, testnet } = config.requirements;
            if (maxGasPrice) {
                candidates = candidates.filter(c => c.averageGasPrice <= maxGasPrice);
            }
            if (minTPS) {
                candidates = candidates.filter(c => c.estimatedTPS >= minTPS);
            }
            if (privacy && privacy !== 'none') {
                candidates = candidates.filter(c => c.privacyLevel === privacy);
            }
            if (testnet !== undefined) {
                candidates = candidates.filter(c => c.chain.testnet === testnet);
            }
        }
        if (candidates.length === 0) {
            throw new Error('No chains match the specified requirements');
        }
        // Sort by optimization priority
        switch (config.optimize) {
            case 'cost':
                candidates.sort((a, b) => a.costRating - b.costRating);
                break;
            case 'speed':
                candidates.sort((a, b) => b.speedRating - a.speedRating);
                break;
            case 'security':
                candidates.sort((a, b) => b.securityRating - a.securityRating);
                break;
        }
        return candidates[0].chain;
    }
    /**
     * Get testnet chains only
     */
    static getTestnetChains() {
        if (this.chains.size === 0) {
            this.initialize();
        }
        return Array.from(this.chains.values())
            .filter(meta => meta.chain.testnet === true)
            .map(meta => meta.chain);
    }
    /**
     * Get mainnet chains only
     */
    static getMainnetChains() {
        if (this.chains.size === 0) {
            this.initialize();
        }
        return Array.from(this.chains.values())
            .filter(meta => meta.chain.testnet !== true)
            .map(meta => meta.chain);
    }
    /**
     * Check if chain is supported
     */
    static isSupported(chainId) {
        if (this.chains.size === 0) {
            this.initialize();
        }
        return this.chains.has(chainId);
    }
    /**
     * Add custom chain to registry
     */
    static addChain(chainId, metadata) {
        if (this.chains.size === 0) {
            this.initialize();
        }
        this.chains.set(chainId, metadata);
    }
}
// Initialize on import
ChainRegistry.initialize();
/**
 * Convenience exports
 */
export const SUPPORTED_CHAINS = ChainRegistry.getAllChains();
export const TESTNET_CHAINS = ChainRegistry.getTestnetChains();
export const MAINNET_CHAINS = ChainRegistry.getMainnetChains();
/**
 * Default chain (Varity L3 Testnet)
 */
export const DEFAULT_CHAIN = varityL3Testnet;
//# sourceMappingURL=registry.js.map