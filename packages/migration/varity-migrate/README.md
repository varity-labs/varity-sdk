# @varity/migrate

> **Note:** This standalone CLI is being integrated into VarietyKit. For the best experience, use `varietykit migrate` instead of `varity-migrate`. See [VarietyKit CLI](../../cli/README.md) for details.

Varity Migration CLI Tool - Seamlessly migrate data from AWS S3 or Google Cloud Storage to Varity's decentralized infrastructure with comprehensive blockchain chain verification.

## Recommended Usage

We recommend using the unified VarietyKit CLI which includes all migration commands:

```bash
# Install VarietyKit
pip install varietykit

# Use migrate commands
varietykit migrate s3 --bucket my-bucket
varietykit migrate gcs --bucket my-bucket
varietykit migrate status --job-id abc123
```

This README documents the standalone `@varity/migrate` package, which continues to work but is now also available through VarietyKit for a unified developer experience.

## Features

### Data Migration
- **Multi-Cloud Support**: Migrate from AWS S3 or Google Cloud Storage
- **Progress Tracking**: Real-time progress bars with speed indicators
- **Resume Capability**: Automatically resume interrupted migrations from checkpoints
- **Data Integrity**: SHA-256 hash verification for all transfers
- **Cost Estimation**: Calculate savings compared to traditional cloud storage
- **Concurrent Transfers**: Configurable concurrency for optimal performance
- **Dry Run Mode**: Test migration without actual data transfer
- **Error Handling**: Robust error tracking and recovery

### Blockchain Verification (NEW)
- **Chain Verification**: Verify RPC connectivity and chain configuration
- **Contract Compatibility**: Check smart contract deployability across chains
- **USDC 6-Decimal Support**: Varity L3 uses USDC (6 decimals) for gas
- **Pre-Flight Checks**: Comprehensive validation before migration
- **Migration Reports**: Detailed compatibility and cost analysis
- **7 Supported Chains**: Ethereum, Arbitrum, Polygon, Base, Optimism, and more
- **Gas Cost Estimation**: Calculate migration costs in native tokens

## Installation

```bash
npm install -g @varity/migrate
```

Or install locally in your project:

```bash
npm install @varity/migrate
```

## Quick Start

### Migrate from AWS S3

```bash
varity-migrate s3 \
  --bucket my-s3-bucket \
  --region us-east-1 \
  --target-layer customer-data \
  --concurrency 10 \
  --verify
```

### Migrate from Google Cloud Storage

```bash
varity-migrate gcs \
  --bucket my-gcs-bucket \
  --project my-project-id \
  --target-layer customer-data \
  --concurrency 10 \
  --verify
```

### Blockchain Chain Verification

```bash
# Verify chain connectivity
varity migrate verify-chain --source-chain 1

# Run pre-flight checks
varity migrate preflight \
  --source-chain 1 \
  --wallet 0xYourWalletAddress

# Generate migration report
varity migrate report \
  --source-chain 1 \
  --contracts 0xContract1,0xContract2 \
  --format markdown \
  --output report.md

# List supported chains
varity migrate chains
```

### Check Migration Status

```bash
varity-migrate status --job-id <job-id>
```

### Verify Migration Integrity

```bash
varity-migrate verify --job-id <job-id>
```

## Commands

### `s3` - Migrate from AWS S3

Migrate data from an AWS S3 bucket to Varity infrastructure.

**Options:**
- `--bucket <bucket>` (required): Source S3 bucket name
- `--prefix <prefix>` (optional): Object prefix filter (e.g., "data/")
- `--region <region>` (optional): AWS region (default: "us-east-1")
- `--target-layer <layer>` (optional): Varity storage layer (default: "customer-data")
- `--concurrency <n>` (optional): Concurrent transfers (default: 10)
- `--dry-run` (optional): Simulate migration without transferring data
- `--verify` (optional): Verify all transfers using hash comparison

**Example:**
```bash
varity-migrate s3 \
  --bucket production-data \
  --prefix backups/ \
  --region us-west-2 \
  --concurrency 20 \
  --verify
```

