"""
Unit Tests for Akash Deployment System

Tests the Akash module components with mocked Akash CLI calls.
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path

# Import Akash components
from varietykit.core.akash.types import (
    AkashProviderBid,
    AkashDeploymentResult,
    AkashDeploymentStatus,
    AkashManifest,
    AkashError,
    AkashProviderError
)
from varietykit.core.akash.provider_selector import ProviderSelector
from varietykit.core.akash.manifest_generator import ManifestGenerator
from varietykit.core.akash.akash_deployer import AkashDeployer

# Import project types
from varietykit.core.types import ProjectInfo, BuildArtifacts


class TestAkashTypes:
    """Test Akash data types"""

    def test_provider_bid_creation(self):
        """Test creating valid provider bid"""
        bid = AkashProviderBid(
            provider="provider.akash.network",
            price=5000,
            location="us-east",
            uptime=99.5,
            reputation_score=95.0
        )

        assert bid.provider == "provider.akash.network"
        assert bid.price == 5000
        assert bid.uptime == 99.5

    def test_provider_bid_validation(self):
        """Test provider bid validation"""
        # Test negative price
        with pytest.raises(ValueError, match="price cannot be negative"):
            AkashProviderBid(provider="test", price=-100)

        # Test invalid uptime
        with pytest.raises(ValueError, match="Uptime must be"):
            AkashProviderBid(provider="test", price=1000, uptime=150)

        # Test invalid reputation
        with pytest.raises(ValueError, match="Reputation score must be"):
            AkashProviderBid(provider="test", price=1000, reputation_score=-10)

    def test_deployment_result_to_dict(self):
        """Test deployment result serialization"""
        result = AkashDeploymentResult(
            success=True,
            deployment_id="12345",
            url="https://app.provider.akash.network",
            status=AkashDeploymentStatus.ACTIVE,
            estimated_monthly_cost=25.50
        )

        result_dict = result.to_dict()

        assert result_dict['success'] is True
        assert result_dict['deployment_id'] == "12345"
        assert result_dict['status'] == 'active'
        assert result_dict['estimated_monthly_cost'] == 25.50


class TestProviderSelector:
    """Test provider selection logic"""

    def test_select_best_provider(self):
        """Test selecting best provider from bids"""
        selector = ProviderSelector(
            price_weight=0.6,
            reputation_weight=0.3,
            uptime_weight=0.1
        )

        bids = [
            AkashProviderBid(
                provider="provider1",
                price=10000,
                reputation_score=80.0,
                uptime=95.0
            ),
            AkashProviderBid(
                provider="provider2",
                price=5000,
                reputation_score=90.0,
                uptime=99.0
            ),
            AkashProviderBid(
                provider="provider3",
                price=7000,
                reputation_score=85.0,
                uptime=97.0
            )
        ]

        best_bid = selector.select_best_provider(bids)

        # Provider2 should win (lowest price + high reputation)
        assert best_bid.provider == "provider2"
        assert best_bid.price == 5000

    def test_select_with_max_price(self):
        """Test provider selection with price ceiling"""
        selector = ProviderSelector()

        bids = [
            AkashProviderBid(provider="expensive", price=15000),
            AkashProviderBid(provider="affordable", price=5000),
        ]

        # Should exclude expensive provider
        best_bid = selector.select_best_provider(bids, max_price=10000)
        assert best_bid.provider == "affordable"

    def test_no_bids_error(self):
        """Test error when no bids available"""
        selector = ProviderSelector()

        with pytest.raises(AkashProviderError, match="No provider bids available"):
            selector.select_best_provider([])

    def test_filter_by_location(self):
        """Test filtering providers by location"""
        selector = ProviderSelector()

        bids = [
            AkashProviderBid(provider="us1", price=5000, location="us-east"),
            AkashProviderBid(provider="eu1", price=6000, location="eu-west"),
            AkashProviderBid(provider="us2", price=5500, location="us-east"),
        ]

        filtered = selector.filter_by_location(bids, "us-east")

        assert len(filtered) == 2
        assert all(bid.location == "us-east" for bid in filtered)

    def test_estimate_monthly_cost(self):
        """Test monthly cost estimation"""
        selector = ProviderSelector()

        # 5000 uakt/block * 432000 blocks/month / 1000000 = 2.16 AKT
        monthly_cost = selector.estimate_monthly_cost(5000)

        assert 2.0 < monthly_cost < 2.5  # Approximate check

    def test_compare_providers(self):
        """Test provider comparison"""
        selector = ProviderSelector()

        bids = [
            AkashProviderBid(provider="p1", price=5000, reputation_score=90.0),
            AkashProviderBid(provider="p2", price=7000, reputation_score=85.0),
        ]

        comparisons = selector.compare_providers(bids)

        assert len(comparisons) == 2
        assert comparisons[0]['provider'] in ['p1', 'p2']
        assert 'score' in comparisons[0]
        assert 'monthly_cost_akt' in comparisons[0]


class TestManifestGenerator:
    """Test SDL manifest generation"""

    @pytest.fixture
    def project_info(self):
        """Sample project info"""
        return ProjectInfo(
            project_type="nextjs",
            framework_version="14.0.0",
            build_command="npm run build",
            output_dir=".next",
            package_manager="npm",
            has_backend=False
        )

    @pytest.fixture
    def build_artifacts(self):
        """Sample build artifacts"""
        return BuildArtifacts(
            success=True,
            output_dir=".next",
            files=["index.html", "bundle.js"],
            entrypoint="index.html",
            total_size_mb=5.0,
            build_time_seconds=30.0
        )

    @pytest.fixture
    def temp_templates_dir(self, tmp_path):
        """Create temporary templates directory"""
        templates_dir = tmp_path / "akash"
        templates_dir.mkdir()

        # Create minimal frontend template
        frontend_template = templates_dir / "frontend.sdl.yaml"
        frontend_template.write_text("""version: "2.0"
