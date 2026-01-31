/**
 * Unit tests for ComputeClient
 */

import {
  ComputeClient,
  ComputeRequest,
  ComputeResponse,
  RAGQueryRequest,
  RAGQueryResponse
} from './ComputeClient'
import { createMockHTTPClient, MockHTTPClient } from '../../tests/mocks/httpClient.mock'

describe('ComputeClient', () => {
  let mockHttp: MockHTTPClient
  let computeClient: ComputeClient

  beforeEach(() => {
    mockHttp = createMockHTTPClient()
    computeClient = new ComputeClient(mockHttp)
  })

  afterEach(() => {
    mockHttp.clearMocks()
  })

  describe('compute', () => {
    it('should run AI computation', async () => {
      const mockResponse: ComputeResponse = {
        answer: 'This is the AI response',
        confidence: 0.95,
        modelUsed: 'gemini-2.5-flash',
        processingTime: 150,
        timestamp: Date.now()
      }

      mockHttp.mockPost('/llm/compute', mockResponse)

      const request: ComputeRequest = {
        model: 'gemini-2.5-flash',
        prompt: 'What is the meaning of life?',
        temperature: 0.7,
        maxTokens: 500
      }

      const result = await computeClient.compute(request)

      expect(result).toEqual(mockResponse)
      expect(result.answer).toBe('This is the AI response')
      expect(result.confidence).toBe(0.95)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'POST',
        path: '/llm/compute',
        data: request
      })
    })
  })

  describe('query', () => {
    it('should query AI with simple prompt', async () => {
      const mockResponse: ComputeResponse = {
        answer: 'AI answer to simple query',
        confidence: 0.88,
        modelUsed: 'gemini-2.5-flash',
        processingTime: 100,
        timestamp: Date.now()
      }

      mockHttp.mockPost('/llm/query', mockResponse)

      const result = await computeClient.query('What is the weather today?', 'User is in San Francisco')

      expect(result).toEqual(mockResponse)
      expect(result.answer).toBe('AI answer to simple query')

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'POST',
        path: '/llm/query',
        data: { prompt: 'What is the weather today?', context: 'User is in San Francisco' }
      })
    })

    it('should query AI without context', async () => {
      const mockResponse: ComputeResponse = {
        answer: 'AI answer without context',
        confidence: 0.80,
        modelUsed: 'gemini-2.5-flash',
        processingTime: 90,
        timestamp: Date.now()
      }

      mockHttp.mockPost('/llm/query', mockResponse)

      const result = await computeClient.query('Hello AI')

      expect(result).toEqual(mockResponse)
    })
  })

  describe('queryRAG', () => {
    it('should query AI with RAG', async () => {
      const mockResponse: RAGQueryResponse = {
        answer: 'RAG-enhanced answer',
        confidence: 0.92,
        modelUsed: 'gemini-2.5-flash',
        processingTime: 250,
        timestamp: Date.now(),
        sources: [
          {
            cid: 'Qm111',
            title: 'Source Document 1',
            snippet: 'Relevant excerpt from source 1',
            relevanceScore: 0.95
          },
          {
            cid: 'Qm222',
            title: 'Source Document 2',
            snippet: 'Relevant excerpt from source 2',
            relevanceScore: 0.88
          }
        ]
      }

      mockHttp.mockPost('/llm/query-rag', mockResponse)

      const request: RAGQueryRequest = {
        query: 'What are our compliance requirements?',
        knowledgeBase: 'compliance-docs',
        topK: 5
      }

      const result = await computeClient.queryRAG(request)

      expect(result).toEqual(mockResponse)
      expect(result.sources).toHaveLength(2)
      expect(result.sources[0].relevanceScore).toBe(0.95)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'POST',
        path: '/llm/query-rag',
        data: request
      })
    })
  })

  describe('queryTEE', () => {
    it('should query AI in TEE', async () => {
      const mockResponse: ComputeResponse = {
        answer: 'TEE-secured answer',
        confidence: 0.90,
        modelUsed: 'gemini-2.5-flash-tee',
        processingTime: 300,
        timestamp: Date.now()
      }

      mockHttp.mockPost('/llm/query-tee', mockResponse)

      const result = await computeClient.queryTEE('Sensitive query', true)

      expect(result).toEqual(mockResponse)
      expect(result.answer).toBe('TEE-secured answer')

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'POST',
        path: '/llm/query-tee',
        data: { prompt: 'Sensitive query', requireAttestation: true }
      })
    })
  })
})
