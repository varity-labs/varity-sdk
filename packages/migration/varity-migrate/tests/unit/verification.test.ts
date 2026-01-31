import { Verifier } from '../../src/utils/verification';
import { MigrationResult } from '../../src/types';

describe('Verifier', () => {
  let verifier: Verifier;

  beforeEach(() => {
    verifier = new Verifier();
  });

  describe('calculateHash', () => {
    it('should calculate SHA-256 hash of data', () => {
      const data = Buffer.from('test data');
      const hash = verifier.calculateHash(data);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // SHA-256 hex string length
    });

    it('should produce consistent hashes for same data', () => {
      const data = Buffer.from('test data');
      const hash1 = verifier.calculateHash(data);
      const hash2 = verifier.calculateHash(data);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different data', () => {
      const data1 = Buffer.from('test data 1');
      const data2 = Buffer.from('test data 2');
      const hash1 = verifier.calculateHash(data1);
      const hash2 = verifier.calculateHash(data2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyIntegrity', () => {
    it('should return valid for matching hashes', async () => {
      const hash = 'abc123';
      const result = await verifier.verifyIntegrity(hash, hash, 'test.txt');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for mismatched hashes', async () => {
      const result = await verifier.verifyIntegrity('hash1', 'hash2', 'test.txt');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Hash mismatch');
      expect(result.error).toContain('test.txt');
    });
  });

  describe('verifyBatch', () => {
    it('should verify batch of successful results', async () => {
      const results: MigrationResult[] = [
        {
          key: 'file1.txt',
          success: true,
          sourceHash: 'hash1',
          targetHash: 'hash1'
        },
        {
          key: 'file2.txt',
          success: true,
          sourceHash: 'hash2',
          targetHash: 'hash2'
        },
        {
          key: 'file3.txt',
          success: true,
          sourceHash: 'hash3',
          targetHash: 'hash3'
        }
      ];

      const verification = await verifier.verifyBatch(results);

      expect(verification.totalVerified).toBe(3);
      expect(verification.successful).toBe(3);
      expect(verification.failed).toBe(0);
      expect(verification.errors.length).toBe(0);
    });

    it('should detect hash mismatches', async () => {
      const results: MigrationResult[] = [
        {
          key: 'file1.txt',
          success: true,
          sourceHash: 'hash1',
          targetHash: 'hash1'
        },
        {
          key: 'file2.txt',
          success: true,
          sourceHash: 'hash2',
          targetHash: 'different_hash'
        }
      ];

      const verification = await verifier.verifyBatch(results);

      expect(verification.totalVerified).toBe(2);
      expect(verification.successful).toBe(1);
      expect(verification.failed).toBe(1);
      expect(verification.errors.length).toBe(1);
      expect(verification.errors[0].key).toBe('file2.txt');
    });

    it('should count failed migrations', async () => {
      const results: MigrationResult[] = [
        {
          key: 'file1.txt',
          success: true,
          sourceHash: 'hash1',
          targetHash: 'hash1'
        },
        {
          key: 'file2.txt',
          success: false,
          error: 'Upload failed'
        }
      ];

      const verification = await verifier.verifyBatch(results);

      expect(verification.totalVerified).toBe(2);
      expect(verification.successful).toBe(1);
      expect(verification.failed).toBe(1);
      expect(verification.errors.length).toBe(1);
    });

    it('should handle results without hashes', async () => {
      const results: MigrationResult[] = [
        {
          key: 'file1.txt',
          success: true
        }
      ];

      const verification = await verifier.verifyBatch(results);

      expect(verification.totalVerified).toBe(1);
      expect(verification.successful).toBe(1);
      expect(verification.failed).toBe(0);
    });
  });

  describe('generateVerificationReport', () => {
    it('should generate report for successful migration', () => {
      const results: MigrationResult[] = [
        { key: 'file1.txt', success: true },
        { key: 'file2.txt', success: true },
        { key: 'file3.txt', success: true }
      ];

      const report = verifier.generateVerificationReport(results);

      expect(report).toContain('Total Objects: 3');
      expect(report).toContain('Successful: 3');
      expect(report).toContain('Failed: 0');
      expect(report).toContain('100.00%');
    });

    it('should generate report with failures', () => {
      const results: MigrationResult[] = [
        { key: 'file1.txt', success: true },
        { key: 'file2.txt', success: false, error: 'Upload failed' },
        { key: 'file3.txt', success: false, error: 'Connection timeout' }
      ];

      const report = verifier.generateVerificationReport(results);

      expect(report).toContain('Total Objects: 3');
      expect(report).toContain('Successful: 1');
      expect(report).toContain('Failed: 2');
      expect(report).toContain('file2.txt');
      expect(report).toContain('Upload failed');
      expect(report).toContain('file3.txt');
      expect(report).toContain('Connection timeout');
    });
  });
});
