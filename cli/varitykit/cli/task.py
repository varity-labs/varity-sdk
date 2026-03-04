"""
Task commands - utilities for common operations
"""

import json
from pathlib import Path

import click
from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.table import Table


@click.group()
@click.pass_context
def task(ctx):
    """
    Task utilities (advanced - internal use)

    This is an advanced command for internal use.
    For deploying apps, use: varitykit app deploy
    """
    pass


# ============================================================
# WALLET COMMANDS
# ============================================================


@task.group()
@click.pass_context
def wallet(ctx):
    """Wallet management commands"""
    pass


@wallet.command()
@click.option("--name", prompt="Wallet name", help="Name for the wallet")
@click.option("--save", is_flag=True, help="Save wallet to .env file")
@click.pass_context
def create(ctx, name, save):
    """
    Create a new Ethereum wallet

    Generates a new private key and address for blockchain interactions.
    Optionally saves to .env file for persistent use.
    """
    console = Console()
    logger = ctx.obj["logger"]

    try:
        # Import web3 for wallet generation
        import secrets

        from eth_account import Account

        console.print(Panel.fit("[bold cyan]Creating New Wallet[/bold cyan]", border_style="cyan"))

        # Generate private key
        private_key = "0x" + secrets.token_hex(32)
        account = Account.from_key(private_key)

        # Display wallet info
        table = Table(box=box.ROUNDED, show_header=False)
        table.add_column("Property", style="cyan", width=15)
        table.add_column("Value", style="white")

        table.add_row("Name", str(name))
        table.add_row("Address", str(account.address))
        table.add_row("Private Key", str(f"[dim]{private_key[:20]}...[/dim]"))

        console.print("\n")
        console.print(table)

        # Security warning
        console.print("\n")
        console.print(
            Panel.fit(
                "[bold red]⚠ SECURITY WARNING[/bold red]\n"
                "Never share your private key with anyone!\n"
                "Store it securely and keep backups.\n\n"
                "[bold yellow]Private Key:[/bold yellow]\n"
                f"[dim]{private_key}[/dim]",
                border_style="red",
            )
        )

        if save:
            env_file = Path(".env")

            # Read existing .env or create new
            env_content = ""
            if env_file.exists():
                env_content = env_file.read_text()

            # Add wallet info
            new_content = env_content + f"\n# Wallet: {name}\n"
            new_content += f"WALLET_ADDRESS={account.address}\n"
            new_content += f"WALLET_PRIVATE_KEY={private_key}\n"

            env_file.write_text(new_content)

            console.print(f"\n[green]✓ Wallet saved to .env file[/green]")
            logger.info(f"Created and saved wallet: {name}")

        else:
            console.print("\n[dim]Use --save flag to save wallet to .env file[/dim]")
            logger.info(f"Created wallet: {name}")

    except ImportError:
        console.print(
            Panel.fit(
                "[bold red]Error: eth-account not installed[/bold red]\n"
                "Install with: pip install eth-account",
                border_style="red",
            )
        )
        ctx.exit(1)

    except Exception as e:
        console.print(
            Panel.fit(f"[bold red]Error creating wallet[/bold red]\n{str(e)}", border_style="red")
        )
        logger.error(f"Failed to create wallet: {e}")
        ctx.exit(1)


@wallet.command()
@click.option("--private-key", prompt="Private key", hide_input=True, help="Private key to import")
@click.option("--name", prompt="Wallet name", help="Name for the wallet")
@click.option("--save", is_flag=True, help="Save wallet to .env file")
@click.pass_context
def import_wallet(ctx, private_key, name, save):
    """
    Import an existing wallet from private key

    Imports a wallet using an existing private key.
    Optionally saves to .env file.
    """
    console = Console()
    logger = ctx.obj["logger"]

    try:
        from eth_account import Account

        # Ensure private key has 0x prefix
        if not private_key.startswith("0x"):
            private_key = "0x" + private_key

        # Validate and import
        account = Account.from_key(private_key)

        console.print(Panel.fit("[bold cyan]Wallet Imported[/bold cyan]", border_style="cyan"))

        table = Table(box=box.ROUNDED, show_header=False)
        table.add_column("Property", style="cyan", width=15)
        table.add_column("Value", style="white")

        table.add_row("Name", str(name))
        table.add_row("Address", str(account.address))

        console.print("\n")
        console.print(table)

        if save:
            env_file = Path(".env")
            env_content = ""
            if env_file.exists():
                env_content = env_file.read_text()

            new_content = env_content + f"\n# Wallet: {name}\n"
            new_content += f"WALLET_ADDRESS={account.address}\n"
            new_content += f"WALLET_PRIVATE_KEY={private_key}\n"

            env_file.write_text(new_content)

            console.print(f"\n[green]✓ Wallet saved to .env file[/green]")
            logger.info(f"Imported and saved wallet: {name}")

        logger.info(f"Imported wallet: {name} ({account.address})")

    except ImportError:
        console.print(
            Panel.fit(
                "[bold red]Error: eth-account not installed[/bold red]\n"
                "Install with: pip install eth-account",
                border_style="red",
            )
        )
        ctx.exit(1)

    except Exception as e:
        console.print(
            Panel.fit(f"[bold red]Error importing wallet[/bold red]\n{str(e)}", border_style="red")
        )
        logger.error(f"Failed to import wallet: {e}")
        ctx.exit(1)


