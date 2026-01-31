"""
Metadata Builder for App Store submissions.

This module extracts metadata from deployed applications and prepares it
for submission to the Varity App Store smart contract.
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .types import AppCategory, AppMetadata, AssetUploadError, MetadataValidationError


class MetadataBuilder:
    """
    Builds App Store metadata from deployment information.

    Extracts app information from package.json, uploads logo and screenshots
    to IPFS, and constructs AppMetadata for smart contract submission.

    Usage:
        builder = MetadataBuilder()
        metadata = builder.build_from_deployment(
            project_info=project_info,
            deployment_result={'frontend_url': 'https://...'},
            package_json_path='./package.json'
        )
    """

    def __init__(self):
        """Initialize MetadataBuilder."""
        self._ipfs_uploader = None

    @property
    def ipfs_uploader(self):
        """Lazy load IPFS uploader."""
        if self._ipfs_uploader is None:
            try:
                from ..ipfs_uploader import IPFSUploader

                self._ipfs_uploader = IPFSUploader()
            except ImportError:
                raise ImportError("IPFSUploader not available")
        return self._ipfs_uploader

    def build_from_deployment(
        self,
        project_info: Any,
        deployment_result: Dict[str, Any],
        package_json_path: str,
        chain_id: int = 33529,
    ) -> AppMetadata:
        """
        Build App Store metadata from deployment information.

        Args:
            project_info: ProjectInfo from project detection
            deployment_result: Deployment result dictionary with frontend_url
            package_json_path: Path to package.json file
            chain_id: Chain ID where app is deployed (default: 33529 for Varity L3)

        Returns:
            AppMetadata ready for smart contract submission

        Raises:
            MetadataValidationError: If required fields are missing or invalid
            AssetUploadError: If logo/screenshot upload fails
        """
        # Load and parse package.json
        package_data = self._load_package_json(package_json_path)

        # Extract basic info from package.json
        name = package_data.get("name", "").replace("-", " ").title()
        description = package_data.get("description", "")

        if not name:
            raise MetadataValidationError("App name not found in package.json")
        if not description:
            raise MetadataValidationError("App description not found in package.json")

        # Extract GitHub URL from repository field
        github_url = self._extract_github_url(package_data)

        # Extract Varity-specific configuration
        varity_config = package_data.get("varity", {})
        category = varity_config.get("category", "Other")

        # Validate category
        if category not in [c.value for c in AppCategory]:
            category = "Other"

        # Get app URL from deployment result
        app_url = deployment_result.get("frontend_url", "")
        if not app_url:
            raise MetadataValidationError("Frontend URL not found in deployment result")

        # Upload logo to IPFS
        logo_path = varity_config.get("logo", "public/logo.png")
        logo_url = self._upload_asset_to_ipfs(logo_path, package_json_path)

        # Upload screenshots to IPFS (optional)
        screenshot_paths = varity_config.get("screenshots", [])
        screenshot_urls = []
        for screenshot_path in screenshot_paths:
            try:
                screenshot_url = self._upload_asset_to_ipfs(screenshot_path, package_json_path)
                screenshot_urls.append(screenshot_url)
            except AssetUploadError as e:
                # Log warning but don't fail if screenshots can't be uploaded
                print(f"Warning: Could not upload screenshot {screenshot_path}: {e}")

        # Build and validate metadata
        metadata = AppMetadata(
            name=name,
            description=description,
            app_url=app_url,
            logo_url=logo_url,
            github_url=github_url,
            category=category,
            screenshots=screenshot_urls,
            chain_id=chain_id,
        )

        # Validate before returning
        metadata.validate()

        return metadata

    def build_from_package_json(
        self, package_json_path: str, app_url: str, chain_id: int = 33529
    ) -> AppMetadata:
        """
        Build metadata directly from package.json (for manual submission).

        Args:
            package_json_path: Path to package.json
            app_url: Deployed application URL
            chain_id: Chain ID (default: 33529 for Varity L3)

        Returns:
            AppMetadata ready for submission

        Raises:
            MetadataValidationError: If required fields are missing
            AssetUploadError: If asset upload fails
        """
        package_data = self._load_package_json(package_json_path)

        name = package_data.get("name", "").replace("-", " ").title()
        description = package_data.get("description", "")
        github_url = self._extract_github_url(package_data)

        varity_config = package_data.get("varity", {})
        category = varity_config.get("category", "Other")
        logo_path = varity_config.get("logo", "public/logo.png")

        # Upload assets
        logo_url = self._upload_asset_to_ipfs(logo_path, package_json_path)

        screenshot_paths = varity_config.get("screenshots", [])
        screenshot_urls = []
        for screenshot_path in screenshot_paths:
            try:
                screenshot_url = self._upload_asset_to_ipfs(screenshot_path, package_json_path)
                screenshot_urls.append(screenshot_url)
            except AssetUploadError:
                pass  # Continue without screenshots

        metadata = AppMetadata(
            name=name,
            description=description,
            app_url=app_url,
            logo_url=logo_url,
            github_url=github_url,
            category=category,
            screenshots=screenshot_urls,
            chain_id=chain_id,
        )

        metadata.validate()
        return metadata

    def _load_package_json(self, package_json_path: str) -> Dict[str, Any]:
        """
        Load and parse package.json file.

        Args:
            package_json_path: Path to package.json

        Returns:
            Parsed package.json data

        Raises:
            MetadataValidationError: If package.json cannot be loaded
        """
        try:
            with open(package_json_path, "r", encoding="utf-8") as f:
                data: Dict[str, Any] = json.load(f)
                return data
        except FileNotFoundError:
            raise MetadataValidationError(f"package.json not found at: {package_json_path}")
        except json.JSONDecodeError as e:
            raise MetadataValidationError(f"Invalid package.json: {e}")

    def _extract_github_url(self, package_data: Dict[str, Any]) -> str:
        """
        Extract GitHub URL from package.json repository field.

        Args:
            package_data: Parsed package.json data

        Returns:
            GitHub repository URL or empty string if not found
        """
        repository = package_data.get("repository", {})

        # Handle string repository
        if isinstance(repository, str):
            if "github.com" in repository:
                # Convert git URLs to https
                if repository.startswith("git+"):
                    return repository.replace("git+", "").replace(".git", "")
                return repository
            return ""

        # Handle object repository
        if isinstance(repository, dict):
            url: str = repository.get("url", "")
            if "github.com" in url:
                # Clean up git URLs
                url = url.replace("git+", "").replace("git://", "https://")
                url = url.replace(".git", "")
                return url

        return ""

    def _upload_asset_to_ipfs(self, asset_path: str, package_json_path: str) -> str:
        """
        Upload an asset (logo or screenshot) to IPFS.

        Args:
            asset_path: Relative path to asset (from varity config)
            package_json_path: Path to package.json (to resolve relative paths)

        Returns:
            IPFS gateway URL to the uploaded asset

        Raises:
            AssetUploadError: If upload fails
        """
        # Resolve asset path relative to package.json location
        project_root = Path(package_json_path).parent
        full_asset_path = project_root / asset_path

        if not full_asset_path.exists():
            raise AssetUploadError(f"Asset not found: {asset_path} (resolved to {full_asset_path})")

        if not full_asset_path.is_file():
            raise AssetUploadError(f"Asset is not a file: {asset_path}")

        # Create temporary directory for single file upload
        import shutil
        import tempfile

        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                # Copy file to temp directory
                temp_file = Path(temp_dir) / full_asset_path.name
                shutil.copy2(full_asset_path, temp_file)

                # Upload to IPFS
                upload_result = self.ipfs_uploader.upload(temp_dir)

                if not upload_result.get("success"):
                    raise AssetUploadError(upload_result.get("error_message", "IPFS upload failed"))

                # Return gateway URL
                gateway_url_raw = upload_result.get("gatewayUrl", "")
                if not gateway_url_raw:
                    raise AssetUploadError("No gateway URL returned from IPFS upload")

                gateway_url: str = str(gateway_url_raw)
                return gateway_url

        except Exception as e:
            if isinstance(e, AssetUploadError):
                raise
            raise AssetUploadError(f"Failed to upload asset {asset_path}: {e}")

    def upload_assets_to_ipfs(
        self, logo_path: str, screenshot_paths: List[str], project_root: str
    ) -> Tuple[str, List[str]]:
        """
        Upload logo and screenshots to IPFS.

        Args:
            logo_path: Path to logo file
            screenshot_paths: List of paths to screenshot files
            project_root: Project root directory

        Returns:
            Tuple of (logo_url, screenshot_urls)

        Raises:
            AssetUploadError: If logo upload fails (screenshots are optional)
        """
        package_json_path = os.path.join(project_root, "package.json")

        # Upload logo (required)
        logo_url = self._upload_asset_to_ipfs(logo_path, package_json_path)

        # Upload screenshots (optional)
        screenshot_urls = []
        for screenshot_path in screenshot_paths:
            try:
                screenshot_url = self._upload_asset_to_ipfs(screenshot_path, package_json_path)
                screenshot_urls.append(screenshot_url)
            except AssetUploadError as e:
                print(f"Warning: Could not upload screenshot {screenshot_path}: {e}")

        return logo_url, screenshot_urls
