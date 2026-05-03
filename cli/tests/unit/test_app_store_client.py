"""
Unit tests for App Store Client and related components.

Tests the app_store module including:
- AppStoreClient contract interaction
- MetadataBuilder metadata extraction
- Type validation and error handling
"""

import json
import os
import tempfile
import pytest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Import app_store components
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../'))

from varitykit.core.app_store.types import (
    AppMetadata,
    SubmissionResult,
    AppStatus,
    AppCategory,
    AppStatusEnum,
    MetadataValidationError,
    ContractInteractionError
)

from varitykit.core.app_store.metadata_builder import MetadataBuilder
from varitykit.core.app_store.client import AppStoreClient


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture
def sample_package_json():
    """Sample package.json data"""
    return {
        "name": "my-awesome-app",
        "version": "1.0.0",
        "description": "An awesome Web3 application built with Varity SDK",
        "repository": {
            "type": "git",
            "url": "https://github.com/user/my-awesome-app"
        },
        "varity": {
            "category": "DeFi",
            "logo": "public/logo.png",
            "screenshots": [
                "public/screenshots/1.png",
                "public/screenshots/2.png"
            ]
        }
    }


@pytest.fixture
def temp_project(sample_package_json):
    """Create a temporary project with package.json"""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create package.json
        package_json_path = os.path.join(tmpdir, 'package.json')
        with open(package_json_path, 'w') as f:
            json.dump(sample_package_json, f)

        # Create logo and screenshots
        public_dir = os.path.join(tmpdir, 'public')
        screenshots_dir = os.path.join(public_dir, 'screenshots')
        os.makedirs(screenshots_dir, exist_ok=True)

        # Create dummy image files
        logo_path = os.path.join(public_dir, 'logo.png')
        with open(logo_path, 'w') as f:
            f.write('fake logo content')

        for i in [1, 2]:
            screenshot_path = os.path.join(screenshots_dir, f'{i}.png')
            with open(screenshot_path, 'w') as f:
                f.write(f'fake screenshot {i}')

        yield tmpdir


@pytest.fixture
def mock_app_store_client():
    """Mock AppStoreClient with required env vars"""
    with patch.dict(os.environ, {
        'VARITY_APP_STORE_ADDRESS': '0x1234567890123456789012345678901234567890',
        'DEVELOPER_WALLET_KEY': '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        'THIRDWEB_CLIENT_ID': 'test_client_id_12345'
    }):
        yield AppStoreClient()


# ============================================================================
# AppMetadata Tests
# ============================================================================

class TestAppMetadata:
    """Test AppMetadata data class and validation"""

    def test_valid_metadata(self):
        """Test creating valid metadata"""
        metadata = AppMetadata(
            name="Test App",
            description="A test application with valid metadata",
            app_url="https://app.example.com",
            logo_url="https://ipfs.io/ipfs/QmTest",
            github_url="https://github.com/user/repo",
            category="DeFi",
            screenshots=["https://ipfs.io/ipfs/QmScreenshot1"],
            chain_id=33529
        )

        # Should not raise
        metadata.validate()

        assert metadata.name == "Test App"
        assert metadata.category == "DeFi"
        assert metadata.chain_id == 33529

    def test_invalid_name_too_short(self):
        """Test validation fails for short name"""
        metadata = AppMetadata(
            name="AB",  # Too short
            description="Valid description text",
            app_url="https://app.example.com",
            logo_url="https://ipfs.io/ipfs/QmTest",
            github_url="https://github.com/user/repo",
            category="DeFi",
            screenshots=[],
            chain_id=33529
        )

        with pytest.raises(MetadataValidationError, match="at least 3 characters"):
            metadata.validate()

    def test_invalid_description_too_short(self):
        """Test validation fails for short description"""
        metadata = AppMetadata(
            name="Test App",
            description="Short",  # Too short
            app_url="https://app.example.com",
            logo_url="https://ipfs.io/ipfs/QmTest",
            github_url="https://github.com/user/repo",
            category="DeFi",
            screenshots=[],
            chain_id=33529
        )

        with pytest.raises(MetadataValidationError, match="at least 10 characters"):
            metadata.validate()

    def test_invalid_app_url(self):
        """Test validation fails for invalid app URL"""
        metadata = AppMetadata(
            name="Test App",
            description="Valid description text",
            app_url="not-a-url",  # Invalid
            logo_url="https://ipfs.io/ipfs/QmTest",
            github_url="https://github.com/user/repo",
            category="DeFi",
            screenshots=[],
            chain_id=33529
        )

        with pytest.raises(MetadataValidationError, match="Invalid app URL"):
            metadata.validate()

    def test_invalid_category(self):
        """Test validation fails for invalid category"""
        metadata = AppMetadata(
            name="Test App",
            description="Valid description text",
            app_url="https://app.example.com",
            logo_url="https://ipfs.io/ipfs/QmTest",
            github_url="https://github.com/user/repo",
            category="InvalidCategory",  # Invalid
            screenshots=[],
            chain_id=33529
        )

        with pytest.raises(MetadataValidationError, match="Invalid category"):
            metadata.validate()

    def test_to_contract_params(self):
        """Test conversion to contract parameters"""
        metadata = AppMetadata(
            name="Test App",
            description="Test description",
            app_url="https://app.example.com",
            logo_url="https://ipfs.io/ipfs/QmLogo",
            github_url="https://github.com/user/repo",
            category="DeFi",
            screenshots=["https://ipfs.io/ipfs/QmScreenshot1"],
            chain_id=33529
        )

        params = metadata.to_contract_params()

        assert params['name'] == "Test App"
        assert params['appUrl'] == "https://app.example.com"
        assert params['category'] == "DeFi"
        assert len(params['screenshots']) == 1