@wallet.command()
@click.pass_context
def list_wallets(ctx):
    """List all wallets in .env file"""
    console = Console()
    logger = ctx.obj["logger"]

    env_file = Path(".env")

    if not env_file.exists():
        console.print(
            Panel.fit(
                "[bold yellow]No .env file found[/bold yellow]\n"
                "Create a wallet with: varitykit task wallet create",
                border_style="yellow",
            )
        )
        ctx.exit(0)

    # Parse .env file for wallet addresses
    wallets = []
    current_wallet: dict = {}

    for line in env_file.read_text().split("\n"):
        if line.startswith("# Wallet:"):
            if current_wallet:
                wallets.append(current_wallet)
            current_wallet: dict = {"name": line.replace("# Wallet:", "").strip()}

        elif line.startswith("WALLET_ADDRESS="):
            current_wallet["address"] = line.split("=")[1].strip()

    if current_wallet:
        wallets.append(current_wallet)

    if not wallets:
        console.print(
            Panel.fit(
                "[bold yellow]No wallets found in .env file[/bold yellow]", border_style="yellow"
            )
        )
        ctx.exit(0)

    # Display wallets
    table = Table(title="Wallets", box=box.ROUNDED, show_header=True, header_style="bold magenta")
    table.add_column("Name", style="cyan", width=20)
    table.add_column("Address", style="white")

    for wallet_info in wallets:
        table.add_row(wallet_info.get("name", str("Unknown")), wallet_info.get("address", "N/A"))

    console.print("\n")
    console.print(table)
    console.print(f"\n[dim]Total: {len(wallets)} wallet(s)[/dim]\n")

    logger.info(f"Listed {len(wallets)} wallets")


@wallet.command()
@click.option("--address", help="Wallet address to check")
@click.option(
    "--network",
    default="local",
    type=click.Choice(["local", "sepolia", "arbitrum"]),
    help="Network to check balance on",
)
@click.pass_context
def balance(ctx, address, network):
    """Check wallet balance on blockchain"""
    console = Console()
    logger = ctx.obj["logger"]

    try:
        from web3 import Web3

        # Get RPC URL based on network
        rpc_urls = {
            "local": "http://localhost:8547",
            "sepolia": "https://sepolia-rollup.arbitrum.io/rpc",
            "arbitrum": "https://arb1.arbitrum.io/rpc",
        }

        rpc_url = rpc_urls[network]
        w3 = Web3(Web3.HTTPProvider(rpc_url))

        if not address:
            # Try to get from .env
            env_file = Path(".env")
            if env_file.exists():
                for line in env_file.read_text().split("\n"):
                    if line.startswith("WALLET_ADDRESS="):
                        address = line.split("=")[1].strip()
                        break

        if not address:
            console.print(
                Panel.fit(
                    "[bold red]No wallet address specified[/bold red]\n"
                    "Use --address flag or create a wallet first",
                    border_style="red",
                )
            )
            ctx.exit(1)

        # Get balance
        balance_wei = w3.eth.get_balance(address)
        balance_eth = w3.from_wei(balance_wei, "ether")

        # Display balance
        table = Table(box=box.ROUNDED, show_header=False)
        table.add_column("Property", style="cyan", width=15)
        table.add_column("Value", style="white")

        table.add_row("Network", str(network.upper()))
        table.add_row("Address", str(address))
        table.add_row("Balance", str(f"{balance_eth:.6f} ETH"))
        table.add_row("Wei", str(str(balance_wei)))

        console.print("\n")
        console.print(table)
        console.print()

        logger.info(f"Checked balance for {address} on {network}")

    except ImportError:
        console.print(
            Panel.fit(
                "[bold red]Error: web3 not installed[/bold red]\n" "Install with: pip install web3",
                border_style="red",
            )
        )
        ctx.exit(1)

    except Exception as e:
        console.print(
            Panel.fit(f"[bold red]Error checking balance[/bold red]\n{str(e)}", border_style="red")
        )
        logger.error(f"Failed to check balance: {e}")
        ctx.exit(1)


