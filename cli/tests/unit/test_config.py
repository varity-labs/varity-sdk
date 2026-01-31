"""
Unit tests for configuration management
"""

import pytest
from pathlib import Path
import tempfile
import toml

from varietykit.core.config import (
    Environment,
    VarityConfig,
    APIConfig,
    NetworkConfig,
    ConfigManager
)


class TestVarityConfig:
    """Test VarityConfig dataclass"""

    def test_default_config(self):
        """Test default configuration"""
        config = VarityConfig()
        assert config.environment == Environment.DEVELOPMENT
        assert config.project_name is None
        assert isinstance(config.api, APIConfig)
        assert isinstance(config.network, NetworkConfig)

    def test_config_to_dict(self):
        """Test converting config to dictionary"""
        config = VarityConfig(
            environment=Environment.PRODUCTION,
            project_name="test-project"
        )
        config_dict = config.to_dict()

        assert config_dict['environment'] == 'production'
        assert config_dict['project_name'] == 'test-project'
        assert 'api' in config_dict
        assert 'network' in config_dict


class TestConfigManager:
    """Test ConfigManager"""

    def test_create_project_config(self):
        """Test creating new project configuration"""
        manager = ConfigManager()
        config = manager.create_project_config(
            project_name="test-project",
            project_path=Path("/tmp/test-project"),
            environment=Environment.DEVELOPMENT
        )

        assert config.project_name == "test-project"
        assert config.project_path == Path("/tmp/test-project")
        assert config.environment == Environment.DEVELOPMENT

    def test_save_and_load_config(self):
        """Test saving and loading configuration"""
        with tempfile.TemporaryDirectory() as tmpdir:
            config_path = Path(tmpdir) / ".varietykit.toml"

            # Create and save config
            manager = ConfigManager()
            config = VarityConfig(
                environment=Environment.PRODUCTION,
                project_name="test-project",
                wallet_address="0x" + "a" * 40
            )

            saved_path = manager.save_config(config, config_path)
            assert saved_path.exists()

            # Load config
            loaded_config = manager.load_config(config_path)
            assert loaded_config.environment == Environment.PRODUCTION
            assert loaded_config.project_name == "test-project"
            assert loaded_config.wallet_address == "0x" + "a" * 40

    def test_get_api_url(self):
        """Test getting API URL for different environments"""
        manager = ConfigManager()
        config = VarityConfig()
        manager.config = config

        # Development uses staging
        assert "staging" in manager.get_api_url(Environment.DEVELOPMENT)

        # Staging uses staging
        assert "staging" in manager.get_api_url(Environment.STAGING)

        # Production uses production
        prod_url = manager.get_api_url(Environment.PRODUCTION)
        assert "staging" not in prod_url
        assert "api.varity.io" in prod_url

        # Local uses local
        assert "localhost" in manager.get_api_url(Environment.LOCAL)

    def test_get_network_config(self):
        """Test getting network config for different environments"""
        manager = ConfigManager()
        config = VarityConfig()
        manager.config = config

        # Local network
        local_config = manager.get_network_config(Environment.LOCAL)
        assert "localhost" in local_config['rpc_url']
        assert local_config['chain_id'] == 31337

        # Testnet
        testnet_config = manager.get_network_config(Environment.STAGING)
        assert "sepolia" in testnet_config['rpc_url']

        # Mainnet
        mainnet_config = manager.get_network_config(Environment.PRODUCTION)
        assert "mainnet" in mainnet_config['rpc_url']


class TestEnvironmentEnum:
    """Test Environment enum"""

    def test_environment_values(self):
        """Test environment enum values"""
        assert Environment.DEVELOPMENT.value == "development"
        assert Environment.STAGING.value == "staging"
        assert Environment.PRODUCTION.value == "production"
        assert Environment.LOCAL.value == "local"

    def test_environment_from_string(self):
        """Test creating environment from string"""
        env = Environment("development")
        assert env == Environment.DEVELOPMENT

        env = Environment("production")
        assert env == Environment.PRODUCTION
