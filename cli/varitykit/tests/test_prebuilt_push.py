"""
Tests for `_push_prebuilt_artifacts` — the Akash pre-built-artifacts fix.

Context: heavy Next.js apps (MUI + thirdweb + Privy, 1400+ npm packages) OOM
when `npm install && npm run build` runs inside a 4Gi Akash container. The
fix runs the build locally, force-adds `.next/`, commits, and pushes, so the
Akash container's entrypoint (`if [ ! -d .next ]; then npm run build; fi`)
skips the build step entirely.

These tests mock `subprocess.run` to isolate the push logic. We never touch
a real git repo.
"""

import subprocess
from pathlib import Path
from unittest.mock import MagicMock, patch, call

import pytest

from varitykit.commands.app_deploy import _push_prebuilt_artifacts


def _make_console():
    """Return a MagicMock console that accepts `.print(...)`."""
    return MagicMock()


def _mk_run_result(returncode=0, stdout="", stderr=""):
    """Build a CompletedProcess-like object for mocking subprocess.run."""
    result = MagicMock(spec=subprocess.CompletedProcess)
    result.returncode = returncode
    result.stdout = stdout
    result.stderr = stderr
    return result


def _git_run_sequence(sequence):
    """
    Build a side_effect function that matches argv prefixes.

    `sequence` maps an argv-prefix-tuple → CompletedProcess-like result.
    Unmatched calls raise AssertionError — this is a test-design assert and
    helps us catch regressions that add new git calls without test coverage.
    """
    def _side_effect(cmd, *args, **kwargs):
        cmd_tuple = tuple(cmd)
        for prefix, result in sequence:
            if cmd_tuple[: len(prefix)] == prefix:
                return result
        raise AssertionError(f"Unexpected subprocess.run call: {cmd}")

    return _side_effect


class TestPushPrebuiltArtifactsHappyPath:
    """End-to-end flow: hosting=akash + nextjs + `.next/` exists → push."""

    def test_nextjs_akash_with_next_dir_calls_git_add_commit_push(self, tmp_path):
        # Simulate a Next.js project whose build just produced `.next/`.
        (tmp_path / ".next").mkdir()
        (tmp_path / ".next" / "BUILD_ID").write_text("abc")

        git_sequence = [
            (("git", "rev-parse", "--show-toplevel"), _mk_run_result(0, stdout=str(tmp_path))),
            (("git", "add", "-f"), _mk_run_result(0)),
            (("git", "rm", "--cached"), _mk_run_result(0)),
            (("git", "commit"), _mk_run_result(0, stdout="[main abc123] chore: ...")),
            (("git", "push"), _mk_run_result(0, stdout="Everything up-to-date")),
        ]

        with patch("varitykit.commands.app_deploy.subprocess.run") as mock_run:
            mock_run.side_effect = _git_run_sequence(git_sequence)

            result = _push_prebuilt_artifacts(
                project_path=tmp_path,
                project_type="nextjs",
                hosting="akash",
                console_=_make_console(),
            )

        assert result is True

        # All four git commands were invoked.
        invoked_cmds = [call_args.args[0] for call_args in mock_run.call_args_list]
        assert any(cmd[:2] == ["git", "rev-parse"] for cmd in invoked_cmds)
        assert any(cmd[:3] == ["git", "add", "-f"] for cmd in invoked_cmds)
        assert any(cmd[:2] == ["git", "commit"] for cmd in invoked_cmds)
        assert any(cmd[:2] == ["git", "push"] for cmd in invoked_cmds)


class TestPushPrebuiltArtifactsSkippedDeploys:
    """When the deploy shape doesn't match, the push must NOT run."""

    def test_static_hosting_skips_push_entirely(self, tmp_path):
        """Static IPFS deploys don't need `.next/` in the repo."""
        (tmp_path / ".next").mkdir()
        (tmp_path / ".next" / "BUILD_ID").write_text("abc")

        with patch("varitykit.commands.app_deploy.subprocess.run") as mock_run:
            result = _push_prebuilt_artifacts(
                project_path=tmp_path,
                project_type="nextjs",
                hosting="static",
                console_=_make_console(),
            )

        assert result is False
        assert mock_run.call_count == 0, "No git command should run for static deploys"

    def test_no_next_directory_skips_push(self, tmp_path):
        """No `.next/` means nothing to ship. Must be a no-op."""
        # Do NOT create `.next/`.

        with patch("varitykit.commands.app_deploy.subprocess.run") as mock_run:
            result = _push_prebuilt_artifacts(
                project_path=tmp_path,
                project_type="nextjs",
                hosting="akash",
                console_=_make_console(),
            )

        assert result is False
        assert mock_run.call_count == 0

    def test_python_project_on_akash_skips_push(self, tmp_path):
        """Python apps have no `.next/` concept; skip unconditionally."""
        # Even if `.next/` exists (developer mistake, stale build, whatever),
        # we shouldn't ship it for a python project — the project_type guard wins.
        (tmp_path / ".next").mkdir()
        (tmp_path / ".next" / "BUILD_ID").write_text("abc")

        with patch("varitykit.commands.app_deploy.subprocess.run") as mock_run:
            result = _push_prebuilt_artifacts(
                project_path=tmp_path,
                project_type="python",
                hosting="akash",
                console_=_make_console(),
            )

        assert result is False
        assert mock_run.call_count == 0


