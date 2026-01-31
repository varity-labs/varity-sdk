/**
 * Base Chain Configuration
 *
 * Base is a secure, low-cost, builder-friendly Ethereum L2 built on the OP Stack
 * Built by Coinbase, designed to onboard 1 billion users to crypto
 * Supports both testnet (Sepolia) and mainnet
 */
import { defineChain } from 'thirdweb/chains';
/**
 * Base Sepolia Testnet Configuration
 * Chain ID: 84532
 * Native Token: ETH (18 decimals)
 */
export const baseSepolia = defineChain({
    id: 84532,
    name: 'Base Sepolia',
    nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
    },
    rpc: 'https://sepolia.base.org',
    blockExplorers: [
        {
            name: 'Basescan',
            url: 'https://sepolia.basescan.org',
        },
    ],
    testnet: true,
});
/**
 * Base Mainnet Configuration
 * Chain ID: 8453
 * Native Token: ETH (18 decimals)
 */
export const base = defineChain({
    id: 8453,
    name: 'Base',
    nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://mainnet.base.org'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Basescan',
            url: 'https://basescan.org',
        },
    },
    testnet: false,
});
/**
 * Get explorer URL for Base chains
 */
export function getBaseExplorerUrl(chainId, type, hash) {
    const chain = chainId === 84532 ? baseSepolia : base;
    const baseUrl = chain.blockExplorers?.[0]?.url;
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
 * Wagmi-compatible configuration for Base Sepolia
 */
export const baseSepoliaWagmi = {
    id: 84532,
    name: 'Base Sepolia',
    network: 'base-sepolia',
    nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://sepolia.base.org'],
        },
        public: {
            http: ['https://sepolia.base.org'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Basescan',
            url: 'https://sepolia.basescan.org',
        },
    },
    testnet: true,
};
/**
 * Wagmi-compatible configuration for Base mainnet
 */
export const baseWagmi = {
    id: 8453,
    name: 'Base',
    network: 'base',
    nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://mainnet.base.org'],
        },
        public: {
            http: ['https://mainnet.base.org'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Basescan',
            url: 'https://basescan.org',
        },
    },
    testnet: false,
};
//# sourceMappingURL=base.js.map