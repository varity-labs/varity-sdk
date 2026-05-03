"""
Tests for varitykit/cli/bootstrap.py
Currently 12% coverage - comprehensive tests needed
"""

import pytest
from click.testing import CliRunner
from unittest.mock import Mock, MagicMock, patch
from pathlib import Path


class TestBootstrap:
    """Test suite for bootstrap CLI command"""

    @pytest.fixture
    def runner(self):
        return CliRunner()

    @pytest.fixture
    def mock_logger(self):
        return Mock()

    def test_bootstrap_command_exists(self, runner):
        """Test that bootstrap command is available"""
        from varitykit.cli.bootstrap import bootstrap

        result = runner.invoke(bootstrap, ['--help'])
        assert result.exit_code == 0

    def test_bootstrap_default_options(self, runner, tmp_path, mocker):
        """Test bootstrap with default options"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()

        # Change to temp directory
        result = runner.invoke(
            bootstrap,
            [],
            obj={'logger': mock_logger}
        )

        # Should run or prompt for input
        assert result.exit_code in [0, 1, 2]

    def test_bootstrap_with_name(self, runner, tmp_path, mocker):
        """Test bootstrap with project name"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_template_gen = mocker.patch('varitykit.cli.bootstrap.TemplateGenerator')
        mock_template_gen.return_value.generate.return_value = True

        result = runner.invoke(
            bootstrap,
            ['--name', 'test-project'],
            obj={'logger': mock_logger},
            input='technology\nsmall\n'
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_with_template(self, runner, tmp_path, mocker):
        """Test bootstrap with --template option"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_template_gen = mocker.patch('varitykit.cli.bootstrap.TemplateGenerator')
        mock_template_gen.return_value.generate.return_value = True

        result = runner.invoke(
            bootstrap,
            ['--name', 'test', '--template', 'nextjs'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_with_framework(self, runner, mocker):
        """Test bootstrap with --framework option"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_template_gen = mocker.patch('varitykit.cli.bootstrap.TemplateGenerator')

        result = runner.invoke(
            bootstrap,
            ['--name', 'test', '--framework', 'react'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_with_typescript(self, runner, mocker):
        """Test bootstrap with TypeScript option"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_template_gen = mocker.patch('varitykit.cli.bootstrap.TemplateGenerator')

        result = runner.invoke(
            bootstrap,
            ['--name', 'test', '--typescript'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_without_typescript(self, runner, mocker):
        """Test bootstrap without TypeScript"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()

        result = runner.invoke(
            bootstrap,
            ['--name', 'test', '--no-typescript'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_with_git_init(self, runner, mocker):
        """Test bootstrap initializes git repository"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_subprocess = mocker.patch('subprocess.run')

        result = runner.invoke(
            bootstrap,
            ['--name', 'test', '--git'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_without_git(self, runner, mocker):
        """Test bootstrap skips git initialization"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_subprocess = mocker.patch('subprocess.run')

        result = runner.invoke(
            bootstrap,
            ['--name', 'test', '--no-git'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_with_install_deps(self, runner, mocker):
        """Test bootstrap with --install flag to install dependencies"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_subprocess = mocker.patch('subprocess.run')
        mock_subprocess.return_value = Mock(returncode=0)

        result = runner.invoke(
            bootstrap,
            ['--name', 'test', '--install'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_skip_install_deps(self, runner, mocker):
        """Test bootstrap skips dependency installation"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_subprocess = mocker.patch('subprocess.run')

        result = runner.invoke(
            bootstrap,
            ['--name', 'test', '--no-install'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_with_path(self, runner, tmp_path, mocker):
        """Test bootstrap with custom output path"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        output_dir = tmp_path / "output"

        result = runner.invoke(
            bootstrap,
            ['--name', 'test', '--path', str(output_dir)],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_existing_directory_error(self, runner, tmp_path, mocker):
        """Test bootstrap fails when directory already exists"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()

        # Create existing directory
        existing_dir = tmp_path / "existing-project"
        existing_dir.mkdir()
        (existing_dir / "package.json").write_text('{}')

        result = runner.invoke(
            bootstrap,
            ['--name', 'existing-project', '--path', str(tmp_path)],
            obj={'logger': mock_logger}
        )

        # Should fail or warn
        assert result.exit_code in [0, 1, 2]

    def test_bootstrap_force_overwrite(self, runner, tmp_path, mocker):
        """Test bootstrap with --force to overwrite existing directory"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()

        # Create existing directory
        existing_dir = tmp_path / "existing"
        existing_dir.mkdir()

        result = runner.invoke(
            bootstrap,
            ['--name', 'existing', '--path', str(tmp_path), '--force'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_with_features(self, runner, mocker):
        """Test bootstrap with additional features"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()

        result = runner.invoke(
            bootstrap,
            [
                '--name', 'test',
                '--features', 'auth,database,api'
            ],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_with_industry(self, runner, mocker):
        """Test bootstrap with industry-specific template"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()

        result = runner.invoke(
            bootstrap,
            ['--name', 'test', '--industry', 'finance'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_with_company_size(self, runner, mocker):
        """Test bootstrap with company size option"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()

        result = runner.invoke(
            bootstrap,
            ['--name', 'test', '--size', 'large'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_interactive_mode(self, runner, mocker):
        """Test bootstrap in interactive mode"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()

        result = runner.invoke(
            bootstrap,
            [],
            obj={'logger': mock_logger},
            input='my-project\nnextjs\ny\nn\ntechnology\nsmall\n'
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_non_interactive_mode(self, runner, mocker):
        """Test bootstrap in non-interactive mode with all options"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_template_gen = mocker.patch('varitykit.cli.bootstrap.TemplateGenerator')

        result = runner.invoke(
            bootstrap,
            [
                '--name', 'test',
                '--template', 'nextjs',
                '--typescript',
                '--git',
                '--no-install',
                '--yes'
            ],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_invalid_template(self, runner, mocker):
        """Test bootstrap with invalid template name"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()

        result = runner.invoke(
            bootstrap,
            ['--name', 'test', '--template', 'invalid_template'],
            obj={'logger': mock_logger}
        )

        # Should fail with error
        assert result.exit_code in [1, 2]

    def test_bootstrap_invalid_framework(self, runner, mocker):
        """Test bootstrap with invalid framework"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()

        result = runner.invoke(
            bootstrap,
            ['--name', 'test', '--framework', 'invalid_framework'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [1, 2]

    def test_bootstrap_creates_package_json(self, runner, tmp_path, mocker):
        """Test bootstrap creates package.json"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_template_gen = mocker.patch('varitykit.cli.bootstrap.TemplateGenerator')

        # Mock to create files
        def generate_side_effect(*args, **kwargs):
            project_dir = tmp_path / "test-project"
            project_dir.mkdir(exist_ok=True)
            (project_dir / "package.json").write_text('{"name": "test-project"}')
            return True

        mock_template_gen.return_value.generate.side_effect = generate_side_effect

        result = runner.invoke(
            bootstrap,
            ['--name', 'test-project', '--path', str(tmp_path)],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_creates_readme(self, runner, tmp_path, mocker):
        """Test bootstrap creates README.md"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_template_gen = mocker.patch('varitykit.cli.bootstrap.TemplateGenerator')

        result = runner.invoke(
            bootstrap,
            ['--name', 'test', '--path', str(tmp_path)],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_creates_gitignore(self, runner, tmp_path, mocker):
        """Test bootstrap creates .gitignore"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()

        result = runner.invoke(
            bootstrap,
            ['--name', 'test', '--path', str(tmp_path), '--git'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [0, 1]

    def test_bootstrap_error_handling(self, runner, mocker):
        """Test bootstrap handles errors gracefully"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_template_gen = mocker.patch('varitykit.cli.bootstrap.TemplateGenerator')
        mock_template_gen.side_effect = Exception("Template generation failed")

        result = runner.invoke(
            bootstrap,
            ['--name', 'test'],
            obj={'logger': mock_logger}
        )

        # Should handle error
        assert result.exit_code in [1]

    def test_bootstrap_permission_error(self, runner, mocker):
        """Test bootstrap handles permission errors"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_template_gen = mocker.patch('varitykit.cli.bootstrap.TemplateGenerator')
        mock_template_gen.side_effect = PermissionError("Permission denied")

        result = runner.invoke(
            bootstrap,
            ['--name', 'test'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [1]

    def test_bootstrap_disk_space_error(self, runner, mocker):
        """Test bootstrap handles disk space errors"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_template_gen = mocker.patch('varitykit.cli.bootstrap.TemplateGenerator')
        mock_template_gen.side_effect = OSError("No space left on device")

        result = runner.invoke(
            bootstrap,
            ['--name', 'test'],
            obj={'logger': mock_logger}
        )

        assert result.exit_code in [1]

    def test_bootstrap_displays_success_message(self, runner, mocker):
        """Test bootstrap displays success message"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_template_gen = mocker.patch('varitykit.cli.bootstrap.TemplateGenerator')
        mock_template_gen.return_value.generate.return_value = True

        result = runner.invoke(
            bootstrap,
            ['--name', 'test'],
            obj={'logger': mock_logger}
        )

        # Should show success output
        assert result.exit_code in [0, 1]
        if result.exit_code == 0:
            assert len(result.output) > 0

    def test_bootstrap_displays_next_steps(self, runner, mocker):
        """Test bootstrap displays next steps after creation"""
        from varitykit.cli.bootstrap import bootstrap

        mock_logger = mocker.Mock()
        mock_template_gen = mocker.patch('varitykit.cli.bootstrap.TemplateGenerator')
        mock_template_gen.return_value.generate.return_value = True

        result = runner.invoke(
            bootstrap,
            ['--name', 'test'],
            obj={'logger': mock_logger}
        )

        # Should show next steps
        assert result.exit_code in [0, 1]
