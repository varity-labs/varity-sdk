/**
 * Thirdweb Type Definitions for Varity L3 Arbitrum Rollup
 *
 * This module provides comprehensive type definitions for Thirdweb SDK integration
 * with the Varity L3 testnet (Chain ID: 33529).
 *
 * CRITICAL: Varity L3 uses USDC as the native gas token with 6 decimals.
 *
 * @packageDocumentation
 */
export type { ThirdwebClient, Chain, PreparedTransaction, ThirdwebContract, PrepareContractCallOptions, ReadContractOptions, Hex, Address } from 'thirdweb';
/**
 * Varity L3 Chain Configuration
 *
 * Defines the complete chain configuration for Varity L3 Testnet.
 *
 * CRITICAL: Native currency is USDC with 6 decimals, NOT 18!
 *
 * @example
 * ```typescript
 * const varityChain: VarityChain = {
 *   id: 33529,
 *   name: "Varity Testnet",
 *   nativeCurrency: {
 *     name: "USDC",
 *     symbol: "USDC",
 *     decimals: 6  // CRITICAL: 6 decimals, not 18!
 *   },
 *   rpc: "https://varity-testnet-rpc.conduit.xyz",
 *   blockExplorer: "https://varity-testnet-explorer.conduit.xyz",
 *   testnet: true
 * }
 * ```
 */
export interface VarityChain {
    /**
     * Chain ID for Varity L3 Testnet
     * @constant 33529
     */
    id: number;
    /**
     * Human-readable chain name
     * @example "Varity Testnet"
     */
    name: string;
    /**
     * Native currency configuration
     * CRITICAL: USDC with 6 decimals
     */
    nativeCurrency: {
        /**
         * Full name of the native currency
         * @constant "USDC"
         */
        name: string;
        /**
         * Currency symbol
         * @constant "USDC"
         */
        symbol: string;
        /**
         * Number of decimal places
         * CRITICAL: USDC uses 6 decimals, NOT 18 like ETH!
         * @constant 6
         */
        decimals: number;
    };
    /**
     * RPC endpoint URL
     * @example "https://varity-testnet-rpc.conduit.xyz"
     */
    rpc: string;
    /**
     * Block explorer URL (optional)
     * @example "https://varity-testnet-explorer.conduit.xyz"
     */
    blockExplorer?: string;
    /**
     * Whether this is a testnet or mainnet
     * @constant true for Varity L3 Testnet
     */
    testnet: boolean;
}
/**
 * Varity Chain Constants
 *
 * Pre-configured chain settings for Varity L3 Testnet.
 */
export interface VarityChainConstants {
    /**
     * Chain ID
     * @constant 33529
     */
    readonly CHAIN_ID: 33529;
    /**
     * Native currency symbol
     * @constant "USDC"
     */
    readonly NATIVE_CURRENCY_SYMBOL: 'USDC';
    /**
     * Native currency decimals
     * CRITICAL: 6 decimals for USDC
     * @constant 6
     */
    readonly NATIVE_CURRENCY_DECIMALS: 6;
    /**
     * Testnet flag
     * @constant true
     */
    readonly IS_TESTNET: true;
}
/**
 * Varity Wallet Configuration
 *
 * Configuration options for initializing a Thirdweb wallet on Varity L3.
 *
 * @example
 * ```typescript
 * const walletConfig: VarityWalletConfig = {
 *   clientId: "your-thirdweb-client-id",
 *   chain: varityChain,
 *   privateKey: "0x...", // optional for server-side wallets
 *   smartWalletOptions: {
 *     factoryAddress: "0x...",
 *     gasless: true
 *   }
 * }
 * ```
 */
export interface VarityWalletConfig {
    /**
     * Thirdweb client ID for API authentication
     */
    clientId: string;
    /**
     * Varity L3 chain configuration
     */
    chain: VarityChain;
    /**
     * Private key for wallet creation (optional, server-side only)
     * SECURITY: Never expose private keys in client-side code!
     */
    privateKey?: string;
    /**
     * Smart wallet (Account Abstraction) configuration (optional)
     */
    smartWalletOptions?: VaritySmartWalletOptions;
}
/**
 * Varity Smart Wallet Options
 *
 * Configuration for Account Abstraction (AA) smart wallets on Varity L3.
 *
 * @example
 * ```typescript
 * const smartWalletOptions: VaritySmartWalletOptions = {
 *   factoryAddress: "0x1234567890123456789012345678901234567890",
 *   gasless: true,
 *   bundlerUrl: "https://varity-bundler.example.com",
 *   paymasterUrl: "https://varity-paymaster.example.com"
 * }
 * ```
 */
