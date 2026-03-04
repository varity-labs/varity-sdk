/**
 * ComputeModule Tests
 *
 * Comprehensive tests for AI/LLM computation on Akash Network
 */

import { ComputeModule, type ComputeParams, type Document } from '../ComputeModule'
import type { VaritySDK } from '../../../core/VaritySDK'

global.fetch = jest.fn()

describe('ComputeModule', () => {
  let computeModule: ComputeModule
  const mockSDK = {
    getAPIEndpoint: () => 'https://api.varity.test',
    getAPIKey: () => 'test-api-key'
  } as VaritySDK

  beforeEach(() => {
    jest.clearAllMocks()
    computeModule = new ComputeModule(mockSDK)
  })

  describe('initiateAIComputation', () => {
    it('should initiate AI computation successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-123' })
      })

      const params: ComputeParams = {
        modelId: 'gemini-2.0-flash',
        input: { prompt: 'Test prompt' },
        options: { temperature: 0.7, maxTokens: 1000 }
      }

      const jobId = await computeModule.initiateAIComputation(params)

      expect(jobId).toBe('job-123')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.varity.test/api/v1/llm/compute',
        expect.objectContaining({
          method: 'POST'
        })
      )
    })

    it('should use default model if not specified', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-456' })
      })

      const params: ComputeParams = {
        input: { prompt: 'Test' }
      }

      await computeModule.initiateAIComputation(params)

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(callBody.modelId).toBe('gemini-2.0-flash')
    })

    it('should throw error on initiation failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      })

      await expect(computeModule.initiateAIComputation({input: {}})).rejects.toThrow()
    })
  })

  describe('getComputationStatus', () => {
    it('should get computation status', async () => {
      const mockStatus = {
        jobId: 'job-123',
        status: 'running',
        progress: 50,
        startedAt: Date.now()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus
      })

      const status = await computeModule.getComputationStatus('job-123')

      expect(status.jobId).toBe('job-123')
      expect(status.status).toBe('running')
      expect(status.progress).toBe(50)
    })
  })

  describe('fetchComputationResult', () => {
    it('should fetch computation result', async () => {
      const mockResult = {
        jobId: 'job-123',
        output: { result: 'test output' },
        metadata: {
          modelUsed: 'gemini-2.0-flash',
          tokensUsed: 100,
          processingTime: 1500,
          cost: 0.01
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      })

      const result = await computeModule.fetchComputationResult('job-123')

      expect(result.jobId).toBe('job-123')
      expect(result.output).toEqual({ result: 'test output' })
      expect(result.metadata.tokensUsed).toBe(100)
    })
  })

  describe('cancelComputation', () => {
    it('should cancel computation', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await computeModule.cancelComputation('job-123')

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('cancelled'))
      consoleSpy.mockRestore()
    })
  })

  describe('query', () => {
    it('should execute simple LLM query', async () => {
      const mockResponse = {
        response: 'AI response',
        model: 'gemini-2.0-flash',
        tokensUsed: 50
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await computeModule.query('Test prompt', 'context')

      expect(result.response).toBe('AI response')
    })
  })

  describe('queryWithRAG', () => {
    it('should execute RAG query', async () => {
      const mockResponse = {
        response: 'RAG response',
        sources: [{ document: 'doc1', score: 0.9 }],
        model: 'gemini-2.0-flash'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await computeModule.queryWithRAG('Query', 'knowledge-base-123')

      expect(result.response).toBe('RAG response')
      expect(result.sources).toHaveLength(1)
    })
  })

  describe('ingestDocument', () => {
    it('should ingest document into knowledge base', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ documentId: 'doc-123' })
      })

      const document: Document = {
        content: 'Test content',
        metadata: { source: 'test' }
      }

      const docId = await computeModule.ingestDocument(document, 'kb-123')

      expect(docId).toBe('doc-123')
    })
  })

  describe('searchKnowledge', () => {
    it('should search knowledge base', async () => {
      const mockResults = {
        documents: [
          { content: 'Result 1', similarity: 0.95, metadata: {} },
          { content: 'Result 2', similarity: 0.85, metadata: {} }
        ],
        query: 'test query',
        totalResults: 2
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      })

      const results = await computeModule.searchKnowledge('test query', 'kb-123')

      expect(results.documents).toHaveLength(2)
      expect(results.totalResults).toBe(2)
    })
  })

  describe('waitForCompletion', () => {
    it('should wait for computation completion', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: 'job-123', status: 'running' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: 'job-123', status: 'completed' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            jobId: 'job-123',
            output: {},
            metadata: { modelUsed: 'test', processingTime: 100 }
          })
        })

      const result = await computeModule.waitForCompletion('job-123', 100, 5000)

      expect(result.jobId).toBe('job-123')
    })

    it('should throw error on timeout', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ jobId: 'job-123', status: 'running' })
      })

      await expect(
        computeModule.waitForCompletion('job-123', 100, 500)
      ).rejects.toThrow('timeout')
    })

    it('should throw error on computation failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jobId: 'job-123',
          status: 'failed',
          error: 'Computation error'
        })
      })

      await expect(
        computeModule.waitForCompletion('job-123')
      ).rejects.toThrow('Computation failed')
    })
  })

  describe('TEE methods', () => {
    describe('queryTEE', () => {
      it('should execute TEE query', async () => {
        const mockResponse = {
          response: 'Encrypted response',
          encrypted: true,
          attestation: {
            verified: true,
            provider: 'phala'
          }
        }

        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        })

        const result = await computeModule.queryTEE('Sensitive prompt', {
          requireAttestation: true,
          teeProvider: 'phala'
        })

        expect(result.encrypted).toBe(true)
        expect(result.attestation?.verified).toBe(true)
      })

      it('should use default TEE provider', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ response: 'test', encrypted: true })
        })

        await computeModule.queryTEE('Test')

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
        expect(callBody.teeProvider).toBe('phala')
      })
    })

    describe('getTEEAttestation', () => {
      it('should get TEE attestation', async () => {
        const mockAttestation = {
          provider: 'phala',
          quote: 'attestation-quote',
          publicKey: 'pub-key-123',
          mrenclave: 'mr-enclave-hash'
        }

        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockAttestation
        })

        const attestation = await computeModule.getTEEAttestation('phala')

        expect(attestation.provider).toBe('phala')
        expect(attestation.quote).toBeDefined()
      })
    })

    describe('verifyTEEAttestation', () => {
      it('should verify TEE attestation', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ valid: true })
        })

        const attestation = {
          provider: 'phala' as const,
          quote: 'test-quote',
          publicKey: 'test-key',
          mrenclave: 'test-mr'
        }

        const isValid = await computeModule.verifyTEEAttestation(attestation)

        expect(isValid).toBe(true)
      })

      it('should return false for invalid attestation', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ valid: false })
        })

        const attestation = {
          provider: 'phala' as const,
          quote: 'invalid',
          publicKey: 'test',
          mrenclave: 'test'
        }

        const isValid = await computeModule.verifyTEEAttestation(attestation)

        expect(isValid).toBe(false)
      })
    })
  })
})
