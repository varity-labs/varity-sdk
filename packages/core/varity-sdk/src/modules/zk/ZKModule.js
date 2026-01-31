/**
 * Varity SDK - ZK Module
 *
 * Universal zero-knowledge proof generation and verification.
 * Works across all templates (ISO, Healthcare, Retail, etc.)
 */
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
export class ZKModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    /**
     * Generate zero-knowledge proof
     *
     * @param circuitId - Circuit identifier
     * @param inputs - Proof inputs
     * @returns ZK proof
     */
    async generateProof(circuitId, inputs) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/zk/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify({ circuitId, inputs })
        });
        if (!response.ok) {
            throw new Error(`Proof generation failed: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Generate login proof (simplified)
     *
     * @param credentials - Login credentials
     * @returns ZK proof
     */
    async generateLoginProof(credentials) {
        // Simplified login proof for v1
        return await this.generateProof('login', {
            public: [credentials.address],
            private: [credentials.signature]
        });
    }
    /**
     * Generate data ownership proof
     *
     * @param dataCID - Data CID
     * @returns ZK proof
     */
    async generateDataOwnershipProof(dataCID) {
        const address = await this.sdk.getAddress();
        return await this.generateProof('data-ownership', {
            public: [dataCID, address],
            private: []
        });
    }
    /**
     * Verify proof on-chain
     *
     * @param proof - ZK proof
     * @param publicInputs - Public inputs
     * @returns Verification result
     */
    async verifyProofOnChain(proof, publicInputs) {
        // Call AccessControlRegistry.proveDataOwnership or similar verifier
        const receipt = await this.sdk.contracts.send('AccessControlRegistry', 'proveDataOwnership', [publicInputs[0], proof] // dataCID, proof
        );
        return {
            valid: true,
            transactionHash: receipt.hash,
            gasUsed: receipt.gasUsed
        };
    }
    /**
     * Verify proof off-chain (local verification)
     *
     * @param proof - ZK proof
     * @param publicInputs - Public inputs
     * @returns True if valid
     */
    async verifyProofOffChain(proof, publicInputs) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/zk/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify({ proof, publicInputs })
        });
        if (!response.ok) {
            throw new Error(`Proof verification failed: ${response.statusText}`);
        }
        const result = await response.json();
        return result.valid;
    }
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
    async proveMLInference(modelId, input, output, options) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const proofInput = {
            modelId,
            input,
            output,
            context: options?.context,
            circuitId: options?.circuitId,
            submitOnChain: options?.submitOnChain ?? false
        };
        const response = await fetch(`${apiEndpoint}/api/v1/zkml/prove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify(proofInput)
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`ZKML proof generation failed: ${error.message || response.statusText}`);
        }
        return await response.json();
    }
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
    async verifyMLProof(proof, onChain = false) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/zkml/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify({ proof, onChain })
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`ZKML proof verification failed: ${error.message || response.statusText}`);
        }
        return await response.json();
    }
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
    async getProofStats() {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/zkml/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to get proof stats: ${response.statusText}`);
        }
        return await response.json();
    }
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
    async listCircuits() {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/zkml/circuits`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to list circuits: ${response.statusText}`);
        }
        return await response.json();
    }
}
//# sourceMappingURL=ZKModule.js.map