export interface VaritySmartWalletOptions {
    /**
     * Smart wallet factory contract address (optional)
     * If not provided, uses Thirdweb's default factory
     */
    factoryAddress?: string;
    /**
     * Enable gasless transactions (sponsor gas fees)
     * @default false
     */
    gasless: boolean;
    /**
     * Custom bundler URL for UserOperation submission (optional)
     */
    bundlerUrl?: string;
    /**
     * Custom paymaster URL for gas sponsorship (optional)
     */
    paymasterUrl?: string;
    /**
     * Account abstraction version
     * @default "v0.7"
     */
    version?: 'v0.6' | 'v0.7';
}
/**
 * Varity Wallet Connection Result
 *
 * Result returned after successfully connecting a wallet to Varity L3.
 */
export interface VarityWalletConnectionResult {
    /**
     * Connected wallet address
     */
    address: string;
    /**
     * Chain ID the wallet is connected to
     * @constant 33529
     */
    chainId: number;
    /**
     * Whether this is a smart wallet
     */
    isSmartWallet: boolean;
    /**
     * Smart wallet factory address (if applicable)
     */
    factoryAddress?: string;
    /**
     * Current USDC balance (in smallest units, 6 decimals)
     * @example 1000000 = 1 USDC
     */
    balance?: bigint;
}
/**
 * Varity Contract Configuration
 *
 * Configuration for interacting with deployed contracts on Varity L3.
 *
 * @example
 * ```typescript
 * const contractConfig: VarityContractConfig = {
 *   address: "0x1234567890123456789012345678901234567890",
 *   abi: ERC20_ABI,
 *   chainId: 33529
 * }
 * ```
 */
export interface VarityContractConfig {
    /**
     * Deployed contract address
     */
    address: string;
    /**
     * Contract ABI (Application Binary Interface)
     */
    abi: any;
    /**
     * Chain ID where contract is deployed
     * @constant 33529 for Varity L3 Testnet
     */
    chainId: number;
}
/**
 * Contract Deployment Parameters
 *
 * Parameters for deploying new contracts to Varity L3.
 *
 * @example
 * ```typescript
 * const deployParams: VarityDeploymentParams = {
 *   contractType: 'ERC20',
 *   name: 'MyToken',
 *   symbol: 'MTK',
 *   constructorParams: [1000000]
 * }
 * ```
 */
export interface VarityDeploymentParams {
    /**
     * Type of contract to deploy
     */
    contractType: 'ERC20' | 'ERC721' | 'ERC1155' | 'Custom';
    /**
     * Contract name (for token contracts)
     */
    name?: string;
    /**
     * Contract symbol (for token contracts)
     */
    symbol?: string;
    /**
     * Contract ABI (for custom contracts)
     */
    abi?: any;
    /**
     * Contract bytecode (for custom contracts)
     */
    bytecode?: string;
    /**
     * Constructor parameters
     */
    constructorParams?: any[];
}
/**
 * Contract Deployment Result
 *
 * Result returned after successful contract deployment.
 */
export interface VarityDeploymentResult {
    /**
     * Deployed contract address
     */
    contractAddress: string;
    /**
     * Transaction hash of deployment
     */
    transactionHash: string;
    /**
     * Block number where contract was deployed
     */
    blockNumber: number;
    /**
     * Gas used for deployment (in USDC with 6 decimals)
     */
    gasUsed: bigint;
    /**
     * Total deployment cost (in USDC with 6 decimals)
     */
    totalCost: bigint;
}
/**
 * Contract Read Options
 *
 * Options for reading contract state.
 */
export interface VarityContractReadOptions {
    /**
     * Contract configuration
     */
    contract: VarityContractConfig;
    /**
     * Function name to call
     */
    method: string;
    /**
     * Function parameters
     */
    params?: any[];
    /**
     * Block number to query (optional, defaults to latest)
     */
    blockNumber?: number;
}
/**
 * Contract Write Options
 *
 * Options for writing to contract state.
 */
