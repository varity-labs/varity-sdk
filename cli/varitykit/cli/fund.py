"""
Test network funding command (advanced - internal use)
"""

import time
from pathlib import Path

import click
from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.table import Table


@click.command()
@click.option("--address", help="Wallet address to fund (auto-detected from .env if not specified)")
@click.option(
    "--network", default="sepolia", type=click.Choice(["sepolia", "local"]), help="TestNet network"
)
@click.option("--amount", default=0.1, type=float, help="Amount of ETH to request (default: 0.1)")
@click.pass_context
def fund(ctx, address, network, amount):
    """
    Fund test account (advanced - internal use)

    This is an advanced command for internal use.
    For deploying apps, use: varitykit app deploy

    \b
    Faucet Sources:
    • Alchemy Sepolia Faucet (https://sepoliafaucet.com/)
    • Chainlink Sepolia Faucet (https://faucets.chain.link/)
    • QuickNode Sepolia Faucet (https://faucet.quicknode.com/)

    \b
    Examples:
      varitykit fund                      # Fund default wallet on Sepolia
      varitykit fund --address 0x123...   # Fund specific address
      varitykit fund --network local      # Fund on local network
      varitykit fund --amount 0.5         # Request 0.5 ETH
    """
    console = Console()
    logger = ctx.obj["logger"]

    # Auto-detect address from .env if not specified
    if not address:
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
                "Create a wallet first with: varitykit task wallet create\n"
                "Or specify address with: --address 0x...",
                border_style="red",
            )
        )
        ctx.exit(1)

    console.print(
        Panel.fit(
            f"[bold cyan]TestNet Dispenser[/bold cyan]\n"
            f"Network: {network.upper()}\n"
            f"Address: {address}\n"
            f"Amount: {amount} ETH",
            border_style="cyan",
        )
    )

    if network == "local":
        fund_local_network(ctx, address, amount, console, logger)
    elif network == "sepolia":
        fund_sepolia_network(ctx, address, amount, console, logger)


def fund_local_network(ctx, address, amount, console, logger):
    """Fund wallet on local network"""
    try:
        from web3 import Web3

        console.print("\n[bold]Funding on local network...[/bold]")

        # Connect to local node
        w3 = Web3(Web3.HTTPProvider("http://localhost:8547"))

        if not w3.is_connected():
            console.print(
                Panel.fit(
                    "[bold red]Cannot connect to local network[/bold red]\n"
                    "Start LocalDePin with: varitykit localdepin start",
                    border_style="red",
                )
            )
            ctx.exit(1)

        # Get accounts from local node (pre-funded)
        accounts = w3.eth.accounts

        if not accounts:
            console.print(
                Panel.fit(
                    "[bold red]No pre-funded accounts found[/bold red]\n"
                    "Check LocalDePin configuration",
                    border_style="red",
                )
            )
            ctx.exit(1)

        # Use first account as funder
        funder = accounts[0]
        amount_wei = w3.to_wei(amount, "ether")

        # Send transaction
        console.print(f"[dim]Sending {amount} ETH from {funder[:10]}...[/dim]")

        tx_hash = w3.eth.send_transaction({"from": funder, "to": address, "value": amount_wei})

        # Wait for transaction
        console.print(f"[dim]Waiting for transaction {tx_hash.hex()[:10]}...[/dim]")
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        if receipt["status"] == 1:
            # Check new balance
            balance_wei = w3.eth.get_balance(address)
            balance_eth = w3.from_wei(balance_wei, "ether")

            # Display result
            table = Table(box=box.ROUNDED, show_header=False)
            table.add_column("Property", style="cyan", width=20)
            table.add_column("Value", style="white")

            table.add_row("Network", str("Local"))
            table.add_row("Address", str(address))
            table.add_row("Amount Received", str(f"{amount} ETH"))
            table.add_row("New Balance", str(f"{balance_eth:.6f} ETH"))
            table.add_row("Transaction Hash", str(tx_hash.hex()))

            console.print("\n")
            console.print(table)
            console.print("\n[green]✓ Wallet funded successfully![/green]\n")

            logger.info(f"Funded {address} with {amount} ETH on local network")

        else:
            console.print(Panel.fit("[bold red]Transaction failed[/bold red]", border_style="red"))
            ctx.exit(1)

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
            Panel.fit(f"[bold red]Error funding wallet[/bold red]\n{str(e)}", border_style="red")
        )
        logger.error(f"Failed to fund wallet: {e}")
        ctx.exit(1)


def fund_sepolia_network(ctx, address, amount, console, logger):
    """Fund wallet on Sepolia network via faucets"""
    import requests

    console.print("\n[bold]Available Sepolia Faucets:[/bold]\n")

    faucets = [
        {
            "name": "Alchemy Sepolia Faucet",
            "url": "https://sepoliafaucet.com/",
            "auto": False,
            "note": "Requires Alchemy account (free)",
        },
        {
            "name": "Chainlink Sepolia Faucet",
            "url": "https://faucets.chain.link/sepolia",
            "auto": False,
            "note": "Connect wallet to claim",
        },
        {
            "name": "QuickNode Sepolia Faucet",
            "url": "https://faucet.quicknode.com/arbitrum/sepolia",
            "auto": False,
            "note": "Requires Twitter verification",
        },
        {
            "name": "Infura Sepolia Faucet",
            "url": "https://www.infura.io/faucet/sepolia",
            "auto": False,
            "note": "Requires Infura account",
        },
    ]

    # Display faucet table
    table = Table(
        title="Sepolia Faucets", box=box.ROUNDED, show_header=True, header_style="bold magenta"
    )
    table.add_column("#", style="cyan", width=5)
    table.add_column("Faucet", style="white", width=30)
    table.add_column("Note", style="dim", width=40)

    for idx, faucet in enumerate(faucets, 1):
        table.add_row(str(idx), str(faucet["name"], faucet["note"]))

    console.print(table)
    console.print()

    console.print(
        Panel.fit(
            "[bold cyan]Manual Faucet Instructions[/bold cyan]\n\n"
            "1. Visit one of the faucet URLs above\n"
            "2. Enter your wallet address:\n"
            f"   [white]{address}[/white]\n"
            "3. Complete verification (if required)\n"
            "4. Wait for test ETH to arrive\n\n"
            "[bold yellow]Note:[/bold yellow] Most faucets require social verification\n"
            "or account creation to prevent abuse.",
            border_style="cyan",
        )
    )

    console.print("\n[bold]Recommended Faucets:[/bold]")
    console.print("  [cyan]1. Alchemy:[/cyan] Fastest, requires free account")
    console.print("  [cyan]2. Chainlink:[/cyan] Reliable, connect MetaMask")
    console.print("  [cyan]3. QuickNode:[/cyan] Good limits, Twitter verification\n")

    # Check if we should open browser
    if click.confirm("Open Alchemy faucet in browser?", default=True):
        import webbrowser

        webbrowser.open("https://sepoliafaucet.com/")
        console.print("[green]✓ Opened browser[/green]\n")

    console.print(
        "[dim]Tip: Use 'varitykit task wallet balance --network sepolia' to check balance[/dim]\n"
    )

    logger.info(f"Displayed faucet info for {address}")


# Note: For future enhancement, we could add automated faucet claims
# using APIs like:
# - Alchemy Faucet API (requires API key)
# - Custom faucet smart contract on local testnet
