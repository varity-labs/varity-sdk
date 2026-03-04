"""
Unit tests for DeploymentHistory class

Tests deployment history management, filtering, rollback, and storage operations.
"""

import json
import pytest
import tempfile
from pathlib import Path
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock

from varietykit.core.deployment_history import DeploymentHistory
from varietykit.core.types import DeploymentResult, DeploymentError


@pytest.fixture
def temp_storage():
    """Create temporary storage directory for testing"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


@pytest.fixture
def history(temp_storage):
    """Create DeploymentHistory instance with temporary storage"""
    return DeploymentHistory(storage_path=temp_storage)


@pytest.fixture
def sample_deployment_result():
    """Create sample DeploymentResult for testing"""
    return DeploymentResult(
        deployment_id="deploy-1737492000",
        frontend_url="https://ipfs.io/ipfs/QmTest123",
        thirdweb_url="https://QmTest123.ipfscdn.io",
        cid="QmTest123",
        app_store_url=None,
        manifest={
            'version': '1.0',
            'deployment_id': 'deploy-1737492000',
            'timestamp': '2026-01-22T10:00:00',
            'network': 'varity',
            'project': {
                'type': 'nextjs',
                'framework_version': '14.0.0',
                'build_command': 'npm run build',
                'package_manager': 'npm',
                'path': '/test/project'
            },
            'build': {
                'success': True,
                'files': 42,
                'size_mb': 5.3,
                'time_seconds': 23.5
            },
            'ipfs': {
                'cid': 'QmTest123',
                'gateway_url': 'https://ipfs.io/ipfs/QmTest123',
                'thirdweb_url': 'https://QmTest123.ipfscdn.io'
            }
        }
    )


class TestDeploymentHistoryInit:
    """Test DeploymentHistory initialization"""

    def test_init_default_storage_path(self):
        """Test default storage path is set correctly"""
        history = DeploymentHistory()
        expected_path = Path.home() / '.varietykit' / 'deployments'
        assert history.storage_path == expected_path

    def test_init_custom_storage_path(self, temp_storage):
        """Test custom storage path is set correctly"""
        history = DeploymentHistory(storage_path=temp_storage)
        assert history.storage_path == Path(temp_storage)

    def test_init_creates_storage_directory(self, temp_storage):
        """Test storage directory is created on init"""
        storage_path = Path(temp_storage) / 'custom' / 'path'
        history = DeploymentHistory(storage_path=str(storage_path))
        assert storage_path.exists()
        assert storage_path.is_dir()


class TestSaveDeployment:
    """Test save_deployment functionality"""

    def test_save_deployment_basic(self, history, sample_deployment_result):
        """Test basic deployment save"""
        history.save_deployment(sample_deployment_result)

        # Verify file was created
        filepath = history.storage_path / f"{sample_deployment_result.deployment_id}.json"
        assert filepath.exists()

        # Verify content
        with open(filepath, 'r') as f:
            saved = json.load(f)

        assert saved['deployment_id'] == sample_deployment_result.deployment_id
        assert saved['version'] == '1.0'
        assert saved['network'] == 'varity'

    def test_save_deployment_with_custom_network(self, history, sample_deployment_result):
        """Test save deployment with custom network"""
        history.save_deployment(sample_deployment_result, network='arbitrum')

        filepath = history.storage_path / f"{sample_deployment_result.deployment_id}.json"
        with open(filepath, 'r') as f:
            saved = json.load(f)

        assert saved['network'] == 'arbitrum'

    def test_save_deployment_with_project_path(self, history, sample_deployment_result):
        """Test save deployment with project path"""
        history.save_deployment(
            sample_deployment_result,
            project_path='/custom/path'
        )

        filepath = history.storage_path / f"{sample_deployment_result.deployment_id}.json"
        with open(filepath, 'r') as f:
            saved = json.load(f)

        assert saved['project']['path'] == '/custom/path'

    def test_save_deployment_adds_timestamp(self, history):
        """Test save deployment adds timestamp if missing"""
        result = DeploymentResult(
            deployment_id="deploy-test",
            frontend_url="https://test.com",
            thirdweb_url="https://test.com",
            cid="QmTest",
            app_store_url=None,
            manifest={'deployment_id': 'deploy-test'}
        )

        history.save_deployment(result)

        filepath = history.storage_path / "deploy-test.json"
        with open(filepath, 'r') as f:
            saved = json.load(f)

        assert 'timestamp' in saved
        # Verify it's a valid ISO timestamp
        datetime.fromisoformat(saved['timestamp'])

    def test_save_deployment_error_handling(self, history):
        """Test save deployment handles errors gracefully"""
        # Create a result with invalid manifest
        result = DeploymentResult(
            deployment_id="",  # Empty ID should cause error
            frontend_url="https://test.com",
            thirdweb_url="https://test.com",
            cid="QmTest",
            app_store_url=None,
            manifest={}
        )

        with pytest.raises(DeploymentError):
            history.save_deployment(result)


class TestGetDeployment:
    """Test get_deployment functionality"""

    def test_get_deployment_exists(self, history, sample_deployment_result):
        """Test retrieve existing deployment"""
        history.save_deployment(sample_deployment_result)
        retrieved = history.get_deployment(sample_deployment_result.deployment_id)

        assert retrieved is not None
        assert retrieved['deployment_id'] == sample_deployment_result.deployment_id
        assert retrieved['network'] == 'varity'

    def test_get_deployment_not_exists(self, history):
        """Test retrieve non-existent deployment returns None"""
        retrieved = history.get_deployment('deploy-nonexistent')
        assert retrieved is None

    def test_get_deployment_corrupted_file(self, history):
        """Test retrieve corrupted deployment file returns None"""
        # Create corrupted file
        filepath = history.storage_path / "deploy-corrupted.json"
        with open(filepath, 'w') as f:
            f.write("invalid json{{{")

        retrieved = history.get_deployment('deploy-corrupted')
        assert retrieved is None


class TestListDeployments:
    """Test list_deployments functionality"""

    def test_list_deployments_empty(self, history):
        """Test list deployments when no deployments exist"""
        deployments = history.list_deployments()
        assert deployments == []

    def test_list_deployments_single(self, history, sample_deployment_result):
        """Test list deployments with single deployment"""
        history.save_deployment(sample_deployment_result)
        deployments = history.list_deployments()

        assert len(deployments) == 1
        assert deployments[0]['deployment_id'] == sample_deployment_result.deployment_id

    def test_list_deployments_multiple(self, history):
        """Test list deployments with multiple deployments"""
        # Create multiple deployments
        for i in range(5):
            result = DeploymentResult(
                deployment_id=f"deploy-{i}",
                frontend_url=f"https://test-{i}.com",
                thirdweb_url=f"https://test-{i}.com",
                cid=f"QmTest{i}",
                app_store_url=None,
                manifest={
                    'deployment_id': f'deploy-{i}',
                    'timestamp': f'2026-01-22T10:00:0{i}',
                    'network': 'varity'
                }
            )
            history.save_deployment(result)

        deployments = history.list_deployments()
        assert len(deployments) == 5

    def test_list_deployments_sorted_by_timestamp(self, history):
        """Test deployments are sorted by timestamp (newest first)"""
        # Create deployments with different timestamps
        timestamps = ['2026-01-22T10:00:00', '2026-01-22T11:00:00', '2026-01-22T09:00:00']

        for i, ts in enumerate(timestamps):
            result = DeploymentResult(
                deployment_id=f"deploy-{i}",
                frontend_url=f"https://test-{i}.com",
                thirdweb_url=f"https://test-{i}.com",
                cid=f"QmTest{i}",
                app_store_url=None,
                manifest={
                    'deployment_id': f'deploy-{i}',
                    'timestamp': ts,
                    'network': 'varity'
                }
            )
            history.save_deployment(result)

        deployments = history.list_deployments()

        # Should be sorted newest first
        assert deployments[0]['timestamp'] == '2026-01-22T11:00:00'
        assert deployments[1]['timestamp'] == '2026-01-22T10:00:00'
        assert deployments[2]['timestamp'] == '2026-01-22T09:00:00'

    def test_list_deployments_filter_by_network(self, history):
        """Test filter deployments by network"""
        # Create deployments on different networks
        networks = ['varity', 'arbitrum', 'varity', 'base', 'varity']

        for i, network in enumerate(networks):
            result = DeploymentResult(
                deployment_id=f"deploy-{i}",
                frontend_url=f"https://test-{i}.com",
                thirdweb_url=f"https://test-{i}.com",
                cid=f"QmTest{i}",
                app_store_url=None,
                manifest={
                    'deployment_id': f'deploy-{i}',
                    'timestamp': f'2026-01-22T10:00:0{i}',
                    'network': network
                }
            )
            history.save_deployment(result, network=network)

        # Filter by varity
        varity_deployments = history.list_deployments(network='varity')
        assert len(varity_deployments) == 3
        assert all(d['network'] == 'varity' for d in varity_deployments)

        # Filter by arbitrum
        arbitrum_deployments = history.list_deployments(network='arbitrum')
        assert len(arbitrum_deployments) == 1
        assert arbitrum_deployments[0]['network'] == 'arbitrum'

    def test_list_deployments_limit(self, history):
        """Test limit parameter"""
        # Create 10 deployments
        for i in range(10):
            result = DeploymentResult(
                deployment_id=f"deploy-{i}",
                frontend_url=f"https://test-{i}.com",
                thirdweb_url=f"https://test-{i}.com",
                cid=f"QmTest{i}",
                app_store_url=None,
                manifest={
                    'deployment_id': f'deploy-{i}',
                    'timestamp': f'2026-01-22T10:00:{i:02d}',
                    'network': 'varity'
                }
            )
            history.save_deployment(result)

        # Test limit
        deployments = history.list_deployments(limit=3)
        assert len(deployments) == 3

    def test_list_deployments_offset(self, history):
        """Test offset parameter"""
        # Create 5 deployments
        for i in range(5):
            result = DeploymentResult(
                deployment_id=f"deploy-{i}",
                frontend_url=f"https://test-{i}.com",
                thirdweb_url=f"https://test-{i}.com",
                cid=f"QmTest{i}",
                app_store_url=None,
                manifest={
                    'deployment_id': f'deploy-{i}',
                    'timestamp': f'2026-01-22T10:00:0{i}',
                    'network': 'varity'
                }
            )
            history.save_deployment(result)

        # Test offset
        deployments = history.list_deployments(offset=2, limit=10)
        assert len(deployments) == 3  # 5 total - 2 offset = 3

    def test_list_deployments_skips_corrupted_files(self, history, sample_deployment_result):
        """Test list deployments skips corrupted files"""
        # Save a valid deployment
        history.save_deployment(sample_deployment_result)

        # Create a corrupted file
        corrupted_path = history.storage_path / "deploy-corrupted.json"
        with open(corrupted_path, 'w') as f:
            f.write("invalid json{{{")

        # Should skip corrupted file and return only valid deployment
        deployments = history.list_deployments()
        assert len(deployments) == 1
        assert deployments[0]['deployment_id'] == sample_deployment_result.deployment_id


class TestGetLatest:
    """Test get_latest functionality"""

    def test_get_latest_no_deployments(self, history):
        """Test get_latest when no deployments exist"""
        latest = history.get_latest()
        assert latest is None

    def test_get_latest_single_deployment(self, history, sample_deployment_result):
        """Test get_latest with single deployment"""
        history.save_deployment(sample_deployment_result)
        latest = history.get_latest()

        assert latest is not None
        assert latest['deployment_id'] == sample_deployment_result.deployment_id

    def test_get_latest_multiple_deployments(self, history):
        """Test get_latest returns most recent deployment"""
        # Create deployments with different timestamps
        for i in range(3):
            result = DeploymentResult(
                deployment_id=f"deploy-{i}",
                frontend_url=f"https://test-{i}.com",
                thirdweb_url=f"https://test-{i}.com",
                cid=f"QmTest{i}",
                app_store_url=None,
                manifest={
                    'deployment_id': f'deploy-{i}',
                    'timestamp': f'2026-01-22T10:0{i}:00',
                    'network': 'varity'
                }
            )
            history.save_deployment(result)

        latest = history.get_latest()
        assert latest['deployment_id'] == 'deploy-2'  # Most recent

    def test_get_latest_filter_by_network(self, history):
        """Test get_latest with network filter"""
        # Create deployments on different networks
        networks = [('varity', '10:00'), ('arbitrum', '11:00'), ('varity', '09:00')]

        for i, (network, time) in enumerate(networks):
            result = DeploymentResult(
                deployment_id=f"deploy-{i}",
                frontend_url=f"https://test-{i}.com",
                thirdweb_url=f"https://test-{i}.com",
                cid=f"QmTest{i}",
                app_store_url=None,
                manifest={
                    'deployment_id': f'deploy-{i}',
                    'timestamp': f'2026-01-22T{time}:00',
                    'network': network
                }
            )
            history.save_deployment(result, network=network)

        # Latest for varity should be deploy-0 (10:00)
        latest_varity = history.get_latest(network='varity')
        assert latest_varity['deployment_id'] == 'deploy-0'

        # Latest for arbitrum should be deploy-1 (11:00)
        latest_arbitrum = history.get_latest(network='arbitrum')
        assert latest_arbitrum['deployment_id'] == 'deploy-1'


class TestRollback:
    """Test rollback functionality"""

    @patch('varietykit.core.deployment_history.DeploymentOrchestrator')
    def test_rollback_success(self, mock_orchestrator_class, history, sample_deployment_result):
        """Test successful rollback"""
        # Save deployment
        history.save_deployment(sample_deployment_result)

        # Mock orchestrator
        mock_orchestrator = Mock()
        mock_new_result = DeploymentResult(
            deployment_id="deploy-new",
            frontend_url="https://ipfs.io/ipfs/QmNew",
            thirdweb_url="https://QmNew.ipfscdn.io",
            cid="QmNew",
            app_store_url=None,
            manifest={'deployment_id': 'deploy-new'}
        )
        mock_orchestrator.deploy.return_value = mock_new_result
        mock_orchestrator_class.return_value = mock_orchestrator

        # Perform rollback
        new_result = history.rollback(sample_deployment_result.deployment_id)

        # Verify orchestrator was called with correct parameters
        mock_orchestrator.deploy.assert_called_once()
        call_kwargs = mock_orchestrator.deploy.call_args[1]
        assert call_kwargs['network'] == 'varity'
        assert call_kwargs['project_path'] == '/test/project'
        assert call_kwargs['submit_to_store'] == False

        # Verify result
        assert new_result.deployment_id == "deploy-new"

    def test_rollback_deployment_not_found(self, history):
        """Test rollback fails when deployment not found"""
        with pytest.raises(DeploymentError) as exc_info:
            history.rollback('deploy-nonexistent')

        assert 'not found' in str(exc_info.value).lower()


class TestDeleteDeployment:
    """Test delete_deployment functionality"""

    def test_delete_deployment_exists(self, history, sample_deployment_result):
        """Test delete existing deployment"""
        history.save_deployment(sample_deployment_result)
        assert history.get_deployment(sample_deployment_result.deployment_id) is not None

        result = history.delete_deployment(sample_deployment_result.deployment_id)
        assert result is True
        assert history.get_deployment(sample_deployment_result.deployment_id) is None

    def test_delete_deployment_not_exists(self, history):
        """Test delete non-existent deployment returns False"""
        result = history.delete_deployment('deploy-nonexistent')
        assert result is False


class TestGetDeploymentCount:
    """Test get_deployment_count functionality"""

    def test_get_deployment_count_empty(self, history):
        """Test count when no deployments exist"""
        count = history.get_deployment_count()
        assert count == 0

    def test_get_deployment_count_multiple(self, history):
        """Test count with multiple deployments"""
        for i in range(5):
            result = DeploymentResult(
                deployment_id=f"deploy-{i}",
                frontend_url=f"https://test-{i}.com",
                thirdweb_url=f"https://test-{i}.com",
                cid=f"QmTest{i}",
                app_store_url=None,
                manifest={
                    'deployment_id': f'deploy-{i}',
                    'network': 'varity'
                }
            )
            history.save_deployment(result)

        count = history.get_deployment_count()
        assert count == 5

    def test_get_deployment_count_filter_by_network(self, history):
        """Test count with network filter"""
        networks = ['varity', 'arbitrum', 'varity', 'base']

        for i, network in enumerate(networks):
            result = DeploymentResult(
                deployment_id=f"deploy-{i}",
                frontend_url=f"https://test-{i}.com",
                thirdweb_url=f"https://test-{i}.com",
                cid=f"QmTest{i}",
                app_store_url=None,
                manifest={
                    'deployment_id': f'deploy-{i}',
                    'network': network
                }
            )
            history.save_deployment(result, network=network)

        varity_count = history.get_deployment_count(network='varity')
        assert varity_count == 2

        arbitrum_count = history.get_deployment_count(network='arbitrum')
        assert arbitrum_count == 1


class TestExportImportHistory:
    """Test export/import functionality"""

    def test_export_deployment_history(self, history, temp_storage):
        """Test export deployment history to JSON"""
        # Create deployments
        for i in range(3):
            result = DeploymentResult(
                deployment_id=f"deploy-{i}",
                frontend_url=f"https://test-{i}.com",
                thirdweb_url=f"https://test-{i}.com",
                cid=f"QmTest{i}",
                app_store_url=None,
                manifest={
                    'deployment_id': f'deploy-{i}',
                    'network': 'varity'
                }
            )
            history.save_deployment(result)

        # Export
        export_path = Path(temp_storage) / 'export.json'
        history.export_deployment_history(str(export_path))

        # Verify export file
        assert export_path.exists()

        with open(export_path, 'r') as f:
            exported = json.load(f)

        assert exported['version'] == '1.0'
        assert exported['deployment_count'] == 3
        assert len(exported['deployments']) == 3

    def test_import_deployment_history(self, temp_storage):
        """Test import deployment history from JSON"""
        # Create export file
        export_data = {
            'version': '1.0',
            'exported_at': '2026-01-22T10:00:00',
            'deployment_count': 2,
            'deployments': [
                {
                    'deployment_id': 'deploy-1',
                    'network': 'varity',
                    'timestamp': '2026-01-22T10:00:00'
                },
                {
                    'deployment_id': 'deploy-2',
                    'network': 'arbitrum',
                    'timestamp': '2026-01-22T11:00:00'
                }
            ]
        }

        export_path = Path(temp_storage) / 'import.json'
        with open(export_path, 'w') as f:
            json.dump(export_data, f)

        # Import to new storage
        import_storage = Path(temp_storage) / 'imported'
        history = DeploymentHistory(storage_path=str(import_storage))

        imported_count = history.import_deployment_history(str(export_path))

        assert imported_count == 2
        assert history.get_deployment_count() == 2
        assert history.get_deployment('deploy-1') is not None
        assert history.get_deployment('deploy-2') is not None