export interface VarityContractWriteOptions {
    /**
     * Contract configuration
     */
    contract: VarityContractConfig;
    /**
     * Function name to call
     */
    method: string;
    /**
     * Function parameters
     */
    params?: any[];
    /**
     * USDC amount to send with transaction (6 decimals)
     */
    value?: bigint;
    /**
     * Gas limit override
     */
    gasLimit?: bigint;
    /**
     * Enable gasless transaction (if smart wallet)
     */
    gasless?: boolean;
}
/**
 * SIWE Message Configuration
 *
 * Configuration for generating Sign-In With Ethereum (SIWE) messages.
 *
 * @example
 * ```typescript
 * const siweMessage: SIWEMessage = {
 *   address: "0x1234567890123456789012345678901234567890",
 *   chainId: 33529,
 *   domain: "app.varity.io",
 *   uri: "https://app.varity.io",
 *   nonce: "random-nonce-123",
 *   issuedAt: new Date().toISOString(),
 *   expirationTime: new Date(Date.now() + 3600000).toISOString()
 * }
 * ```
 */
export interface SIWEMessage {
    /**
     * Wallet address signing the message
     */
    address: string;
    /**
     * Chain ID
     * @constant 33529 for Varity L3
     */
    chainId: number;
    /**
     * Domain requesting the signature
     * @example "app.varity.io"
     */
    domain: string;
    /**
     * URI of the application
     * @example "https://app.varity.io"
     */
    uri: string;
    /**
     * Random nonce for security
     */
    nonce: string;
    /**
     * Timestamp when message was issued (ISO 8601)
     */
    issuedAt: string;
    /**
     * Timestamp when message expires (optional, ISO 8601)
     */
    expirationTime?: string;
    /**
     * Timestamp when message becomes valid (optional, ISO 8601)
     */
    notBefore?: string;
    /**
     * Human-readable statement (optional)
     */
    statement?: string;
    /**
     * Request ID (optional)
     */
    requestId?: string;
    /**
     * Resources the user is authorizing (optional)
     */
    resources?: string[];
}
/**
 * SIWE Verification Result
 *
 * Result of verifying a SIWE signature.
 */
export interface SIWEVerifyResult {
    /**
     * Whether the signature is valid
     */
    valid: boolean;
    /**
     * Verified wallet address (if valid)
     */
    address?: string;
    /**
     * Error message (if invalid)
     */
    error?: string;
    /**
     * Verified chain ID (if valid)
     */
    chainId?: number;
    /**
     * Expiration timestamp (if valid)
     */
    expiresAt?: string;
}
/**
 * SIWE Authentication Payload
 *
 * Complete payload for SIWE authentication.
 */
export interface SIWEAuthPayload {
    /**
     * SIWE message
     */
    message: SIWEMessage;
    /**
     * Signature from wallet
     */
    signature: string;
}
/**
 * Gas Estimation Result
 *
 * Result of estimating gas for a transaction on Varity L3.
 *
 * CRITICAL: All values are in USDC with 6 decimals.
 */
export interface VarityGasEstimation {
    /**
     * Estimated gas units
     */
    gasLimit: bigint;
    /**
     * Gas price in USDC per gas unit (6 decimals)
     */
    gasPrice: bigint;
    /**
     * Maximum fee per gas (EIP-1559, 6 decimals)
     */
    maxFeePerGas?: bigint;
    /**
     * Maximum priority fee per gas (EIP-1559, 6 decimals)
     */
    maxPriorityFeePerGas?: bigint;
    /**
     * Estimated total cost in USDC (6 decimals)
     * @example 1000000 = 1 USDC
     */
    estimatedCost: bigint;
    /**
     * Estimated cost in human-readable format
     * @example "0.50 USDC"
     */
    estimatedCostFormatted: string;
}
/**
 * Transaction Fee Options
 *
 * Options for customizing transaction fees.
 */
export interface VarityTransactionFeeOptions {
    /**
     * Gas limit override
     */
    gasLimit?: bigint;
    /**
     * Gas price override (legacy transactions)
     */
    gasPrice?: bigint;
    /**
     * Max fee per gas (EIP-1559)
     */
    maxFeePerGas?: bigint;
    /**
     * Max priority fee per gas (EIP-1559)
     */
    maxPriorityFeePerGas?: bigint;
    /**
     * Fee multiplier (1.0 = normal, 1.5 = 50% higher)
     * @default 1.0
     */
    feeMultiplier?: number;
}
/**
 * Contract Event Filter
 *
 * Configuration for filtering contract events.
 */
