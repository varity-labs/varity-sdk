/**
 * Varity SDK - Compute Module
 *
 * Universal AI/LLM computation on Akash Network.
 * Works across all templates (ISO, Healthcare, Retail, etc.)
 */
import type { VaritySDK } from '../../core/VaritySDK';
import type { AIResponse, AIResponseWithSources, TEEResponse, TEEAttestation, TEEQueryOptions, TEEProvider } from '../../core/types';
export type JobId = string;
export interface ComputeParams {
    modelId?: string;
    input: any;
    options?: {
        temperature?: number;
        maxTokens?: number;
        timeout?: number;
    };
}
export interface ComputeStatus {
    jobId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress?: number;
    startedAt?: number;
    completedAt?: number;
    error?: string;
}
export interface ComputeResult {
    jobId: string;
    output: any;
    metadata: {
        modelUsed: string;
        tokensUsed?: number;
        processingTime: number;
        cost?: number;
    };
    zkProof?: any;
}
export interface Document {
    content: string;
    metadata?: Record<string, any>;
}
export interface SearchResults {
    documents: Array<{
        content: string;
        similarity: number;
        metadata?: Record<string, any>;
    }>;
    query: string;
    totalResults: number;
}
/**
 * ComputeModule - Universal AI/LLM computation
 *
 * @example
 * ```typescript
 * // Simple LLM query
 * const response = await sdk.compute.query("Analyze this merchant data")
 *
 * // Query with RAG (Retrieval Augmented Generation)
 * const response = await sdk.compute.queryWithRAG(
 *   "Show performance trends",
 *   "iso-merchants-knowledge"
 * )
 *
 * // Advanced computation job
 * const jobId = await sdk.compute.initiateAIComputation({
 *   modelId: 'gemini-2.0-flash',
 *   input: { prompt: "Complex analysis..." }
 * })
 * const status = await sdk.compute.getComputationStatus(jobId)
 * const result = await sdk.compute.fetchComputationResult(jobId)
 * ```
 */
export declare class ComputeModule {
    private sdk;
    constructor(sdk: VaritySDK);
    /**
     * Initiate AI computation job
     *
     * @param params - Computation parameters
     * @returns Job ID
     */
    initiateAIComputation(params: ComputeParams): Promise<JobId>;
    /**
     * Get computation job status
     *
     * @param jobId - Job identifier
     * @returns Job status
     */
    getComputationStatus(jobId: string): Promise<ComputeStatus>;
    /**
     * Fetch computation result
     *
     * @param jobId - Job identifier
     * @returns Computation result
     */
    fetchComputationResult(jobId: string): Promise<ComputeResult>;
    /**
     * Cancel computation job
     *
     * @param jobId - Job identifier
     */
    cancelComputation(jobId: string): Promise<void>;
    /**
     * Simple LLM query (synchronous)
     *
     * @param prompt - Query prompt
     * @param context - Optional context
     * @returns AI response
     */
    query(prompt: string, context?: string): Promise<AIResponse>;
    /**
     * Query with RAG (Retrieval Augmented Generation)
     *
     * @param query - User query
     * @param knowledgeBase - Knowledge base identifier
     * @returns AI response with sources
     */
    queryWithRAG(query: string, knowledgeBase: string): Promise<AIResponseWithSources>;
    /**
     * Ingest document into knowledge base
     *
     * @param document - Document to ingest
     * @param knowledgeBase - Knowledge base identifier
     * @returns Document ID
     */
    ingestDocument(document: Document, knowledgeBase: string): Promise<string>;
    /**
     * Search knowledge base
     *
     * @param query - Search query
     * @param knowledgeBase - Knowledge base identifier
     * @returns Search results
     */
    searchKnowledge(query: string, knowledgeBase: string): Promise<SearchResults>;
    /**
     * Wait for computation to complete
     *
     * @param jobId - Job identifier
     * @param pollInterval - Polling interval in ms (default: 1000)
     * @param timeout - Timeout in ms (default: 300000 / 5 minutes)
     * @returns Computation result
     */
    waitForCompletion(jobId: string, pollInterval?: number, timeout?: number): Promise<ComputeResult>;
    /**
     * Query LLM with TEE encryption
     *
     * Performs an LLM query with Trusted Execution Environment encryption,
     * ensuring that the query and response are protected by hardware-backed security.
     *
     * @param prompt - Query prompt
     * @param options - TEE query options
     * @returns TEE-encrypted AI response with optional attestation
     *
     * @example
     * ```typescript
     * // Basic TEE query
     * const response = await sdk.compute.queryTEE(
     *   "Analyze sensitive merchant data"
     * )
     *
     * // TEE query with attestation
     * const response = await sdk.compute.queryTEE(
     *   "Process confidential transaction",
     *   {
     *     requireAttestation: true,
     *     teeProvider: 'phala',
     *     temperature: 0.7
     *   }
     * )
     * console.log('Encrypted:', response.encrypted)
     * console.log('TEE verified:', response.attestation?.verified)
     * ```
     */
    queryTEE(prompt: string, options?: TEEQueryOptions): Promise<TEEResponse>;
    /**
     * Get TEE attestation
     *
     * Retrieves an attestation quote from a Trusted Execution Environment,
     * providing cryptographic proof of the enclave's integrity.
     *
     * @param teeProvider - TEE provider to use
     * @returns TEE attestation with quote and public key
     *
     * @example
     * ```typescript
     * // Get attestation from Phala Network
     * const attestation = await sdk.compute.getTEEAttestation('phala')
     * console.log('TEE Provider:', attestation.provider)
     * console.log('Public Key:', attestation.publicKey)
     * console.log('Quote:', attestation.quote)
     *
     * // Verify the attestation
     * const isValid = await sdk.compute.verifyTEEAttestation(attestation)
     * console.log('Attestation valid:', isValid)
     * ```
     */
    getTEEAttestation(teeProvider?: TEEProvider): Promise<TEEAttestation>;
    /**
     * Verify TEE attestation
     *
     * Verifies the cryptographic integrity of a TEE attestation quote,
     * ensuring the enclave is running authentic code in a secure environment.
     *
     * @param attestation - TEE attestation to verify
     * @returns True if attestation is valid
     *
     * @example
     * ```typescript
     * const attestation = await sdk.compute.getTEEAttestation('intel-sgx')
     *
     * // Verify the attestation
     * const isValid = await sdk.compute.verifyTEEAttestation(attestation)
     *
     * if (isValid) {
     *   console.log('✅ TEE attestation verified')
     *   console.log('MRENCLAVE:', attestation.mrenclave)
     *   console.log('TCB Status:', attestation.verificationDetails?.tcbStatus)
     * } else {
     *   console.log('❌ TEE attestation verification failed')
     * }
     * ```
     */
    verifyTEEAttestation(attestation: TEEAttestation): Promise<boolean>;
}
//# sourceMappingURL=ComputeModule.d.ts.map