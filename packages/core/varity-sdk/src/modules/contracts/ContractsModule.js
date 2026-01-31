/**
 * Varity SDK - Contracts Module
 *
 * Universal L3 smart contract interaction layer.
 * Works across all templates (ISO, Healthcare, Retail, etc.)
 */
import { ethers } from 'ethers';
// Import all contract ABIs
import MerchantRegistryABI from '../../contracts/abis/iso/MerchantRegistry.json';
import TransactionVaultABI from '../../contracts/abis/iso/TransactionVault.json';
import RepPerformanceABI from '../../contracts/abis/iso/RepPerformance.json';
import ResidualCalculatorABI from '../../contracts/abis/iso/ResidualCalculator.json';
import AccessControlRegistryABI from '../../contracts/abis/iso/AccessControlRegistry.json';
import DataProofRegistryABI from '../../contracts/abis/iso/DataProofRegistry.json';
import VarityWalletFactoryABI from '../../contracts/abis/iso/VarityWalletFactory.json';
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
export class ContractsModule {
    sdk;
    contracts = new Map();
    eventListeners = new Map();
    // Contract ABI registry
    static ABI_REGISTRY = {
        MerchantRegistry: MerchantRegistryABI.abi,
        TransactionVault: TransactionVaultABI.abi,
        RepPerformance: RepPerformanceABI.abi,
        ResidualCalculator: ResidualCalculatorABI.abi,
        AccessControlRegistry: AccessControlRegistryABI.abi,
        DataProofRegistry: DataProofRegistryABI.abi,
        VarityWalletFactory: VarityWalletFactoryABI.abi
    };
    constructor(sdk) {
        this.sdk = sdk;
    }
    /**
     * Get or create contract instance
     */
    getContractInstance(contractName, withSigner = false) {
        const cacheKey = `${contractName}:${withSigner}`;
        if (this.contracts.has(cacheKey)) {
            return this.contracts.get(cacheKey);
        }
        const abi = ContractsModule.ABI_REGISTRY[contractName];
        if (!abi) {
            throw new Error(`Contract ABI not found for "${contractName}". ` +
                `Available contracts: ${Object.keys(ContractsModule.ABI_REGISTRY).join(', ')}`);
        }
        const address = this.sdk.getContractAddress(contractName);
        const provider = this.sdk.getProvider();
        const contract = new ethers.Contract(address, abi, withSigner ? this.sdk.getSigner() : provider);
        this.contracts.set(cacheKey, contract);
        return contract;
    }
    /**
     * Call contract method (read-only)
     *
     * @param contractName - Contract name
     * @param method - Method name
     * @param args - Method arguments
     * @returns Method return value
     */
    async call(contractName, method, args = []) {
        const contract = this.getContractInstance(contractName, false);
        if (!contract[method]) {
            throw new Error(`Method "${method}" not found on contract "${contractName}"`);
        }
        return await contract[method](...args);
    }
    /**
     * Send contract transaction (write)
     *
     * @param contractName - Contract name
     * @param method - Method name
     * @param args - Method arguments
     * @param options - Transaction options
     * @returns Transaction receipt
     */
    async send(contractName, method, args = [], options) {
        const contract = this.getContractInstance(contractName, true);
        if (!contract[method]) {
            throw new Error(`Method "${method}" not found on contract "${contractName}"`);
        }
        const tx = await contract[method](...args, options || {});
        const receipt = await tx.wait();
        return {
            hash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed,
            status: receipt.status,
            logs: receipt.logs
        };
    }
    /**
     * Estimate gas for transaction
     *
     * @param contractName - Contract name
     * @param method - Method name
     * @param args - Method arguments
     * @returns Estimated gas
     */
    async estimateGas(contractName, method, args = []) {
        const contract = this.getContractInstance(contractName, true);
        if (!contract[method]) {
            throw new Error(`Method "${method}" not found on contract "${contractName}"`);
        }
        return await contract[method].estimateGas(...args);
    }
    /**
     * Deploy new sovereign contract instance
     *
     * @param template - Template type (e.g., 'iso', 'healthcare')
     * @param config - Deployment configuration
     * @returns Deployed contract address
     */
    async deploySovereignContract(template, config) {
        // This would deploy a new instance of template contracts
        // For example, a company deploying their own MerchantRegistry
        throw new Error('Sovereign contract deployment not yet implemented');
    }
    /**
     * Get contract address by name
     *
     * @param contractName - Contract name
     * @returns Contract address
     */
    async getContractAddress(contractName) {
        return this.sdk.getContractAddress(contractName);
    }
    /**
     * Get contract instance
     *
     * @param contractName - Contract name
     * @returns Contract instance
     */
    async getContract(contractName) {
        return this.getContractInstance(contractName, false);
    }
    /**
     * Listen to contract events
     *
     * @param contractName - Contract name
     * @param eventName - Event name
     * @param callback - Event callback
     */
    async listen(contractName, eventName, callback) {
        const contract = this.getContractInstance(contractName, false);
        const listenerId = `${contractName}:${eventName}`;
        // Remove existing listener if any
        if (this.eventListeners.has(listenerId)) {
            await this.stopListening(contractName, eventName);
        }
        contract.on(eventName, callback);
        this.eventListeners.set(listenerId, { contract, eventName, callback });
        console.log(`✅ Listening to ${contractName}.${eventName}`);
    }
    /**
     * Stop listening to contract events
     *
     * @param contractName - Contract name
     * @param eventName - Event name
     */
    async stopListening(contractName, eventName) {
        const listenerId = `${contractName}:${eventName}`;
        const listener = this.eventListeners.get(listenerId);
        if (listener) {
            listener.contract.off(eventName, listener.callback);
            this.eventListeners.delete(listenerId);
            console.log(`✅ Stopped listening to ${contractName}.${eventName}`);
        }
    }
    /**
     * Batch call multiple read-only methods
     *
     * @param calls - Array of contract calls
     * @returns Array of results
     */
    async batchCall(calls) {
        const promises = calls.map(call => this.call(call.contractName, call.method, call.args));
        return await Promise.all(promises);
    }
    /**
     * Multicall on single contract
     *
     * @param contractName - Contract name
     * @param calls - Array of method calls
     * @returns Array of results
     */
    async multicall(contractName, calls) {
        const contract = this.getContractInstance(contractName, false);
        const promises = calls.map(call => contract[call.method](...call.args));
        return await Promise.all(promises);
    }
    /**
     * Register custom contract ABI
     *
     * @param contractName - Contract name
     * @param abi - Contract ABI
     */
    registerABI(contractName, abi) {
        ContractsModule.ABI_REGISTRY[contractName] = abi;
        console.log(`✅ Registered ABI for ${contractName}`);
    }
    /**
     * Clear cached contract instances
     */
    clearCache() {
        this.contracts.clear();
        console.log('✅ Contract cache cleared');
    }
    /**
     * Remove all event listeners
     */
    async removeAllListeners() {
        for (const [listenerId, listener] of this.eventListeners.entries()) {
            listener.contract.off(listener.eventName, listener.callback);
        }
        this.eventListeners.clear();
        console.log('✅ All event listeners removed');
    }
}
//# sourceMappingURL=ContractsModule.js.map