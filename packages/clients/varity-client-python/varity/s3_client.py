"""
Varity S3-Compatible Client

boto3-compatible client for Varity's decentralized storage infrastructure.
Supports standard S3 operations with Filecoin/IPFS backend.
"""

import boto3
from botocore.client import Config
from typing import Optional, Dict, Any, BinaryIO, Union
import os


class VarityS3Client:
    """
    Varity S3 Client

    boto3-compatible client for Varity's decentralized storage infrastructure.

    Args:
        endpoint: Gateway endpoint URL (default: http://localhost:3001)
        aws_access_key_id: AWS access key ID
        aws_secret_access_key: AWS secret access key
        region: AWS region (default: us-east-1)
        network: Varity network (arbitrum-sepolia, arbitrum-one)
        storage_backend: Storage backend (filecoin-ipfs, filecoin-lighthouse)
        encryption_enabled: Enable Lit Protocol encryption
        **kwargs: Additional boto3 client arguments

    Example:
        >>> client = VarityS3Client(
        ...     aws_access_key_id='YOUR_ACCESS_KEY',
        ...     aws_secret_access_key='YOUR_SECRET_KEY'
        ... )
        >>> client.put_object('my-bucket', 'hello.txt', b'Hello, Varity!')
        >>> response = client.get_object('my-bucket', 'hello.txt')
        >>> print(response['Body'].read())
        b'Hello, Varity!'
    """

    def __init__(
        self,
        endpoint: str = "http://localhost:3001",
        aws_access_key_id: Optional[str] = None,
        aws_secret_access_key: Optional[str] = None,
        region: str = "us-east-1",
        network: str = "arbitrum-sepolia",
        storage_backend: str = "filecoin-ipfs",
        encryption_enabled: bool = True,
        **kwargs
    ):
        """Initialize Varity S3 Client"""
        # Use environment variables as fallback
        access_key = aws_access_key_id or os.getenv("AWS_ACCESS_KEY_ID")
        secret_key = aws_secret_access_key or os.getenv("AWS_SECRET_ACCESS_KEY")

        # Store configuration
        self.endpoint = endpoint
        self.network = network
        self.storage_backend = storage_backend
        self.encryption_enabled = encryption_enabled

        # Initialize boto3 S3 client with custom endpoint
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
            config=Config(
                signature_version="s3v4",
                s3={"addressing_style": "path"}  # Use path-style addressing
            ),
            **kwargs
        )

    def get_config(self) -> Dict[str, Any]:
        """
        Get client configuration

        Returns:
            Dictionary containing client configuration
        """
        return {
            "endpoint": self.endpoint,
            "network": self.network,
            "storage_backend": self.storage_backend,
            "encryption_enabled": self.encryption_enabled
        }

    # Bucket Operations

    def create_bucket(self, bucket: str, **kwargs) -> Dict[str, Any]:
        """
        Create a new bucket

        Args:
            bucket: Bucket name
            **kwargs: Additional boto3 create_bucket arguments

        Returns:
            boto3 create_bucket response
        """
        return self.client.create_bucket(Bucket=bucket, **kwargs)

    def delete_bucket(self, bucket: str, **kwargs) -> Dict[str, Any]:
        """
        Delete a bucket

        Args:
            bucket: Bucket name
            **kwargs: Additional boto3 delete_bucket arguments

        Returns:
            boto3 delete_bucket response
        """
        return self.client.delete_bucket(Bucket=bucket, **kwargs)

    def list_buckets(self, **kwargs) -> Dict[str, Any]:
        """
        List all buckets

        Args:
            **kwargs: Additional boto3 list_buckets arguments

        Returns:
            boto3 list_buckets response
        """
        return self.client.list_buckets(**kwargs)

    # Object Operations

    def put_object(
        self,
        bucket: str,
        key: str,
        body: Union[bytes, str, BinaryIO],
        content_type: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Upload an object to Varity storage

        Args:
            bucket: Bucket name
            key: Object key
            body: Object content (bytes, string, or file-like object)
            content_type: Content type (MIME type)
            metadata: Custom metadata dictionary
            **kwargs: Additional boto3 put_object arguments

        Returns:
            boto3 put_object response with ETag
        """
        params = {
            "Bucket": bucket,
            "Key": key,
            "Body": body,
            **kwargs
        }

        if content_type:
            params["ContentType"] = content_type

        if metadata:
            params["Metadata"] = metadata

        return self.client.put_object(**params)

    def get_object(self, bucket: str, key: str, **kwargs) -> Dict[str, Any]:
        """
        Download an object from Varity storage

        Args:
            bucket: Bucket name
            key: Object key
            **kwargs: Additional boto3 get_object arguments

        Returns:
            boto3 get_object response with Body stream
        """
        return self.client.get_object(Bucket=bucket, Key=key, **kwargs)

    def delete_object(self, bucket: str, key: str, **kwargs) -> Dict[str, Any]:
        """
        Delete an object from Varity storage

        Args:
            bucket: Bucket name
            key: Object key
            **kwargs: Additional boto3 delete_object arguments

        Returns:
            boto3 delete_object response
        """
        return self.client.delete_object(Bucket=bucket, Key=key, **kwargs)

    def head_object(self, bucket: str, key: str, **kwargs) -> Dict[str, Any]:
        """
        Get object metadata without downloading content

        Args:
            bucket: Bucket name
            key: Object key
            **kwargs: Additional boto3 head_object arguments

        Returns:
            boto3 head_object response with metadata
        """
        return self.client.head_object(Bucket=bucket, Key=key, **kwargs)

    def list_objects(
        self,
        bucket: str,
        prefix: Optional[str] = None,
        max_keys: int = 1000,
        **kwargs
    ) -> Dict[str, Any]:
        """
        List objects in a bucket

        Args:
            bucket: Bucket name
            prefix: Filter objects by prefix
            max_keys: Maximum number of objects to return
            **kwargs: Additional boto3 list_objects_v2 arguments

        Returns:
            boto3 list_objects_v2 response
        """
        params = {
            "Bucket": bucket,
            "MaxKeys": max_keys,
            **kwargs
        }

        if prefix:
            params["Prefix"] = prefix

        return self.client.list_objects_v2(**params)

    def copy_object(
        self,
        source_bucket: str,
        source_key: str,
        dest_bucket: str,
        dest_key: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Copy an object

        Args:
            source_bucket: Source bucket name
            source_key: Source object key
            dest_bucket: Destination bucket name
            dest_key: Destination object key
            **kwargs: Additional boto3 copy_object arguments

        Returns:
            boto3 copy_object response
        """
        copy_source = {"Bucket": source_bucket, "Key": source_key}
        return self.client.copy_object(
            CopySource=copy_source,
            Bucket=dest_bucket,
            Key=dest_key,
            **kwargs
        )

    # Advanced Operations

    def upload_file(
        self,
        file_path: str,
        bucket: str,
        key: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Upload a file from filesystem

        Args:
            file_path: Path to file to upload
            bucket: Bucket name
            key: Object key (defaults to filename)
            metadata: Custom metadata dictionary
            **kwargs: Additional boto3 upload_file arguments

        Returns:
            Upload response
        """
        if key is None:
            key = os.path.basename(file_path)

        extra_args = kwargs.copy()
        if metadata:
            extra_args["Metadata"] = metadata

        self.client.upload_file(file_path, bucket, key, ExtraArgs=extra_args)
        return {"Bucket": bucket, "Key": key, "FilePath": file_path}

    def download_file(
        self,
        bucket: str,
        key: str,
        file_path: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Download a file to filesystem

        Args:
            bucket: Bucket name
            key: Object key
            file_path: Path to save downloaded file
            **kwargs: Additional boto3 download_file arguments

        Returns:
            Download response
        """
        self.client.download_file(bucket, key, file_path, **kwargs)
        return {"Bucket": bucket, "Key": key, "FilePath": file_path}

    def generate_presigned_url(
        self,
        operation: str,
        bucket: str,
        key: str,
        expires_in: int = 3600,
        **kwargs
    ) -> str:
        """
        Generate a presigned URL for object access

        Args:
            operation: Operation name ('get_object', 'put_object', etc.)
            bucket: Bucket name
            key: Object key
            expires_in: URL expiration time in seconds (default: 1 hour)
            **kwargs: Additional parameters for the operation

        Returns:
            Presigned URL string
        """
        params = {"Bucket": bucket, "Key": key, **kwargs}
        return self.client.generate_presigned_url(
            operation,
            Params=params,
            ExpiresIn=expires_in
        )

    def upload_fileobj(
        self,
        fileobj: BinaryIO,
        bucket: str,
        key: str,
        metadata: Optional[Dict[str, str]] = None,
        **kwargs
    ) -> None:
        """
        Upload a file-like object

        Args:
            fileobj: File-like object to upload
            bucket: Bucket name
            key: Object key
            metadata: Custom metadata dictionary
            **kwargs: Additional boto3 upload_fileobj arguments
        """
        extra_args = kwargs.copy()
        if metadata:
            extra_args["Metadata"] = metadata

        self.client.upload_fileobj(fileobj, bucket, key, ExtraArgs=extra_args)

    def download_fileobj(
        self,
        bucket: str,
        key: str,
        fileobj: BinaryIO,
        **kwargs
    ) -> None:
        """
        Download to a file-like object

        Args:
            bucket: Bucket name
            key: Object key
            fileobj: File-like object to write to
            **kwargs: Additional boto3 download_fileobj arguments
        """
        self.client.download_fileobj(bucket, key, fileobj, **kwargs)

    # Context Manager Support

    def __enter__(self):
        """Enter context manager"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context manager"""
        # boto3 client doesn't need explicit cleanup
        pass

    def close(self):
        """Close client connections"""
        # boto3 client doesn't need explicit cleanup
        pass