### `gcs` - Migrate from Google Cloud Storage

Migrate data from a Google Cloud Storage bucket to Varity infrastructure.

**Options:**
- `--bucket <bucket>` (required): Source GCS bucket name
- `--prefix <prefix>` (optional): Object prefix filter
- `--project <project>` (optional): GCP project ID
- `--target-layer <layer>` (optional): Varity storage layer (default: "customer-data")
- `--concurrency <n>` (optional): Concurrent transfers (default: 10)
- `--dry-run` (optional): Simulate migration without transferring data
- `--verify` (optional): Verify all transfers using hash comparison

**Example:**
```bash
varity-migrate gcs \
  --bucket production-data \
  --project my-gcp-project \
  --prefix data/ \
  --concurrency 15 \
  --verify
```

### `status` - Check Migration Status

Check the status of a migration job.

**Options:**
- `--job-id <id>` (required): Migration job ID

**Example:**
```bash
varity-migrate status --job-id 550e8400-e29b-41d4-a716-446655440000
```

**Output:**
```
=== Migration Job Status ===
Job ID: 550e8400-e29b-41d4-a716-446655440000
Source: aws-s3
Target: varity-filecoin
Status: COMPLETED

=== Configuration ===
Bucket: production-data
Region: us-east-1
Target Layer: customer-data

=== Progress ===
Total Objects: 1000
Processed: 1000 (100.00%)
Failed: 0
Total Size: 1024.50 MB
Processed Size: 1024.50 MB

=== Timestamps ===
Created: 2024-01-15T10:00:00.000Z
Updated: 2024-01-15T10:30:00.000Z
Completed: 2024-01-15T10:30:00.000Z
Duration: 1800.00 seconds
```

### `verify` - Verify Migration Integrity

Verify the integrity of migrated data by comparing hashes.

**Options:**
- `--job-id <id>` (required): Migration job ID

**Example:**
```bash
varity-migrate verify --job-id 550e8400-e29b-41d4-a716-446655440000
```

## Configuration

### AWS Credentials

The tool uses the AWS SDK, which supports multiple credential methods:

1. **Environment Variables:**
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
```

2. **AWS Credentials File:**
Place credentials in `~/.aws/credentials`

3. **IAM Role:**
If running on EC2, use an IAM role

### Google Cloud Credentials

For GCS migrations, set up authentication:

1. **Service Account Key:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

2. **gcloud CLI:**
```bash
gcloud auth application-default login
```

## Features in Detail

### Resume Capability

If a migration is interrupted, the tool automatically resumes from the last checkpoint:

```bash
# Start migration
varity-migrate s3 --bucket my-bucket --concurrency 10

# If interrupted, simply run the same command again
varity-migrate s3 --bucket my-bucket --concurrency 10
# Will skip already-migrated files
```

### Cost Estimation

The tool automatically calculates and displays cost savings:

```
=== Cost Estimate Report ===
Storage Size: 100.00 GB

Current Monthly Cost: $23.00
Varity Monthly Cost:   $2.25
Monthly Savings:       $20.75 (90.22%)

