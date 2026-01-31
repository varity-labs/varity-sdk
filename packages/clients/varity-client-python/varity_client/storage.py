"""
Storage Operations Module

IPFS storage operations for decentralized file storage.
"""

import asyncio
import aiohttp
from typing import Optional, Union, BinaryIO
from pathlib import Path

from .types import IPFSUploadResult
from .exceptions import StorageError


class StorageManager:
    """
    Manager for IPFS storage operations.

    Handles file uploads, downloads, and pinning operations.
    """

    def __init__(self, client):
        """
        Initialize storage manager.

        Args:
            client: VarityClient instance
        """
        self.client = client
        self.ipfs_gateway = client.ipfs_gateway
        self.thirdweb_client_id = client.thirdweb_client_id

        # Thirdweb storage API endpoint
        self.upload_endpoint = "https://storage.thirdweb.com/ipfs/upload"

    async def upload_to_ipfs(
        self,
        content: Union[bytes, str, BinaryIO],
        filename: Optional[str] = None,
        pin: bool = True,
    ) -> IPFSUploadResult:
        """
        Upload file to IPFS.

        Args:
            content: File content (bytes, string, or file-like object)
            filename: Optional filename for metadata
            pin: Whether to pin the content (default: True)

        Returns:
            IPFSUploadResult with CID and gateway URL

        Example:
            >>> # Upload bytes
            >>> result = await client.storage.upload_to_ipfs(
            ...     b"Hello, IPFS!",
            ...     filename="hello.txt"
            ... )
            >>> print(f"CID: {result.cid}")
            >>> print(f"URL: {result.gateway_url}")
        """
        try:
            # Convert content to bytes if needed
            if isinstance(content, str):
                content_bytes = content.encode("utf-8")
            elif isinstance(content, BinaryIO):
                content_bytes = content.read()
            else:
                content_bytes = content

            # Upload to Thirdweb storage
            async with aiohttp.ClientSession() as session:
                form_data = aiohttp.FormData()
                form_data.add_field(
                    "file",
                    content_bytes,
                    filename=filename or "file",
                )

                headers = {
                    "X-Client-Id": self.thirdweb_client_id,
                }

                async with session.post(
                    self.upload_endpoint,
                    data=form_data,
                    headers=headers,
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise StorageError(
                            f"Failed to upload to IPFS: {response.status} - {error_text}"
                        )

                    result = await response.json()

                    # Extract CID from response
                    # Thirdweb returns: {"IpfsHash": "Qm...", ...}
                    cid = result.get("IpfsHash")
                    if not cid:
                        raise StorageError("No CID returned from upload")

                    # Generate gateway URL
                    gateway_url = f"{self.ipfs_gateway}{cid}"

                    return IPFSUploadResult(
                        cid=cid,
                        size=len(content_bytes),
                        gateway_url=gateway_url,
                        pinned=pin,
                    )
        except aiohttp.ClientError as e:
            raise StorageError(f"Network error uploading to IPFS: {str(e)}") from e
        except Exception as e:
            raise StorageError(f"Failed to upload to IPFS: {str(e)}") from e

    async def upload_file(
        self, file_path: str, pin: bool = True
    ) -> IPFSUploadResult:
        """
        Upload file from filesystem to IPFS.

        Args:
            file_path: Path to file to upload
            pin: Whether to pin the content (default: True)

        Returns:
            IPFSUploadResult with CID and gateway URL

        Example:
            >>> result = await client.storage.upload_file("/path/to/file.pdf")
            >>> print(f"Uploaded to: {result.gateway_url}")
        """
        try:
            path = Path(file_path)
            if not path.exists():
                raise StorageError(f"File not found: {file_path}")

            # Read file content
            content = path.read_bytes()

            # Upload with filename
            return await self.upload_to_ipfs(
                content, filename=path.name, pin=pin
            )
        except Exception as e:
            raise StorageError(f"Failed to upload file: {str(e)}") from e

    async def download_from_ipfs(
        self, cid: str, output_path: Optional[str] = None
    ) -> bytes:
        """
        Download file from IPFS.

        Args:
            cid: IPFS content identifier
            output_path: Optional path to save file

        Returns:
            File content as bytes

        Example:
            >>> # Download to memory
            >>> content = await client.storage.download_from_ipfs("Qm...")
            >>>
            >>> # Download to file
            >>> await client.storage.download_from_ipfs(
            ...     "Qm...",
            ...     output_path="/path/to/save/file.pdf"
            ... )
        """
        try:
            gateway_url = self.get_gateway_url(cid)

            async with aiohttp.ClientSession() as session:
                async with session.get(gateway_url) as response:
                    if response.status != 200:
                        raise StorageError(
                            f"Failed to download from IPFS: {response.status}"
                        )

                    content = await response.read()

                    # Save to file if output_path provided
                    if output_path:
                        path = Path(output_path)
                        path.parent.mkdir(parents=True, exist_ok=True)
                        path.write_bytes(content)

                    return content
        except aiohttp.ClientError as e:
            raise StorageError(f"Network error downloading from IPFS: {str(e)}") from e
        except Exception as e:
            raise StorageError(f"Failed to download from IPFS: {str(e)}") from e

    async def pin_content(self, cid: str) -> bool:
        """
        Pin content to IPFS to ensure it remains available.

        Args:
            cid: IPFS content identifier

        Returns:
            True if pinning successful

        Example:
            >>> await client.storage.pin_content("Qm...")
        """
        # Note: This requires a pinning service API
        # For now, return True as placeholder
        # In production, integrate with:
        # - Thirdweb storage API
        # - Pinata
        # - web3.storage
        # - NFT.storage
        return True

    def get_gateway_url(self, cid: str) -> str:
        """
        Generate gateway URL for IPFS content.

        Args:
            cid: IPFS content identifier

        Returns:
            Gateway URL

        Example:
            >>> url = client.storage.get_gateway_url("Qm...")
            >>> print(url)
            'https://gateway.ipfscdn.io/ipfs/Qm...'
        """
        return f"{self.ipfs_gateway}{cid}"

    async def upload_json(self, data: dict, pin: bool = True) -> IPFSUploadResult:
        """
        Upload JSON data to IPFS.

        Args:
            data: Dictionary to upload as JSON
            pin: Whether to pin the content

        Returns:
            IPFSUploadResult with CID and gateway URL

        Example:
            >>> result = await client.storage.upload_json({
            ...     "name": "My NFT",
            ...     "description": "NFT metadata"
            ... })
        """
        import json

        try:
            json_string = json.dumps(data, indent=2)
            return await self.upload_to_ipfs(
                json_string, filename="metadata.json", pin=pin
            )
        except Exception as e:
            raise StorageError(f"Failed to upload JSON: {str(e)}") from e

    async def download_json(self, cid: str) -> dict:
        """
        Download and parse JSON from IPFS.

        Args:
            cid: IPFS content identifier

        Returns:
            Parsed JSON as dictionary

        Example:
            >>> data = await client.storage.download_json("Qm...")
            >>> print(data["name"])
        """
        import json

        try:
            content = await self.download_from_ipfs(cid)
            return json.loads(content.decode("utf-8"))
        except Exception as e:
            raise StorageError(f"Failed to download JSON: {str(e)}") from e
