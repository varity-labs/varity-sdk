"""
Chain management commands for VarityKit

List, inspect, and check health of supported chains.
"""

import click
import requests
from rich.console import Console
from rich.table import Table

console = Console()

# Chain configurations — single source of truth for CLI
CHAIN_CONFIGS = {
    "varity-l3": {
        "name": "Varity L3 Testnet",
        "chain_id": 33529,
        "rpc_url": "https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz",
        "explorer_url": "https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz",
        "native_token": "USDC",
        "native_decimals": 6,
        "type": "Arbitrum Orbit (Conduit)",
        "privacy": "none",
        "testnet": True,
        "gas_price_gwei": "0.1",
        "block_time_sec": "~0.25",
    },
    "avax-l1": {
        "name": "Varity Avalanche L1 Testnet",
        "chain_id": 43214,
        "rpc_url": "https://avax-testnet.varity.network/rpc",
        "explorer_url": "https://avax-testnet.varity.network/explorer",
        "native_token": "USDC",
        "native_decimals": 6,
        "type": "Avalanche L1 (Fluence)",
        "privacy": "sovereign",
        "testnet": True,
        "gas_price_gwei": "0.5",
        "block_time_sec": "~2",
    },
}

DEFAULT_CHAIN = "varity-l3"


@click.group()
def chains():
    """
    Manage and inspect supported chains

    \b
    Commands:
      varitykit chains list          # List all supported chains
      varitykit chains info avax-l1  # Show chain details
      varitykit chains health        # Check chain RPC health
    """
    pass


@chains.command("list")
def list_chains():
    """List all supported chains"""
    table = Table(title="Supported Chains", show_lines=True)
    table.add_column("ID", style="cyan", no_wrap=True)
    table.add_column("Name", style="bold")
    table.add_column("Chain ID", justify="right")
    table.add_column("Token", justify="center")
    table.add_column("Type", style="dim")
    table.add_column("Privacy", justify="center")
    table.add_column("Gas", justify="right")
    table.add_column("Default", justify="center")

    for chain_key, config in CHAIN_CONFIGS.items():
        is_default = "Y" if chain_key == DEFAULT_CHAIN else ""
        table.add_row(
            chain_key,
            config["name"],
            str(config["chain_id"]),
            config["native_token"],
            config["type"],
            config["privacy"],
            f"{config['gas_price_gwei']} Gwei",
            is_default,
        )

    console.print()
    console.print(table)
    console.print()
    console.print(f"  Default chain: [cyan]{DEFAULT_CHAIN}[/cyan]")
    console.print(f"  Use [bold]--chain[/bold] flag with deploy: varitykit app deploy --chain avax-l1")
    console.print()


@chains.command()
@click.argument("chain_id", required=True)
def info(chain_id):
    """Show detailed chain information"""
    config = CHAIN_CONFIGS.get(chain_id)
    if not config:
        console.print(f"[red]Unknown chain: {chain_id}[/red]")
        console.print(f"Available: {', '.join(CHAIN_CONFIGS.keys())}")
        return

    console.print()
    console.print(f"[bold cyan]{config['name']}[/bold cyan]")
    console.print()

    table = Table(show_header=False, box=None, padding=(0, 2))
    table.add_column("Key", style="dim", no_wrap=True)
    table.add_column("Value")

    table.add_row("Chain ID", str(config["chain_id"]))
    table.add_row("CLI Name", chain_id)
    table.add_row("Type", config["type"])
    table.add_row("RPC URL", config["rpc_url"])
    table.add_row("Explorer", config["explorer_url"])
    table.add_row("Native Token", f"{config['native_token']} ({config['native_decimals']} decimals)")
    table.add_row("Gas Price", f"{config['gas_price_gwei']} Gwei")
    table.add_row("Block Time", config["block_time_sec"])
    table.add_row("Privacy", config["privacy"])
    table.add_row("Testnet", str(config["testnet"]))
    table.add_row("Default", str(chain_id == DEFAULT_CHAIN))

    console.print(table)
    console.print()


@chains.command()
@click.argument("chain_id", required=False)
def health(chain_id):
    """Check chain RPC health"""
    targets = {}
    if chain_id:
        config = CHAIN_CONFIGS.get(chain_id)
        if not config:
            console.print(f"[red]Unknown chain: {chain_id}[/red]")
            return
        targets[chain_id] = config
    else:
        targets = CHAIN_CONFIGS

    console.print()
    console.print("[bold]Chain Health Check[/bold]")
    console.print()

    for _, config in targets.items():
        rpc_url = config["rpc_url"]
        try:
            # eth_chainId
            resp = requests.post(
                rpc_url,
                json={"jsonrpc": "2.0", "method": "eth_chainId", "params": [], "id": 1},
                timeout=10,
            )
            data = resp.json()
            chain_id_hex = data.get("result", "0x0")
            chain_id_int = int(chain_id_hex, 16) if chain_id_hex else 0

            if chain_id_int == config["chain_id"]:
                console.print(f"  [green]PASS[/green]  {config['name']} (chain {chain_id_int})")
            else:
                console.print(
                    f"  [yellow]WARN[/yellow]  {config['name']} — chain ID mismatch "
                    f"(expected {config['chain_id']}, got {chain_id_int})"
                )

            # eth_blockNumber
            resp2 = requests.post(
                rpc_url,
                json={"jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 2},
                timeout=10,
            )
            block_data = resp2.json()
            block_hex = block_data.get("result", "0x0")
            block_num = int(block_hex, 16) if block_hex else 0
            console.print(f"         Block height: {block_num:,}")

        except requests.exceptions.Timeout:
            console.print(f"  [red]FAIL[/red]  {config['name']} — RPC timeout ({rpc_url})")
        except requests.exceptions.ConnectionError:
            console.print(f"  [red]FAIL[/red]  {config['name']} — Connection refused ({rpc_url})")
        except Exception as e:
            console.print(f"  [red]FAIL[/red]  {config['name']} — {e}")

    console.print()
