"""
Authentication commands for VarityKit CLI.

Handles developer identity via deploy keys from the developer portal.
"""

import click
from rich.console import Console
from rich.panel import Panel

console = Console()


def _do_login():
    """Shared login logic used by both 'varitykit login' and 'varitykit auth login'."""
    from varitykit.services.gateway_client import save_deploy_key, get_deploy_key

    existing = get_deploy_key()
    if existing:
        masked = existing[:8] + "..." + existing[-4:]
        console.print(f"\n  Already logged in (key: {masked})")
        if not click.confirm("  Replace with a new deploy key?", default=False):
            return

    settings_url = "https://developer.store.varity.so/dashboard/settings"

    console.print(
        Panel(
            "Get your deploy key from the developer portal:\n"
            f"[bold]{settings_url}[/bold]",
            title="Deploy Key",
            border_style="blue",
        )
    )

    # Try to open the settings page in the browser
    console.print(f"\n  Opening {settings_url} in your browser...")
    import subprocess as _sp
    try:
        _sp.Popen(['explorer.exe', settings_url], stdout=_sp.DEVNULL, stderr=_sp.DEVNULL)
    except (FileNotFoundError, OSError):
        try:
            _sp.run(["wslview", settings_url], capture_output=True, timeout=5)
        except (FileNotFoundError, OSError, Exception):
            try:
                import webbrowser
                webbrowser.open(settings_url)
            except Exception:
                pass

    deploy_key = click.prompt("\n  Paste your deploy key", hide_input=False).strip()

    if len(deploy_key) < 10:
        console.print("\n  [red]Invalid deploy key.[/red] It should be at least 10 characters.")
        return

    save_deploy_key(deploy_key)

    console.print("\n  [green]Logged in successfully![/green]")
    console.print("  Your domains are now protected. Run 'varitykit app deploy' to deploy.\n")


# Top-level command: varitykit login
@click.command()
def login():
    """Log in with your deploy key from the developer portal."""
    _do_login()


# Command group: varitykit auth {login,logout,status}
@click.group()
def auth():
    """Manage your Varity developer account."""
    pass


@auth.command("login")
def auth_login():
    """Log in with your deploy key from the developer portal."""
    _do_login()


@auth.command()
def logout():
    """Remove your deploy key from this machine."""
    from varitykit.services.gateway_client import get_deploy_key, CONFIG_PATH

    existing = get_deploy_key()
    if not existing:
        console.print("\n  Not logged in.\n")
        return

    if click.confirm("  Remove your deploy key from this machine?", default=False):
        import json
        try:
            with open(CONFIG_PATH, "r") as f:
                config = json.load(f)
            config.pop("deploy_key", None)
            with open(CONFIG_PATH, "w") as f:
                json.dump(config, f, indent=2)
        except Exception:
            pass

        console.print("\n  [green]Logged out.[/green]\n")


@auth.command()
def status():
    """Show current login status."""
    from varitykit.services.gateway_client import get_deploy_key

    deploy_key = get_deploy_key()

    if deploy_key:
        masked = deploy_key[:8] + "..." + deploy_key[-4:]
        console.print(f"\n  [green]Logged in[/green] (key: {masked})\n")
    else:
        console.print("\n  [yellow]Not logged in.[/yellow]")
        console.print("  Run 'varitykit login' to connect your developer account.\n")
