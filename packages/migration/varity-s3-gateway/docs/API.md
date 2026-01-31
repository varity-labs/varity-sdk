# Varity S3 Gateway - API Documentation

Complete API reference for the S3-compatible HTTP gateway.

## Base URL

```
http://localhost:3001
```

## Authentication

All API requests (except health check) require AWS Signature Version 4 authentication.

### Headers Required

```http
Authorization: AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20230101/us-east-1/s3/aws4_request, SignedHeaders=host;x-amz-date, Signature=...
x-amz-date: 20230101T000000Z
x-amz-content-sha256: UNSIGNED-PAYLOAD
```

### Credentials

Configure your AWS credentials:

```bash
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

## API Endpoints

### Health Check

#### GET /health

Check server health status (no authentication required).

**Response:**

```json
{
  "status": "healthy",
  "service": "varity-s3-gateway",
  "version": "1.0.0",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

---

## Service Operations

### List Buckets

#### GET /

List all buckets owned by the authenticated user.

**Request:**

```http
GET / HTTP/1.1
Host: localhost:3001
Authorization: AWS4-HMAC-SHA256 ...
x-amz-date: 20230101T000000Z
```

**Response:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ListAllMyBucketsResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Owner>
    <ID>AKIAIOSFODNN7EXAMPLE</ID>
    <DisplayName>AKIAIOSFODNN7EXAMPLE</DisplayName>
  </Owner>
  <Buckets>
    <Bucket>
      <Name>my-bucket</Name>
      <CreationDate>2023-01-01T00:00:00.000Z</CreationDate>
    </Bucket>
  </Buckets>
</ListAllMyBucketsResult>
```

---

## Bucket Operations

### Create Bucket

#### PUT /{bucket}

Create a new bucket.

**Request:**

```http
PUT /my-bucket HTTP/1.1
Host: localhost:3001
Authorization: AWS4-HMAC-SHA256 ...
x-amz-date: 20230101T000000Z
```

**Response:**

```http
HTTP/1.1 200 OK
```

**Error Responses:**

- `400 InvalidBucketName` - Invalid bucket name
- `409 BucketAlreadyExists` - Bucket already exists

---

### Check Bucket Exists

#### HEAD /{bucket}

Check if a bucket exists.

**Request:**

```http
HEAD /my-bucket HTTP/1.1
Host: localhost:3001
Authorization: AWS4-HMAC-SHA256 ...
x-amz-date: 20230101T000000Z
```

**Response:**

```http
HTTP/1.1 200 OK
```

**Error Responses:**

- `404 Not Found` - Bucket does not exist

---

### Delete Bucket

#### DELETE /{bucket}

Delete an empty bucket.

**Request:**

```http
DELETE /my-bucket HTTP/1.1
Host: localhost:3001
Authorization: AWS4-HMAC-SHA256 ...
x-amz-date: 20230101T000000Z
```

**Response:**

```http
HTTP/1.1 204 No Content
```

**Error Responses:**

- `404 NoSuchBucket` - Bucket does not exist

---

### List Objects (V2)

#### GET /{bucket}?list-type=2

List objects in a bucket.

**Query Parameters:**

- `list-type=2` (required) - Use ListObjectsV2 API
- `prefix` (optional) - Filter objects by prefix
- `max-keys` (optional) - Maximum number of keys to return (default: 1000)
- `continuation-token` (optional) - Token for pagination

**Request:**

```http
GET /my-bucket?list-type=2&prefix=docs/&max-keys=100 HTTP/1.1
Host: localhost:3001
Authorization: AWS4-HMAC-SHA256 ...
x-amz-date: 20230101T000000Z
```

**Response:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Name>my-bucket</Name>
  <Prefix>docs/</Prefix>
  <MaxKeys>100</MaxKeys>
  <KeyCount>2</KeyCount>
  <IsTruncated>false</IsTruncated>
  <Contents>
    <Key>docs/file1.txt</Key>
    <LastModified>2023-01-01T00:00:00.000Z</LastModified>
    <ETag>"d41d8cd98f00b204e9800998ecf8427e"</ETag>
    <Size>1024</Size>
    <StorageClass>STANDARD</StorageClass>
  </Contents>
  <Contents>
    <Key>docs/file2.txt</Key>
    <LastModified>2023-01-01T00:00:00.000Z</LastModified>
    <ETag>"098f6bcd4621d373cade4e832627b4f6"</ETag>
    <Size>2048</Size>
    <StorageClass>STANDARD</StorageClass>
  </Contents>
</ListBucketResult>
```

---

## Object Operations

### Upload Object

#### PUT /{bucket}/{key}

Upload an object to a bucket.

**Headers:**

- `Content-Type` - MIME type of the object
- `Content-Length` - Size of the object
- `x-amz-meta-*` - Custom metadata (optional)

**Request:**

```http
PUT /my-bucket/docs/file.txt HTTP/1.1
Host: localhost:3001
Authorization: AWS4-HMAC-SHA256 ...
x-amz-date: 20230101T000000Z
Content-Type: text/plain
Content-Length: 13
x-amz-meta-author: John Doe

Hello, World!
```

**Response:**

```http
HTTP/1.1 200 OK
ETag: "6cd3556deb0da54bca060b4c39479839"
x-amz-request-id: 1234567890-abcdef
x-amz-version-id: QmYwAPJzv5CZsnAzt8auVZRn8cpMaFMyL53cV7bG5aL2Xu
```

**Error Responses:**

- `404 NoSuchBucket` - Bucket does not exist

---

### Download Object

#### GET /{bucket}/{key}

Download an object from a bucket.

**Headers (Optional):**

- `If-Match` - Only return if ETag matches
- `If-None-Match` - Only return if ETag doesn't match
- `Range` - Download specific byte range

**Request:**

```http
GET /my-bucket/docs/file.txt HTTP/1.1
Host: localhost:3001
Authorization: AWS4-HMAC-SHA256 ...
x-amz-date: 20230101T000000Z
```

**Response:**

```http
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 13
ETag: "6cd3556deb0da54bca060b4c39479839"
Last-Modified: Sun, 01 Jan 2023 00:00:00 GMT
x-amz-meta-author: John Doe

Hello, World!
```

**Error Responses:**

- `404 NoSuchBucket` - Bucket does not exist
- `404 NoSuchKey` - Object does not exist
- `304 Not Modified` - Object not modified (If-None-Match)
- `412 Precondition Failed` - Precondition failed (If-Match)

---

### Get Object Metadata

#### HEAD /{bucket}/{key}

Get object metadata without downloading the object.

**Request:**

```http
HEAD /my-bucket/docs/file.txt HTTP/1.1
Host: localhost:3001
Authorization: AWS4-HMAC-SHA256 ...
x-amz-date: 20230101T000000Z
```

**Response:**

```http
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 13
ETag: "6cd3556deb0da54bca060b4c39479839"
Last-Modified: Sun, 01 Jan 2023 00:00:00 GMT
x-amz-meta-author: John Doe
```

**Error Responses:**

- `404 Not Found` - Object does not exist

---

### Delete Object

#### DELETE /{bucket}/{key}

Delete an object from a bucket.

**Request:**

```http
DELETE /my-bucket/docs/file.txt HTTP/1.1
Host: localhost:3001
Authorization: AWS4-HMAC-SHA256 ...
x-amz-date: 20230101T000000Z
```

**Response:**

```http
HTTP/1.1 204 No Content
x-amz-request-id: 1234567890-abcdef
```

**Note:** S3 returns success even if the object doesn't exist.

---

### Copy Object

#### PUT /{bucket}/{key}

Copy an object to a new location.

**Headers:**

- `x-amz-copy-source` - Source bucket and key (`/source-bucket/source-key`)

**Request:**

```http
PUT /my-bucket/docs/file-copy.txt HTTP/1.1
Host: localhost:3001
Authorization: AWS4-HMAC-SHA256 ...
x-amz-date: 20230101T000000Z
x-amz-copy-source: /my-bucket/docs/file.txt
```

**Response:**

```http
HTTP/1.1 200 OK
x-amz-request-id: 1234567890-abcdef
x-amz-copy-source-version-id: QmYwAPJzv5CZsnAzt8auVZRn8cpMaFMyL53cV7bG5aL2Xu
```

**Error Responses:**

- `404 NoSuchBucket` - Source or destination bucket does not exist

---

## Error Responses

All errors are returned in XML format:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>NoSuchBucket</Code>
  <Message>The specified bucket does not exist</Message>
  <Resource>/my-bucket</Resource>
  <RequestId>1234567890-abcdef</RequestId>
</Error>
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AccessDenied` | 403 | Access denied |
| `InvalidAccessKeyId` | 403 | Invalid access key |
| `SignatureDoesNotMatch` | 403 | Signature verification failed |
| `InvalidBucketName` | 400 | Invalid bucket name |
| `NoSuchBucket` | 404 | Bucket does not exist |
| `BucketAlreadyExists` | 409 | Bucket already exists |
| `NoSuchKey` | 404 | Object does not exist |
| `InternalError` | 500 | Internal server error |
| `SlowDown` | 503 | Rate limit exceeded |

---

## Rate Limiting

The gateway enforces rate limits to prevent abuse:

- **Window**: 15 minutes (configurable via `RATE_LIMIT_WINDOW_MS`)
- **Max Requests**: 1000 per window (configurable via `RATE_LIMIT_MAX_REQUESTS`)

When rate limit is exceeded, the API returns:

```xml
<Error>
  <Code>SlowDown</Code>
  <Message>Please reduce your request rate</Message>
</Error>
```

---

## Custom Headers

### Request Headers

- `x-amz-date` - Request timestamp (required for authentication)
- `x-amz-content-sha256` - Payload hash (required for authentication)
- `x-amz-meta-*` - Custom metadata (optional)
- `x-amz-copy-source` - Copy source (for copy operations)

### Response Headers

- `x-amz-request-id` - Unique request identifier
- `x-amz-version-id` - Object version (IPFS CID)
- `x-amz-copy-source-version-id` - Source version for copy operations
- `x-amz-meta-*` - Custom metadata

---

## Storage Backend

Objects are stored on Filecoin/IPFS via the Varity SDK:

### Storage Flow

1. **PUT Request** → S3 Gateway
2. **Authentication** → AWS Signature V4 verification
3. **Upload** → Varity SDK → Filecoin/IPFS
4. **CID Mapping** → `bucket/key` → IPFS CID
5. **Response** → ETag, version ID (CID)

### Retrieval Flow

1. **GET Request** → S3 Gateway
2. **Authentication** → AWS Signature V4 verification
3. **Lookup** → `bucket/key` → IPFS CID
4. **Download** → Varity SDK → Filecoin/IPFS
5. **Response** → Object data

---

## Client Examples

### AWS CLI

```bash
# Configure
aws configure set aws_access_key_id AKIAIOSFODNN7EXAMPLE
aws configure set aws_secret_access_key wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Create bucket
aws s3 mb s3://my-bucket --endpoint-url http://localhost:3001

# Upload
aws s3 cp file.txt s3://my-bucket/ --endpoint-url http://localhost:3001

# List
aws s3 ls s3://my-bucket/ --endpoint-url http://localhost:3001

# Download
aws s3 cp s3://my-bucket/file.txt downloaded.txt --endpoint-url http://localhost:3001

# Delete
aws s3 rm s3://my-bucket/file.txt --endpoint-url http://localhost:3001
```

### AWS SDK (JavaScript)

```javascript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: 'http://localhost:3001',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
  },
  forcePathStyle: true
});

await s3.send(new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'file.txt',
  Body: 'Hello, World!'
}));
```

### boto3 (Python)

```python
import boto3

s3 = boto3.client(
    's3',
    endpoint_url='http://localhost:3001',
    aws_access_key_id='AKIAIOSFODNN7EXAMPLE',
    aws_secret_access_key='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
)

s3.put_object(
    Bucket='my-bucket',
    Key='file.txt',
    Body=b'Hello, World!'
)
```

---

## Limitations

### Current Implementation

- Bucket/key mappings stored in memory (use database for production)
- No multipart upload support (yet)
- No versioning support (yet)
- No bucket policies (yet)
- No ACLs (yet)

### Planned Features

- Persistent storage backend
- Multipart uploads
- Versioning
- Bucket policies
- Server-side encryption

---

For more information, see the [README](./README.md).