# ============================================================
# STORAGE COMMANDS
# ============================================================


@task.group()
@click.pass_context
def storage(ctx):
    """Storage management commands (IPFS/Filecoin)"""
    pass


@storage.command()
@click.argument("file_path", type=click.Path(exists=True))
@click.option("--pin", is_flag=True, help="Pin file to IPFS")
@click.pass_context
def upload(ctx, file_path, pin):
    """
    Upload file to IPFS/Filecoin

    Uploads a file to the local IPFS node or Pinata gateway.
    """
    console = Console()
    logger = ctx.obj["logger"]

    try:
        import requests

        file_path = Path(file_path)

        console.print(
            Panel.fit(
                f"[bold cyan]Uploading to IPFS[/bold cyan]\n" f"File: {file_path.name}",
                border_style="cyan",
            )
        )

        # Upload to local IPFS
        with open(file_path, "rb") as f:
            files = {"file": f}
            response = requests.post("http://localhost:5001/api/v0/add", files=files, timeout=30)

        if response.status_code == 200:
            data = response.json()
            ipfs_hash = data["Hash"]

            table = Table(box=box.ROUNDED, show_header=False)
            table.add_column("Property", style="cyan", width=15)
            table.add_column("Value", style="white")

            table.add_row("File", str(file_path.name))
            table.add_row("Size", str(f"{file_path.stat().st_size:,} bytes"))
            table.add_row("IPFS Hash", str(ipfs_hash))
            table.add_row("Gateway URL", str(f"http://localhost:8080/ipfs/{ipfs_hash}"))

            console.print("\n")
            console.print(table)
            console.print()

            console.print(f"[green]✓ File uploaded successfully![/green]")

            if pin:
                console.print(f"[dim]Pinning file...[/dim]")
                # Pin the file
                pin_response = requests.post(
                    f"http://localhost:5001/api/v0/pin/add?arg={ipfs_hash}", timeout=10
                )
                if pin_response.status_code == 200:
                    console.print(f"[green]✓ File pinned[/green]\n")

            logger.info(f"Uploaded file: {file_path.name} -> {ipfs_hash}")

        else:
            console.print(
                Panel.fit(
                    f"[bold red]Upload failed[/bold red]\n" f"Status: {response.status_code}",
                    border_style="red",
                )
            )
            ctx.exit(1)

    except requests.exceptions.ConnectionError:
        console.print(
            Panel.fit(
                "[bold red]Cannot connect to IPFS node[/bold red]\n"
                "Start LocalDePin with: varitykit localdepin start",
                border_style="red",
            )
        )
        ctx.exit(1)

    except Exception as e:
        console.print(
            Panel.fit(f"[bold red]Error uploading file[/bold red]\n{str(e)}", border_style="red")
        )
        logger.error(f"Failed to upload file: {e}")
        ctx.exit(1)


@storage.command()
@click.argument("ipfs_hash")
@click.option("--output", "-o", help="Output file path")
@click.pass_context
def download(ctx, ipfs_hash, output):
    """Download file from IPFS by hash"""
    console = Console()
    logger = ctx.obj["logger"]

    try:
        import requests

        console.print(f"[dim]Downloading {ipfs_hash}...[/dim]")

        response = requests.get(f"http://localhost:8080/ipfs/{ipfs_hash}", timeout=30)

        if response.status_code == 200:
            # Determine output path
            if not output:
                output = f"{ipfs_hash[:8]}.dat"

            output_path = Path(output)
            output_path.write_bytes(response.content)

            console.print(f"[green]✓ Downloaded to {output_path}[/green]")
            console.print(f"[dim]Size: {len(response.content):,} bytes[/dim]\n")

            logger.info(f"Downloaded {ipfs_hash} to {output_path}")

        else:
            console.print(
                Panel.fit(
                    f"[bold red]Download failed[/bold red]\n" f"Status: {response.status_code}",
                    border_style="red",
                )
            )
            ctx.exit(1)

    except Exception as e:
        console.print(
            Panel.fit(f"[bold red]Error downloading file[/bold red]\n{str(e)}", border_style="red")
        )
        logger.error(f"Failed to download: {e}")
        ctx.exit(1)


