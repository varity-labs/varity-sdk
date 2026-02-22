"""
Domain management commands for VarityKit CLI.

List and manage your app domains on varity.app.
"""

import click
from rich.console import Console
from rich.table import Table

console = Console()


@click.group()
def domains():
    """Manage your app domains on varity.app"""
    pass


@domains.command("list")
def list_domains():
    """List all domains you own."""
    from varitykit.services.gateway_client import list_my_domains, get_deploy_key

    deploy_key = get_deploy_key()
    if not deploy_key:
        console.print("\n  [yellow]Not logged in.[/yellow]")
        console.print("  Run [bold]varitykit login[/bold] first.\n")
        return

    try:
        result = list_my_domains(deploy_key)
    except Exception as e:
        console.print(f"\n  [red]Failed to fetch domains: {e}[/red]\n")
        return

    if not result:
        console.print("\n  [yellow]No domains found.[/yellow]")
        console.print("  Deploy an app with [bold]varitykit app deploy[/bold] to register a domain.\n")
        return

    table = Table(title=f"Your Domains ({len(result)})")
    table.add_column("Subdomain", style="cyan", no_wrap=True)
    table.add_column("App URL", style="blue")
    table.add_column("App Name", style="green")

    for domain in result:
        subdomain = domain.get("subdomain", "—")
        url = f"https://varity.app/{subdomain}"
        app_name = domain.get("appName", "—")
        table.add_row(subdomain, url, app_name)

    console.print("\n")
    console.print(table)
    console.print("\n")
