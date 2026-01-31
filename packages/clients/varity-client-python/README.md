# Varity Python Client

boto3-compatible client library for Varity's decentralized storage infrastructure.

## Features

- **boto3 Compatible**: Drop-in replacement for boto3 S3 client
- **Decentralized Storage**: Built on Filecoin/IPFS infrastructure
- **Lit Protocol Encryption**: All data encrypted at rest
- **Multiple Networks**: Support for Arbitrum Sepolia and Arbitrum One
- **Type Hints**: Full type annotations for better IDE support
- **Stream Support**: Efficient handling of large files
- **Presigned URLs**: Generate temporary access URLs

## Installation

```bash
pip install varity-client
```

## Quick Start

```python
from varity import VarityS3Client

client = VarityS3Client(
    aws_access_key_id='YOUR_ACCESS_KEY',
    aws_secret_access_key='YOUR_SECRET_KEY',
    endpoint='http://localhost:3001',
    network='arbitrum-sepolia'
)

# Upload a file
client.put_object('my-bucket', 'hello.txt', b'Hello, Varity!')

# Download a file
response = client.get_object('my-bucket', 'hello.txt')
content = response['Body'].read()
print(content)  # b'Hello, Varity!'
```

## Configuration Options

```python
client = VarityS3Client(
    # AWS-compatible credentials
    aws_access_key_id='YOUR_ACCESS_KEY',
    aws_secret_access_key='YOUR_SECRET_KEY',

    # Gateway endpoint
    endpoint='http://localhost:3001',

    # Network selection
    network='arbitrum-sepolia',  # or 'arbitrum-one'

    # Storage backend
    storage_backend='filecoin-ipfs',  # or 'filecoin-lighthouse'

    # Enable/disable encryption
    encryption_enabled=True,

    # AWS region (for compatibility)
    region='us-east-1'
)
```

## API Reference

### Bucket Operations

```python
# Create bucket
client.create_bucket('my-bucket')

# List buckets
response = client.list_buckets()
buckets = response['Buckets']

# Delete bucket
client.delete_bucket('my-bucket')
```

### Object Operations

```python
# Upload object
client.put_object(
    bucket='my-bucket',
    key='file.txt',
    body=b'content',
    content_type='text/plain',
    metadata={'key': 'value'}
)

# Download object
response = client.get_object('my-bucket', 'file.txt')
content = response['Body'].read()

# Get object metadata
response = client.head_object('my-bucket', 'file.txt')
metadata = response['Metadata']

# List objects
response = client.list_objects('my-bucket', prefix='folder/', max_keys=100)
objects = response['Contents']

# Copy object
client.copy_object(
    source_bucket='my-bucket',
    source_key='file.txt',
    dest_bucket='my-bucket',
    dest_key='file-copy.txt'
)

# Delete object
client.delete_object('my-bucket', 'file.txt')
```

### File System Operations

```python
# Upload from file
client.upload_file(
    file_path='/path/to/file.txt',
    bucket='my-bucket',
    key='uploaded.txt',
    metadata={'source': 'filesystem'}
)

# Download to file
client.download_file(
    bucket='my-bucket',
    key='uploaded.txt',
    file_path='/path/to/download.txt'
)
```

### Stream Operations

```python
from io import BytesIO

# Upload from stream
stream = BytesIO(b'stream content')
client.upload_fileobj(stream, 'my-bucket', 'stream.txt')

# Download to stream
stream = BytesIO()
client.download_fileobj('my-bucket', 'stream.txt', stream)
content = stream.getvalue()
```

### Presigned URLs

```python
# Generate presigned URL for upload
url = client.generate_presigned_url(
    operation='put_object',
    bucket='my-bucket',
    key='file.txt',
    expires_in=3600  # 1 hour
)

# Generate presigned URL for download
url = client.generate_presigned_url(
    operation='get_object',
    bucket='my-bucket',
    key='file.txt',
    expires_in=3600
)
```

### Context Manager

```python
with VarityS3Client(
    aws_access_key_id='key',
    aws_secret_access_key='secret'
) as client:
    client.put_object('my-bucket', 'file.txt', b'content')
```

## Examples

See the [examples](./examples) directory for comprehensive usage examples:

- Basic client initialization
- Upload and download operations
- Bucket management
- Presigned URLs
- File system operations
- Stream operations
- Metadata handling
- Network configuration

Run examples:
```bash
python examples/usage.py
```

## Testing

```bash
# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest tests/ -v

# Run tests with coverage
pytest tests/ --cov=varity --cov-report=html

# Run specific test
pytest tests/test_client.py::TestObjectOperations::test_put_object -v
```

## Gateway Requirements

This client requires a running Varity S3 gateway. Start the gateway:

```bash
cd ../varity-s3-gateway
npm start
```

Default gateway endpoints:
- **S3 Gateway**: http://localhost:3001
- **GCS Gateway**: http://localhost:8080

## Architecture

The Varity client provides:

1. **Storage Layer**: Filecoin/IPFS distributed storage
2. **Encryption Layer**: Lit Protocol encryption at rest
3. **Data Availability**: Celestia DA with ZK proofs
4. **Blockchain Layer**: Arbitrum L3 settlement
5. **Privacy**: 5-layer privacy architecture

## License

MIT