export interface VarityEventFilter {
    /**
     * Contract address
     */
    contractAddress: string;
    /**
     * Event name
     */
    eventName: string;
    /**
     * Event parameters to filter by (optional)
     */
    filters?: Record<string, any>;
    /**
     * Starting block number (optional)
     */
    fromBlock?: number;
    /**
     * Ending block number (optional)
     */
    toBlock?: number | 'latest';
}
/**
 * Contract Event
 *
 * Decoded contract event data.
 */
export interface VarityContractEvent {
    /**
     * Event name
     */
    eventName: string;
    /**
     * Block number where event was emitted
     */
    blockNumber: number;
    /**
     * Transaction hash
     */
    transactionHash: string;
    /**
     * Log index
     */
    logIndex: number;
    /**
     * Decoded event arguments
     */
    args: Record<string, any>;
    /**
     * Raw log data
     */
    raw: {
        data: string;
        topics: string[];
    };
}
/**
 * Thirdweb-Ethers Hybrid Configuration
 *
 * Configuration for using Thirdweb SDK with optional ethers.js fallback.
 * This pattern allows gradual migration from ethers.js to Thirdweb.
 *
 * @example
 * ```typescript
 * const hybridConfig: ThirdwebEthersHybrid = {
 *   useThirdweb: true,
 *   useFallback: true,
 *   preferredMethod: 'thirdweb'
 * }
 * ```
 */
export interface ThirdwebEthersHybrid {
    /**
     * Enable Thirdweb SDK methods
     * @default true
     */
    useThirdweb: boolean;
    /**
     * Enable ethers.js fallback for unsupported operations
     * @default false
     */
    useFallback: boolean;
    /**
     * Preferred method when both are available
     * @default 'thirdweb'
     */
    preferredMethod: 'thirdweb' | 'ethers';
    /**
     * Ethers provider URL (optional, required if useFallback is true)
     */
    ethersRpcUrl?: string;
    /**
     * Logging configuration for wrapper operations
     */
    logging?: {
        /**
         * Enable debug logging
         * @default false
         */
        enabled: boolean;
        /**
         * Log method selections (which SDK is used)
         * @default true
         */
        logMethodSelection: boolean;
        /**
         * Log performance metrics
         * @default false
         */
        logPerformance: boolean;
    };
}
/**
 * Wrapper SDK Configuration
 *
 * Complete configuration for Varity SDK wrapper that supports both
 * Thirdweb and ethers.js operations.
 */
export interface ThirdwebWrapperConfig {
    /**
     * Thirdweb client configuration
     */
    thirdwebClient: {
        /**
         * Thirdweb client ID
         */
        clientId: string;
        /**
         * Secret key for server-side operations (optional)
         */
        secretKey?: string;
        /**
         * Custom chain configuration
         */
        chain: VarityChain;
    };
    /**
     * Hybrid mode configuration
     */
    hybridMode: ThirdwebEthersHybrid;
    /**
     * Account abstraction configuration (optional)
     */
    accountAbstraction?: {
        /**
         * Enable smart wallet functionality
         */
        enabled: boolean;
        /**
         * Smart wallet configuration
         */
        options: VaritySmartWalletOptions;
    };
    /**
     * Storage configuration for IPFS/decentralized storage
     */
    storage?: {
        /**
         * IPFS gateway URL
         * @example "https://gateway.pinata.cloud"
         */
        gatewayUrl?: string;
        /**
         * Upload provider
         * @default 'thirdweb'
         */
        provider?: 'thirdweb' | 'pinata' | 'custom';
        /**
         * Custom upload endpoint (for 'custom' provider)
         */
        customEndpoint?: string;
    };
}
/**
 * Contract Deployment API Response
 *
 * Response from contract deployment API endpoint.
 */
export interface ContractDeployResponse {
    /**
     * Whether deployment was successful
     */
    success: boolean;
    /**
     * Deployment result data (if successful)
     */
    data?: VarityDeploymentResult;
    /**
     * Error details (if failed)
     */
    error?: {
        /**
         * Error code
         */
        code: string;
        /**
         * Human-readable error message
         */
        message: string;
        /**
         * Technical error details
         */
        details?: any;
    };
    /**
     * Response timestamp
     */
    timestamp: string;
}
/**
 * Contract Call API Response
 *
 * Response from contract read/write operation API endpoint.
 */
