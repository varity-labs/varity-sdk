import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * E2E tests using AWS CLI
 * These tests verify S3 Gateway compatibility with real AWS CLI commands
 *
 * Prerequisites:
 * - AWS CLI installed (`aws --version`)
 * - S3 Gateway server running on port 3001
 * - Test credentials configured
 *
 * To run these tests:
 * 1. Start the S3 Gateway: npm run dev
 * 2. Run tests: npm test -- tests/e2e/aws-cli.test.ts
 */

const ENDPOINT_URL = process.env.S3_ENDPOINT_URL || 'http://localhost:3001';
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
const TEST_BUCKET = 'aws-cli-test-bucket';
const TEST_FILE = path.join(__dirname, 'test-file.txt');

// Skip these tests if AWS CLI is not installed or server is not running
const describeIfAwsCli = process.env.SKIP_E2E_TESTS ? describe.skip : describe;

describeIfAwsCli('AWS CLI E2E Tests', () => {
  let awsCliAvailable = false;
  let serverAvailable = false;

  beforeAll(async () => {
    // Check if AWS CLI is available
    try {
      await execAsync('aws --version');
      awsCliAvailable = true;
      console.log('AWS CLI detected');
    } catch (error) {
      console.warn('AWS CLI not found. Skipping E2E tests. Install AWS CLI to run these tests.');
    }

    // Check if server is running
    try {
      const response = await fetch(ENDPOINT_URL);
      serverAvailable = true;
      console.log('S3 Gateway server detected at', ENDPOINT_URL);
    } catch (error) {
      console.warn('S3 Gateway not running at', ENDPOINT_URL, '. Start server with "npm run dev" to run these tests.');
    }

    // Create test file
    if (awsCliAvailable && serverAvailable) {
      fs.writeFileSync(TEST_FILE, 'AWS CLI E2E Test Content\nLine 2\nLine 3');
    }
  });

  afterAll(async () => {
    // Cleanup
    if (awsCliAvailable && serverAvailable) {
      try {
        // Delete test bucket and all objects
        await runAwsCommand(`s3 rb s3://${TEST_BUCKET} --force`);
      } catch (error) {
        // Ignore errors
      }

      // Remove test file
      if (fs.existsSync(TEST_FILE)) {
        fs.unlinkSync(TEST_FILE);
      }
    }
  });

  describe('Prerequisites', () => {
    it('should have AWS CLI installed', () => {
      expect(awsCliAvailable).toBe(true);
    });

    it('should have S3 Gateway server running', () => {
      expect(serverAvailable).toBe(true);
    });
  });

  describe('Bucket operations', () => {
    it('should create bucket with aws s3 mb', async () => {
      if (!awsCliAvailable || !serverAvailable) {
        console.log('Skipping: AWS CLI or server not available');
        return;
      }

      const result = await runAwsCommand(`s3 mb s3://${TEST_BUCKET}`);
      expect(result.stdout).toContain('make_bucket');
    });

    it('should list buckets with aws s3 ls', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      const result = await runAwsCommand('s3 ls');
      // May contain the test bucket
      expect(result.exitCode).toBe(0);
    });

    it('should check bucket exists with aws s3api head-bucket', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      const result = await runAwsCommand(`s3api head-bucket --bucket ${TEST_BUCKET}`);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Object operations', () => {
    it('should upload file with aws s3 cp', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      const result = await runAwsCommand(`s3 cp ${TEST_FILE} s3://${TEST_BUCKET}/test-upload.txt`);
      expect(result.stdout).toContain('upload');
    });

    it('should list objects with aws s3 ls', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      const result = await runAwsCommand(`s3 ls s3://${TEST_BUCKET}/`);
      expect(result.stdout).toContain('test-upload.txt');
    });

    it('should download file with aws s3 cp', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      const downloadPath = path.join(__dirname, 'downloaded-file.txt');

      try {
        const result = await runAwsCommand(`s3 cp s3://${TEST_BUCKET}/test-upload.txt ${downloadPath}`);
        expect(result.stdout).toContain('download');

        // Verify file content
        const content = fs.readFileSync(downloadPath, 'utf8');
        expect(content).toContain('AWS CLI E2E Test Content');
      } finally {
        // Cleanup
        if (fs.existsSync(downloadPath)) {
          fs.unlinkSync(downloadPath);
        }
      }
    });

    it('should get object metadata with aws s3api head-object', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      const result = await runAwsCommand(
        `s3api head-object --bucket ${TEST_BUCKET} --key test-upload.txt`
      );

      expect(result.stdout).toContain('ETag');
      expect(result.stdout).toContain('ContentType');
    });

    it('should copy object with aws s3 cp', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      const result = await runAwsCommand(
        `s3 cp s3://${TEST_BUCKET}/test-upload.txt s3://${TEST_BUCKET}/test-copy.txt`
      );

      expect(result.stdout).toContain('copy');
    });

    it('should delete object with aws s3 rm', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      const result = await runAwsCommand(`s3 rm s3://${TEST_BUCKET}/test-copy.txt`);
      expect(result.stdout).toContain('delete');
    });
  });

  describe('Advanced S3 API operations', () => {
    it('should upload with metadata using aws s3api put-object', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      const result = await runAwsCommand(
        `s3api put-object --bucket ${TEST_BUCKET} --key metadata-test.txt ` +
        `--body ${TEST_FILE} --metadata author=TestAuthor,version=1.0`
      );

      expect(result.stdout).toContain('ETag');
    });

    it('should list objects with prefix using aws s3api list-objects-v2', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      // Upload a few files with prefix
      await runAwsCommand(`s3 cp ${TEST_FILE} s3://${TEST_BUCKET}/prefix/file1.txt`);
      await runAwsCommand(`s3 cp ${TEST_FILE} s3://${TEST_BUCKET}/prefix/file2.txt`);

      const result = await runAwsCommand(
        `s3api list-objects-v2 --bucket ${TEST_BUCKET} --prefix prefix/`
      );

      expect(result.stdout).toContain('prefix/file1.txt');
      expect(result.stdout).toContain('prefix/file2.txt');
    });

    it('should support conditional get with if-match', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      // Get object metadata to get ETag
      const headResult = await runAwsCommand(
        `s3api head-object --bucket ${TEST_BUCKET} --key test-upload.txt`
      );

      // Extract ETag from output
      const etagMatch = headResult.stdout.match(/"ETag":\s*"([^"]+)"/);
      if (etagMatch) {
        const etag = etagMatch[1];

        // Try conditional get
        const result = await runAwsCommand(
          `s3api get-object --bucket ${TEST_BUCKET} --key test-upload.txt ` +
          `--if-match ${etag} /tmp/conditional-test.txt`
        );

        expect(result.exitCode).toBe(0);
      }
    });
  });

  describe('Batch operations', () => {
    it('should sync directory to bucket', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      // Create temp directory with files
      const tempDir = path.join(__dirname, 'temp-sync');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      try {
        fs.writeFileSync(path.join(tempDir, 'file1.txt'), 'Content 1');
        fs.writeFileSync(path.join(tempDir, 'file2.txt'), 'Content 2');

        const result = await runAwsCommand(`s3 sync ${tempDir} s3://${TEST_BUCKET}/sync-test/`);
        expect(result.stdout).toContain('upload');
      } finally {
        // Cleanup
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }
    });

    it('should handle multiple files with aws s3 mv', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      // Upload a file
      await runAwsCommand(`s3 cp ${TEST_FILE} s3://${TEST_BUCKET}/move-source.txt`);

      // Move it
      const result = await runAwsCommand(
        `s3 mv s3://${TEST_BUCKET}/move-source.txt s3://${TEST_BUCKET}/move-dest.txt`
      );

      expect(result.stdout).toContain('move');
    });
  });

  describe('Error handling', () => {
    it('should handle non-existent bucket', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      try {
        await runAwsCommand('s3 ls s3://non-existent-bucket-12345/');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.stderr || error.message).toContain('NoSuchBucket');
      }
    });

    it('should handle non-existent object', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      try {
        await runAwsCommand(
          `s3api head-object --bucket ${TEST_BUCKET} --key non-existent-file.txt`
        );
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.stderr || error.message).toMatch(/NotFound|NoSuchKey/);
      }
    });

    it('should handle invalid bucket name', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      try {
        await runAwsCommand('s3 mb s3://INVALID-BUCKET-NAME');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.stderr || error.message).toMatch(/InvalidBucketName|validation/);
      }
    });
  });

  describe('Performance', () => {
    it('should handle large file upload', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      const largefile = path.join(__dirname, 'large-file.bin');

      try {
        // Create 10MB file
        const buffer = Buffer.alloc(10 * 1024 * 1024);
        fs.writeFileSync(largefile, buffer);

        const result = await runAwsCommand(`s3 cp ${largefile} s3://${TEST_BUCKET}/large-file.bin`);
        expect(result.stdout).toContain('upload');
      } finally {
        if (fs.existsSync(largefile)) {
          fs.unlinkSync(largefile);
        }
      }
    }, 60000); // 60 second timeout

    it('should handle concurrent uploads', async () => {
      if (!awsCliAvailable || !serverAvailable) return;

      const promises = Array.from({ length: 5 }, (_, i) =>
        runAwsCommand(`s3 cp ${TEST_FILE} s3://${TEST_BUCKET}/concurrent-${i}.txt`)
      );

      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result.stdout).toContain('upload');
      });
    }, 30000);
  });
});

/**
 * Helper function to run AWS CLI command
 */
async function runAwsCommand(command: string): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  const fullCommand = `aws ${command} --endpoint-url ${ENDPOINT_URL} ` +
    `--region us-east-1 ` +
    `--output json`;

  const env = {
    ...process.env,
    AWS_ACCESS_KEY_ID: AWS_ACCESS_KEY,
    AWS_SECRET_ACCESS_KEY: AWS_SECRET_KEY
  };

  try {
    const { stdout, stderr } = await execAsync(fullCommand, { env });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    throw {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.code || 1,
      message: error.message
    };
  }
}
