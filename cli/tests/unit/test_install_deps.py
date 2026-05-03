import json
import stat
import subprocess

from click.testing import CliRunner

from varitykit.cli.install_deps import _binary_health, install_deps


def test_binary_health_rejects_zero_byte_package_bin(tmp_path):
    (tmp_path / "package.json").write_text(
        json.dumps({"dependencies": {"next": "^14.0.0"}})
    )
    bin_dir = tmp_path / "node_modules" / ".bin"
    bin_dir.mkdir(parents=True)
    next_bin = bin_dir / "next"
    next_bin.write_text("#!/usr/bin/env node\n")
    next_bin.chmod(next_bin.stat().st_mode | stat.S_IXUSR)

    package_bin = tmp_path / "node_modules" / "next" / "dist" / "bin" / "next"
    package_bin.parent.mkdir(parents=True)
    package_bin.write_text("")

    missing, corrupt = _binary_health(tmp_path)

    assert missing == []
    assert corrupt == ["next"]


def test_install_deps_npm_success(monkeypatch, tmp_path):
    (tmp_path / "package.json").write_text(json.dumps({"dependencies": {}}))

    def fake_run(command, cwd, capture_output, text, timeout):
        return subprocess.CompletedProcess(command, 0, "added 1 package", "")

    monkeypatch.setattr(subprocess, "run", fake_run)

    result = CliRunner().invoke(install_deps, ["--path", str(tmp_path)])

    assert result.exit_code == 0
    assert "Dependencies installed successfully" in result.output


def test_install_deps_python_success(monkeypatch, tmp_path):
    (tmp_path / "requirements.txt").write_text("fastapi\n")

    def fake_run(command, cwd, capture_output, text, timeout):
        assert command[:3] == ["pip", "install", "-r"]
        return subprocess.CompletedProcess(command, 0, "ok", "")

    monkeypatch.setattr(subprocess, "run", fake_run)

    result = CliRunner().invoke(install_deps, ["--path", str(tmp_path)])

    assert result.exit_code == 0
    assert "Python dependencies installed successfully" in result.output
