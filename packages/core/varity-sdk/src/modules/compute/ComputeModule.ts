/**
 * Varity SDK - Compute Module
 *
 * Universal AI/LLM computation on Akash Network.
 * Works across all templates (ISO, Healthcare, Retail, etc.)
 */

import type { VaritySDK } from '../../core/VaritySDK'
import type {
  AIResponse,
  AIResponseWithSources,
  TEEResponse,
  TEEAttestation,
  TEEQueryOptions,
  TEEProvider
} from '../../core/types'

export type JobId = string

export interface ComputeParams {
  modelId?: string
  input: any
  options?: {
    temperature?: number
    maxTokens?: number
    timeout?: number
  }
}

export interface ComputeStatus {
  jobId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number
  startedAt?: number
  completedAt?: number
  error?: string
}

export interface ComputeResult {
  jobId: string
  output: any
  metadata: {
    modelUsed: string
    tokensUsed?: number
    processingTime: number
    cost?: number
  }
  zkProof?: any
}

export interface Document {
  content: string
  metadata?: Record<string, any>
}

export interface SearchResults {
  documents: Array<{
    content: string
    similarity: number
    metadata?: Record<string, any>
  }>
  query: string
  totalResults: number
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
export class ComputeModule {
  private sdk: VaritySDK

  constructor(sdk: VaritySDK) {
    this.sdk = sdk
  }

  /**
   * Initiate AI computation job
   *
   * @param params - Computation parameters
   * @returns Job ID
   */
  async initiateAIComputation(params: ComputeParams): Promise<JobId> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/llm/compute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({
        modelId: params.modelId || 'gemini-2.0-flash',
        input: params.input,
        options: params.options
      })
    })

    if (!response.ok) {
      throw new Error(`Compute initiation failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result.jobId
  }

  /**
   * Get computation job status
   *
   * @param jobId - Job identifier
   * @returns Job status
   */
  async getComputationStatus(jobId: string): Promise<ComputeStatus> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(
      `${apiEndpoint}/api/v1/llm/compute/${jobId}/status`,
      {
        headers: {
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Fetch computation result
   *
   * @param jobId - Job identifier
   * @returns Computation result
   */
  async fetchComputationResult(jobId: string): Promise<ComputeResult> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(
      `${apiEndpoint}/api/v1/llm/compute/${jobId}/result`,
      {
        headers: {
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Result fetch failed: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Cancel computation job
   *
   * @param jobId - Job identifier
   */
  async cancelComputation(jobId: string): Promise<void> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(
      `${apiEndpoint}/api/v1/llm/compute/${jobId}/cancel`,
      {
        method: 'POST',
        headers: {
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Cancel failed: ${response.statusText}`)
    }

    console.log(`✅ Computation cancelled: ${jobId}`)
  }

  /**
   * Simple LLM query (synchronous)
   *
   * @param prompt - Query prompt
   * @param context - Optional context
   * @returns AI response
   */
  async query(prompt: string, context?: string): Promise<AIResponse> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/llm/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({ prompt, context })
    })

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Query with RAG (Retrieval Augmented Generation)
   *
   * @param query - User query
   * @param knowledgeBase - Knowledge base identifier
   * @returns AI response with sources
   */
  async queryWithRAG(
    query: string,
    knowledgeBase: string
  ): Promise<AIResponseWithSources> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/llm/query-rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({ query, knowledgeBase })
    })

    if (!response.ok) {
      throw new Error(`RAG query failed: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Ingest document into knowledge base
   *
   * @param document - Document to ingest
   * @param knowledgeBase - Knowledge base identifier
   * @returns Document ID
   */
  async ingestDocument(
    document: Document,
    knowledgeBase: string
  ): Promise<string> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/rag/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({
        document,
        knowledgeBase
      })
    })

    if (!response.ok) {
      throw new Error(`Document ingest failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result.documentId
  }

  /**
   * Search knowledge base
   *
   * @param query - Search query
   * @param knowledgeBase - Knowledge base identifier
   * @returns Search results
   */
  async searchKnowledge(
    query: string,
    knowledgeBase: string
  ): Promise<SearchResults> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/rag/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({ query, knowledgeBase })
    })

    if (!response.ok) {
      throw new Error(`Knowledge search failed: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Wait for computation to complete
   *
   * @param jobId - Job identifier
   * @param pollInterval - Polling interval in ms (default: 1000)
   * @param timeout - Timeout in ms (default: 300000 / 5 minutes)
   * @returns Computation result
   */
  async waitForCompletion(
    jobId: string,
    pollInterval: number = 1000,
    timeout: number = 300000
  ): Promise<ComputeResult> {
    const startTime = Date.now()

    while (true) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Computation timeout after ${timeout}ms`)
      }

      const status = await this.getComputationStatus(jobId)

      if (status.status === 'completed') {
        return await this.fetchComputationResult(jobId)
      }

      if (status.status === 'failed') {
        throw new Error(`Computation failed: ${status.error}`)
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
  }

  // ========================================================================
  // TEE (Trusted Execution Environment) Methods
  // ========================================================================

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
  async queryTEE(
    prompt: string,
    options?: TEEQueryOptions
  ): Promise<TEEResponse> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/llm/query-tee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({
        prompt,
        context: options?.context,
        requireAttestation: options?.requireAttestation ?? false,
        teeProvider: options?.teeProvider ?? 'phala',
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        knowledgeBase: options?.knowledgeBase
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`TEE query failed: ${error.message || response.statusText}`)
    }

    return await response.json()
  }

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
  async getTEEAttestation(
    teeProvider: TEEProvider = 'phala'
  ): Promise<TEEAttestation> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/tee/attestation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({ teeProvider })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`TEE attestation failed: ${error.message || response.statusText}`)
    }

    return await response.json()
  }

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
  async verifyTEEAttestation(
    attestation: TEEAttestation
  ): Promise<boolean> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/tee/verify-attestation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({ attestation })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`TEE attestation verification failed: ${error.message || response.statusText}`)
    }

    const result = await response.json()
    return result.valid
  }
}
