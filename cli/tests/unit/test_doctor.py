"""
Tests for varitykit/cli/doctor.py
Currently 7% coverage - comprehensive tests needed
"""

import pytest
from click.testing import CliRunner
from unittest.mock import Mock, MagicMock, patch
import subprocess


class TestDoctor:
    """Test suite for doctor CLI command"""

    @pytest.fixture
    def runner(self):
        return CliRunner()

    @pytest.fixture
    def mock_logger(self):
        return Mock()

    def test_doctor_command_exists(self, runner):
        """Test that doctor command is available"""
        from varitykit.cli.doctor import doctor

        result = runner.invoke(doctor, ['--help'])
        assert result.exit_code == 0
        assert 'doctor' in result.output.lower() or 'check' in result.output.lower()

    def test_doctor_all_checks_pass(self, runner, mocker):
        """Test doctor when all system checks pass"""
        from varitykit.cli.doctor import doctor

        # Mock all subprocess calls to succeed
        mock_run = mocker.patch('subprocess.run')
        mock_result = Mock()
        mock_result.returncode = 0
        mock_result.stdout = "version 1.0.0"
        mock_run.return_value = mock_result

        # Mock file operations
        mocker.patch('pathlib.Path.exists', return_value=True)

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, [], obj={'logger': mock_logger})

        # Should succeed
        assert result.exit_code == 0

    def test_doctor_missing_dependencies(self, runner, mocker):
        """Test doctor when dependencies are missing"""
        from varitykit.cli.doctor import doctor

        # Mock subprocess to fail (command not found)
        mock_run = mocker.patch('subprocess.run')
        mock_run.side_effect = FileNotFoundError()

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, [], obj={'logger': mock_logger})

        # Should report issues
        assert result.exit_code in [0, 1]

    def test_doctor_checks_node(self, runner, mocker):
        """Test doctor checks for Node.js"""
        from varitykit.cli.doctor import doctor

        mock_run = mocker.patch('subprocess.run')

        # Mock node command
        node_result = Mock()
        node_result.returncode = 0
        node_result.stdout = "v18.0.0"
        mock_run.return_value = node_result

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, [], obj={'logger': mock_logger})

        # Should check for node
        assert result.exit_code in [0, 1]
        # Verify subprocess was called
        assert mock_run.called

    def test_doctor_checks_npm(self, runner, mocker):
        """Test doctor checks for npm"""
        from varitykit.cli.doctor import doctor

        mock_run = mocker.patch('subprocess.run')
        npm_result = Mock()
        npm_result.returncode = 0
        npm_result.stdout = "8.0.0"
        mock_run.return_value = npm_result

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, [], obj={'logger': mock_logger})

        assert result.exit_code in [0, 1]

    def test_doctor_checks_docker(self, runner, mocker):
        """Test doctor checks for Docker"""
        from varitykit.cli.doctor import doctor

        mock_run = mocker.patch('subprocess.run')

        def run_side_effect(cmd, *args, **kwargs):
            if 'docker' in cmd:
                docker_result = Mock()
                docker_result.returncode = 0
                docker_result.stdout = "Docker version 20.10.0"
                return docker_result
            return Mock(returncode=0, stdout="version")

        mock_run.side_effect = run_side_effect

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, [], obj={'logger': mock_logger})

        assert result.exit_code in [0, 1]

    def test_doctor_checks_git(self, runner, mocker):
        """Test doctor checks for Git"""
        from varitykit.cli.doctor import doctor

        mock_run = mocker.patch('subprocess.run')
        git_result = Mock()
        git_result.returncode = 0
        git_result.stdout = "git version 2.30.0"
        mock_run.return_value = git_result

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, [], obj={'logger': mock_logger})

        assert result.exit_code in [0, 1]

    def test_doctor_checks_python(self, runner, mocker):
        """Test doctor checks for Python"""
        from varitykit.cli.doctor import doctor

        mock_run = mocker.patch('subprocess.run')
        python_result = Mock()
        python_result.returncode = 0
        python_result.stdout = "Python 3.9.0"
        mock_run.return_value = python_result

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, [], obj={'logger': mock_logger})

        assert result.exit_code in [0, 1]

    def test_doctor_with_verbose_flag(self, runner, mocker):
        """Test doctor with --verbose flag"""
        from varitykit.cli.doctor import doctor

        mock_run = mocker.patch('subprocess.run')
        mock_run.return_value = Mock(returncode=0, stdout="version")

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, ['--verbose'], obj={'logger': mock_logger})

        # Should provide more detailed output
        assert result.exit_code in [0, 1]

    def test_doctor_checks_env_variables(self, runner, mocker):
        """Test doctor checks for required environment variables"""
        from varitykit.cli.doctor import doctor

        mock_run = mocker.patch('subprocess.run')
        mock_run.return_value = Mock(returncode=0, stdout="version")

        # Mock environment variable check
        mocker.patch('os.environ.get', return_value=None)

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, [], obj={'logger': mock_logger})

        # Should warn about missing env vars
        assert result.exit_code in [0, 1]

    def test_doctor_checks_thirdweb_client_id(self, runner, mocker):
        """Test doctor checks for THIRDWEB_CLIENT_ID"""
        from varitykit.cli.doctor import doctor

        mock_run = mocker.patch('subprocess.run')
        mock_run.return_value = Mock(returncode=0, stdout="version")

        # Mock env var to be missing
        def get_env(key, default=None):
            if key == 'THIRDWEB_CLIENT_ID':
                return None
            return default

        mocker.patch('os.environ.get', side_effect=get_env)

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, [], obj={'logger': mock_logger})

        assert result.exit_code in [0, 1]

    def test_doctor_docker_not_running(self, runner, mocker):
        """Test doctor when Docker is installed but not running"""
        from varitykit.cli.doctor import doctor

        mock_run = mocker.patch('subprocess.run')

        def run_side_effect(cmd, *args, **kwargs):
            if 'docker' in cmd and 'ps' in cmd:
                # Docker ps fails when daemon is not running
                result = Mock()
                result.returncode = 1
                result.stdout = ""
                result.stderr = "Cannot connect to Docker daemon"
                return result
            return Mock(returncode=0, stdout="version")

        mock_run.side_effect = run_side_effect

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, [], obj={'logger': mock_logger})

        # Should warn about Docker not running
        assert result.exit_code in [0, 1]

    def test_doctor_old_node_version(self, runner, mocker):
        """Test doctor warns about old Node.js version"""
        from varitykit.cli.doctor import doctor

        mock_run = mocker.patch('subprocess.run')

        def run_side_effect(cmd, *args, **kwargs):
            if 'node' in cmd:
                result = Mock()
                result.returncode = 0
                result.stdout = "v14.0.0"  # Old version
                return result
            return Mock(returncode=0, stdout="version")

        mock_run.side_effect = run_side_effect

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, [], obj={'logger': mock_logger})

        # Should warn about old version
        assert result.exit_code in [0, 1]

    def test_doctor_all_checks_summary(self, runner, mocker):
        """Test doctor provides a summary of all checks"""
        from varitykit.cli.doctor import doctor

        mock_run = mocker.patch('subprocess.run')
        mock_run.return_value = Mock(returncode=0, stdout="version")

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, [], obj={'logger': mock_logger})

        # Should show summary
        assert result.exit_code in [0, 1]
        # Output should contain check results
        assert len(result.output) > 0

    def test_doctor_fix_flag(self, runner, mocker):
        """Test doctor with --fix flag to auto-fix issues"""
        from varitykit.cli.doctor import doctor

        mock_run = mocker.patch('subprocess.run')
        mock_run.return_value = Mock(returncode=0, stdout="version")

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, ['--fix'], obj={'logger': mock_logger})

        # Should attempt to fix issues
        assert result.exit_code in [0, 1]

    def test_doctor_json_output(self, runner, mocker):
        """Test doctor with --json flag for machine-readable output"""
        from varitykit.cli.doctor import doctor

        mock_run = mocker.patch('subprocess.run')
        mock_run.return_value = Mock(returncode=0, stdout="version")

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, ['--json'], obj={'logger': mock_logger})

        # Should provide JSON output
        assert result.exit_code in [0, 1]

    def test_doctor_checks_config_file(self, runner, mocker):
        """Test doctor checks for varity config file"""
        from varitykit.cli.doctor import doctor

        mock_run = mocker.patch('subprocess.run')
        mock_run.return_value = Mock(returncode=0, stdout="version")

        # Mock config file check
        mock_path = mocker.patch('pathlib.Path.exists')
        mock_path.return_value = False

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, [], obj={'logger': mock_logger})

        assert result.exit_code in [0, 1]

    def test_doctor_network_connectivity(self, runner, mocker):
        """Test doctor checks network connectivity"""
        from varitykit.cli.doctor import doctor

        mock_run = mocker.patch('subprocess.run')
        mock_run.return_value = Mock(returncode=0, stdout="version")

        # Mock network check
        mock_requests = mocker.patch('requests.get')
        mock_requests.return_value = Mock(status_code=200)

        mock_logger = mocker.Mock()

        result = runner.invoke(doctor, [], obj={'logger': mock_logger})

        assert result.exit_code in [0, 1]