Annual Savings:        $249.00
3-Year Savings:        $747.00
```

### Data Integrity Verification

Enable verification to ensure data integrity:

```bash
varity-migrate s3 --bucket my-bucket --verify
```

This performs SHA-256 hash comparison for all transferred files.

### Dry Run Mode

Test your migration without actually transferring data:

```bash
varity-migrate s3 --bucket my-bucket --dry-run
```

This is useful for:
- Estimating migration time
- Calculating storage requirements
- Verifying access permissions
- Previewing cost savings

### Progress Tracking

Real-time progress display with:
- Progress bar
- Transfer speed (objects/second)
- ETA (estimated time remaining)
- Current/total objects
- Bandwidth usage

```
Migration Progress |████████████████░░░░| 80% | 800/1000 objects | 15.5 obj/s | ETA: 12s
```

## Storage Layers

Varity uses a 3-layer storage architecture:

### 1. `varity-internal`
- Internal Varity platform data
- Access: Varity admins only
- Use case: Platform documentation, internal tools

### 2. `industry-rag`
- Shared industry knowledge base
- Access: All customers in industry + Varity admins
- Use case: Industry best practices, compliance docs

### 3. `customer-data` (default)
- Customer-specific data
- Access: Single customer only (+ emergency admin)
- Use case: Business data, transactions, documents

Specify the target layer with `--target-layer`:

```bash
varity-migrate s3 --bucket my-bucket --target-layer customer-data
```

## Database

Migration metadata is stored in a SQLite database (`varity-migrate.db`) in the current directory.

This database contains:
- Migration job records
- Progress tracking
- Checkpoints for resume capability
- Error logs

## Error Handling

The tool handles errors gracefully:

1. **Network Errors**: Automatically retries with exponential backoff
2. **Access Errors**: Logs error and continues with remaining files
3. **Verification Failures**: Marks file as failed and includes in report

View errors for a specific job:

```bash
varity-migrate status --job-id <job-id>
```

## Performance Tuning

### Concurrency

Adjust concurrency based on your network and system:

- **Low bandwidth**: `--concurrency 5`
- **Medium bandwidth**: `--concurrency 10` (default)
- **High bandwidth**: `--concurrency 20-50`

### Prefix Filtering

Migrate specific subsets of data:

```bash
varity-migrate s3 --bucket my-bucket --prefix backups/2024/
```

## Use Cases

### 1. Cloud Cost Reduction

Migrate from expensive cloud storage to Varity:

```bash
# Migrate all S3 data
varity-migrate s3 --bucket production-data --verify

# Expected savings: 80-90% on storage costs
```

### 2. Data Archival

Move cold data to long-term decentralized storage:

```bash
# Migrate old backups
varity-migrate s3 --bucket backups --prefix 2023/ --concurrency 5
```

### 3. Multi-Cloud Strategy

Replicate data across providers:

```bash
# Keep copy on Varity alongside cloud storage
varity-migrate s3 --bucket primary-data --verify
```

### 4. Compliance & Privacy

Move sensitive data to privacy-focused infrastructure:

```bash
# Migrate to encrypted decentralized storage
varity-migrate gcs --bucket sensitive-data --target-layer customer-data
```

## Development

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Run Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage
```

### Development Mode

```bash
npm run dev -- s3 --bucket test-bucket --dry-run
```

## Architecture

### Components

- **CLI**: Command-line interface using Commander.js
- **Services**:
  - `S3SourceService`: AWS S3 integration
  - `GCSSourceService`: Google Cloud Storage integration
  - `VarityTargetService`: Varity/IPFS upload
  - `MigrationService`: Migration orchestration
- **Database**: SQLite for job tracking
- **Utilities**:
  - `ProgressTracker`: Real-time progress display
  - `Verifier`: Data integrity verification
  - `CheckpointManager`: Resume capability
  - `CostEstimator`: Cost calculation

### Data Flow

```
Source (S3/GCS) → Download → Hash → Encrypt → IPFS → Verify → Checkpoint
```

## Troubleshooting

### Issue: "Job not found"

**Solution:** Check the job ID is correct:
```bash
varity-migrate status --job-id <correct-job-id>
```

### Issue: "Permission denied"

**Solution:** Verify cloud credentials are configured:
```bash
# AWS
aws s3 ls s3://your-bucket

# GCS
gsutil ls gs://your-bucket
```

### Issue: Slow transfer speeds

**Solution:** Increase concurrency:
```bash
varity-migrate s3 --bucket my-bucket --concurrency 20
```

### Issue: Verification failures

**Solution:** Re-run verification:
```bash
varity-migrate verify --job-id <job-id>
```

## Support

- **Documentation**: https://docs.varity.network
- **Issues**: https://github.com/varity/packages/issues
- **Discord**: https://discord.gg/varity

## License

MIT License - see LICENSE file for details

## Contributing

Contributions welcome! Please see CONTRIBUTING.md for guidelines.

---

**Powered by Varity** - Decentralized Infrastructure for the Modern Web
