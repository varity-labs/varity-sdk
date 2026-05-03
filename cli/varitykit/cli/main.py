"""
Main CLI entry point for VarityKit
"""

import sys
import os
from importlib.metadata import PackageNotFoundError, version

# Ensure UTF-8 output on Windows terminals (prevents UnicodeEncodeError
# when rich prints checkmarks/emojis on cp1252 consoles)
if sys.platform == 'win32':
    for stream in [sys.stdout, sys.stderr]:
        if hasattr(stream, 'reconfigure'):
            stream.reconfigure(encoding='utf-8', errors='replace')
    os.environ.setdefault('PYTHONIOENCODING', 'utf-8')

import importlib

import click
from varitykit.utils.logger import get_logger, set_log_level


def _resolve_cli_version() -> str:
    """Resolve package version without relying on top-level package imports."""
    try:
        return version("varitykit")
    except PackageNotFoundError:
        try:
            from varitykit import __version__ as pkg_version

            return pkg_version
        except Exception:
            return "unknown"


# Global options
@click.group()
@click.version_option(version=_resolve_cli_version(), prog_name="varitykit")
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose output")
@click.option("--debug", is_flag=True, help="Enable debug output")
@click.option("--json", "json_format", is_flag=True, help="Output in JSON format")
@click.pass_context
def cli(ctx, verbose, debug, json_format):
    """
    VarityKit - Build, deploy, and run any app in 60 seconds.

    Deploy your app in seconds. Auth, payments, database included.
    60-80% cheaper than AWS. Zero configuration required.
    """
    # Setup logging
    if debug:
        set_log_level("DEBUG")
    elif verbose:
        set_log_level("INFO")
    else:
        set_log_level("WARNING")

    # Store options in context
    ctx.ensure_object(dict)
    ctx.obj["verbose"] = verbose
    ctx.obj["debug"] = debug
    ctx.obj["json_format"] = json_format
    ctx.obj["logger"] = get_logger(
        level="DEBUG" if debug else ("INFO" if verbose else "WARNING"), json_format=json_format
    )


def _safe_add(module_path: str, attr: str, alias: str = None, hidden: bool = False) -> None:
    try:
        module = importlib.import_module(module_path)
        cmd = getattr(module, attr)
        if hidden:
            cmd.hidden = True
        cli.add_command(cmd, alias)
    except Exception:
        # Keep CLI bootable even when optional commands fail to import.
        # This protects core commands (e.g. `init`) from unrelated module errors.
        return


def _register_commands() -> None:
    # Core commands (visible to all developers)
    _safe_add("varitykit.cli.auth", "login")   # varitykit login (top-level shortcut)
    _safe_add("varitykit.cli.auth", "auth")    # varitykit auth {login,logout,status}
    _safe_add("varitykit.cli.doctor", "doctor")
    _safe_add("varitykit.cli.init", "init")
    _safe_add("varitykit.commands.app_deploy", "app")
    _safe_add("varitykit.cli.dev", "dev")
    _safe_add("varitykit.cli.install_deps", "install_deps")
    _safe_add("varitykit.cli.template", "template")
    _safe_add("varitykit.cli.marketplace", "marketplace")
    _safe_add("varitykit.cli.domains", "domains")
    _safe_add("varitykit.commands.platforms", "platforms")
    _safe_add("varitykit.cli.migrate", "migrate")  # varitykit migrate — Vercel → Varity

    # Utility commands
    _safe_add("varitykit.cli.bootstrap", "bootstrap")
    _safe_add("varitykit.cli.completions", "completions")

    # Hidden aliases and internal commands
    _safe_add("varitykit.commands.chains", "chains", hidden=True)

    # Advanced commands (hidden from default help - still callable)
    _safe_add("varitykit.cli.task", "task", "task", hidden=True)
    _safe_add("varitykit.cli.contract", "contract", "contract", hidden=True)
    _safe_add("varitykit.cli.deploy", "deploy", "deploy", hidden=True)
    _safe_add("varitykit.cli.fund", "fund", "fund", hidden=True)
    _safe_add("varitykit.cli.localnet", "localnet", "localnet", hidden=True)
    _safe_add("varitykit.cli.localdepin", "localdepin", "localdepin", hidden=True)
    _safe_add("varitykit.cli.marketing", "marketing", "marketing", hidden=True)
    _safe_add("varitykit.cli.thirdweb", "thirdweb", "thirdweb", hidden=True)


_register_commands()


if __name__ == "__main__":
    cli()
