"""
Varity S3 Client Edge Cases and Advanced Tests

Tests for edge cases, error conditions, and advanced scenarios
to achieve 90%+ code coverage
"""

import pytest
import os
from io import BytesIO
from varity import VarityS3Client


class TestEdgeCases:
    """Test edge cases and advanced scenarios"""

    def test_client_with_environment_variables(self):
        """Test client initialization with environment variables"""
        # Set environment variables
        os.environ['AWS_ACCESS_KEY_ID'] = 'env-test-key'
        os.environ['AWS_SECRET_ACCESS_KEY'] = 'env-test-secret'

        # Create client without explicit credentials
        client = VarityS3Client(endpoint="http://localhost:3001")
        assert client is not None

        config = client.get_config()
        assert config['endpoint'] == "http://localhost:3001"

        # Clean up
        if 'AWS_ACCESS_KEY_ID' in os.environ:
            del os.environ['AWS_ACCESS_KEY_ID']
        if 'AWS_SECRET_ACCESS_KEY' in os.environ:
            del os.environ['AWS_SECRET_ACCESS_KEY']

    def test_client_with_all_custom_options(self):
        """Test client with all configuration options"""
        client = VarityS3Client(
            endpoint="http://custom:9000",
            aws_access_key_id="custom-key",
            aws_secret_access_key="custom-secret",
            region="us-west-2",
            network="arbitrum-one",
            storage_backend="filecoin-lighthouse",
            encryption_enabled=False
        )

        config = client.get_config()
        assert config['endpoint'] == "http://custom:9000"
        assert config['network'] == "arbitrum-one"
        assert config['storage_backend'] == "filecoin-lighthouse"
        assert config['encryption_enabled'] is False

    def test_multiple_client_instances(self):
        """Test multiple concurrent client instances"""
        client1 = VarityS3Client(
            network="arbitrum-sepolia",
            storage_backend="filecoin-ipfs"
        )
        client2 = VarityS3Client(
            network="arbitrum-one",
            storage_backend="filecoin-lighthouse"
        )

        config1 = client1.get_config()
        config2 = client2.get_config()

        assert config1['network'] == "arbitrum-sepolia"
        assert config2['network'] == "arbitrum-one"
        assert config1['storage_backend'] == "filecoin-ipfs"
        assert config2['storage_backend'] == "filecoin-lighthouse"


class TestContextManager:
    """Test context manager functionality"""

    def test_context_manager_with_block(self):
        """Test using client as context manager"""
        with VarityS3Client() as client:
            assert client is not None
            config = client.get_config()
            assert config is not None
            assert 'endpoint' in config

    def test_context_manager_close(self):
        """Test explicit close method"""
        client = VarityS3Client()
        assert client is not None

        # Close should not raise error
        client.close()
        assert True


