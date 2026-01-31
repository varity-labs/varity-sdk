package varity

import (
	"bytes"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func getTestConfig() *Config {
	endpoint := os.Getenv("VARITY_S3_ENDPOINT")
	if endpoint == "" {
		endpoint = "http://localhost:3001"
	}

	accessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	if accessKey == "" {
		accessKey = "test-access-key"
	}

	secretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")
	if secretKey == "" {
		secretKey = "test-secret-key"
	}

	return &Config{
		Endpoint:          endpoint,
		AccessKeyID:       accessKey,
		SecretAccessKey:   secretKey,
		Region:            "us-east-1",
		Network:           "arbitrum-sepolia",
		StorageBackend:    "filecoin-ipfs",
		EncryptionEnabled: true,
	}
}

func TestClientConfiguration(t *testing.T) {
	t.Run("DefaultConfiguration", func(t *testing.T) {
		client, err := NewS3Client(&Config{
			AccessKeyID:     "test",
			SecretAccessKey: "test",
		})
		require.NoError(t, err)
		require.NotNil(t, client)

		config := client.GetConfig()
		assert.Equal(t, "arbitrum-sepolia", config["network"])
		assert.Equal(t, "filecoin-ipfs", config["storageBackend"])
		assert.Equal(t, true, config["encryptionEnabled"])
	})

	t.Run("CustomConfiguration", func(t *testing.T) {
		client, err := NewS3Client(&Config{
			Endpoint:          "http://custom-endpoint:9000",
			AccessKeyID:       "custom-key",
			SecretAccessKey:   "custom-secret",
			Network:           "arbitrum-one",
			StorageBackend:    "filecoin-lighthouse",
			EncryptionEnabled: false,
		})
		require.NoError(t, err)

		config := client.GetConfig()
		assert.Equal(t, "http://custom-endpoint:9000", config["endpoint"])
		assert.Equal(t, "arbitrum-one", config["network"])
		assert.Equal(t, "filecoin-lighthouse", config["storageBackend"])
		assert.Equal(t, false, config["encryptionEnabled"])
	})
}

func TestBucketOperations(t *testing.T) {
	client, err := NewS3Client(getTestConfig())
	require.NoError(t, err)

	bucketName := fmt.Sprintf("test-bucket-%d", time.Now().Unix())

	t.Run("CreateBucket", func(t *testing.T) {
		err := client.CreateBucket(bucketName)
		if err != nil {
			t.Logf("Note: Create bucket requires running gateway: %v", err)
			t.Skip("Gateway not available")
		}
	})

	t.Run("ListBuckets", func(t *testing.T) {
		buckets, err := client.ListBuckets()
		if err != nil {
			t.Logf("Note: List buckets requires running gateway: %v", err)
			t.Skip("Gateway not available")
		}
		assert.NotNil(t, buckets)
	})

	t.Run("DeleteBucket", func(t *testing.T) {
		err := client.DeleteBucket(bucketName)
		if err != nil {
			t.Logf("Note: Delete bucket requires running gateway: %v", err)
			t.Skip("Gateway not available")
		}
	})
}

func TestObjectOperations(t *testing.T) {
	client, err := NewS3Client(getTestConfig())
	require.NoError(t, err)

	bucket := "test-bucket"
	key := fmt.Sprintf("test-file-%d.txt", time.Now().Unix())
	content := []byte("Hello, Varity! This is a test file.")

	t.Run("PutObject", func(t *testing.T) {
		metadata := map[string]*string{
			"test-key":         aws.String("test-value"),
			"upload-timestamp": aws.String(time.Now().Format(time.RFC3339)),
		}

		err := client.PutObject(bucket, key, content, metadata)
		if err != nil {
			t.Logf("Note: Upload requires running gateway: %v", err)
			t.Skip("Gateway not available")
		}
		t.Logf("✓ Upload successful: %s", key)
	})

	t.Run("HeadObject", func(t *testing.T) {
		result, err := client.HeadObject(bucket, key)
		if err != nil {
			t.Logf("Note: Head object requires running gateway: %v", err)
			t.Skip("Gateway not available")
		}
		assert.NotNil(t, result)
		assert.NotNil(t, result.ContentLength)
		t.Logf("✓ Head object successful: %s", key)
	})

	t.Run("GetObject", func(t *testing.T) {
		data, err := client.GetObject(bucket, key)
		if err != nil {
			t.Logf("Note: Download requires running gateway: %v", err)
			t.Skip("Gateway not available")
		}
		assert.Equal(t, content, data)
		t.Logf("✓ Download successful: %s", key)
	})

	t.Run("ListObjects", func(t *testing.T) {
		objects, err := client.ListObjects(bucket, nil, aws.Int64(10))
		if err != nil {
			t.Logf("Note: List objects requires running gateway: %v", err)
			t.Skip("Gateway not available")
		}
		assert.NotNil(t, objects)
		t.Log("✓ List objects successful")
	})

	t.Run("CopyObject", func(t *testing.T) {
		copyKey := fmt.Sprintf("test-copy-%d.txt", time.Now().Unix())
		err := client.CopyObject(bucket, key, bucket, copyKey)
		if err != nil {
			t.Logf("Note: Copy object requires running gateway: %v", err)
			t.Skip("Gateway not available")
		}
		t.Logf("✓ Copy object successful: %s -> %s", key, copyKey)
	})

	t.Run("DeleteObject", func(t *testing.T) {
		err := client.DeleteObject(bucket, key)
		if err != nil {
			t.Logf("Note: Delete requires running gateway: %v", err)
			t.Skip("Gateway not available")
		}
		t.Logf("✓ Delete object successful: %s", key)
	})
}

func TestAdvancedOperations(t *testing.T) {
	client, err := NewS3Client(getTestConfig())
	require.NoError(t, err)

	bucket := "test-bucket"

	t.Run("PresignedURLs", func(t *testing.T) {
		key := "presigned-test.txt"

		// Presigned GET URL
		getURL, err := client.PresignGetObject(bucket, key, time.Hour)
		if err != nil {
			t.Logf("Note: Presigned URL requires running gateway: %v", err)
			t.Skip("Gateway not available")
		}
		assert.Contains(t, getURL, "http")
		assert.Contains(t, getURL, bucket)
		t.Logf("✓ Presigned GET URL: %s...", getURL[:50])

		// Presigned PUT URL
		putURL, err := client.PresignPutObject(bucket, key, time.Hour)
		if err != nil {
			t.Logf("Note: Presigned URL requires running gateway: %v", err)
			t.Skip("Gateway not available")
		}
		assert.Contains(t, putURL, "http")
		t.Logf("✓ Presigned PUT URL: %s...", putURL[:50])
	})

	t.Run("StreamOperations", func(t *testing.T) {
		key := "stream-test.txt"
		content := []byte("Stream content")

		// Upload stream
		reader := bytes.NewReader(content)
		metadata := map[string]*string{
			"upload-method": aws.String("stream"),
		}
		err := client.PutObjectStream(bucket, key, reader, metadata)
		if err != nil {
			t.Logf("Note: Stream upload requires running gateway: %v", err)
			t.Skip("Gateway not available")
		}
		t.Log("✓ Stream upload successful")

		// Download stream
		var buffer bytes.Buffer
		err = client.GetObjectStream(bucket, key, &buffer)
		if err != nil {
			t.Logf("Note: Stream download requires running gateway: %v", err)
			t.Skip("Gateway not available")
		}
		assert.Equal(t, content, buffer.Bytes())
		t.Log("✓ Stream download successful")
	})
}

func TestErrorHandling(t *testing.T) {
	client, err := NewS3Client(getTestConfig())
	require.NoError(t, err)

	t.Run("NonExistentBucket", func(t *testing.T) {
		_, err := client.GetObject(fmt.Sprintf("nonexistent-%d", time.Now().Unix()), "test.txt")
		assert.Error(t, err)
	})

	t.Run("NonExistentObject", func(t *testing.T) {
		_, err := client.GetObject("test-bucket", fmt.Sprintf("nonexistent-%d.txt", time.Now().Unix()))
		assert.Error(t, err)
	})
}