export interface ContractCallResponse<T = any> {
    /**
     * Whether call was successful
     */
    success: boolean;
    /**
     * Returned data from contract (if read operation)
     */
    data?: T;
    /**
     * Transaction hash (if write operation)
     */
    transactionHash?: string;
    /**
     * Transaction receipt (if write operation)
     */
    receipt?: {
        /**
         * Block number
         */
        blockNumber: number;
        /**
         * Gas used (USDC, 6 decimals)
         */
        gasUsed: bigint;
        /**
         * Transaction status
         */
        status: 'success' | 'reverted';
        /**
         * Emitted events
         */
        events: VarityContractEvent[];
    };
    /**
     * Error details (if failed)
     */
    error?: {
        /**
         * Error code
         */
        code: string;
        /**
         * Human-readable error message
         */
        message: string;
        /**
         * Revert reason (if contract reverted)
         */
        revertReason?: string;
    };
    /**
     * Response timestamp
     */
    timestamp: string;
}
/**
 * SIWE Authentication API Response
 *
 * Response from Sign-In With Ethereum authentication endpoint.
 */
export interface SIWEAuthResponse {
    /**
     * Whether authentication was successful
     */
    success: boolean;
    /**
     * Authentication result (if successful)
     */
    data?: {
        /**
         * Verified wallet address
         */
        address: string;
        /**
         * Session token (JWT)
         */
        token: string;
        /**
         * Token expiration time (ISO 8601)
         */
        expiresAt: string;
        /**
         * User profile data (optional)
         */
        profile?: {
            /**
             * ENS name (if available)
             */
            ensName?: string;
            /**
             * Avatar URL (if available)
             */
            avatar?: string;
        };
    };
    /**
     * Error details (if failed)
     */
    error?: {
        /**
         * Error code
         */
        code: string;
        /**
         * Error message
         */
        message: string;
    };
    /**
     * Response timestamp
     */
    timestamp: string;
}
/**
 * Chain Information API Response
 *
 * Response containing current chain information.
 */
export interface ChainInfoResponse {
    /**
     * Chain ID
     */
    chainId: number;
    /**
     * Chain name
     */
    name: string;
    /**
     * Native currency information
     */
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    /**
     * Current block number
     */
    blockNumber: number;
    /**
     * Current gas price (USDC, 6 decimals)
     */
    gasPrice: bigint;
    /**
     * Network status
     */
    status: 'healthy' | 'degraded' | 'down';
    /**
     * Response timestamp
     */
    timestamp: string;
}
/**
 * Wallet Balance API Response
 *
 * Response containing wallet balance information.
 */
export interface WalletBalanceResponse {
    /**
     * Wallet address
     */
    address: string;
    /**
     * USDC balance information
     */
    balance: USDCAmount;
    /**
     * Token balances (optional)
     */
    tokens?: Array<{
        /**
         * Token contract address
         */
        address: string;
        /**
         * Token symbol
         */
        symbol: string;
        /**
         * Token name
         */
        name: string;
        /**
         * Token balance (raw amount)
         */
        balance: bigint;
        /**
         * Token decimals
         */
        decimals: number;
        /**
         * Formatted balance
         */
        formatted: string;
    }>;
    /**
     * Response timestamp
     */
    timestamp: string;
}
/**
 * Thirdweb Client Configuration
 *
 * Complete configuration for initializing Thirdweb client.
 *
 * @example
 * ```typescript
 * const clientConfig: ThirdwebClientConfig = {
 *   clientId: "your-client-id",
 *   secretKey: "your-secret-key", // server-side only
 *   chains: [varityChain],
 *   supportedWallets: ['metamask', 'walletconnect', 'coinbase']
 * }
 * ```
 */
export interface ThirdwebClientConfig {
    /**
     * Thirdweb client ID (required)
     */
    clientId: string;
    /**
     * Thirdweb secret key (optional, server-side only)
     * SECURITY: Never expose secret key in client-side code!
     */
    secretKey?: string;
    /**
     * Supported chains
     */
    chains: VarityChain[];
    /**
     * Supported wallet types
     */
    supportedWallets?: Array<'metamask' | 'walletconnect' | 'coinbase' | 'injected' | 'smart-wallet' | 'embedded-wallet'>;
    /**
     * Default chain (optional, uses first chain if not specified)
     */
    defaultChain?: VarityChain;
    /**
     * RPC options
     */
    rpcOptions?: {
        /**
         * Request timeout in milliseconds
         * @default 30000
         */
        timeout?: number;
        /**
         * Number of retry attempts
         * @default 3
         */
        retries?: number;
        /**
         * Batch JSON-RPC requests
         * @default true
         */
        batch?: boolean;
    };
}
/**
 * Thirdweb Auth Configuration
 *
 * Configuration for Thirdweb authentication (SIWE).
 */
