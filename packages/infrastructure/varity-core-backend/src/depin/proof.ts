/**
 * Celestia Proof Verification Utilities
 * PROPRIETARY - DO NOT DISTRIBUTE
 *
 * Utilities for verifying data availability proofs from Celestia
 */

import crypto from 'crypto';
import logger from '../utils/logger';

/**
 * Data availability proof structure from Celestia
 */
export interface CelestiaProof {
  start: number;
  end: number;
  nodes: string[]; // Merkle tree nodes (base64 encoded)
  leaf_hash?: string; // Hash of the data
  is_max_namespace_ignored?: boolean;
}

/**
 * Verified proof result
 */
export interface VerifiedProof {
  valid: boolean;
  blobId: string;
  height: number;
  namespace: string;
  commitment: string;
  merkleRoot?: string;
  error?: string;
}

/**
 * Verify a Merkle proof from Celestia
 *
 * @param proof - The Merkle proof from Celestia RPC
 * @param commitment - The blob commitment (hash)
 * @param merkleRoot - The Merkle root from the block header
 * @returns Whether the proof is valid
 */
export function verifyMerkleProof(
  proof: CelestiaProof,
  commitment: string,
  merkleRoot: string
): boolean {
  try {
    if (!proof || !proof.nodes || proof.nodes.length === 0) {
      logger.warn('Empty or invalid proof provided');
      return false;
    }

    // Start with the leaf hash (commitment)
    let currentHash = Buffer.from(commitment, 'base64');

    // Traverse up the Merkle tree
    for (const node of proof.nodes) {
      const nodeHash = Buffer.from(node, 'base64');

      // Combine current hash with sibling node
      // Order matters in Merkle trees (left vs right)
      const combined = Buffer.concat([currentHash, nodeHash]);
      currentHash = crypto.createHash('sha256').update(combined).digest();
    }

    // Final hash should match the Merkle root
    const computedRoot = currentHash.toString('base64');
    const isValid = computedRoot === merkleRoot;

    logger.info('Merkle proof verification', {
      valid: isValid,
      computedRoot: computedRoot.substring(0, 16) + '...',
      expectedRoot: merkleRoot.substring(0, 16) + '...',
    });

    return isValid;
  } catch (error: any) {
    logger.error('Merkle proof verification failed', {
      error: error.message,
    });
    return false;
  }
}

/**
 * Verify a data availability proof from Celestia
 *
 * @param blobId - The blob identifier
 * @param height - Block height where blob was included
 * @param namespace - Celestia namespace
 * @param commitment - Blob commitment
 * @param proof - Celestia proof object
 * @param merkleRoot - Merkle root from block header (optional)
 * @returns Verified proof result
 */
export function verifyDataAvailabilityProof(
  blobId: string,
  height: number,
  namespace: string,
  commitment: string,
  proof: CelestiaProof,
  merkleRoot?: string
): VerifiedProof {
  try {
    // If no Merkle root provided, we can only validate proof structure
    if (!merkleRoot) {
      logger.info('Verifying proof structure (no Merkle root provided)');
      const structureValid = validateProofStructure(proof);

      return {
        valid: structureValid,
        blobId,
        height,
        namespace,
        commitment,
        error: structureValid ? undefined : 'Invalid proof structure',
      };
    }

    // Verify Merkle proof against root
    const valid = verifyMerkleProof(proof, commitment, merkleRoot);

    return {
      valid,
      blobId,
      height,
      namespace,
      commitment,
      merkleRoot,
      error: valid ? undefined : 'Merkle proof verification failed',
    };
  } catch (error: any) {
    logger.error('Data availability proof verification failed', {
      error: error.message,
      blobId,
    });

    return {
      valid: false,
      blobId,
      height,
      namespace,
      commitment,
      error: error.message,
    };
  }
}

/**
 * Validate proof structure without verifying against Merkle root
 */
export function validateProofStructure(proof: CelestiaProof): boolean {
  if (!proof) {
    return false;
  }

  // Check required fields
  if (typeof proof.start !== 'number' || typeof proof.end !== 'number') {
    return false;
  }

  // Check that proof has nodes
  if (!Array.isArray(proof.nodes) || proof.nodes.length === 0) {
    return false;
  }

  // Validate that all nodes are valid base64 strings
  for (const node of proof.nodes) {
    if (typeof node !== 'string') {
      return false;
    }

    try {
      Buffer.from(node, 'base64');
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Calculate the expected Merkle depth for a given number of leaves
 */
export function calculateMerkleDepth(numLeaves: number): number {
  if (numLeaves <= 1) return 0;
  return Math.ceil(Math.log2(numLeaves));
}

/**
 * Verify commitment matches data
 *
 * @param data - The actual blob data
 * @param commitment - The claimed commitment
 * @returns Whether commitment is valid for the data
 */
export function verifyCommitment(data: Buffer, commitment: string): boolean {
  try {
    const computedCommitment = crypto
      .createHash('sha256')
      .update(data)
      .digest('base64');

    const isValid = computedCommitment === commitment;

    logger.info('Commitment verification', {
      valid: isValid,
      computed: computedCommitment.substring(0, 16) + '...',
      expected: commitment.substring(0, 16) + '...',
    });

    return isValid;
  } catch (error: any) {
    logger.error('Commitment verification failed', {
      error: error.message,
    });
    return false;
  }
}

/**
 * Batch verify multiple proofs
 */
export function batchVerifyProofs(
  proofs: Array<{
    blobId: string;
    height: number;
    namespace: string;
    commitment: string;
    proof: CelestiaProof;
    merkleRoot?: string;
  }>
): VerifiedProof[] {
  logger.info('Batch verifying proofs', {
    count: proofs.length,
  });

  const results = proofs.map((p) =>
    verifyDataAvailabilityProof(
      p.blobId,
      p.height,
      p.namespace,
      p.commitment,
      p.proof,
      p.merkleRoot
    )
  );

  const validCount = results.filter((r) => r.valid).length;

  logger.info('Batch verification complete', {
    total: results.length,
    valid: validCount,
    invalid: results.length - validCount,
  });

  return results;
}

/**
 * Generate proof summary for logging/monitoring
 */
export interface ProofSummary {
  blobId: string;
  height: number;
  namespace: string;
  verified: boolean;
  proofSize: number;
  timestamp: number;
}

export function generateProofSummary(
  verifiedProof: VerifiedProof,
  proofSize: number
): ProofSummary {
  return {
    blobId: verifiedProof.blobId,
    height: verifiedProof.height,
    namespace: verifiedProof.namespace,
    verified: verifiedProof.valid,
    proofSize,
    timestamp: Date.now(),
  };
}
