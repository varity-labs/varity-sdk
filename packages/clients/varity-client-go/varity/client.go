/*
Package varity provides an AWS SDK-compatible client for Varity's decentralized storage infrastructure.

The client wraps the AWS S3 SDK and provides additional features for Varity's
Filecoin/IPFS backend with Lit Protocol encryption.

Example usage:

	client, err := varity.NewS3Client(&varity.Config{
		Endpoint:          "http://localhost:3001",
		AccessKeyID:       "YOUR_ACCESS_KEY",
		SecretAccessKey:   "YOUR_SECRET_KEY",
		Network:           "arbitrum-sepolia",
		StorageBackend:    "filecoin-ipfs",
		EncryptionEnabled: true,
	})
	if err != nil {
		log.Fatal(err)
	}

	// Upload object
	err = client.PutObject("my-bucket", "hello.txt", []byte("Hello, Varity!"), nil)
	if err != nil {
		log.Fatal(err)
	}

	// Download object
	data, err := client.GetObject("my-bucket", "hello.txt")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(string(data))
*/
package varity

import (
	"bytes"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

// Config represents Varity S3 client configuration
type Config struct {
	// Endpoint is the gateway URL (default: http://localhost:3001)
	Endpoint string

	// AccessKeyID is the AWS-compatible access key
	AccessKeyID string

	// SecretAccessKey is the AWS-compatible secret key
	SecretAccessKey string

	// Region is the AWS region (default: us-east-1)
	Region string

	// Network is the Varity network (arbitrum-sepolia, arbitrum-one)
	Network string

	// StorageBackend is the storage backend (filecoin-ipfs, filecoin-lighthouse)
	StorageBackend string

	// EncryptionEnabled enables Lit Protocol encryption
	EncryptionEnabled bool

	// DisableSSL disables SSL (for local development)
	DisableSSL bool
}

// S3Client wraps the AWS S3 client with Varity-specific functionality
type S3Client struct {
	client            *s3.S3
	config            *Config
	endpoint          string
	network           string
	storageBackend    string
	encryptionEnabled bool
}

// NewS3Client creates a new Varity S3 client
func NewS3Client(config *Config) (*S3Client, error) {
	if config == nil {
		config = &Config{}
	}

	// Set defaults
	if config.Endpoint == "" {
		config.Endpoint = "http://localhost:3001"
	}
	if config.Region == "" {
		config.Region = "us-east-1"
	}
	if config.Network == "" {
		config.Network = "arbitrum-sepolia"
	}
	if config.StorageBackend == "" {
		config.StorageBackend = "filecoin-ipfs"
	}

	// Create AWS session
	sess, err := session.NewSession(&aws.Config{
		Endpoint:         aws.String(config.Endpoint),
		Region:           aws.String(config.Region),
		Credentials:      credentials.NewStaticCredentials(config.AccessKeyID, config.SecretAccessKey, ""),
		S3ForcePathStyle: aws.Bool(true), // Required for S3-compatible APIs
		DisableSSL:       aws.Bool(config.DisableSSL || strings.HasPrefix(config.Endpoint, "http://")),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %w", err)
	}

	return &S3Client{
		client:            s3.New(sess),
		config:            config,
		endpoint:          config.Endpoint,
		network:           config.Network,
		storageBackend:    config.StorageBackend,
		encryptionEnabled: config.EncryptionEnabled,
	}, nil
}

// GetConfig returns the client configuration
func (c *S3Client) GetConfig() map[string]interface{} {
	return map[string]interface{}{
		"endpoint":           c.endpoint,
		"network":            c.network,
		"storageBackend":     c.storageBackend,
		"encryptionEnabled":  c.encryptionEnabled,
	}
}

// Bucket Operations

// CreateBucket creates a new bucket
func (c *S3Client) CreateBucket(bucket string) error {
	_, err := c.client.CreateBucket(&s3.CreateBucketInput{
		Bucket: aws.String(bucket),
	})
	return err
}

// DeleteBucket deletes a bucket
func (c *S3Client) DeleteBucket(bucket string) error {
	_, err := c.client.DeleteBucket(&s3.DeleteBucketInput{
		Bucket: aws.String(bucket),
	})
	return err
}

// ListBuckets lists all buckets
func (c *S3Client) ListBuckets() ([]*s3.Bucket, error) {
	result, err := c.client.ListBuckets(&s3.ListBucketsInput{})
	if err != nil {
		return nil, err
	}
	return result.Buckets, nil
}

// Object Operations

// PutObject uploads an object
func (c *S3Client) PutObject(bucket, key string, body []byte, metadata map[string]*string) error {
	_, err := c.client.PutObject(&s3.PutObjectInput{
		Bucket:   aws.String(bucket),
		Key:      aws.String(key),
		Body:     bytes.NewReader(body),
		Metadata: metadata,
	})
	return err
}

// GetObject downloads an object
func (c *S3Client) GetObject(bucket, key string) ([]byte, error) {
	result, err := c.client.GetObject(&s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}
	defer result.Body.Close()

	return io.ReadAll(result.Body)
}

// DeleteObject deletes an object
func (c *S3Client) DeleteObject(bucket, key string) error {
	_, err := c.client.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	return err
}

// HeadObject gets object metadata
func (c *S3Client) HeadObject(bucket, key string) (*s3.HeadObjectOutput, error) {
	return c.client.HeadObject(&s3.HeadObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
}

// ListObjects lists objects in a bucket
func (c *S3Client) ListObjects(bucket string, prefix *string, maxKeys *int64) ([]*s3.Object, error) {
	input := &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
	}
	if prefix != nil {
		input.Prefix = prefix
	}
	if maxKeys != nil {
		input.MaxKeys = maxKeys
	}

	result, err := c.client.ListObjectsV2(input)
	if err != nil {
		return nil, err
	}
	return result.Contents, nil
}

// CopyObject copies an object
func (c *S3Client) CopyObject(sourceBucket, sourceKey, destBucket, destKey string) error {
	_, err := c.client.CopyObject(&s3.CopyObjectInput{
		CopySource: aws.String(fmt.Sprintf("%s/%s", sourceBucket, sourceKey)),
		Bucket:     aws.String(destBucket),
		Key:        aws.String(destKey),
	})
	return err
}

// Advanced Operations

// PresignGetObject generates a presigned URL for downloading an object
func (c *S3Client) PresignGetObject(bucket, key string, expiration time.Duration) (string, error) {
	req, _ := c.client.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	return req.Presign(expiration)
}

// PresignPutObject generates a presigned URL for uploading an object
func (c *S3Client) PresignPutObject(bucket, key string, expiration time.Duration) (string, error) {
	req, _ := c.client.PutObjectRequest(&s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	return req.Presign(expiration)
}

// PutObjectStream uploads an object from a reader
func (c *S3Client) PutObjectStream(bucket, key string, reader io.Reader, metadata map[string]*string) error {
	_, err := c.client.PutObject(&s3.PutObjectInput{
		Bucket:   aws.String(bucket),
		Key:      aws.String(key),
		Body:     aws.ReadSeekCloser(reader),
		Metadata: metadata,
	})
	return err
}

// GetObjectStream downloads an object to a writer
func (c *S3Client) GetObjectStream(bucket, key string, writer io.Writer) error {
	result, err := c.client.GetObject(&s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return err
	}
	defer result.Body.Close()

	_, err = io.Copy(writer, result.Body)
	return err
}

// GetClient returns the underlying AWS S3 client for advanced operations
func (c *S3Client) GetClient() *s3.S3 {
	return c.client
}
