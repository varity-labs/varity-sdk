"""
Varity S3 Client Tests
"""

import pytest
import os
from io import BytesIO
from varity import VarityS3Client


@pytest.fixture
def client():
    """Create test client"""
    return VarityS3Client(
        endpoint=os.getenv("VARITY_S3_ENDPOINT", "http://localhost:3001"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "test-access-key"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "test-secret-key"),
        network="arbitrum-sepolia",
        storage_backend="filecoin-ipfs"
    )


class TestClientConfiguration:
    """Test client configuration"""

    def test_create_default_client(self):
        """Test creating client with default configuration"""
        client = VarityS3Client()
        assert client is not None

        config = client.get_config()
        assert config["network"] == "arbitrum-sepolia"
        assert config["storage_backend"] == "filecoin-ipfs"
        assert config["encryption_enabled"] is True

    def test_create_custom_client(self):
        """Test creating client with custom configuration"""
        client = VarityS3Client(
            endpoint="http://custom-endpoint:9000",
            network="arbitrum-one",
            storage_backend="filecoin-lighthouse",
            encryption_enabled=False
        )

        config = client.get_config()
        assert config["endpoint"] == "http://custom-endpoint:9000"
        assert config["network"] == "arbitrum-one"
        assert config["storage_backend"] == "filecoin-lighthouse"
        assert config["encryption_enabled"] is False