services:
  web:
    image: {{ docker_image }}
    expose:
      - port: 80
        as: 80
        to:
          - global: true
""")

        # Create minimal backend template
        backend_template = templates_dir / "backend.sdl.yaml"
        backend_template.write_text("""version: "2.0"
services:
  api:
    image: {{ docker_image }}
    expose:
      - port: {{ port }}
        as: {{ port }}
        to:
          - global: true
""")

        return str(templates_dir)

    def test_generate_frontend_manifest(
        self,
        project_info,
        build_artifacts,
        temp_templates_dir
    ):
        """Test generating frontend manifest"""
        generator = ManifestGenerator(templates_dir=temp_templates_dir)

        manifest = generator.generate_frontend_manifest(
            project_info,
            build_artifacts,
            cpu_units=0.5,
            memory_size="512Mi"
        )

        assert manifest.version == "2.0"
        yaml_content = manifest.to_yaml()
        assert "nginx:alpine" in yaml_content
        assert "version" in yaml_content

    def test_generate_backend_manifest(
        self,
        project_info,
        build_artifacts,
        temp_templates_dir
    ):
        """Test generating backend manifest"""
        generator = ManifestGenerator(templates_dir=temp_templates_dir)

        manifest = generator.generate_backend_manifest(
            project_info,
            build_artifacts,
            runtime="nodejs",
            port=3000
        )

        assert manifest.version == "2.0"
        yaml_content = manifest.to_yaml()
        assert "3000" in yaml_content

    def test_docker_image_selection(self, temp_templates_dir):
        """Test automatic Docker image selection"""
        generator = ManifestGenerator(templates_dir=temp_templates_dir)

        assert generator._get_default_docker_image("nodejs") == "node:18-alpine"
        assert generator._get_default_docker_image("python") == "python:3.11-slim"
        assert generator._get_default_docker_image("go") == "golang:1.21-alpine"

    def test_default_commands(self, temp_templates_dir):
        """Test default command generation"""
        generator = ManifestGenerator(templates_dir=temp_templates_dir)

        assert generator._get_default_command("nodejs") == ["node", "index.js"]
        assert generator._get_default_command("python") == ["python", "main.py"]


class TestAkashDeployer:
    """Test Akash deployer with mocked CLI"""

    @pytest.fixture
    def mock_akash_cli(self, monkeypatch):
        """Mock Akash CLI commands"""
        def mock_run(*args, **kwargs):
            cmd = args[0] if args else kwargs.get('args', [])

            # Mock version check
            if 'version' in cmd:
                result = Mock()
                result.returncode = 0
                result.stdout = "akash version 0.18.0"
                return result

            # Mock deployment create
            if 'deployment' in cmd and 'create' in cmd:
                result = Mock()
                result.returncode = 0
                result.stdout = json.dumps({
                    'dseq': '12345',
                    'deployment_id': '12345'
                })
                return result

            # Mock bid list
            if 'bid' in cmd and 'list' in cmd:
                result = Mock()
                result.returncode = 0
                result.stdout = json.dumps({
                    'bids': [
                        {
                            'provider': 'provider.akash.network',
                            'price': {'amount': '5000'},
                            'location': 'us-east',
                            'uptime': 99.0,
                            'reputation': 95.0
                        }
                    ]
                })
                return result

            # Mock lease create
            if 'lease' in cmd and 'create' in cmd:
                result = Mock()
                result.returncode = 0
                result.stdout = json.dumps({
                    'lease_id': '12345/provider.akash.network'
                })
                return result

            # Mock send-manifest
            if 'send-manifest' in cmd:
                result = Mock()
                result.returncode = 0
                result.stdout = "Manifest sent"
                return result

            # Mock lease-status
            if 'lease-status' in cmd:
                result = Mock()
                result.returncode = 0
                result.stdout = json.dumps({
                    'services': {
                        'web': {
                            'uris': ['https://app.provider.akash.network']
                        }
                    }
                })
                return result

            # Default
            result = Mock()
            result.returncode = 0
            result.stdout = "{}"
            return result

        monkeypatch.setattr('subprocess.run', mock_run)

    @pytest.fixture
    def deployer(self, mock_akash_cli):
        """Create deployer with mocked CLI"""
        return AkashDeployer(
            wallet_key="test_wallet_key",
            network="mainnet"
        )

    @pytest.fixture
    def project_info(self):
        """Sample project info"""
        return ProjectInfo(
            project_type="nextjs",
            framework_version="14.0.0",
            build_command="npm run build",
            output_dir=".next",
            package_manager="npm"
        )

    @pytest.fixture
    def build_artifacts(self):
        """Sample build artifacts"""
        return BuildArtifacts(
            success=True,
            output_dir=".next",
            files=["index.html"],
            entrypoint="index.html",
            total_size_mb=5.0,
            build_time_seconds=30.0
        )

    def test_deployer_initialization(self, deployer):
        """Test deployer initializes correctly"""
        assert deployer.wallet_key == "test_wallet_key"
        assert deployer.network == "mainnet"
        assert deployer.timeout == 300

    def test_deploy_frontend(self, deployer, project_info, build_artifacts):
        """Test frontend deployment"""
        # This test requires templates, so skip if not available
        try:
            result = deployer.deploy_frontend(
                project_info,
                build_artifacts
            )

            assert result.success
            assert result.deployment_id
            assert result.url
        except FileNotFoundError:
            # Templates not found in test environment
            pytest.skip("Template files not available")

    def test_missing_wallet_key_error(self):
        """Test error when wallet key missing"""
        with patch.dict('os.environ', {}, clear=True):
            with patch('subprocess.run') as mock_run:
                mock_run.return_value = Mock(returncode=0, stdout="v0.18.0")
                with pytest.raises(AkashError, match="wallet key not provided"):
                    AkashDeployer()


@pytest.mark.integration
class TestAkashIntegration:
    """
    Integration tests requiring real Akash CLI and wallet.

    Run with: pytest -m integration
    Requires:
    - AKASH_WALLET_KEY environment variable
    - Akash CLI installed
    - AKT tokens in wallet
    """

    @pytest.mark.skip(reason="Requires real Akash wallet and tokens")
    def test_real_deployment(self):
        """Test deployment to real Akash network"""
        import os

        wallet_key = os.getenv('AKASH_WALLET_KEY')
        if not wallet_key:
            pytest.skip("AKASH_WALLET_KEY not set")

        deployer = AkashDeployer(
            wallet_key=wallet_key,
            network="testnet"
        )

        project_info = ProjectInfo(
            project_type="react",
            framework_version="18.0.0",
            build_command="npm run build",
            output_dir="build",
            package_manager="npm"
        )

        build_artifacts = BuildArtifacts(
            success=True,
            output_dir="build",
            files=["index.html"],
            entrypoint="index.html",
            total_size_mb=2.0,
            build_time_seconds=20.0
        )

        result = deployer.deploy_frontend(project_info, build_artifacts)

        assert result.success
        assert result.url.startswith('https://')
        print(f"Deployed to: {result.url}")


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
