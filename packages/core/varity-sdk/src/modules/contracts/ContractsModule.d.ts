/**
 * Varity SDK - Contracts Module
 *
 * Universal L3 smart contract interaction layer.
 * Works across all templates (ISO, Healthcare, Retail, etc.)
 */
import { ethers } from 'ethers';
import type { VaritySDK } from '../../core/VaritySDK';
import type { TransactionReceipt } from '../../core/types';
export interface TxOptions {
    gasLimit?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    value?: bigint;
    nonce?: number;
}
export interface ContractCall {
    contractName: string;
    method: string;
    args: any[];
}
export interface MultiCall {
    method: string;
    args: any[];
}
export interface ContractConfig {
    constructorArgs: any[];
    options?: TxOptions;
}
export interface EventCallback {
    (...args: any[]): void;
}
/**
 * ContractsModule - Universal smart contract interaction
 *
 * @example
 * ```typescript
 * // Read from contract
 * const merchant = await sdk.contracts.call(
 *   'MerchantRegistry',
 *   'getMerchant',
 *   [merchantId]
 * )
 *
 * // Write to contract
 * const receipt = await sdk.contracts.send(
 *   'MerchantRegistry',
 *   'registerMerchant',
 *   [businessName, owner, repId]
 * )
 *
 * // Listen to events
 * await sdk.contracts.listen('MerchantRegistry', 'MerchantRegistered', (event) => {
 *   console.log('New merchant:', event.merchantId)
 * })
 * ```
 */
export declare class ContractsModule {
    private sdk;
    private contracts;
    private eventListeners;
    private static readonly ABI_REGISTRY;
    constructor(sdk: VaritySDK);
    /**
     * Get or create contract instance
     */
    private getContractInstance;
    /**
     * Call contract method (read-only)
     *
     * @param contractName - Contract name
     * @param method - Method name
     * @param args - Method arguments
     * @returns Method return value
     */
    call(contractName: string, method: string, args?: any[]): Promise<any>;
    /**
     * Send contract transaction (write)
     *
     * @param contractName - Contract name
     * @param method - Method name
     * @param args - Method arguments
     * @param options - Transaction options
     * @returns Transaction receipt
     */
    send(contractName: string, method: string, args?: any[], options?: TxOptions): Promise<TransactionReceipt>;
    /**
     * Estimate gas for transaction
     *
     * @param contractName - Contract name
     * @param method - Method name
     * @param args - Method arguments
     * @returns Estimated gas
     */
    estimateGas(contractName: string, method: string, args?: any[]): Promise<bigint>;
    /**
     * Deploy new sovereign contract instance
     *
     * @param template - Template type (e.g., 'iso', 'healthcare')
     * @param config - Deployment configuration
     * @returns Deployed contract address
     */
    deploySovereignContract(template: string, config: ContractConfig): Promise<string>;
    /**
     * Get contract address by name
     *
     * @param contractName - Contract name
     * @returns Contract address
     */
    getContractAddress(contractName: string): Promise<string>;
    /**
     * Get contract instance
     *
     * @param contractName - Contract name
     * @returns Contract instance
     */
    getContract(contractName: string): Promise<ethers.Contract>;
    /**
     * Listen to contract events
     *
     * @param contractName - Contract name
     * @param eventName - Event name
     * @param callback - Event callback
     */
    listen(contractName: string, eventName: string, callback: EventCallback): Promise<void>;
    /**
     * Stop listening to contract events
     *
     * @param contractName - Contract name
     * @param eventName - Event name
     */
    stopListening(contractName: string, eventName: string): Promise<void>;
    /**
     * Batch call multiple read-only methods
     *
     * @param calls - Array of contract calls
     * @returns Array of results
     */
    batchCall(calls: ContractCall[]): Promise<any[]>;
    /**
     * Multicall on single contract
     *
     * @param contractName - Contract name
     * @param calls - Array of method calls
     * @returns Array of results
     */
    multicall(contractName: string, calls: MultiCall[]): Promise<any[]>;
    /**
     * Register custom contract ABI
     *
     * @param contractName - Contract name
     * @param abi - Contract ABI
     */
    registerABI(contractName: string, abi: any): void;
    /**
     * Clear cached contract instances
     */
    clearCache(): void;
    /**
     * Remove all event listeners
     */
    removeAllListeners(): Promise<void>;
}
//# sourceMappingURL=ContractsModule.d.ts.map