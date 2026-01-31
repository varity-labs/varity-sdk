/**
 * Varity SDK - ZK Module
 *
 * Universal zero-knowledge proof generation and verification.
 * Works across all templates (ISO, Healthcare, Retail, etc.)
 */
import type { VaritySDK } from '../../core/VaritySDK';
import type { ZKProof, ZKMLProof, ZKMLProofInput, ZKMLVerificationResult, ZKMLProofStats } from '../../core/types';
export interface ProofInputs {
    public: any[];
    private: any[];
}
export interface VerificationResult {
    valid: boolean;
    transactionHash?: string;
    gasUsed?: bigint;
}
/**
 * ZKModule - Universal zero-knowledge proof operations
 *
 * @example
 * ```typescript
 * // Generate proof
 * const proof = await sdk.zk.generateProof('login-circuit', {
 *   public: [address],
 *   private: [password]
 * })
 *
 * // Verify proof on-chain
 * const result = await sdk.zk.verifyProofOnChain(proof, [address])
 * ```
 */
export declare class ZKModule {
    private sdk;
    constructor(sdk: VaritySDK);
    /**
     * Generate zero-knowledge proof
     *
     * @param circuitId - Circuit identifier
     * @param inputs - Proof inputs
     * @returns ZK proof
     */
    generateProof(circuitId: string, inputs: ProofInputs): Promise<ZKProof>;
    /**
     * Generate login proof (simplified)
     *
     * @param credentials - Login credentials
     * @returns ZK proof
     */
    generateLoginProof(credentials: any): Promise<ZKProof>;
    /**
     * Generate data ownership proof
     *
     * @param dataCID - Data CID
     * @returns ZK proof
     */
    generateDataOwnershipProof(dataCID: string): Promise<ZKProof>;
    /**
     * Verify proof on-chain
     *
     * @param proof - ZK proof
     * @param publicInputs - Public inputs
     * @returns Verification result
     */
    verifyProofOnChain(proof: ZKProof, publicInputs: any[]): Promise<VerificationResult>;
    /**
     * Verify proof off-chain (local verification)
     *
     * @param proof - ZK proof
     * @param publicInputs - Public inputs
     * @returns True if valid
     */
    verifyProofOffChain(proof: ZKProof, publicInputs: any[]): Promise<boolean>;
    /**
     * Prove ML inference with ZKML
     *
     * Generates a zero-knowledge proof that an ML inference was performed correctly
     * without revealing the model weights or full input/output data.
     *
     * @param modelId - Model identifier
     * @param input - Input data to the model
     * @param output - Output from the model
     * @param options - Additional proof generation options
     * @returns ZKML proof with verification data
     *
     * @example
     * ```typescript
     * const proof = await sdk.zk.proveMLInference(
     *   'merchant-risk-model',
     *   { merchantData: {...} },
     *   { riskScore: 0.85 },
     *   { submitOnChain: true }
     * )
     * console.log('Proof ID:', proof.proofId)
     * console.log('Verified:', proof.verified)
     * ```
     */
    proveMLInference(modelId: string, input: any, output: any, options?: Partial<ZKMLProofInput>): Promise<ZKMLProof>;
    /**
     * Verify ZKML proof
     *
     * Verifies a ZKML proof either on-chain or off-chain.
     *
     * @param proof - ZKML proof to verify
     * @param onChain - Whether to verify on-chain (default: false)
     * @returns Verification result
     *
     * @example
     * ```typescript
     * // Off-chain verification (faster, no gas)
     * const result = await sdk.zk.verifyMLProof(proof)
     * console.log('Valid:', result.valid)
     *
     * // On-chain verification (slower, requires gas)
     * const result = await sdk.zk.verifyMLProof(proof, true)
     * console.log('Transaction:', result.txHash)
     * ```
     */
    verifyMLProof(proof: ZKMLProof, onChain?: boolean): Promise<ZKMLVerificationResult>;
    /**
     * Get ZKML proof statistics
     *
     * Returns statistics about ZKML proof generation and verification.
     *
     * @returns Proof statistics
     *
     * @example
     * ```typescript
     * const stats = await sdk.zk.getProofStats()
     * console.log('Total proofs:', stats.totalProofsGenerated)
     * console.log('Success rate:', stats.successRate)
     * console.log('Avg generation time:', stats.avgGenerationTimeMs, 'ms')
     * ```
     */
    getProofStats(): Promise<ZKMLProofStats>;
    /**
     * List available ZKML circuits
     *
     * Returns a list of compiled ZKML circuits available for proof generation.
     *
     * @returns Array of circuit configurations
     *
     * @example
     * ```typescript
     * const circuits = await sdk.zk.listCircuits()
     * circuits.forEach(circuit => {
     *   console.log(`${circuit.circuitId}: ${circuit.provingSystem}`)
     * })
     * ```
     */
    listCircuits(): Promise<any[]>;
}
//# sourceMappingURL=ZKModule.d.ts.map