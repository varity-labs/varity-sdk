"""
Regression test for VAR-512: varitykit deploy group exposes blockchain jargon.

Rule 4 forbids blockchain/crypto/Web3 terms in developer-facing CLI output.
The deploy group is hidden from varitykit --help but still callable; its
subcommand --help text must not surface forbidden vocabulary.
"""

import pytest
from click.testing import CliRunner
from varitykit.cli.main import cli

FORBIDDEN_TERMS = [
    "blockchain",
    "WALLET_PRIVATE_KEY",
    "wallet balance",
    "ARBISCAN_API_KEY",
    "block explorer",
    "smart contract",
    "gas fees",
    "on-chain",
    "crypto",
    "Web3",
    "DePIN",
    "IPFS",
]


@pytest.fixture
def runner():
    return CliRunner()


def _help(runner, *args):
    result = runner.invoke(cli, list(args) + ["--help"])
    assert result.exit_code == 0, f"CLI exited {result.exit_code}: {result.output}"
    return result.output.lower()


class TestDeployJargon:
    def test_deploy_help_no_jargon(self, runner):
        output = _help(runner, "deploy")
        for term in FORBIDDEN_TERMS:
            assert term.lower() not in output, (
                f"Rule 4 violation: '{term}' found in `varitykit deploy --help`"
            )

    def test_deploy_run_help_no_jargon(self, runner):
        output = _help(runner, "deploy", "run")
        for term in FORBIDDEN_TERMS:
            assert term.lower() not in output, (
                f"Rule 4 violation: '{term}' found in `varitykit deploy run --help`"
            )

    def test_deploy_status_help_no_jargon(self, runner):
        output = _help(runner, "deploy", "status")
        for term in FORBIDDEN_TERMS:
            assert term.lower() not in output, (
                f"Rule 4 violation: '{term}' found in `varitykit deploy status --help`"
            )

    def test_deploy_list_help_no_jargon(self, runner):
        output = _help(runner, "deploy", "list")
        for term in FORBIDDEN_TERMS:
            assert term.lower() not in output, (
                f"Rule 4 violation: '{term}' found in `varitykit deploy list --help`"
            )

    def test_deploy_rollback_help_no_jargon(self, runner):
        output = _help(runner, "deploy", "rollback")
        for term in FORBIDDEN_TERMS:
            assert term.lower() not in output, (
                f"Rule 4 violation: '{term}' found in `varitykit deploy rollback --help`"
            )

    def test_gas_limit_flag_hidden(self, runner):
        output = _help(runner, "deploy", "run")
        assert "--gas-limit" not in output, (
            "Rule 4 violation: --gas-limit flag visible in `varitykit deploy run --help`"
        )