class TestPushPrebuiltArtifactsFailureModes:
    """Failures must NEVER raise — deploy continues with slower runtime build."""

    def test_git_push_failure_logs_warning_and_returns_false(self, tmp_path):
        """A push failure (e.g., no remote, auth error) must degrade gracefully."""
        (tmp_path / ".next").mkdir()
        (tmp_path / ".next" / "BUILD_ID").write_text("abc")
        console = _make_console()

        git_sequence = [
            (("git", "rev-parse", "--show-toplevel"), _mk_run_result(0, stdout=str(tmp_path))),
            (("git", "add", "-f"), _mk_run_result(0)),
            (("git", "rm", "--cached"), _mk_run_result(0)),
            (("git", "commit"), _mk_run_result(0)),
            (("git", "push"), _mk_run_result(1, stderr="fatal: no upstream configured")),
        ]

        with patch("varitykit.commands.app_deploy.subprocess.run") as mock_run:
            mock_run.side_effect = _git_run_sequence(git_sequence)

            # MUST NOT raise.
            result = _push_prebuilt_artifacts(
                project_path=tmp_path,
                project_type="nextjs",
                hosting="akash",
                console_=console,
            )

        assert result is False

        # The warning message must have been printed.
        printed = " ".join(
            str(c.args[0]) if c.args else ""
            for c in console.print.call_args_list
        )
        assert "Could not push pre-built artifacts" in printed

    def test_nothing_to_commit_still_attempts_push(self, tmp_path):
        """
        Idempotent re-deploy: `.next/` bytes identical to last commit.
        `git commit` exits non-zero with 'nothing to commit' — we still push
        (maybe an earlier commit hasn't reached the remote yet).
        """
        (tmp_path / ".next").mkdir()
        (tmp_path / ".next" / "BUILD_ID").write_text("abc")

        git_sequence = [
            (("git", "rev-parse", "--show-toplevel"), _mk_run_result(0, stdout=str(tmp_path))),
            (("git", "add", "-f"), _mk_run_result(0)),
            (("git", "rm", "--cached"), _mk_run_result(0)),
            (
                ("git", "commit"),
                _mk_run_result(1, stdout="nothing to commit, working tree clean"),
            ),
            (("git", "push"), _mk_run_result(0, stdout="Everything up-to-date")),
        ]

        with patch("varitykit.commands.app_deploy.subprocess.run") as mock_run:
            mock_run.side_effect = _git_run_sequence(git_sequence)

            result = _push_prebuilt_artifacts(
                project_path=tmp_path,
                project_type="nextjs",
                hosting="akash",
                console_=_make_console(),
            )

        # Commit was skipped, push still ran, overall succeeded.
        assert result is True

        invoked_cmds = [call_args.args[0] for call_args in mock_run.call_args_list]
        assert any(cmd[:2] == ["git", "push"] for cmd in invoked_cmds), (
            "Push must still be attempted even when `git commit` says nothing to commit"
        )


class TestPushPrebuiltArtifactsGitFlags:
    """Regression guards for the exact flags we require."""

    def test_commit_command_includes_no_verify(self, tmp_path):
        """
        --no-verify is essential: generic-template-dashboard has a pre-commit
        hook that re-runs the entire build. Without --no-verify, this hook
        could hang for 5+ minutes or fail.
        """
        (tmp_path / ".next").mkdir()
        (tmp_path / ".next" / "BUILD_ID").write_text("abc")

        git_sequence = [
            (("git", "rev-parse", "--show-toplevel"), _mk_run_result(0, stdout=str(tmp_path))),
            (("git", "add", "-f"), _mk_run_result(0)),
            (("git", "rm", "--cached"), _mk_run_result(0)),
            (("git", "commit"), _mk_run_result(0)),
            (("git", "push"), _mk_run_result(0)),
        ]

        with patch("varitykit.commands.app_deploy.subprocess.run") as mock_run:
            mock_run.side_effect = _git_run_sequence(git_sequence)

            _push_prebuilt_artifacts(
                project_path=tmp_path,
                project_type="nextjs",
                hosting="akash",
                console_=_make_console(),
            )

        commit_cmd = next(
            call_args.args[0]
            for call_args in mock_run.call_args_list
            if call_args.args[0][:2] == ["git", "commit"]
        )
        assert "--no-verify" in commit_cmd, (
            f"commit command must include --no-verify, got: {commit_cmd}"
        )

    def test_git_add_command_includes_force_flag(self, tmp_path):
        """
        `-f` is essential: `.next/` is gitignored by default in every
        create-next-app / create-varity-app template.
        """
        (tmp_path / ".next").mkdir()
        (tmp_path / ".next" / "BUILD_ID").write_text("abc")

        git_sequence = [
            (("git", "rev-parse", "--show-toplevel"), _mk_run_result(0, stdout=str(tmp_path))),
            (("git", "add", "-f"), _mk_run_result(0)),
            (("git", "rm", "--cached"), _mk_run_result(0)),
            (("git", "commit"), _mk_run_result(0)),
            (("git", "push"), _mk_run_result(0)),
        ]

        with patch("varitykit.commands.app_deploy.subprocess.run") as mock_run:
            mock_run.side_effect = _git_run_sequence(git_sequence)

            _push_prebuilt_artifacts(
                project_path=tmp_path,
                project_type="nextjs",
                hosting="akash",
                console_=_make_console(),
            )

        add_cmd = next(
            call_args.args[0]
            for call_args in mock_run.call_args_list
            if call_args.args[0][:2] == ["git", "add"]
        )
        assert "-f" in add_cmd, f"git add must include -f, got: {add_cmd}"
        assert any(a.startswith(".next") for a in add_cmd)
