/**
 * Thirdweb Wrapper for Varity SDK
 *
 * This wrapper provides Thirdweb SDK v5 functionality while maintaining
 * 100% backwards compatibility with existing ethers.js v6 implementation.
 *
 * Pattern: Optional enhancement layer - does NOT break existing functionality
 */
import { type Chain } from 'thirdweb';
import { type Account } from 'thirdweb/wallets';
import { ethers } from 'ethers';
/**
 * Configuration for ThirdwebWrapper
 */
export interface ThirdwebWrapperConfig {
    /**
     * Chain to use (defaults to Varity L3 Testnet)
     * Can be a chain ID number or a Chain object from thirdweb/chains
     */
    chain?: number | Chain;
    /**
     * RPC URL (optional - will use chain's default if not provided)
     */
    rpcUrl?: string;
    /**
     * Thirdweb Client ID (from .env.testnet)
     * Default: a35636133eb5ec6f30eb9f4c15fce2f3
     */
    clientId?: string;
    /**
     * Optional private key for wallet operations
     */
    privateKey?: string;
    /**
     * @deprecated Use chain parameter instead
     */
    chainId?: number;
}
/**
 * Contract deployment parameters
 */
export interface DeployContractParams {
    name: string;
    abi: any[];
    bytecode: string;
    constructorArgs?: any[];
}
/**
 * ThirdwebWrapper Class
 *
 * Provides Thirdweb SDK capabilities with ethers.js fallback.
 * All existing ethers.js functionality is preserved.
 */
export declare class ThirdwebWrapper {
    private client;
    private ethersProvider;
    private chainId;
    private account?;
    private chain;
    constructor(config: ThirdwebWrapperConfig);
    /**
     * Get a contract instance using Thirdweb
     * @param address Contract address
     * @returns Thirdweb contract instance
     */
    getContract(address: string): Promise<Readonly<import("node_modules/thirdweb/dist/types/contract/contract").ContractOptions<[], `0x${string}`>>>;
    /**
     * Deploy a contract using Thirdweb
     * @param params Deployment parameters
     * @returns Deployed contract address
     */
    deployContract(params: DeployContractParams): Promise<{
        address: string;
        deployed: boolean;
        method: string;
        transactionHash: string;
    }>;
    /**
     * Upload data to IPFS using Thirdweb Storage
     * @param data Data to upload (can be JSON, File, or any supported type)
     * @returns IPFS URI
     */
    uploadToIPFS(data: any): Promise<string>;
    /**
     * Download data from IPFS using Thirdweb Storage
     * @param uri IPFS URI
     * @returns Downloaded data
     */
    downloadFromIPFS(uri: string): Promise<Response>;
    /**
     * Get the ethers.js provider (backwards compatibility)
     * @returns Ethers JsonRpcProvider
     */
    getEthersProvider(): ethers.JsonRpcProvider;
    /**
     * Get a contract instance using ethers.js (backwards compatibility)
     * @param address Contract address
     * @param abi Contract ABI
     * @returns Ethers Contract instance
     */
    getContractWithEthers(address: string, abi: any[]): Promise<ethers.Contract>;
    /**
     * Deploy a contract using ethers.js (backwards compatibility)
     * @param params Deployment parameters
     * @returns Deployment result
     */
    deployContractWithEthers(params: DeployContractParams): Promise<{
        address: string;
        deployed: boolean;
        method: string;
        transactionHash: string | undefined;
    }>;
    /**
     * Get the Thirdweb client instance
     * @returns Thirdweb client
     */
    getClient(): import("node_modules/thirdweb/dist/types/client/client").ThirdwebClient;
    /**
     * Get the Thirdweb account (if configured)
     * @returns Thirdweb account or undefined
     */
    getAccount(): Account | undefined;
    /**
     * Get the chain configuration
     * @returns Varity chain definition
     */
    getChain(): Readonly<import("node_modules/thirdweb/dist/types/chains/types").ChainOptions & {
        rpc: string;
    }>;
    /**
     * Get the chain ID
     * @returns Chain ID (33529)
     */
    getChainId(): number;
    /**
     * Check if Thirdweb account is configured
     * @returns True if account is available
     */
    hasAccount(): boolean;
    /**
     * Deploy contract with automatic fallback
     * Tries Thirdweb first, falls back to ethers.js on error
     * @param params Deployment parameters
     * @returns Deployment result
     */
    deployWithFallback(params: DeployContractParams): Promise<{
        address: string;
        deployed: boolean;
        method: string;
        transactionHash: string | undefined;
    }>;
    /**
     * Get contract events
     * @param params Event query parameters
     * @returns Contract events
     */
    getContractEvents(params: {
        contract: any;
        fromBlock?: number;
        toBlock?: number | 'latest';
        eventName?: string;
    }): Promise<ethers.Log[]>;
    /**
     * Get block information
     * @param blockNumber Block number or 'latest'
     * @returns Block information
     */
    getBlock(blockNumber: string | number): Promise<ethers.Block | null>;
    /**
     * Get transaction information
     * @param hash Transaction hash
     * @returns Transaction information
     */
    getTransaction(hash: string): Promise<ethers.TransactionResponse | null>;
    /**
     * Get current gas price
     * @returns Gas price in wei
     */
    getGasPrice(): Promise<bigint | null>;
    /**
     * Get wallet balance
     * @param address Wallet address
     * @returns Balance in wei
     */
    getBalance(address: string): Promise<bigint>;
    /**
     * Get NFTs for a wallet
     * @param address Wallet address
     * @param options Query options
     * @returns NFT list
     */
    getNFTs(address: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<never[]>;
    /**
     * Get transaction history for a wallet
     * @param address Wallet address
     * @param options Query options
     * @returns Transaction history
     */
    getTransactionHistory(address: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<never[]>;
    /**
     * Get token balances for a wallet
     * @param address Wallet address
     * @returns Token balances
     */
    getTokenBalances(address: string): Promise<never[]>;
    /**
     * Send transaction
     * @param params Transaction parameters
     * @returns Transaction result
     */
    sendTransaction(params: {
        from: string;
        to: string;
        amount: string;
        token?: string;
    }): Promise<{
        transactionHash: string;
        from: string;
        to: string;
        amount: string;
    }>;
}
/**
 * Factory function to create ThirdwebWrapper instance
 * @param config Configuration options
 * @returns ThirdwebWrapper instance
 */
export declare function createThirdwebWrapper(config: ThirdwebWrapperConfig): ThirdwebWrapper;
//# sourceMappingURL=ThirdwebWrapper.d.ts.map