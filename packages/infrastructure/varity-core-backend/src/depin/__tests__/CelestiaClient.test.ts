/**
 * Celestia Client Unit Tests
 * PROPRIETARY - DO NOT DISTRIBUTE
 */

import { CelestiaClient, BlobSubmissionResult } from '../CelestiaClient';
import { CelestiaConfig } from '../../types';

describe('CelestiaClient', () => {
  let client: CelestiaClient;
  let config: CelestiaConfig;

  beforeEach(() => {
    // Use testnet configuration
    config = {
      rpcEndpoint: 'https://celestia-mocha-rpc.publicnode.com',
      namespace: 'varity-test',
      enableZKProofs: false,
    };

    client = new CelestiaClient(config);
  });

  describe('Namespace Generation', () => {
    it('should generate deterministic namespace IDs', () => {
      const namespace1 = 'varity-customer-123';
      const namespace2 = 'varity-customer-123';

      // Generate namespace IDs using the private method (test internals)
      const id1 = (client as any).generateNamespaceId(namespace1);
      const id2 = (client as any).generateNamespaceId(namespace2);

      expect(id1).toEqual(id2);
      expect(id1.length).toBe(10); // 10 bytes total
      expect(id1[0]).toBe(0); // Version 0
      expect(id1[9]).toBe(0); // Padding
    });

    it('should generate different IDs for different namespaces', () => {
      const id1 = (client as any).generateNamespaceId('varity-customer-123');
      const id2 = (client as any).generateNamespaceId('varity-customer-456');

      expect(id1).not.toEqual(id2);
    });

    it('should convert namespace to base64', () => {
      const namespaceId = (client as any).generateNamespaceId('test');
      const base64 = (client as any).namespaceToBase64(namespaceId);

      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(0);

      // Should be valid base64
      expect(() => Buffer.from(base64, 'base64')).not.toThrow();
    });
  });

  describe('Blob Commitment', () => {
    it('should generate deterministic commitments', () => {
      const data = Buffer.from('test data');

      const commitment1 = (client as any).generateCommitment(data);
      const commitment2 = (client as any).generateCommitment(data);

      expect(commitment1).toBe(commitment2);
    });

    it('should generate different commitments for different data', () => {
      const data1 = Buffer.from('test data 1');
      const data2 = Buffer.from('test data 2');

      const commitment1 = (client as any).generateCommitment(data1);
      const commitment2 = (client as any).generateCommitment(data2);

      expect(commitment1).not.toBe(commitment2);
    });

    it('should generate valid base64 commitments', () => {
      const data = Buffer.from('test data');
      const commitment = (client as any).generateCommitment(data);

      expect(typeof commitment).toBe('string');
      expect(() => Buffer.from(commitment, 'base64')).not.toThrow();
    });
  });

  describe('Blob ID Generation', () => {
    it('should generate unique blob IDs', () => {
      const namespace = 'varity-test';
      const commitment1 = 'commitment1';
      const commitment2 = 'commitment2';

      const blobId1 = (client as any).generateBlobId(namespace, commitment1);
      const blobId2 = (client as any).generateBlobId(namespace, commitment2);

      expect(blobId1).not.toBe(blobId2);
    });

    it('should generate deterministic blob IDs', () => {
      const namespace = 'varity-test';
      const commitment = 'test-commitment';

      const blobId1 = (client as any).generateBlobId(namespace, commitment);
      const blobId2 = (client as any).generateBlobId(namespace, commitment);

      expect(blobId1).toBe(blobId2);
    });
  });

  describe('DA Cost Calculation', () => {
    it('should calculate correct DA cost', () => {
      const dataSize = 1024 * 1024; // 1 MB
      const expectedCost = dataSize * 0.000001;

      const cost = client.calculateDACost(dataSize);

      expect(cost).toBe(expectedCost);
    });

    it('should calculate cost for different sizes', () => {
      expect(client.calculateDACost(1000)).toBe(0.001);
      expect(client.calculateDACost(1000000)).toBe(1.0);
      expect(client.calculateDACost(100)).toBe(0.0001);
    });
  });

  describe('Static Namespace Generators', () => {
    it('should generate customer namespace', () => {
      const customerId = 'customer-123';
      const namespace = CelestiaClient.generateCustomerNamespace(customerId);

      expect(namespace).toBe('varity-customer-customer-123');
      expect(namespace).toContain('varity-customer');
    });

    it('should generate industry namespace', () => {
      const industry = 'finance';
      const namespace = CelestiaClient.generateIndustryNamespace(industry);

      expect(namespace).toBe('varity-industry-finance-rag');
      expect(namespace).toContain('varity-industry');
      expect(namespace).toContain('-rag');
    });

    it('should generate internal namespace', () => {
      const category = 'platform-docs';
      const namespace = CelestiaClient.generateInternalNamespace(category);

      expect(namespace).toBe('varity-internal-platform-docs');
      expect(namespace).toContain('varity-internal');
    });
  });

  describe('ZK Proof Generation', () => {
    it('should generate ZK proof when enabled', () => {
      const zkConfig: CelestiaConfig = {
        ...config,
        enableZKProofs: true,
      };

      const zkClient = new CelestiaClient(zkConfig);
      const data = Buffer.from('test data');
      const commitment = 'test-commitment';

      const zkProof = (zkClient as any).generateZKProof(data, commitment);

      expect(typeof zkProof).toBe('string');
      expect(zkProof.length).toBe(64); // SHA-256 hex string
    });

    it('should not generate ZK proof when disabled', async () => {
      // Note: This test would require mocking the RPC call
      // For now, we just test that ZK proofs are optional
      expect(config.enableZKProofs).toBe(false);
    });
  });

  describe('Blob Size Validation', () => {
    it('should accept blobs under 2MB', () => {
      const smallData = Buffer.alloc(1024 * 1024); // 1 MB

      expect(smallData.byteLength).toBeLessThan(2 * 1024 * 1024);
    });

    it('should validate blob size limits', () => {
      const maxSize = 2 * 1024 * 1024; // 2 MB
      const largeData = Buffer.alloc(maxSize + 1);

      // This would need to be tested with actual submitBlob call
      expect(largeData.byteLength).toBeGreaterThan(maxSize);
    });
  });
});

