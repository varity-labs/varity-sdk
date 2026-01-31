/**
 * ZK Client - Zero-knowledge proof operations
 *
 * Handles ZK proof generation/verification via API server (ZKML backend)
 */

import { HTTPClient } from '../../utils/http'
import { JSONValue } from '@varity-labs/types'

/**
 * ZK Proof structure (Groth16 format)
 */
export interface ZKProof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
}

export interface ZKProofRequest {
  modelId: string
  input: JSONValue
  output: JSONValue
  submitOnChain?: boolean
}

export interface ZKProofResponse {
  proofId: string
  proof: ZKProof
  publicSignals: string[]
  verified: boolean
  timestamp: number
}

export interface ZKVerifyRequest {
  proofId: string
  proof: ZKProof
  publicSignals: string[]
}

export interface ZKVerifyResponse {
  valid: boolean
  verificationMethod: 'on-chain' | 'off-chain'
  txHash?: string
  verificationTimeMs: number
}

export interface ZKMLStats {
  totalProofsGenerated: number
  totalProofsVerified: number
  avgGenerationTimeMs: number
  avgVerificationTimeMs: number
  successRate: number
}

export class ZKClient {
  constructor(private http: HTTPClient) {}

  /**
   * Generate zero-knowledge proof for ML inference
   */
  async prove(request: ZKProofRequest): Promise<ZKProofResponse> {
    return this.http.post<ZKProofResponse>('/zkml/prove', request)
  }

  /**
   * Verify zero-knowledge proof
   */
  async verify(request: ZKVerifyRequest): Promise<ZKVerifyResponse> {
    return this.http.post<ZKVerifyResponse>('/zkml/verify', request)
  }

  /**
   * Get ZKML statistics
   */
  async stats(): Promise<ZKMLStats> {
    return this.http.get<ZKMLStats>('/zkml/stats')
  }

  /**
   * List available circuits
   */
  async circuits(): Promise<string[]> {
    return this.http.get<string[]>('/zkml/circuits')
  }
}