@storage.command()
@click.pass_context
def list_files(ctx):
    """List pinned files on IPFS"""
    console = Console()
    logger = ctx.obj["logger"]

    try:
        import requests

        response = requests.post("http://localhost:5001/api/v0/pin/ls", timeout=10)

        if response.status_code == 200:
            data = response.json()
            pins = data.get("Keys", {})

            if not pins:
                console.print("[dim]No pinned files found[/dim]\n")
                ctx.exit(0)

            table = Table(
                title="Pinned Files", box=box.ROUNDED, show_header=True, header_style="bold magenta"
            )
            table.add_column("IPFS Hash", style="cyan", width=50)
            table.add_column("Type", style="white", width=15)

            for ipfs_hash, info in pins.items():
                table.add_row(ipfs_hash, str(info.get("Type", "unknown")))

            console.print("\n")
            console.print(table)
            console.print(f"\n[dim]Total: {len(pins)} file(s)[/dim]\n")

            logger.info(f"Listed {len(pins)} pinned files")

        else:
            console.print(
                Panel.fit("[bold red]Failed to list files[/bold red]", border_style="red")
            )
            ctx.exit(1)

    except requests.exceptions.ConnectionError:
        console.print(
            Panel.fit(
                "[bold red]Cannot connect to IPFS node[/bold red]\n"
                "Start LocalDePin with: varitykit localdepin start",
                border_style="red",
            )
        )
        ctx.exit(1)

    except Exception as e:
        console.print(
            Panel.fit(f"[bold red]Error listing files[/bold red]\n{str(e)}", border_style="red")
        )
        logger.error(f"Failed to list files: {e}")
        ctx.exit(1)


# ============================================================
# DASHBOARD COMMANDS
# ============================================================


@task.group()
@click.pass_context
def dashboard(ctx):
    """Dashboard deployment and management commands"""
    pass


@dashboard.command()
@click.option("--name", prompt="Dashboard name", help="Name for the dashboard")
@click.option(
    "--network",
    default="local",
    type=click.Choice(["local", "testnet", "mainnet"]),
    help="Deployment network",
)
@click.pass_context
def deploy(ctx, name, network):
    """
    Deploy dashboard to Varity L3

    Builds and deploys the dashboard to the specified network.
    """
    console = Console()
    logger = ctx.obj["logger"]

    console.print(
        Panel.fit(
            f"[bold cyan]Deploying Dashboard[/bold cyan]\n" f"Name: {name}\n" f"Network: {network}",
            border_style="cyan",
        )
    )

    # This would integrate with the actual deployment pipeline
    console.print("\n[bold]Deployment Steps:[/bold]")
    console.print("  [dim]1. Building frontend...[/dim]")
    console.print("  [dim]2. Uploading to IPFS...[/dim]")
    console.print("  [dim]3. Deploying smart contracts...[/dim]")
    console.print("  [dim]4. Registering on Varity L3...[/dim]\n")

    console.print(
        Panel.fit(
            "[bold yellow]Deployment feature coming soon![/bold yellow]\n"
            "This will integrate with the full deployment pipeline.",
            border_style="yellow",
        )
    )

    logger.info(f"Deploy requested: {name} to {network}")


@dashboard.command()
@click.pass_context
def list_dashboards(ctx):
    """List deployed dashboards"""
    console = Console()

    console.print(
        Panel.fit(
            "[bold yellow]Dashboard listing coming soon![/bold yellow]\n"
            "This will show all your deployed dashboards.",
            border_style="yellow",
        )
    )


@dashboard.command()
@click.argument("dashboard_id")
@click.pass_context
def logs(ctx, dashboard_id):
    """View dashboard logs"""
    console = Console()

    console.print(
        Panel.fit(
            "[bold yellow]Log viewing coming soon![/bold yellow]\n" f"Dashboard ID: {dashboard_id}",
            border_style="yellow",
        )
    )
