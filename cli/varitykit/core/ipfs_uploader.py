"""
IPFS Uploader

Uploads directories to IPFS using thirdweb Storage via Node.js bridge script.
This module provides a Python interface to the thirdweb Storage SDK.
"""

import json
import os
import subprocess
from pathlib import Path
from typing import Dict, List, Optional


class IPFSUploadError(Exception):
    """Raised when IPFS upload fails"""

    pass


class IPFSUploadResult:
    """Result of an IPFS upload operation"""

    def __init__(self, data: Dict):
        self.success: bool = data.get("success", False)
        self.cid: str = data.get("cid", "")
        self.gateway_url: str = data.get("gatewayUrl", "")
        self.thirdweb_url: str = data.get("thirdwebUrl", "")
        self.files: List[str] = data.get("files", [])
        self.total_size: int = data.get("totalSize", 0)
        self.file_count: int = data.get("fileCount", 0)
        self.upload_time: int = data.get("uploadTime", 0)

    def __repr__(self):
        return (
            f"IPFSUploadResult(cid='{self.cid}', "
            f"files={self.file_count}, "
            f"size={self.total_size} bytes, "
            f"time={self.upload_time}ms)"
        )


class IPFSUploader:
    """
    Upload files to IPFS using thirdweb Storage

    This class provides a Python interface to upload directories to IPFS
    via the thirdweb Storage SDK. It uses a Node.js bridge script to
    leverage the TypeScript SDK.

    Example:
        uploader = IPFSUploader()
        result = uploader.upload('./build')
        print(f"Uploaded to IPFS: {result.gateway_url}")
        print(f"CID: {result.cid}")
    """

    def __init__(self, client_id: Optional[str] = None):
        """
        Initialize IPFS uploader

        Args:
            client_id: thirdweb client ID (optional, falls back to env var)
        """
        self.client_id = client_id or os.getenv("THIRDWEB_CLIENT_ID")
        self.script_path = Path(__file__).parent.parent.parent / "scripts" / "upload_to_ipfs.js"

        # Verify Node.js script exists
        if not self.script_path.exists():
            raise FileNotFoundError(
                f"IPFS upload script not found: {self.script_path}\n"
                "Run: cd cli/scripts && npm install"
            )

    def upload(self, directory: str) -> IPFSUploadResult:
        """
        Upload directory to IPFS

        Uploads all files in the specified directory to IPFS using
        thirdweb Storage. Returns upload result with CID and URLs.

        Args:
            directory: Path to directory to upload

        Returns:
            IPFSUploadResult with CID, URLs, and metadata

        Raises:
            IPFSUploadError: If upload fails
            FileNotFoundError: If directory doesn't exist

        Example:
            uploader = IPFSUploader()
            result = uploader.upload('./out')

            print(f"Success: {result.success}")
            print(f"CID: {result.cid}")
            print(f"Gateway URL: {result.gateway_url}")
            print(f"Files uploaded: {result.file_count}")
        """
        # Validate directory exists
        dir_path = Path(directory).resolve()
        if not dir_path.exists():
            raise FileNotFoundError(f"Directory not found: {directory}")

        if not dir_path.is_dir():
            raise ValueError(f"Path is not a directory: {directory}")

        # Check for client ID
        if not self.client_id:
            raise IPFSUploadError(
                "THIRDWEB_CLIENT_ID required. Set as environment variable or pass to constructor.\n"
                "Get your client ID from: https://thirdweb.com/dashboard"
            )

        # Check Node.js is installed
        try:
            subprocess.run(["node", "--version"], capture_output=True, check=True, timeout=5)
        except (subprocess.CalledProcessError, FileNotFoundError):
            raise IPFSUploadError(
                "Node.js not found. Install from: https://nodejs.org/\n"
                "Required: Node.js 18 or higher"
            )

        # Build command
        cmd = ["node", str(self.script_path), str(dir_path), self.client_id]

        try:
            # Execute Node.js script
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=300, check=False  # 5 minute timeout
            )

            # Parse JSON output
            if result.returncode == 0:
                # Success - parse stdout
                try:
                    data = json.loads(result.stdout)
                    return IPFSUploadResult(data)
                except json.JSONDecodeError as e:
                    raise IPFSUploadError(
                        f"Failed to parse upload result: {e}\n" f"Output: {result.stdout}"
                    )
            else:
                # Failure - parse stderr
                try:
                    error_data = json.loads(result.stderr)
                    error_msg = error_data.get("error", "Unknown error")
                    raise IPFSUploadError(f"IPFS upload failed: {error_msg}")
                except json.JSONDecodeError:
                    # Stderr is not JSON, return raw error
                    raise IPFSUploadError(
                        f"IPFS upload failed:\n"
                        f"Return code: {result.returncode}\n"
                        f"Stderr: {result.stderr}\n"
                        f"Stdout: {result.stdout}"
                    )

        except subprocess.TimeoutExpired:
            raise IPFSUploadError(
                "Upload timeout after 5 minutes. "
                "Try uploading a smaller directory or check your network connection."
            )
        except Exception as e:
            raise IPFSUploadError(f"Unexpected error during upload: {e}")

    def check_dependencies(self) -> Dict[str, bool]:
        """
        Check if all dependencies are available

        Returns:
            Dict with status of each dependency

        Example:
            uploader = IPFSUploader()
            status = uploader.check_dependencies()

            if not status['node_installed']:
                print("Please install Node.js")
            if not status['script_exists']:
                print("Run: cd cli/scripts && npm install")
        """
        status = {
            "node_installed": False,
            "script_exists": self.script_path.exists(),
            "client_id_set": bool(self.client_id),
        }

        # Check Node.js
        try:
            result = subprocess.run(["node", "--version"], capture_output=True, timeout=5)
            status["node_installed"] = result.returncode == 0
        except (subprocess.CalledProcessError, FileNotFoundError):
            pass

        return status

    def get_file_count(self, directory: str) -> int:
        """
        Count files in directory recursively

        Args:
            directory: Path to directory

        Returns:
            Number of files

        Example:
            uploader = IPFSUploader()
            count = uploader.get_file_count('./build')
            print(f"Will upload {count} files")
        """
        dir_path = Path(directory)
        if not dir_path.exists():
            return 0

        return sum(1 for _ in dir_path.rglob("*") if _.is_file())

    def get_directory_size(self, directory: str) -> int:
        """
        Calculate total size of directory in bytes

        Args:
            directory: Path to directory

        Returns:
            Total size in bytes

        Example:
            uploader = IPFSUploader()
            size = uploader.get_directory_size('./build')
            print(f"Directory size: {size / 1024 / 1024:.2f} MB")
        """
        dir_path = Path(directory)
        if not dir_path.exists():
            return 0

        total_size = 0
        for file_path in dir_path.rglob("*"):
            if file_path.is_file():
                total_size += file_path.stat().st_size

        return total_size

    @staticmethod
    def format_size(size_bytes: int) -> str:
        """
        Format byte size as human-readable string

        Args:
            size_bytes: Size in bytes

        Returns:
            Formatted string (e.g., "1.5 MB")

        Example:
            formatted = IPFSUploader.format_size(1500000)
            print(formatted)  # "1.43 MB"
        """
        size: float = float(size_bytes)
        for unit in ["B", "KB", "MB", "GB", "TB"]:
            if size < 1024.0:
                return f"{size:.2f} {unit}"
            size /= 1024.0
        return f"{size:.2f} PB"
