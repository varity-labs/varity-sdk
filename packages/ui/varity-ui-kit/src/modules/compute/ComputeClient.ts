/**
 * Compute Client - AI/LLM computation
 *
 * Handles AI queries via API server (Akash Network backend)
 */

import { HTTPClient } from '../../utils/http'

export interface ComputeRequest {
  model?: string
  prompt: string
  context?: string
  temperature?: number
  maxTokens?: number
}

export interface ComputeResponse {
  answer: string
  confidence: number
  modelUsed: string
  processingTime: number
  timestamp: number
}

export interface RAGQueryRequest {
  query: string
  knowledgeBase?: string
  topK?: number
}

export interface RAGQueryResponse extends ComputeResponse {
  sources: Array<{
    cid: string
    title: string
    snippet: string
    relevanceScore: number
  }>
}

export class ComputeClient {
  constructor(private http: HTTPClient) {}

  /**
   * Run AI computation
   */
  async compute(request: ComputeRequest): Promise<ComputeResponse> {
    return this.http.post<ComputeResponse>('/llm/compute', request)
  }

  /**
   * Query AI with simple prompt
   */
  async query(prompt: string, context?: string): Promise<ComputeResponse> {
    return this.http.post<ComputeResponse>('/llm/query', { prompt, context })
  }

  /**
   * Query AI with RAG (Retrieval-Augmented Generation)
   */
  async queryRAG(request: RAGQueryRequest): Promise<RAGQueryResponse> {
    return this.http.post<RAGQueryResponse>('/llm/query-rag', request)
  }

  /**
   * Query AI in TEE (Trusted Execution Environment)
   */
  async queryTEE(prompt: string, requireAttestation?: boolean): Promise<ComputeResponse> {
    return this.http.post<ComputeResponse>('/llm/query-tee', {
      prompt,
      requireAttestation
    })
  }
}