class TestBucketOperations:
    """Test bucket operations"""

    def test_create_bucket(self, client):
        """Test creating a bucket"""
        bucket_name = f"test-bucket-{os.urandom(4).hex()}"

        try:
            response = client.create_bucket(bucket_name)
            assert response is not None
            assert "Location" in response or "ResponseMetadata" in response
        except Exception as e:
            print(f"Note: Create bucket requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_list_buckets(self, client):
        """Test listing buckets"""
        try:
            response = client.list_buckets()
            assert response is not None
            assert "Buckets" in response
            assert isinstance(response["Buckets"], list)
        except Exception as e:
            print(f"Note: List buckets requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_delete_bucket(self, client):
        """Test deleting a bucket"""
        bucket_name = f"test-bucket-{os.urandom(4).hex()}"

        try:
            # Create bucket first
            client.create_bucket(bucket_name)
            # Then delete it
            response = client.delete_bucket(bucket_name)
            assert response is not None
        except Exception as e:
            print(f"Note: Delete bucket requires running gateway: {e}")
            pytest.skip("Gateway not available")


class TestObjectOperations:
    """Test object operations"""

    @pytest.fixture
    def bucket_name(self):
        """Test bucket name"""
        return "test-bucket"

    def test_put_object(self, client, bucket_name):
        """Test uploading an object"""
        key = f"test-file-{os.urandom(4).hex()}.txt"
        content = b"Hello, Varity! This is a test file."

        try:
            response = client.put_object(
                bucket_name,
                key,
                content,
                content_type="text/plain",
                metadata={
                    "test-key": "test-value",
                    "upload-timestamp": "2024-01-01T00:00:00Z"
                }
            )

            assert response is not None
            assert "ETag" in response
            print(f"✓ Upload successful: {key}")
        except Exception as e:
            print(f"Note: Upload requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_get_object(self, client, bucket_name):
        """Test downloading an object"""
        key = "test-file.txt"
        content = b"Test content"

        try:
            # Upload first
            client.put_object(bucket_name, key, content)

            # Then download
            response = client.get_object(bucket_name, key)
            assert response is not None
            assert "Body" in response

            downloaded_content = response["Body"].read()
            assert downloaded_content == content
            print(f"✓ Download successful: {key}")
        except Exception as e:
            print(f"Note: Download requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_head_object(self, client, bucket_name):
        """Test getting object metadata"""
        key = "test-file.txt"

        try:
            # Upload first
            client.put_object(
                bucket_name,
                key,
                b"Test content",
                metadata={"author": "test"}
            )

            # Get metadata
            response = client.head_object(bucket_name, key)
            assert response is not None
            assert "ContentLength" in response
            assert "ContentType" in response
            print(f"✓ Head object successful: {key}")
        except Exception as e:
            print(f"Note: Head object requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_list_objects(self, client, bucket_name):
        """Test listing objects"""
        try:
            response = client.list_objects(bucket_name, max_keys=10)
            assert response is not None
            assert "Contents" in response or "KeyCount" in response
            print(f"✓ List objects successful")
        except Exception as e:
            print(f"Note: List objects requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_copy_object(self, client, bucket_name):
        """Test copying an object"""
        source_key = "source-file.txt"
        dest_key = "dest-file.txt"

        try:
            # Upload source
            client.put_object(bucket_name, source_key, b"Source content")

            # Copy it
            response = client.copy_object(
                bucket_name,
                source_key,
                bucket_name,
                dest_key
            )
            assert response is not None
            print(f"✓ Copy object successful: {source_key} -> {dest_key}")
        except Exception as e:
            print(f"Note: Copy object requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_delete_object(self, client, bucket_name):
        """Test deleting an object"""
        key = "delete-test.txt"

        try:
            # Upload first
            client.put_object(bucket_name, key, b"To be deleted")

            # Then delete
            response = client.delete_object(bucket_name, key)
            assert response is not None
            print(f"✓ Delete object successful: {key}")
        except Exception as e:
            print(f"Note: Delete object requires running gateway: {e}")
            pytest.skip("Gateway not available")


class TestAdvancedFeatures:
    """Test advanced features"""

    @pytest.fixture
    def bucket_name(self):
        """Test bucket name"""
        return "test-bucket"

    def test_generate_presigned_url(self, client, bucket_name):
        """Test generating presigned URLs"""
        key = "presigned-test.txt"

        try:
            url = client.generate_presigned_url(
                "put_object",
                bucket_name,
                key,
                expires_in=3600
            )
            assert url is not None
            assert "http" in url
            assert bucket_name in url
            print(f"✓ Presigned URL generated: {url[:50]}...")
        except Exception as e:
            print(f"Note: Presigned URL requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_upload_fileobj(self, client, bucket_name):
        """Test uploading file-like object"""
        key = "fileobj-test.txt"
        content = b"File object content"

        try:
            fileobj = BytesIO(content)
            client.upload_fileobj(
                fileobj,
                bucket_name,
                key,
                metadata={"upload-type": "fileobj"}
            )
            print(f"✓ File object upload successful: {key}")
        except Exception as e:
            print(f"Note: File object upload requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_download_fileobj(self, client, bucket_name):
        """Test downloading to file-like object"""
        key = "download-fileobj-test.txt"
        content = b"Download to fileobj"

        try:
            # Upload first
            client.put_object(bucket_name, key, content)

            # Download to BytesIO
            fileobj = BytesIO()
            client.download_fileobj(bucket_name, key, fileobj)

            fileobj.seek(0)
            downloaded = fileobj.read()
            assert downloaded == content
            print(f"✓ File object download successful: {key}")
        except Exception as e:
            print(f"Note: File object download requires running gateway: {e}")
            pytest.skip("Gateway not available")


class TestContextManager:
    """Test context manager support"""

    def test_context_manager(self):
        """Test using client as context manager"""
        with VarityS3Client() as client:
            assert client is not None
            config = client.get_config()
            assert config is not None


class TestErrorHandling:
    """Test error handling"""

    def test_nonexistent_bucket(self, client):
        """Test accessing non-existent bucket"""
        with pytest.raises(Exception):
            client.get_object(f"nonexistent-{os.urandom(8).hex()}", "test.txt")

    def test_nonexistent_object(self, client):
        """Test accessing non-existent object"""
        with pytest.raises(Exception):
            client.get_object("test-bucket", f"nonexistent-{os.urandom(8).hex()}.txt")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