# ============================================================================
# MetadataBuilder Tests
# ============================================================================

class TestMetadataBuilder:
    """Test MetadataBuilder functionality"""

    def test_load_package_json(self, temp_project):
        """Test loading package.json"""
        builder = MetadataBuilder()
        package_json_path = os.path.join(temp_project, 'package.json')

        data = builder._load_package_json(package_json_path)

        assert data['name'] == 'my-awesome-app'
        assert data['description'] == 'An awesome Web3 application built with Varity SDK'
        assert 'varity' in data

    def test_load_missing_package_json(self):
        """Test error when package.json missing"""
        builder = MetadataBuilder()

        with pytest.raises(MetadataValidationError, match="not found"):
            builder._load_package_json('/nonexistent/package.json')

    def test_extract_github_url_object(self, sample_package_json):
        """Test extracting GitHub URL from repository object"""
        builder = MetadataBuilder()

        url = builder._extract_github_url(sample_package_json)

        assert url == "https://github.com/user/my-awesome-app"

    def test_extract_github_url_string(self):
        """Test extracting GitHub URL from repository string"""
        builder = MetadataBuilder()
        package_data = {
            "repository": "https://github.com/user/repo"
        }

        url = builder._extract_github_url(package_data)

        assert url == "https://github.com/user/repo"

    def test_extract_github_url_git_protocol(self):
        """Test extracting and cleaning git:// URLs"""
        builder = MetadataBuilder()
        package_data = {
            "repository": {
                "url": "git+https://github.com/user/repo.git"
            }
        }

        url = builder._extract_github_url(package_data)

        assert url == "https://github.com/user/repo"
        assert not url.startswith('git+')
        assert not url.endswith('.git')

    @patch('varitykit.core.app_store.metadata_builder.MetadataBuilder.ipfs_uploader')
    def test_build_from_deployment(self, mock_ipfs, temp_project):
        """Test building metadata from deployment"""
        # Mock IPFS upload
        mock_ipfs_instance = MagicMock()
        mock_ipfs_instance.upload.return_value = {
            'success': True,
            'gatewayUrl': 'https://ipfs.io/ipfs/QmTestLogo',
            'cid': 'QmTestLogo'
        }
        mock_ipfs.return_value = mock_ipfs_instance

        builder = MetadataBuilder()
        builder._ipfs_uploader = mock_ipfs_instance

        # Mock project info
        project_info = MagicMock()
        project_info.project_type = 'nextjs'

        deployment_result = {
            'frontend_url': 'https://ipfs.io/ipfs/QmTestApp'
        }

        package_json_path = os.path.join(temp_project, 'package.json')

        metadata = builder.build_from_deployment(
            project_info=project_info,
            deployment_result=deployment_result,
            package_json_path=package_json_path,
            chain_id=33529
        )

        assert metadata.name == "My Awesome App"  # Converted from 'my-awesome-app'
        assert metadata.description == "An awesome Web3 application built with Varity SDK"
        assert metadata.app_url == "https://ipfs.io/ipfs/QmTestApp"
        assert metadata.category == "DeFi"
        assert metadata.chain_id == 33529


# ============================================================================
# AppStoreClient Tests
# ============================================================================

