"""
Unit tests for DeploymentOrchestrator

Tests the deployment orchestration logic with mocked dependencies.
"""

import pytest
import json
from pathlib import Path
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime

from varitykit.core.deployment_orchestrator import DeploymentOrchestrator
from varitykit.core.types import (
    ProjectInfo,
    BuildArtifacts,
    DeploymentResult,
    DeploymentError,
    ProjectDetectionError,
    BuildError,
    IPFSUploadError
)


class TestDeploymentOrchestrator:
    """Test suite for DeploymentOrchestrator"""

    @pytest.fixture
    def orchestrator(self):
        """Create orchestrator instance with verbose=False for testing"""
        return DeploymentOrchestrator(verbose=False)

    @pytest.fixture
    def mock_project_info(self):
        """Mock ProjectInfo for a Next.js project"""
        return ProjectInfo(
            project_type='nextjs',
            framework_version='14.0.0',
            build_command='npm run build',
            output_dir='out',
            package_manager='npm',
            has_backend=False
        )

    @pytest.fixture
    def mock_build_artifacts(self, tmp_path):
        """Mock BuildArtifacts"""
        return BuildArtifacts(
            success=True,
            output_dir=str(tmp_path / 'out'),
            files=['index.html', '_next/static/chunks/main.js'],
            entrypoint='index.html',
            total_size_mb=2.5,
            build_time_seconds=15.3
        )

    @pytest.fixture
    def mock_ipfs_result(self):
        """Mock IPFS upload result"""
        return {
            'success': True,
            'cid': 'QmXoYPZzD4VWJ8G5h5vB9JgK4VWJ8G5h5vB9JgK4VWJ8G5',
            'gatewayUrl': 'https://ipfs.io/ipfs/QmXoYPZzD4VWJ8G5h5vB9JgK4VWJ8G5h5vB9JgK4VWJ8G5',
            'thirdwebUrl': 'https://QmXoYPZzD4VWJ8G5h5vB9JgK4VWJ8G5h5vB9JgK4VWJ8G5.ipfscdn.io',
            'totalSize': 2621440,  # 2.5 MB in bytes
            'fileCount': 42
        }

    def test_init(self, orchestrator):
        """Test orchestrator initialization"""
        assert orchestrator.verbose == False
        assert orchestrator._detector is None
        assert orchestrator._builder is None
        assert orchestrator._ipfs is None

    def test_create_manifest(self, orchestrator, mock_project_info, mock_build_artifacts, mock_ipfs_result):
        """Test manifest creation"""
        manifest = orchestrator._create_manifest(
            mock_project_info,
            mock_build_artifacts,
            mock_ipfs_result,
            'varity'
        )

        assert manifest['version'] == '1.0'
        assert 'deployment_id' in manifest
        assert manifest['deployment_id'].startswith('deploy-')
        assert 'timestamp' in manifest
        assert manifest['network'] == 'varity'

        # Verify project section
        assert manifest['project']['type'] == 'nextjs'
        assert manifest['project']['framework_version'] == '14.0.0'
        assert manifest['project']['build_command'] == 'npm run build'

        # Verify build section
        assert manifest['build']['success'] == True
        assert manifest['build']['files'] == 2
        assert manifest['build']['size_mb'] == 2.5

        # Verify IPFS section
        assert manifest['ipfs']['cid'] == mock_ipfs_result['cid']
        assert manifest['ipfs']['gateway_url'] == mock_ipfs_result['gatewayUrl']

    def test_save_deployment(self, orchestrator, mock_project_info, mock_build_artifacts, mock_ipfs_result, tmp_path):
        """Test deployment metadata saving"""
        # Create manifest
        manifest = orchestrator._create_manifest(
            mock_project_info,
            mock_build_artifacts,
            mock_ipfs_result,
            'varity'
        )

        # Mock home directory
        with patch('pathlib.Path.home', return_value=tmp_path):
            deployment_id = orchestrator._save_deployment(manifest)

            # Verify deployment ID
            assert deployment_id == manifest['deployment_id']

            # Verify file was created
            deployments_dir = tmp_path / '.varitykit' / 'deployments'
            assert deployments_dir.exists()

            manifest_file = deployments_dir / f"{deployment_id}.json"
            assert manifest_file.exists()

            # Verify file contents
            with open(manifest_file, 'r') as f:
                saved_manifest = json.load(f)

            assert saved_manifest == manifest

    def test_get_deployment(self, orchestrator, tmp_path):
        """Test retrieving deployment by ID"""
        # Create a mock deployment manifest
        deployment_id = 'deploy-1234567890'
        manifest = {
            'deployment_id': deployment_id,
            'timestamp': '2026-01-21T10:00:00',
            'network': 'varity',
            'ipfs': {
                'cid': 'QmTest...'
            }
        }

        # Save it
        with patch('pathlib.Path.home', return_value=tmp_path):
            deployments_dir = tmp_path / '.varitykit' / 'deployments'
            deployments_dir.mkdir(parents=True, exist_ok=True)

            manifest_file = deployments_dir / f"{deployment_id}.json"
            with open(manifest_file, 'w') as f:
                json.dump(manifest, f)

            # Retrieve it
            retrieved = orchestrator.get_deployment(deployment_id)

            assert retrieved is not None
            assert retrieved['deployment_id'] == deployment_id
            assert retrieved['ipfs']['cid'] == 'QmTest...'

    def test_get_deployment_not_found(self, orchestrator, tmp_path):
        """Test retrieving non-existent deployment"""
        with patch('pathlib.Path.home', return_value=tmp_path):
            result = orchestrator.get_deployment('deploy-nonexistent')
            assert result is None

    def test_list_deployments(self, orchestrator, tmp_path):
        """Test listing all deployments"""
        # Create multiple deployment manifests
        manifests = []
        for i in range(3):
            manifest = {
                'deployment_id': f'deploy-{1234567890 + i}',
                'timestamp': f'2026-01-21T10:0{i}:00',
                'network': 'varity',
                'ipfs': {'cid': f'QmTest{i}...'}
            }
            manifests.append(manifest)

        # Save them
        with patch('pathlib.Path.home', return_value=tmp_path):
            deployments_dir = tmp_path / '.varitykit' / 'deployments'
            deployments_dir.mkdir(parents=True, exist_ok=True)

            for manifest in manifests:
                manifest_file = deployments_dir / f"{manifest['deployment_id']}.json"
                with open(manifest_file, 'w') as f:
                    json.dump(manifest, f)

            # List them
            deployments = orchestrator.list_deployments()

            assert len(deployments) == 3
            # Verify they're sorted by timestamp (newest first)
            assert deployments[0]['deployment_id'] == 'deploy-1234567892'
            assert deployments[2]['deployment_id'] == 'deploy-1234567890'

    def test_list_deployments_filtered_by_network(self, orchestrator, tmp_path):
        """Test listing deployments filtered by network"""
        # Create manifests for different networks
        manifests = [
            {
                'deployment_id': 'deploy-1',
                'timestamp': '2026-01-21T10:00:00',
                'network': 'varity',
                'ipfs': {'cid': 'QmTest1...'}
            },
            {
                'deployment_id': 'deploy-2',
                'timestamp': '2026-01-21T10:01:00',
                'network': 'arbitrum',
                'ipfs': {'cid': 'QmTest2...'}
            },
            {
                'deployment_id': 'deploy-3',
                'timestamp': '2026-01-21T10:02:00',
                'network': 'varity',
                'ipfs': {'cid': 'QmTest3...'}
            }
        ]

        # Save them
        with patch('pathlib.Path.home', return_value=tmp_path):
            deployments_dir = tmp_path / '.varitykit' / 'deployments'
            deployments_dir.mkdir(parents=True, exist_ok=True)

            for manifest in manifests:
                manifest_file = deployments_dir / f"{manifest['deployment_id']}.json"
                with open(manifest_file, 'w') as f:
                    json.dump(manifest, f)

            # List only varity deployments
            varity_deployments = orchestrator.list_deployments(network='varity')

            assert len(varity_deployments) == 2
            assert all(d['network'] == 'varity' for d in varity_deployments)

    @patch('varitykit.core.deployment_orchestrator.DeploymentOrchestrator.detector')
    @patch('varitykit.core.deployment_orchestrator.DeploymentOrchestrator.builder')
    @patch('varitykit.core.deployment_orchestrator.DeploymentOrchestrator.ipfs')
    def test_deploy_success(
        self,
        mock_ipfs_prop,
        mock_builder_prop,
        mock_detector_prop,
        orchestrator,
        mock_project_info,
        mock_build_artifacts,
        mock_ipfs_result,
        tmp_path
    ):
        """Test successful full deployment"""
        # Setup mocks
        mock_detector = Mock()
        mock_detector.detect.return_value = mock_project_info
        mock_detector_prop.__get__ = Mock(return_value=mock_detector)

        mock_builder = Mock()
        mock_builder.build.return_value = mock_build_artifacts
        mock_builder_prop.__get__ = Mock(return_value=mock_builder)

        mock_ipfs = Mock()
        mock_ipfs.upload.return_value = mock_ipfs_result
        mock_ipfs_prop.__get__ = Mock(return_value=mock_ipfs)

        # Execute deployment
        with patch('pathlib.Path.home', return_value=tmp_path):
            result = orchestrator.deploy(
                project_path='.',
                network='varity',
                submit_to_store=False
            )

        # Verify result
        assert isinstance(result, DeploymentResult)
        assert result.deployment_id.startswith('deploy-')
        assert result.cid == mock_ipfs_result['cid']
        assert result.frontend_url == mock_ipfs_result['gatewayUrl']
        assert result.thirdweb_url == mock_ipfs_result['thirdwebUrl']
        assert result.app_store_url is None

        # Verify manifest was saved
        deployments_dir = tmp_path / '.varitykit' / 'deployments'
        manifest_file = deployments_dir / f"{result.deployment_id}.json"
        assert manifest_file.exists()

    @patch('varitykit.core.deployment_orchestrator.DeploymentOrchestrator.detector')
    def test_deploy_detection_failure(self, mock_detector_prop, orchestrator):
        """Test deployment failure during project detection"""
        mock_detector = Mock()
        mock_detector.detect.side_effect = ProjectDetectionError("Unsupported project type")
        mock_detector_prop.__get__ = Mock(return_value=mock_detector)

        with pytest.raises(ProjectDetectionError):
            orchestrator.deploy()

    @patch('varitykit.core.deployment_orchestrator.DeploymentOrchestrator.detector')
    @patch('varitykit.core.deployment_orchestrator.DeploymentOrchestrator.builder')
    def test_deploy_build_failure(
        self,
        mock_builder_prop,
        mock_detector_prop,
        orchestrator,
        mock_project_info
    ):
        """Test deployment failure during build"""
        mock_detector = Mock()
        mock_detector.detect.return_value = mock_project_info
        mock_detector_prop.__get__ = Mock(return_value=mock_detector)

        mock_builder = Mock()
        failed_artifacts = BuildArtifacts(
            success=False,
            output_dir='out',
            files=[],
            entrypoint='index.html',
            total_size_mb=0.0,
            build_time_seconds=0.0
        )
        mock_builder.build.return_value = failed_artifacts
        mock_builder_prop.__get__ = Mock(return_value=mock_builder)

        with pytest.raises(BuildError):
            orchestrator.deploy()

    @patch('varitykit.core.deployment_orchestrator.DeploymentOrchestrator.detector')
    @patch('varitykit.core.deployment_orchestrator.DeploymentOrchestrator.builder')
    @patch('varitykit.core.deployment_orchestrator.DeploymentOrchestrator.ipfs')
    def test_deploy_ipfs_failure(
        self,
        mock_ipfs_prop,
        mock_builder_prop,
        mock_detector_prop,
        orchestrator,
        mock_project_info,
        mock_build_artifacts
    ):
        """Test deployment failure during IPFS upload"""
        mock_detector = Mock()
        mock_detector.detect.return_value = mock_project_info
        mock_detector_prop.__get__ = Mock(return_value=mock_detector)

        mock_builder = Mock()
        mock_builder.build.return_value = mock_build_artifacts
        mock_builder_prop.__get__ = Mock(return_value=mock_builder)

        mock_ipfs = Mock()
        mock_ipfs.upload.return_value = {
            'success': False,
            'error_message': 'IPFS upload timeout'
        }
        mock_ipfs_prop.__get__ = Mock(return_value=mock_ipfs)

        with pytest.raises(IPFSUploadError):
            orchestrator.deploy()

    def test_deployment_result_str(self):
        """Test DeploymentResult string representation"""
        result = DeploymentResult(
            deployment_id='deploy-1234567890',
            frontend_url='https://ipfs.io/ipfs/QmTest...',
            thirdweb_url='https://QmTest....ipfscdn.io',
            cid='QmTest...',
            app_store_url=None,
            manifest={}
        )

        str_repr = str(result)
        assert 'deploy-1234567890' in str_repr
        assert 'https://ipfs.io/ipfs/QmTest...' in str_repr
        assert 'QmTest...' in str_repr


class TestDeploymentOrchestratorIntegration:
    """Integration tests with actual file system (no mocks)"""

    @pytest.fixture
    def temp_home(self, tmp_path):
        """Create temporary home directory"""
        return tmp_path

    def test_deployment_metadata_persistence(self, temp_home):
        """Test that deployment metadata persists correctly"""
        orchestrator = DeploymentOrchestrator(verbose=False)

        manifest = {
            'deployment_id': 'deploy-test-123',
            'timestamp': '2026-01-21T10:00:00',
            'network': 'varity',
            'project': {'type': 'nextjs'},
            'build': {'files': 42},
            'ipfs': {'cid': 'QmTest...'}
        }

        with patch('pathlib.Path.home', return_value=temp_home):
            # Save deployment
            deployment_id = orchestrator._save_deployment(manifest)

            # Retrieve it
            retrieved = orchestrator.get_deployment(deployment_id)

            assert retrieved is not None
            assert retrieved['deployment_id'] == deployment_id
            assert retrieved['network'] == 'varity'

            # List all deployments
            deployments = orchestrator.list_deployments()
            assert len(deployments) == 1
            assert deployments[0]['deployment_id'] == deployment_id
