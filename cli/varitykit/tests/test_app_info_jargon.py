"""
Regression test for VAR-513: varitykit app info --help exposes forbidden vocab.

Rule 4 forbids blockchain/crypto/Web3 terms in developer-facing CLI output.
"""

import pytest
from click.testing import CliRunner
from varitykit.cli.main import cli

FORBIDDEN_TERMS = [
    "cid",
    "contract address",
    "blockchain",
    "smart contract",
    "on-chain",
    "crypto",
    "Web3",
    "DePIN",
    "IPFS",
    "gas",
    "wallet",
]


@pytest.fixture
def runner():
    return CliRunner()


def _help(runner, *args):
    result = runner.invoke(cli, list(args) + ["--help"])
    assert result.exit_code == 0, f"CLI exited {result.exit_code}: {result.output}"
    return result.output.lower()


class TestAppInfoJargon:
    def test_app_info_help_no_jargon(self, runner):
        output = _help(runner, "app", "info")
        for term in FORBIDDEN_TERMS:
            assert term.lower() not in output, (
                f"Rule 4 violation: '{term}' found in `varitykit app info --help`"
            )

    def test_app_list_help_no_jargon(self, runner):
        output = _help(runner, "app", "list")
        for term in FORBIDDEN_TERMS:
            assert term.lower() not in output, (
                f"Rule 4 violation: '{term}' found in `varitykit app list --help`"
            )

    def test_app_rollback_help_no_jargon(self, runner):
        output = _help(runner, "app", "rollback")
        for term in FORBIDDEN_TERMS:
            assert term.lower() not in output, (
                f"Rule 4 violation: '{term}' found in `varitykit app rollback --help`"
            )

    def test_app_status_help_no_jargon(self, runner):
        output = _help(runner, "app", "status")
        for term in FORBIDDEN_TERMS:
            assert term.lower() not in output, (
                f"Rule 4 violation: '{term}' found in `varitykit app status --help`"
            )
