/**
 * Unit tests for ZKClient
 */

import {
  ZKClient,
  ZKProofRequest,
  ZKProofResponse,
  ZKVerifyRequest,
  ZKVerifyResponse,
  ZKMLStats
} from './ZKClient'
import { createMockHTTPClient, MockHTTPClient } from '../../tests/mocks/httpClient.mock'

describe('ZKClient', () => {
  let mockHttp: MockHTTPClient
  let zkClient: ZKClient

  beforeEach(() => {
    mockHttp = createMockHTTPClient()
    zkClient = new ZKClient(mockHttp)
  })

  afterEach(() => {
    mockHttp.clearMocks()
  })

  describe('prove', () => {
    it('should generate zero-knowledge proof', async () => {
      const mockResponse: ZKProofResponse = {
        proofId: 'proof-123',
        proof: {
          pi_a: ['0x1', '0x2'],
          pi_b: [['0x3', '0x4'], ['0x5', '0x6']],
          pi_c: ['0x7', '0x8']
        },
        publicSignals: ['signal1', 'signal2'],
        verified: true,
        timestamp: Date.now()
      }

      mockHttp.mockPost('/zkml/prove', mockResponse)

      const request: ZKProofRequest = {
        modelId: 'model-123',
        input: { data: [1, 2, 3, 4] },
        output: { prediction: 0.95 },
        submitOnChain: false
      }

      const result = await zkClient.prove(request)

      expect(result).toEqual(mockResponse)
      expect(result.proofId).toBe('proof-123')
      expect(result.verified).toBe(true)
      expect(result.publicSignals).toHaveLength(2)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'POST',
        path: '/zkml/prove',
        data: request
      })
    })

    it('should generate and submit proof on-chain', async () => {
      const mockResponse: ZKProofResponse = {
        proofId: 'proof-456',
        proof: {
          pi_a: ['0x1', '0x2'],
          pi_b: [['0x3', '0x4'], ['0x5', '0x6']],
          pi_c: ['0x7', '0x8']
        },
        publicSignals: ['signal1'],
        verified: true,
        timestamp: Date.now()
      }

      mockHttp.mockPost('/zkml/prove', mockResponse)

      const request: ZKProofRequest = {
        modelId: 'model-456',
        input: { data: [5, 6, 7, 8] },
        output: { prediction: 0.88 },
        submitOnChain: true
      }

      const result = await zkClient.prove(request)

      expect(result).toEqual(mockResponse)
    })
  })

  describe('verify', () => {
    it('should verify zero-knowledge proof', async () => {
      const mockResponse: ZKVerifyResponse = {
        valid: true,
        verificationMethod: 'off-chain',
        verificationTimeMs: 50
      }

      mockHttp.mockPost('/zkml/verify', mockResponse)

      const request: ZKVerifyRequest = {
        proofId: 'proof-123',
        proof: {
          pi_a: ['0x1', '0x2'],
          pi_b: [['0x3', '0x4'], ['0x5', '0x6']],
          pi_c: ['0x7', '0x8']
        },
        publicSignals: ['signal1', 'signal2']
      }

      const result = await zkClient.verify(request)

      expect(result).toEqual(mockResponse)
      expect(result.valid).toBe(true)
      expect(result.verificationMethod).toBe('off-chain')
      expect(result.verificationTimeMs).toBe(50)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'POST',
        path: '/zkml/verify',
        data: request
      })
    })

    it('should verify proof on-chain', async () => {
      const mockResponse: ZKVerifyResponse = {
        valid: true,
        verificationMethod: 'on-chain',
        txHash: '0xabcdef1234567890',
        verificationTimeMs: 500
      }

      mockHttp.mockPost('/zkml/verify', mockResponse)

      const request: ZKVerifyRequest = {
        proofId: 'proof-456',
        proof: { pi_a: ['0x1'], pi_b: [['0x2']], pi_c: ['0x3'] },
        publicSignals: ['signal1']
      }

      const result = await zkClient.verify(request)

      expect(result.verificationMethod).toBe('on-chain')
      expect(result.txHash).toBe('0xabcdef1234567890')
    })
  })

  describe('stats', () => {
    it('should get ZKML statistics', async () => {
      const mockStats: ZKMLStats = {
        totalProofsGenerated: 1000,
        totalProofsVerified: 950,
        avgGenerationTimeMs: 250,
        avgVerificationTimeMs: 50,
        successRate: 0.95
      }

      mockHttp.mockGet('/zkml/stats', mockStats)

      const result = await zkClient.stats()

      expect(result).toEqual(mockStats)
      expect(result.totalProofsGenerated).toBe(1000)
      expect(result.successRate).toBe(0.95)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'GET',
        path: '/zkml/stats'
      })
    })
  })

  describe('circuits', () => {
    it('should list available circuits', async () => {
      const mockCircuits = ['circuit-1', 'circuit-2', 'circuit-3']

      mockHttp.mockGet('/zkml/circuits', mockCircuits)

      const result = await zkClient.circuits()

      expect(result).toEqual(mockCircuits)
      expect(result).toHaveLength(3)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'GET',
        path: '/zkml/circuits'
      })
    })
  })
})