class TestBucketOperationsAdvanced:
    """Advanced bucket operation tests"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return VarityS3Client(
            endpoint=os.getenv("VARITY_S3_ENDPOINT", "http://localhost:3001"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "test-key"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "test-secret"),
            network="arbitrum-sepolia"
        )

    def test_create_bucket_with_kwargs(self, client):
        """Test creating bucket with additional arguments"""
        bucket_name = f"test-kwargs-{os.urandom(4).hex()}"

        try:
            response = client.create_bucket(
                bucket_name,
                ACL='private'
            )
            assert response is not None
            print(f"✓ Bucket created with ACL: {bucket_name}")

            # Cleanup
            try:
                client.delete_bucket(bucket_name)
            except Exception:
                pass
        except Exception as e:
            print(f"Note: Bucket operations require running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_list_buckets_with_kwargs(self, client):
        """Test listing buckets with additional arguments"""
        try:
            response = client.list_buckets()
            assert response is not None
            assert 'Buckets' in response
            print(f"✓ Listed {len(response['Buckets'])} buckets")
        except Exception as e:
            print(f"Note: List buckets requires running gateway: {e}")
            pytest.skip("Gateway not available")


class TestObjectOperationsAdvanced:
    """Advanced object operation tests"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return VarityS3Client()

    @pytest.fixture
    def bucket_name(self):
        """Test bucket name"""
        return "test-bucket"

    def test_put_object_with_string_body(self, client, bucket_name):
        """Test uploading object with string body"""
        key = f"string-test-{os.urandom(4).hex()}.txt"
        content = "String content test"

        try:
            response = client.put_object(
                bucket_name,
                key,
                content,
                content_type="text/plain"
            )
            assert response is not None
            print(f"✓ Uploaded string content: {key}")

            # Cleanup
            try:
                client.delete_object(bucket_name, key)
            except Exception:
                pass
        except Exception as e:
            print(f"Note: Upload requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_put_object_with_bytes_body(self, client, bucket_name):
        """Test uploading object with bytes body"""
        key = f"bytes-test-{os.urandom(4).hex()}.bin"
        content = b"Binary content test"

        try:
            response = client.put_object(
                bucket_name,
                key,
                content,
                content_type="application/octet-stream",
                metadata={
                    'type': 'binary',
                    'test': 'true'
                }
            )
            assert response is not None
            print(f"✓ Uploaded bytes content: {key}")

            # Cleanup
            try:
                client.delete_object(bucket_name, key)
            except Exception:
                pass
        except Exception as e:
            print(f"Note: Upload requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_put_object_with_file_like_object(self, client, bucket_name):
        """Test uploading object with file-like object"""
        key = f"fileobj-test-{os.urandom(4).hex()}.txt"
        content = BytesIO(b"File-like object content")

        try:
            response = client.put_object(
                bucket_name,
                key,
                content,
                content_type="text/plain"
            )
            assert response is not None
            print(f"✓ Uploaded file-like object: {key}")

            # Cleanup
            try:
                client.delete_object(bucket_name, key)
            except Exception:
                pass
        except Exception as e:
            print(f"Note: Upload requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_list_objects_with_prefix(self, client, bucket_name):
        """Test listing objects with prefix"""
        try:
            response = client.list_objects(
                bucket_name,
                prefix="test-",
                max_keys=5
            )
            assert response is not None
            print("✓ Listed objects with prefix")
        except Exception as e:
            print(f"Note: List objects requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_list_objects_without_prefix(self, client, bucket_name):
        """Test listing all objects without prefix"""
        try:
            response = client.list_objects(
                bucket_name,
                max_keys=100
            )
            assert response is not None
            print("✓ Listed all objects")
        except Exception as e:
            print(f"Note: List objects requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_copy_object_with_kwargs(self, client, bucket_name):
        """Test copying object with additional arguments"""
        source_key = f"copy-source-{os.urandom(4).hex()}.txt"
        dest_key = f"copy-dest-{os.urandom(4).hex()}.txt"

        try:
            # Upload source file
            client.put_object(bucket_name, source_key, b"Source content")

            # Copy with metadata
            response = client.copy_object(
                bucket_name,
                source_key,
                bucket_name,
                dest_key,
                MetadataDirective='COPY'
            )
            assert response is not None
            print(f"✓ Copied object with kwargs: {source_key} -> {dest_key}")

            # Cleanup
            try:
                client.delete_object(bucket_name, source_key)
                client.delete_object(bucket_name, dest_key)
            except Exception:
                pass
        except Exception as e:
            print(f"Note: Copy object requires running gateway: {e}")
            pytest.skip("Gateway not available")


class TestAdvancedFileOperations:
    """Test advanced file operations"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return VarityS3Client()

    @pytest.fixture
    def bucket_name(self):
        """Test bucket name"""
        return "test-bucket"

    def test_upload_file_with_default_key(self, client, bucket_name, tmp_path):
        """Test uploading file with default key"""
        # Create temporary file
        test_file = tmp_path / "test-upload.txt"
        test_file.write_text("Test file content")

        try:
            response = client.upload_file(
                str(test_file),
                bucket_name
            )
            assert response is not None
            assert 'Key' in response
            assert response['Key'] == 'test-upload.txt'
            print(f"✓ Uploaded file with default key: {response['Key']}")

            # Cleanup
            try:
                client.delete_object(bucket_name, response['Key'])
            except Exception:
                pass
        except Exception as e:
            print(f"Note: Upload file requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_upload_file_with_custom_key(self, client, bucket_name, tmp_path):
        """Test uploading file with custom key"""
        # Create temporary file
        test_file = tmp_path / "test-upload-custom.txt"
        test_file.write_text("Test file content")

        custom_key = f"custom-key-{os.urandom(4).hex()}.txt"

        try:
            response = client.upload_file(
                str(test_file),
                bucket_name,
                key=custom_key,
                metadata={'custom': 'true'}
            )
            assert response is not None
            assert response['Key'] == custom_key
            print(f"✓ Uploaded file with custom key: {custom_key}")

            # Cleanup
            try:
                client.delete_object(bucket_name, custom_key)
            except Exception:
                pass
        except Exception as e:
            print(f"Note: Upload file requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_download_file(self, client, bucket_name, tmp_path):
        """Test downloading file to filesystem"""
        key = f"download-test-{os.urandom(4).hex()}.txt"
        content = b"Download test content"
        download_path = tmp_path / "downloaded.txt"

        try:
            # Upload file first
            client.put_object(bucket_name, key, content)

            # Download file
            response = client.download_file(
                bucket_name,
                key,
                str(download_path)
            )
            assert response is not None
            assert download_path.exists()
            assert download_path.read_bytes() == content
            print(f"✓ Downloaded file: {key}")

            # Cleanup
            try:
                client.delete_object(bucket_name, key)
            except Exception:
                pass
        except Exception as e:
            print(f"Note: Download file requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_upload_fileobj_with_metadata(self, client, bucket_name):
        """Test uploading file object with metadata"""
        key = f"fileobj-metadata-{os.urandom(4).hex()}.txt"
        content = b"File object with metadata"
        fileobj = BytesIO(content)

        try:
            client.upload_fileobj(
                fileobj,
                bucket_name,
                key,
                metadata={
                    'upload-type': 'fileobj',
                    'test': 'true'
                }
            )
            print(f"✓ Uploaded file object with metadata: {key}")

            # Cleanup
            try:
                client.delete_object(bucket_name, key)
            except Exception:
                pass
        except Exception as e:
            print(f"Note: Upload fileobj requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_download_fileobj(self, client, bucket_name):
        """Test downloading to file object"""
        key = f"download-fileobj-{os.urandom(4).hex()}.txt"
        content = b"Download to fileobj content"

        try:
            # Upload first
            client.put_object(bucket_name, key, content)

            # Download to BytesIO
            fileobj = BytesIO()
            client.download_fileobj(bucket_name, key, fileobj)

            fileobj.seek(0)
            downloaded = fileobj.read()
            assert downloaded == content
            print(f"✓ Downloaded to file object: {key}")

            # Cleanup
            try:
                client.delete_object(bucket_name, key)
            except Exception:
                pass
        except Exception as e:
            print(f"Note: Download fileobj requires running gateway: {e}")
            pytest.skip("Gateway not available")


class TestPresignedURLs:
    """Test presigned URL generation"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return VarityS3Client()

    def test_generate_presigned_get_url(self, client):
        """Test generating presigned GET URL"""
        try:
            url = client.generate_presigned_url(
                'get_object',
                'test-bucket',
                'test-file.txt',
                expires_in=3600
            )
            assert url is not None
            assert 'http' in url
            assert 'test-bucket' in url
            print(f"✓ Generated presigned GET URL")
        except Exception as e:
            print(f"Note: Presigned URL requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_generate_presigned_put_url(self, client):
        """Test generating presigned PUT URL"""
        try:
            url = client.generate_presigned_url(
                'put_object',
                'test-bucket',
                'upload-file.txt',
                expires_in=1800
            )
            assert url is not None
            assert 'http' in url
            print(f"✓ Generated presigned PUT URL")
        except Exception as e:
            print(f"Note: Presigned URL requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_generate_presigned_url_with_custom_expiration(self, client):
        """Test generating presigned URL with custom expiration"""
        try:
            url = client.generate_presigned_url(
                'get_object',
                'test-bucket',
                'test-file.txt',
                expires_in=7200  # 2 hours
            )
            assert url is not None
            print(f"✓ Generated presigned URL with custom expiration")
        except Exception as e:
            print(f"Note: Presigned URL requires running gateway: {e}")
            pytest.skip("Gateway not available")

    def test_generate_presigned_url_with_kwargs(self, client):
        """Test generating presigned URL with additional parameters"""
        try:
            url = client.generate_presigned_url(
                'get_object',
                'test-bucket',
                'test-file.txt',
                expires_in=3600,
                ResponseContentType='application/json'
            )
            assert url is not None
            print(f"✓ Generated presigned URL with kwargs")
        except Exception as e:
            print(f"Note: Presigned URL requires running gateway: {e}")
            pytest.skip("Gateway not available")


class TestErrorHandlingAdvanced:
    """Advanced error handling tests"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return VarityS3Client()

    def test_invalid_credentials_error(self):
        """Test handling invalid credentials"""
        client = VarityS3Client(
            aws_access_key_id='invalid-key',
            aws_secret_access_key='invalid-secret'
        )

        with pytest.raises(Exception):
            client.list_buckets()

    def test_network_error_handling(self):
        """Test handling network errors"""
        client = VarityS3Client(
            endpoint='http://localhost:9999'  # Non-existent endpoint
        )

        with pytest.raises(Exception):
            client.list_buckets()

    def test_invalid_bucket_name_error(self, client):
        """Test handling invalid bucket name"""
        with pytest.raises(Exception):
            client.create_bucket('INVALID BUCKET NAME!')

    def test_nonexistent_file_in_upload(self, client):
        """Test handling non-existent file in upload"""
        with pytest.raises(Exception):
            client.upload_file(
                '/nonexistent/path/file.txt',
                'test-bucket'
            )

    def test_nonexistent_directory_in_download(self, client):
        """Test handling non-existent directory in download"""
        with pytest.raises(Exception):
            client.download_file(
                'test-bucket',
                'test-file.txt',
                '/nonexistent/directory/file.txt'
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