export interface ThirdwebAuthConfig {
    /**
     * Application domain
     * @example "app.varity.io"
     */
    domain: string;
    /**
     * Application URI
     * @example "https://app.varity.io"
     */
    uri: string;
    /**
     * Session duration in seconds
     * @default 86400 (24 hours)
     */
    sessionDuration?: number;
    /**
     * Enable refresh tokens
     * @default false
     */
    enableRefreshTokens?: boolean;
    /**
     * Custom nonce generator (optional)
     */
    nonceGenerator?: () => string;
    /**
     * JWT signing secret (server-side only)
     */
    jwtSecret?: string;
    /**
     * Additional SIWE resources
     */
    resources?: string[];
}
/**
 * Thirdweb Storage Configuration
 *
 * Configuration for Thirdweb storage (IPFS/decentralized storage).
 */
export interface ThirdwebStorageConfig {
    /**
     * Storage gateway URL
     * @example "https://gateway.pinata.cloud"
     */
    gatewayUrl: string;
    /**
     * Upload provider
     */
    provider: 'thirdweb' | 'pinata' | 'ipfs' | 'custom';
    /**
     * Provider-specific credentials
     */
    credentials?: {
        /**
         * API key
         */
        apiKey?: string;
        /**
         * API secret
         */
        apiSecret?: string;
        /**
         * Custom headers
         */
        customHeaders?: Record<string, string>;
    };
    /**
     * Upload options
     */
    uploadOptions?: {
        /**
         * Enable pinning on IPFS
         * @default true
         */
        pin?: boolean;
        /**
         * Metadata to attach to uploads
         */
        metadata?: Record<string, any>;
        /**
         * Wrap with directory (for multiple files)
         * @default false
         */
        wrapWithDirectory?: boolean;
    };
}
/**
 * USDC Amount
 *
 * Represents a USDC amount with proper decimal handling.
 *
 * CRITICAL: Always uses 6 decimals.
 */
export interface USDCAmount {
    /**
     * Amount in smallest units (6 decimals)
     * @example 1000000n = 1 USDC
     */
    raw: bigint;
    /**
     * Human-readable formatted amount
     * @example "1.50 USDC"
     */
    formatted: string;
    /**
     * Numeric value (JavaScript number, may lose precision for large values)
     * @example 1.5
     */
    value: number;
    /**
     * Number of decimals
     * @constant 6
     */
    decimals: 6;
}
/**
 * Type guard to check if a value is a valid Varity chain configuration
 */
export declare function isVarityChain(chain: any): chain is VarityChain;
/**
 * Type guard to check if a value is a valid SIWE message
 */
export declare function isSIWEMessage(message: any): message is SIWEMessage;
/**
 * Varity L3 Testnet Chain Constants
 */
export declare const VARITY_L3_TESTNET: VarityChainConstants;
/**
 * USDC Decimals Constant
 * CRITICAL: Always use this constant when handling USDC amounts
 */
export declare const USDC_DECIMALS: 6;
/**
 * Helper to format USDC amounts
 *
 * @param amount - Raw USDC amount (6 decimals)
 * @returns Formatted USDC amount object
 *
 * @example
 * ```typescript
 * const formatted = formatUSDC(1500000n)
 * // Returns: { raw: 1500000n, formatted: "1.50 USDC", value: 1.5, decimals: 6 }
 * ```
 */
export declare function formatUSDC(amount: bigint): USDCAmount;
/**
 * Helper to parse USDC amounts from human-readable format
 *
 * @param amount - Human-readable amount (e.g., "1.5" or 1.5)
 * @returns Raw USDC amount (6 decimals)
 *
 * @example
 * ```typescript
 * const raw = parseUSDC("1.5")
 * // Returns: 1500000n
 * ```
 */
export declare function parseUSDC(amount: string | number): bigint;
//# sourceMappingURL=thirdweb.d.ts.map