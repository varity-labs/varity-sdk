"""
Main CLI entry point for VarityKit
"""

from pathlib import Path

import click
from varitykit import __version__
from varitykit.utils.logger import get_logger, set_log_level


# Global options
@click.group()
@click.version_option(version=__version__, prog_name="varitykit")
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose output")
@click.option("--debug", is_flag=True, help="Enable debug output")
@click.option("--json", "json_format", is_flag=True, help="Output in JSON format")
@click.pass_context
def cli(ctx, verbose, debug, json_format):
    """
    VarityKit - Build, deploy, and monetize apps faster than ever.

    Deploy your app in seconds. Auth, payments, database included.
    70% cheaper than AWS. Zero configuration required.
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


from varitykit.cli.bootstrap import bootstrap
from varitykit.cli.completions import completions
from varitykit.cli.contract import contract
from varitykit.cli.deploy import deploy
from varitykit.cli.dev import dev

# Import commands
from varitykit.cli.doctor import doctor
from varitykit.cli.fund import fund
from varitykit.cli.init import init
from varitykit.cli.localdepin import localdepin
from varitykit.cli.localnet import localnet
from varitykit.cli.marketing import marketing
from varitykit.cli.marketplace import marketplace
from varitykit.cli.migrate import migrate
from varitykit.cli.task import task
from varitykit.cli.template import template
from varitykit.cli.thirdweb import thirdweb
from varitykit.cli.auth import auth, login
from varitykit.cli.domains import domains
from varitykit.commands.app_deploy import app
from varitykit.commands.chains import chains
from varitykit.commands.platforms import platforms

# Core commands (visible to all developers)
cli.add_command(login)  # varitykit login (top-level shortcut)
cli.add_command(auth)   # varitykit auth {login,logout,status}
cli.add_command(doctor)
cli.add_command(init)
cli.add_command(app)
cli.add_command(dev)
cli.add_command(template)
cli.add_command(marketplace)
cli.add_command(domains)
cli.add_command(platforms)
cli.add_command(chains)

# Utility commands
cli.add_command(bootstrap)
cli.add_command(completions)
cli.add_command(migrate)

# Advanced commands (hidden from default help - still callable)
cli.add_command(task, "task")
cli.add_command(contract, "contract")
cli.add_command(deploy, "deploy")
cli.add_command(fund, "fund")
cli.add_command(localnet, "localnet")
cli.add_command(localdepin, "localdepin")
cli.add_command(marketing, "marketing")
cli.add_command(thirdweb, "thirdweb")

# Hide advanced commands from default help
for cmd_name in ["task", "contract", "deploy", "fund", "localnet", "localdepin", "marketing", "thirdweb"]:
    if cmd_name in cli.commands:
        cli.commands[cmd_name].hidden = True


if __name__ == "__main__":
    cli()
