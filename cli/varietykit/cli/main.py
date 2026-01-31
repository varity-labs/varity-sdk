"""
Main CLI entry point for VarityKit
"""

from pathlib import Path

import click
from varietykit import __version__
from varietykit.utils.logger import get_logger, set_log_level


# Global options
@click.group()
@click.version_option(version=__version__, prog_name="varietykit")
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose output")
@click.option("--debug", is_flag=True, help="Enable debug output")
@click.option("--json", "json_format", is_flag=True, help="Output in JSON format")
@click.pass_context
def cli(ctx, verbose, debug, json_format):
    """
    VarityKit - AI-powered CLI for building dashboards on Varity L3

    Build, test, and deploy AI dashboard templates with ease.
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


from varietykit.cli.bootstrap import bootstrap
from varietykit.cli.completions import completions
from varietykit.cli.contract import contract
from varietykit.cli.deploy import deploy
from varietykit.cli.dev import dev

# Import commands
from varietykit.cli.doctor import doctor
from varietykit.cli.fund import fund
from varietykit.cli.init import init
from varietykit.cli.localdepin import localdepin
from varietykit.cli.localnet import localnet
from varietykit.cli.marketing import marketing
from varietykit.cli.marketplace import marketplace
from varietykit.cli.migrate import migrate
from varietykit.cli.task import task
from varietykit.cli.template import template
from varietykit.cli.thirdweb import thirdweb
from varietykit.commands.app_deploy import app

# Register commands
cli.add_command(doctor)
cli.add_command(init)
cli.add_command(bootstrap)
cli.add_command(completions)
cli.add_command(task)
cli.add_command(fund)
cli.add_command(dev)
cli.add_command(localnet)
cli.add_command(localdepin)
cli.add_command(deploy)
cli.add_command(contract)
cli.add_command(template)
cli.add_command(marketplace)
cli.add_command(marketing)
cli.add_command(thirdweb)
cli.add_command(migrate)
cli.add_command(app)


if __name__ == "__main__":
    cli()
