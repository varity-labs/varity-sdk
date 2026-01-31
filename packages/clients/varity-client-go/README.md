# Varity Go Client

AWS SDK-compatible client library for Varity's decentralized storage infrastructure.

## Features

- **AWS SDK Compatible**: Drop-in replacement for aws-sdk-go S3 client
- **Decentralized Storage**: Built on Filecoin/IPFS infrastructure
- **Lit Protocol Encryption**: All data encrypted at rest
- **Multiple Networks**: Support for Arbitrum Sepolia and Arbitrum One
- **Type Safe**: Full Go type safety and error handling
- **Stream Support**: Efficient handling of large files
- **Presigned URLs**: Generate temporary access URLs

## Installation

```bash
go get github.com/varity/client-go
```

## Quick Start

```go
package main

import (
    "fmt"
    "log"

    "github.com/varity/client-go/varity"
)

func main() {
    client, err := varity.NewS3Client(&varity.Config{
        Endpoint:        "http://localhost:3001",
        AccessKeyID:     "YOUR_ACCESS_KEY",
        SecretAccessKey: "YOUR_SECRET_KEY",
        Network:         "arbitrum-sepolia",
    })
    if err != nil {
        log.Fatal(err)
    }

    // Upload a file
    err = client.PutObject("my-bucket", "hello.txt", []byte("Hello, Varity!"), nil)
    if err != nil {
        log.Fatal(err)
    }

    // Download a file
    data, err := client.GetObject("my-bucket", "hello.txt")
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(string(data)) // "Hello, Varity!"
}
```

## Configuration Options

```go
client, err := varity.NewS3Client(&varity.Config{
    // Gateway endpoint
    Endpoint: "http://localhost:3001",

    // AWS-compatible credentials
    AccessKeyID:     "YOUR_ACCESS_KEY",
    SecretAccessKey: "YOUR_SECRET_KEY",

    // AWS region (for compatibility)
    Region: "us-east-1",

    // Network selection
    Network: "arbitrum-sepolia", // or "arbitrum-one"

    // Storage backend
    StorageBackend: "filecoin-ipfs", // or "filecoin-lighthouse"

    // Enable/disable encryption
    EncryptionEnabled: true,

    // Disable SSL for local development
    DisableSSL: true,
})
```

## API Reference

### Bucket Operations

```go
// Create bucket
err := client.CreateBucket("my-bucket")

// List buckets
buckets, err := client.ListBuckets()
for _, bucket := range buckets {
    fmt.Println(bucket.Name)
}

// Delete bucket
err := client.DeleteBucket("my-bucket")
```

### Object Operations

```go
import "github.com/aws/aws-sdk-go/aws"

// Upload object
metadata := map[string]*string{
    "author": aws.String("John Doe"),
    "version": aws.String("1.0"),
}
err := client.PutObject("my-bucket", "file.txt", []byte("content"), metadata)

// Download object
data, err := client.GetObject("my-bucket", "file.txt")

// Get object metadata
result, err := client.HeadObject("my-bucket", "file.txt")
fmt.Println(*result.ContentLength)

// List objects
objects, err := client.ListObjects("my-bucket", aws.String("prefix/"), aws.Int64(100))

// Copy object
err := client.CopyObject("my-bucket", "file.txt", "my-bucket", "file-copy.txt")

// Delete object
err := client.DeleteObject("my-bucket", "file.txt")
```

### Stream Operations

```go
import (
    "bytes"
    "io"
)

// Upload from reader
reader := bytes.NewReader([]byte("stream content"))
metadata := map[string]*string{
    "upload-method": aws.String("stream"),
}
err := client.PutObjectStream("my-bucket", "file.txt", reader, metadata)

// Download to writer
var buffer bytes.Buffer
err := client.GetObjectStream("my-bucket", "file.txt", &buffer)
content := buffer.Bytes()
```

### Presigned URLs

```go
import "time"

// Generate presigned URL for upload
url, err := client.PresignPutObject("my-bucket", "file.txt", time.Hour)

// Generate presigned URL for download
url, err := client.PresignGetObject("my-bucket", "file.txt", time.Hour)
```

### Advanced Usage

```go
// Get underlying AWS S3 client for advanced operations
s3Client := client.GetClient()

// Use standard AWS SDK operations
result, err := s3Client.GetObject(&s3.GetObjectInput{
    Bucket: aws.String("my-bucket"),
    Key:    aws.String("file.txt"),
})
```

## Examples

See the [examples](./examples) directory for comprehensive usage examples:

- Basic client initialization
- Upload and download operations
- Bucket management
- Presigned URLs
- Stream operations
- Metadata handling
- Network configuration

Run examples:
```bash
go run examples/main.go
```

## Testing

```bash
# Run tests
go test ./varity -v

# Run tests with coverage
go test ./varity -cover

# Run specific test
go test ./varity -run TestObjectOperations -v

# Run tests with gateway
export RUN_INTEGRATION_EXAMPLES=true
go test ./varity -v
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

## Documentation

- [API Documentation](https://pkg.go.dev/github.com/varity/client-go/varity)
- [Examples](./examples)
- [Tests](./varity/client_test.go)

## License

MIT
