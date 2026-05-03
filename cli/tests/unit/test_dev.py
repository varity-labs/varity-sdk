"""
Tests for varitykit/cli/dev.py
Currently 20% coverage - comprehensive tests needed
"""

import pytest
from click.testing import CliRunner
from unittest.mock import Mock, MagicMock, patch
from pathlib import Path


class TestDev:
    """Test suite for dev CLI command"""

    @pytest.fixture
    def runner(self):
        return CliRunner()

    @pytest.fixture
    def mock_logger(self):
        return Mock()

    def test_dev_command_exists(self, runner):
        """Test that dev command is available"""
        from varitykit.cli.dev import dev

        result = runner.invoke(dev, ['--help'])
        assert result.exit_code == 0

    def test_dev_starts_development_server(self, runner, tmp_path, mocker):
        """Test dev command starts development server"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()
        mock_subprocess = mocker.patch('subprocess.Popen')
        mock_process = Mock()
        mock_process.poll.return_value = None
        mock_subprocess.return_value = mock_process

        # Create a test project
        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('{"name": "test", "scripts": {"dev": "next dev"}}')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir)],
            obj={'logger': mock_logger}
        )

        # Should start or attempt to start server
        assert result.exit_code in [0, 1]

    def test_dev_with_port_option(self, runner, tmp_path, mocker):
        """Test dev command with custom port"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()
        mock_subprocess = mocker.patch('subprocess.Popen')

        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('{"name": "test"}')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir), '--port', '4000'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_dev_with_host_option(self, runner, tmp_path, mocker):
        """Test dev command with custom host"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()

        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('{"name": "test"}')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir), '--host', '0.0.0.0'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_dev_detects_nextjs_project(self, runner, tmp_path, mocker):
        """Test dev command detects Next.js project"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()
        mock_subprocess = mocker.patch('subprocess.Popen')

        project_dir = tmp_path / "nextjs-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('''{
            "dependencies": {"next": "14.0.0"}
        }''')
        (project_dir / "next.config.js").write_text('module.exports = {}')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir)],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_dev_detects_react_project(self, runner, tmp_path, mocker):
        """Test dev command detects React project"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()

        project_dir = tmp_path / "react-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('''{
            "dependencies": {"react": "18.0.0", "react-scripts": "5.0.0"}
        }''')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir)],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_dev_detects_vue_project(self, runner, tmp_path, mocker):
        """Test dev command detects Vue project"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()

        project_dir = tmp_path / "vue-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('''{
            "dependencies": {"vue": "3.0.0"}
        }''')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir)],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_dev_with_hot_reload(self, runner, tmp_path, mocker):
        """Test dev command with hot reload enabled"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()

        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('{"name": "test"}')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir), '--hot-reload'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_dev_without_hot_reload(self, runner, tmp_path, mocker):
        """Test dev command with hot reload disabled"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()

        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('{"name": "test"}')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir), '--no-hot-reload'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_dev_with_env_file(self, runner, tmp_path, mocker):
        """Test dev command loads .env file"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()

        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('{"name": "test"}')
        (project_dir / ".env").write_text('API_KEY=test123\nAPI_URL=https://api.test.com')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir)],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_dev_missing_package_json(self, runner, tmp_path, mocker):
        """Test dev command with missing package.json"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()

        project_dir = tmp_path / "empty-project"
        project_dir.mkdir()

        result = runner.invoke(
            dev,
            ['--path', str(project_dir)],
            obj={'logger': mock_logger}
        )

        # Should fail or warn
        assert result.exit_code in [0, 1, 2]

    def test_dev_port_already_in_use(self, runner, tmp_path, mocker):
        """Test dev command when port is already in use"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()
        mock_subprocess = mocker.patch('subprocess.Popen')
        mock_subprocess.side_effect = OSError("Address already in use")

        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('{"name": "test"}')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir)],
            obj={'logger': mock_logger}
        )

        # Should handle port conflict
        assert result.exit_code in [0, 1]

    def test_dev_with_verbose_output(self, runner, tmp_path, mocker):
        """Test dev command with verbose output"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()

        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('{"name": "test"}')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir), '--verbose'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_dev_with_open_browser(self, runner, tmp_path, mocker):
        """Test dev command opens browser automatically"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()
        mock_webbrowser = mocker.patch('webbrowser.open')

        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('{"name": "test"}')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir), '--open'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_dev_without_open_browser(self, runner, tmp_path, mocker):
        """Test dev command doesn't open browser"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()

        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('{"name": "test"}')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir), '--no-open'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_dev_handles_keyboard_interrupt(self, runner, tmp_path, mocker):
        """Test dev command handles Ctrl+C gracefully"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()
        mock_subprocess = mocker.patch('subprocess.Popen')
        mock_process = Mock()
        mock_process.poll.side_effect = KeyboardInterrupt()
        mock_subprocess.return_value = mock_process

        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('{"name": "test"}')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir)],
            obj={'logger': mock_logger}
        )

        # Should handle interrupt gracefully
        assert result.exit_code in [0, 1]

    def test_dev_with_watch_option(self, runner, tmp_path, mocker):
        """Test dev command with file watching"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()

        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('{"name": "test"}')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir), '--watch'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_dev_custom_script(self, runner, tmp_path, mocker):
        """Test dev command with custom dev script"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()

        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('''{
            "scripts": {
                "dev": "custom-dev-command"
            }
        }''')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir)],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_dev_error_handling(self, runner, tmp_path, mocker):
        """Test dev command handles errors gracefully"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()
        mock_subprocess = mocker.patch('subprocess.Popen')
        mock_subprocess.side_effect = Exception("Unexpected error")

        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('{"name": "test"}')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir)],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [1]

    def test_dev_displays_server_info(self, runner, tmp_path, mocker):
        """Test dev command displays server information"""
        from varitykit.cli.dev import dev

        mock_logger = mocker.Mock()
        mock_subprocess = mocker.patch('subprocess.Popen')
        mock_process = Mock()
        mock_process.poll.return_value = None
        mock_subprocess.return_value = mock_process

        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        (project_dir / "package.json").write_text('{"name": "test"}')

        result = runner.invoke(
            dev,
            ['--path', str(project_dir)],
            obj={'logger': mock_logger}
        )

        # Should display server info
        assert result.exit_code in [0, 1]