class TestAppStoreClient:
    """Test AppStoreClient functionality"""

    def test_client_initialization_with_env_vars(self, mock_app_store_client):
        """Test client initializes with environment variables"""
        client = mock_app_store_client

        assert client.contract_address == '0x1234567890123456789012345678901234567890'
        assert client.signer_key.startswith('0xabcdef')
        assert client.thirdweb_client_id == 'test_client_id_12345'
        assert client.network == 'varity'

    def test_client_initialization_missing_contract_address(self):
        """Test error when contract address missing"""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ContractInteractionError, match="contract address not provided"):
                AppStoreClient()

    def test_client_initialization_invalid_network(self):
        """Test error with invalid network"""
        with patch.dict(os.environ, {
            'VARITY_APP_STORE_ADDRESS': '0x1234',
            'DEVELOPER_WALLET_KEY': '0xabcd',
            'THIRDWEB_CLIENT_ID': 'test'
        }):
            with pytest.raises(ContractInteractionError, match="Invalid network"):
                AppStoreClient(network='invalid_network')

    def test_check_dependencies(self, mock_app_store_client):
        """Test dependency checking"""
        client = mock_app_store_client

        deps = client.check_dependencies()

        assert 'node_installed' in deps
        assert 'contract_address_set' in deps
        assert 'signer_key_set' in deps
        assert 'thirdweb_client_id_set' in deps

        # These should be True based on our mock
        assert deps['contract_address_set'] is True
        assert deps['signer_key_set'] is True
        assert deps['thirdweb_client_id_set'] is True

    @patch('subprocess.run')
    def test_submit_app_success(self, mock_subprocess, mock_app_store_client):
        """Test successful app submission"""
        # Mock subprocess response
        mock_subprocess.return_value = MagicMock(
            returncode=0,
            stdout=json.dumps({
                'success': True,
                'appId': 42,
                'transactionHash': '0xabcdef1234567890'
            })
        )

        client = mock_app_store_client

        metadata = AppMetadata(
            name="Test App",
            description="A test application for unit testing",
            app_url="https://test.example.com",
            logo_url="https://ipfs.io/ipfs/QmLogo",
            github_url="https://github.com/user/repo",
            category="DeFi",
            screenshots=[],
            chain_id=33529
        )

        result = client.submit_app(metadata)

        assert result.success is True
        assert result.app_id == 42
        assert result.tx_hash == '0xabcdef1234567890'
        assert result.url == 'https://store.varity.so/apps/42'

    @patch('subprocess.run')
    def test_submit_app_failure(self, mock_subprocess, mock_app_store_client):
        """Test failed app submission"""
        # Mock subprocess failure
        mock_subprocess.return_value = MagicMock(
            returncode=0,
            stdout=json.dumps({
                'success': False,
                'error': 'Transaction reverted'
            })
        )

        client = mock_app_store_client

        metadata = AppMetadata(
            name="Test App",
            description="A test application",
            app_url="https://test.example.com",
            logo_url="https://ipfs.io/ipfs/QmLogo",
            github_url="https://github.com/user/repo",
            category="DeFi",
            screenshots=[],
            chain_id=33529
        )

        result = client.submit_app(metadata)

        assert result.success is False
        assert result.error_message == 'Transaction reverted'

    def test_generate_submission_script(self, mock_app_store_client):
        """Test submission script generation"""
        client = mock_app_store_client

        metadata = AppMetadata(
            name="Test App",
            description="Test description",
            app_url="https://test.com",
            logo_url="https://ipfs.io/ipfs/QmLogo",
            github_url="https://github.com/user/repo",
            category="DeFi",
            screenshots=["https://ipfs.io/ipfs/QmScreen1"],
            chain_id=33529
        )

        script = client._generate_submission_script(metadata)

        # Verify script contains required elements
        assert 'createThirdwebClient' in script
        assert 'prepareContractCall' in script
        assert 'sendTransaction' in script
        assert client.contract_address in script
        assert 'submitApp' in script
        assert '"Test App"' in script
        assert '"DeFi"' in script


# ============================================================================
# Integration Tests
# ============================================================================

class TestIntegration:
    """Integration tests for the complete workflow"""

    @patch('varitykit.core.app_store.metadata_builder.MetadataBuilder.ipfs_uploader')
    @patch('subprocess.run')
    def test_complete_submission_workflow(
        self,
        mock_subprocess,
        mock_ipfs,
        temp_project
    ):
        """Test complete workflow from metadata building to submission"""
        # Mock IPFS upload
        mock_ipfs_instance = MagicMock()
        mock_ipfs_instance.upload.return_value = {
            'success': True,
            'gatewayUrl': 'https://ipfs.io/ipfs/QmTestLogo',
            'cid': 'QmTestLogo'
        }

        # Mock contract submission
        mock_subprocess.return_value = MagicMock(
            returncode=0,
            stdout=json.dumps({
                'success': True,
                'appId': 123,
                'transactionHash': '0xtest123'
            })
        )

        with patch.dict(os.environ, {
            'VARITY_APP_STORE_ADDRESS': '0x1234',
            'DEVELOPER_WALLET_KEY': '0xabcd',
            'THIRDWEB_CLIENT_ID': 'test'
        }):
            # Build metadata
            builder = MetadataBuilder()
            builder._ipfs_uploader = mock_ipfs_instance

            project_info = MagicMock()
            deployment_result = {'frontend_url': 'https://test.com'}
            package_json_path = os.path.join(temp_project, 'package.json')

            metadata = builder.build_from_deployment(
                project_info=project_info,
                deployment_result=deployment_result,
                package_json_path=package_json_path
            )

            # Submit to App Store
            client = AppStoreClient()
            result = client.submit_app(metadata)

            # Verify success
            assert result.success is True
            assert result.app_id == 123
            assert result.url == 'https://store.varity.so/apps/123'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