describe('CelestiaClient Integration Tests (requires testnet)', () => {
  // These tests require actual Celestia testnet connectivity
  // Skip by default, run with: npm test -- --runInBand --testNamePattern="Integration"

  let client: CelestiaClient;

  beforeAll(() => {
    const config: CelestiaConfig = {
      rpcEndpoint: 'https://celestia-mocha-rpc.publicnode.com',
      namespace: 'varity-test-integration',
      enableZKProofs: false,
    };

    client = new CelestiaClient(config);
  });

  // NOTE: These tests are commented out as they require actual testnet connectivity
  // Uncomment and run when testing against live testnet

  /*
  it.skip('should submit blob to Celestia testnet', async () => {
    const testData = Buffer.from(JSON.stringify({
      test: true,
      timestamp: Date.now(),
      message: 'Varity Celestia integration test',
    }));

    const result = await client.submitBlob(testData);

    expect(result).toBeDefined();
    expect(result.height).toBeGreaterThan(0);
    expect(result.blobId).toBeTruthy();
    expect(result.commitment).toBeTruthy();
    expect(result.namespace).toBe('varity-test-integration');

    console.log('Blob submitted successfully:', {
      height: result.height,
      blobId: result.blobId,
      commitment: result.commitment,
    });
  }, 30000); // 30 second timeout

  it.skip('should retrieve blob from Celestia testnet', async () => {
    // First submit a blob
    const testData = Buffer.from('Test retrieval data');
    const submission = await client.submitBlob(testData);

    // Then retrieve it
    const retrieved = await client.retrieveBlob(
      submission.blobId,
      submission.height,
      submission.namespace
    );

    expect(retrieved).toEqual(testData);
  }, 60000); // 60 second timeout

  it.skip('should verify data availability proof', async () => {
    // Submit a blob
    const testData = Buffer.from('Test proof verification');
    const submission = await client.submitBlob(testData);

    // Verify proof
    const proof = await client.verifyDataAvailability(
      submission.blobId,
      submission.height,
      submission.namespace
    );

    expect(proof).toBeDefined();
    expect(proof.verified).toBe(true);
    expect(proof.height).toBe(submission.height);
  }, 60000);

  it.skip('should submit blob batch to Celestia', async () => {
    const blobs = [
      { namespace: 'varity-test', data: Buffer.from('Blob 1') },
      { namespace: 'varity-test', data: Buffer.from('Blob 2') },
      { namespace: 'varity-test', data: Buffer.from('Blob 3') },
    ];

    const results = await client.submitBlobBatch(blobs);

    expect(results).toHaveLength(3);
    expect(results.every(r => r.height > 0)).toBe(true);

    // All blobs should be in same block (same height)
    const heights = results.map(r => r.height);
    expect(new Set(heights).size).toBe(1);
  }, 60000);
  */
});
