/**
 * thirdweb Bridge Client
 *
 * Cross-chain asset bridging powered by thirdweb
 * Seamlessly transfer tokens and NFTs between chains
 *
 * Features:
 * - Cross-chain token transfers
 * - NFT bridging
 * - Automatic route optimization
 * - Gas estimation
 * - Bridge status tracking
 * - Multi-hop bridging support
 */
import type { ThirdwebClient, Chain } from 'thirdweb';
/**
 * Bridge configuration
 */
export interface BridgeConfig {
    /**
     * thirdweb client instance
     */
    client: ThirdwebClient;
}
/**
 * Asset type for bridging
 */
export type AssetType = 'erc20' | 'erc721' | 'erc1155' | 'native';
/**
 * Bridge route
 */
export interface BridgeRoute {
    /**
     * Source chain
     */
    from: Chain;
    /**
     * Destination chain
     */
    to: Chain;
    /**
     * Bridge protocol used
     */
    protocol: string;
    /**
     * Estimated time in seconds
     */
    estimatedTime: number;
    /**
     * Estimated gas cost (in source chain's native token)
     */
    estimatedGas: string;
    /**
     * Bridge fee (in basis points, e.g., 30 = 0.3%)
     */
    feeBps: number;
    /**
     * Whether this is a direct bridge or requires hops
     */
    isDirectBridge: boolean;
    /**
     * Intermediate hops (if not direct)
     */
    hops?: Chain[];
}
/**
 * Bridge asset parameters
 */
export interface BridgeAssetParams {
    /**
     * Source chain
     */
    fromChain: Chain;
    /**
     * Destination chain
     */
    toChain: Chain;
    /**
     * Asset type
     */
    assetType: AssetType;
    /**
     * Token contract address (for ERC20/ERC721/ERC1155)
     */
    tokenAddress?: string;
    /**
     * Token ID (for ERC721/ERC1155)
     */
    tokenId?: string;
    /**
     * Amount to bridge (for ERC20/native)
     */
    amount?: string;
    /**
     * Recipient address on destination chain
     */
    recipient: string;
    /**
     * Optional slippage tolerance (in basis points)
     */
    slippageBps?: number;
}
/**
 * Bridge transaction status
 */
export type BridgeStatus = 'pending' | 'initiated' | 'in_progress' | 'completed' | 'failed' | 'refunded';
/**
 * Bridge transaction result
 */
export interface BridgeTransactionResult {
    /**
     * Bridge transaction ID
     */
    bridgeId: string;
    /**
     * Source chain transaction hash
     */
    sourceTxHash: string;
    /**
     * Destination chain transaction hash (available after completion)
     */
    destinationTxHash?: string;
    /**
     * Current status
     */
    status: BridgeStatus;
    /**
     * Estimated completion time
     */
    estimatedCompletion: Date;
    /**
     * Route used
     */
    route: BridgeRoute;
}
/**
 * Bridge quote (estimate before executing)
 */
export interface BridgeQuote {
    /**
     * Available routes
     */
    routes: BridgeRoute[];
    /**
     * Recommended route (lowest cost + fastest)
     */
    recommendedRoute: BridgeRoute;
    /**
     * Amount that will be received (after fees)
     */
    receivingAmount: string;
    /**
     * Total fees
     */
    totalFees: {
        bridgeFee: string;
        gasFee: string;
        total: string;
    };
}
/**
 * Bridge history entry
 */
export interface BridgeHistoryEntry {
    bridgeId: string;
    timestamp: Date;
    fromChain: Chain;
    toChain: Chain;
    assetType: AssetType;
    amount: string;
    status: BridgeStatus;
    sourceTxHash: string;
    destinationTxHash?: string;
}
/**
 * thirdweb Bridge Client
 *
 * Cross-chain asset bridging made simple
 */
export declare class BridgeClient {
    private client;
    private baseUrl;
    constructor(config: BridgeConfig);
    /**
     * Get available bridge routes
     */
    getRoutes(fromChain: Chain, toChain: Chain): Promise<BridgeRoute[]>;
    /**
     * Get a quote for bridging
     */
    getQuote(params: BridgeAssetParams): Promise<BridgeQuote>;
    /**
     * Bridge an asset from one chain to another
     */
    bridgeAsset(params: BridgeAssetParams): Promise<BridgeTransactionResult>;
    /**
     * Get bridge transaction status
     */
    getStatus(bridgeId: string): Promise<BridgeTransactionResult>;
    /**
     * Wait for bridge to complete
     */
    waitForCompletion(bridgeId: string, options?: {
        pollInterval?: number;
        timeout?: number;
    }): Promise<BridgeTransactionResult>;
    /**
     * Get bridge history for an address
     */
    getHistory(address: string): Promise<BridgeHistoryEntry[]>;
    /**
     * Check if a bridge route is available
     */
    isRouteAvailable(fromChain: Chain, toChain: Chain): Promise<boolean>;
    /**
     * Get supported chains for bridging
     */
    getSupportedChains(): Promise<Chain[]>;
    /**
     * Estimate gas for a bridge operation
     */
    estimateGas(params: BridgeAssetParams): Promise<string>;
}
/**
 * Create Bridge client instance
 */
export declare function createBridgeClient(config: BridgeConfig): BridgeClient;
//# sourceMappingURL=BridgeClient.d.ts.map