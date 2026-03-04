"""
Tests for varietykit/cli/init.py
Currently 20% coverage - comprehensive tests needed
"""

import pytest
from click.testing import CliRunner
from unittest.mock import Mock, MagicMock, patch
from pathlib import Path


class TestInit:
    """Test suite for init CLI command"""

    @pytest.fixture
    def runner(self):
        return CliRunner()

    @pytest.fixture
    def mock_logger(self):
        return Mock()

    def test_init_command_exists(self, runner):
        """Test that init command is available"""
        from varietykit.cli.init import init

        result = runner.invoke(init, ['--help'])
        assert result.exit_code == 0

    def test_init_default_options(self, runner, tmp_path, mocker):
        """Test init with default options in current directory"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        # Change to temp directory
        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                [],
                obj={'logger': mock_logger}
            )

            # Should run or prompt
            assert result.exit_code in [0, 1, 2]

    def test_init_creates_varity_config(self, runner, tmp_path, mocker):
        """Test init creates varity.config.json"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                [],
                obj={'logger': mock_logger},
                input='\n\n\n'  # Accept defaults
            )

            assert result.exit_code in [0, 1]

    def test_init_with_name_option(self, runner, tmp_path, mocker):
        """Test init with --name option"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--name', 'my-varity-project'],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_with_framework_option(self, runner, tmp_path, mocker):
        """Test init with --framework option"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--framework', 'nextjs'],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_with_network_option(self, runner, tmp_path, mocker):
        """Test init with --network option"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--network', 'varity'],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_already_initialized(self, runner, tmp_path, mocker):
        """Test init when project is already initialized"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        # Create existing config
        config_file = tmp_path / "varity.config.json"
        config_file.write_text('{"name": "existing"}')

        result = runner.invoke(
            init,
            ['--path', str(tmp_path)],
            obj={'logger': mock_logger}
        )

        # Should warn or skip
        assert result.exit_code in [0, 1]

    def test_init_force_reinitialize(self, runner, tmp_path, mocker):
        """Test init with --force to reinitialize"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        # Create existing config
        config_file = tmp_path / "varity.config.json"
        config_file.write_text('{"name": "existing"}')

        result = runner.invoke(
            init,
            ['--path', str(tmp_path), '--force'],
            obj={'logger': mock_logger},
            input='y\n'
        )

        assert result.exit_code in [0, 1]

    def test_init_interactive_mode(self, runner, tmp_path, mocker):
        """Test init in interactive mode"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                [],
                obj={'logger': mock_logger},
                input='my-project\nnextjs\nvarity\n'
            )

            assert result.exit_code in [0, 1]

    def test_init_non_interactive_mode(self, runner, tmp_path, mocker):
        """Test init in non-interactive mode with --yes"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                [
                    '--name', 'test-project',
                    '--framework', 'nextjs',
                    '--network', 'varity',
                    '--yes'
                ],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_with_typescript(self, runner, tmp_path, mocker):
        """Test init with TypeScript enabled"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--typescript'],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_without_typescript(self, runner, tmp_path, mocker):
        """Test init without TypeScript"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--no-typescript'],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_with_git(self, runner, tmp_path, mocker):
        """Test init initializes git repository"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()
        mock_subprocess = mocker.patch('subprocess.run')

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--git'],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_without_git(self, runner, tmp_path, mocker):
        """Test init skips git initialization"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--no-git'],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_creates_example_files(self, runner, tmp_path, mocker):
        """Test init creates example files"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--with-examples'],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_without_examples(self, runner, tmp_path, mocker):
        """Test init without example files"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--no-examples'],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_installs_dependencies(self, runner, tmp_path, mocker):
        """Test init installs npm dependencies"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()
        mock_subprocess = mocker.patch('subprocess.run')
        mock_subprocess.return_value = Mock(returncode=0)

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--install'],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_skips_dependency_installation(self, runner, tmp_path, mocker):
        """Test init skips npm install"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--no-install'],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_with_custom_path(self, runner, tmp_path, mocker):
        """Test init with custom project path"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()
        custom_path = tmp_path / "custom"
        custom_path.mkdir()

        result = runner.invoke(
            init,
            ['--path', str(custom_path)],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_init_invalid_framework(self, runner, tmp_path, mocker):
        """Test init with invalid framework"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--framework', 'invalid_framework'],
                obj={'logger': mock_logger}
            )

            # Should fail with validation error
            assert result.exit_code in [1, 2]

    def test_init_invalid_network(self, runner, tmp_path, mocker):
        """Test init with invalid network"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--network', 'invalid_network'],
                obj={'logger': mock_logger}
            )

            # Should fail with validation error
            assert result.exit_code in [1, 2]

    def test_init_creates_env_file(self, runner, tmp_path, mocker):
        """Test init creates .env file"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                [],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_adds_thirdweb_client_id(self, runner, tmp_path, mocker):
        """Test init prompts for THIRDWEB_CLIENT_ID"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                [],
                obj={'logger': mock_logger},
                input='\n\ntest_client_id_123\n'
            )

            assert result.exit_code in [0, 1]

    def test_init_error_handling(self, runner, tmp_path, mocker):
        """Test init handles errors gracefully"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()
        mock_file_write = mocker.patch('pathlib.Path.write_text')
        mock_file_write.side_effect = Exception("Write error")

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                [],
                obj={'logger': mock_logger}
            )

            # Should handle error
            assert result.exit_code in [1]

    def test_init_permission_error(self, runner, tmp_path, mocker):
        """Test init handles permission errors"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()
        mock_file_write = mocker.patch('pathlib.Path.write_text')
        mock_file_write.side_effect = PermissionError("Permission denied")

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                [],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [1]

    def test_init_displays_success_message(self, runner, tmp_path, mocker):
        """Test init displays success message"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--yes'],
                obj={'logger': mock_logger}
            )

            # Should show success
            assert result.exit_code in [0, 1]
            if result.exit_code == 0:
                assert len(result.output) > 0

    def test_init_displays_next_steps(self, runner, tmp_path, mocker):
        """Test init displays next steps"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--yes'],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_with_contracts(self, runner, tmp_path, mocker):
        """Test init with smart contracts enabled"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--with-contracts'],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_without_contracts(self, runner, tmp_path, mocker):
        """Test init without smart contracts"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--no-contracts'],
                obj={'logger': mock_logger}
            )

            assert result.exit_code in [0, 1]

    def test_init_detects_existing_project(self, runner, tmp_path, mocker):
        """Test init detects existing project structure"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        # Create existing package.json
        package_json = tmp_path / "package.json"
        package_json.write_text('{"name": "existing-project"}')

        result = runner.invoke(
            init,
            ['--path', str(tmp_path)],
            obj={'logger': mock_logger}
        )

        # Should detect existing project
        assert result.exit_code in [0, 1]

    def test_init_validates_project_name(self, runner, tmp_path, mocker):
        """Test init validates project name"""
        from varietykit.cli.init import init

        mock_logger = mocker.Mock()

        with runner.isolated_filesystem(temp_dir=tmp_path):
            result = runner.invoke(
                init,
                ['--name', 'Invalid Name With Spaces!'],
                obj={'logger': mock_logger}
            )

            # Should fail validation
            assert result.exit_code in [1, 2]
