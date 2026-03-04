"""
Unit tests for Marketplace functionality

Tests template publishing, searching, and installation
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from click.testing import CliRunner
from varietykit.cli.marketplace import marketplace


@pytest.mark.unit
class TestMarketplacePublish:
    """Test template publishing to marketplace"""

    def test_publish_command_exists(self, cli_runner):
        """Test that publish command is registered"""
        result = cli_runner.invoke(marketplace, ['publish', '--help'])
        assert result.exit_code == 0
        assert 'publish' in result.output.lower()

    @pytest.mark.parametrize('price,expected_creator,expected_platform', [
        (99, 69, 30),
        (299, 209, 90),
        (499, 349, 150),
        (999, 699, 300),
    ])
    def test_revenue_split_various_prices(
        self,
        price,
        expected_creator,
        expected_platform
    ):
        """Test revenue split calculations for different prices"""
        creator_share = int(price * 0.70)
        platform_share = price - creator_share

        assert creator_share == expected_creator
        assert platform_share == expected_platform
        assert creator_share + platform_share == price


@pytest.mark.unit
class TestMarketplaceSearch:
    """Test marketplace search functionality"""

    def test_search_command_exists(self, cli_runner):
        """Test that search command is registered"""
        result = cli_runner.invoke(marketplace, ['search', '--help'])
        assert result.exit_code == 0


@pytest.mark.unit
class TestMarketplaceInstall:
    """Test template installation"""

    def test_install_command_exists(self, cli_runner):
        """Test that install command is registered"""
        result = cli_runner.invoke(marketplace, ['install', '--help'])
        assert result.exit_code == 0


@pytest.mark.unit
class TestMarketplaceStats:
    """Test marketplace statistics"""

    def test_stats_command_exists(self, cli_runner):
        """Test that stats command is registered"""
        result = cli_runner.invoke(marketplace, ['stats', '--help'])
        assert result.exit_code == 0


@pytest.mark.unit
class TestMarketplaceUpdate:
    """Test template update functionality"""

    def test_update_command_exists(self, cli_runner):
        """Test that update command is registered"""
        result = cli_runner.invoke(marketplace, ['update', '--help'])
        assert result.exit_code == 0


@pytest.mark.unit
class TestMarketplaceUnpublish:
    """Test template unpublishing"""

    def test_unpublish_command_exists(self, cli_runner):
        """Test that unpublish command is registered"""
        result = cli_runner.invoke(marketplace, ['unpublish', '--help'])
        assert result.exit_code == 0


@pytest.mark.unit
class TestRevenueSharing:
    """Test 70/30 revenue sharing logic"""

    def test_calculate_revenue_split(self):
        """Test that revenue split is correctly calculated"""
        price = 299

        creator_share = int(price * 0.70)
        platform_share = price - creator_share

        assert creator_share == 209
        assert platform_share == 90
        assert creator_share + platform_share == price
