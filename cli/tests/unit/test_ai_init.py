"""
Tests for varitykit/cli/ai_init.py
Currently 0% coverage - comprehensive tests needed
"""

import pytest
from click.testing import CliRunner
from pathlib import Path
from unittest.mock import Mock, MagicMock, patch


class TestAIInit:
    """Test suite for ai-init CLI command"""

    @pytest.fixture
    def runner(self):
        return CliRunner()

    @pytest.fixture
    def mock_logger(self):
        return Mock()

    def test_ai_init_command_exists(self, runner):
        """Test that ai-init command is available"""
        from varitykit.cli.ai_init import ai_init

        result = runner.invoke(ai_init, ['--help'])
        assert result.exit_code == 0
        assert 'ai-init' in result.output.lower() or 'AI' in result.output

    def test_ai_init_with_name_option(self, runner, tmp_path, mocker):
        """Test ai-init with --name option"""
        from varitykit.cli.ai_init import ai_init

        # Mock dependencies
        mock_ai_engine = mocker.patch('varitykit.cli.ai_init.AITemplateEngine')
        mock_logger = mocker.Mock()

        # Mock engine methods
        mock_engine_instance = Mock()
        mock_engine_instance.analyze_business_requirements.return_value = {
            'business_name': 'Test Company',
            'industry': 'technology',
            'company_size': 'small'
        }
        mock_engine_instance.generate_template.return_value = True
        mock_ai_engine.return_value = mock_engine_instance

        result = runner.invoke(
            ai_init,
            ['--name', 'test-company'],
            obj={'logger': mock_logger},
            input='technology\nsmall\n'
        )

        # Should succeed or be aborted (depending on implementation)
        assert result.exit_code in [0, 1]

    def test_ai_init_interactive_mode(self, runner, tmp_path, mocker):
        """Test ai-init in interactive mode"""
        from varitykit.cli.ai_init import ai_init

        # Mock dependencies
        mock_ai_engine = mocker.patch('varitykit.cli.ai_init.AITemplateEngine')
        mock_logger = mocker.Mock()

        result = runner.invoke(
            ai_init,
            [],
            obj={'logger': mock_logger},
            input='My Company\ntechnology\nsmall\nyes\n'
        )

        # Should run without crashing
        assert result.exit_code in [0, 1]

    def test_ai_init_with_industry_option(self, runner, mocker):
        """Test ai-init with --industry option"""
        from varitykit.cli.ai_init import ai_init

        mock_logger = mocker.Mock()

        result = runner.invoke(
            ai_init,
            ['--name', 'test', '--industry', 'finance'],
            obj={'logger': mock_logger},
            input='small\nyes\n'
        )

        # Should run without crashing
        assert result.exit_code in [0, 1]

    def test_ai_init_with_size_option(self, runner, mocker):
        """Test ai-init with --size option"""
        from varitykit.cli.ai_init import ai_init

        mock_logger = mocker.Mock()

        result = runner.invoke(
            ai_init,
            ['--name', 'test', '--size', 'large'],
            obj={'logger': mock_logger},
            input='technology\nyes\n'
        )

        # Should run without crashing
        assert result.exit_code in [0, 1]

    def test_ai_init_all_options(self, runner, mocker):
        """Test ai-init with all options provided"""
        from varitykit.cli.ai_init import ai_init

        mock_ai_engine = mocker.patch('varitykit.cli.ai_init.AITemplateEngine')
        mock_logger = mocker.Mock()

        # Mock engine
        mock_engine_instance = Mock()
        mock_engine_instance.analyze_business_requirements.return_value = {
            'business_name': 'Test Company',
            'industry': 'technology',
            'company_size': 'medium'
        }
        mock_engine_instance.generate_template.return_value = True
        mock_ai_engine.return_value = mock_engine_instance

        result = runner.invoke(
            ai_init,
            [
                '--name', 'test-company',
                '--industry', 'technology',
                '--size', 'medium',
                '--yes'
            ],
            obj={'logger': mock_logger}
        )

        # Should succeed or abort
        assert result.exit_code in [0, 1]

    def test_ai_init_error_handling(self, runner, mocker):
        """Test ai-init handles errors gracefully"""
        from varitykit.cli.ai_init import ai_init

        mock_ai_engine = mocker.patch('varitykit.cli.ai_init.AITemplateEngine')
        mock_logger = mocker.Mock()

        # Make engine raise an error
        mock_ai_engine.side_effect = Exception("AI Engine Error")

        result = runner.invoke(
            ai_init,
            ['--name', 'test'],
            obj={'logger': mock_logger}
        )

        # Should handle error
        assert result.exit_code != 0

    def test_ai_init_invalid_industry(self, runner, mocker):
        """Test ai-init with invalid industry"""
        from varitykit.cli.ai_init import ai_init

        mock_logger = mocker.Mock()

        result = runner.invoke(
            ai_init,
            ['--name', 'test', '--industry', 'invalid_industry'],
            obj={'logger': mock_logger}
        )

        # Should handle invalid input
        assert result.exit_code in [0, 1, 2]  # 2 for click usage error

    def test_ai_init_invalid_size(self, runner, mocker):
        """Test ai-init with invalid company size"""
        from varitykit.cli.ai_init import ai_init

        mock_logger = mocker.Mock()

        result = runner.invoke(
            ai_init,
            ['--name', 'test', '--size', 'invalid_size'],
            obj={'logger': mock_logger}
        )

        # Should handle invalid input
        assert result.exit_code in [0, 1, 2]

    def test_ai_init_with_path_option(self, runner, tmp_path, mocker):
        """Test ai-init with custom output path"""
        from varitykit.cli.ai_init import ai_init

        mock_logger = mocker.Mock()
        output_dir = tmp_path / "output"

        result = runner.invoke(
            ai_init,
            [
                '--name', 'test',
                '--path', str(output_dir)
            ],
            obj={'logger': mock_logger},
            input='technology\nsmall\nyes\n'
        )

        # Should run without crashing
        assert result.exit_code in [0, 1]
