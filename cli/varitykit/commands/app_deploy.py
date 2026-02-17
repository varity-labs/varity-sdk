"""
Application deployment commands for VarityKit

Deploy applications with one command.
"""

import os
from pathlib import Path

import click
from rich.console import Console
from rich.panel import Panel

console = Console()


# Advanced: On-chain pricing (available post-beta)
# VARITY_PAYMENTS_ADDRESS = "0x0568cf3b5b9c94542aa8d32eb51ffa38912fc48c"
# VARITY_L3_RPC = "https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz"
#
# # ABI for setAppPrice function (camelCase - Stylus SDK conversion)
# VARITY_PAYMENTS_ABI = [
#     {
#         "name": "setAppPrice",
#         "type": "function",
#         "stateMutability": "nonpayable",
#         "inputs": [
#             {"name": "appId", "type": "uint64"},
#             {"name": "priceUsdc", "type": "uint64"},
#             {"name": "isSubscription", "type": "bool"},
#             {"name": "intervalDays", "type": "uint64"},
#         ],
#         "outputs": [],
#     },
#     {
#         "name": "getAppPricing",
#         "type": "function",
#         "stateMutability": "view",
#         "inputs": [{"name": "appId", "type": "uint64"}],
#         "outputs": [
#             {"name": "priceUsdc", "type": "uint64"},
#             {"name": "developer", "type": "address"},
#             {"name": "isSubscription", "type": "bool"},
#             {"name": "intervalDays", "type": "uint64"},
#             {"name": "isActive", "type": "bool"},
#         ],
#     },
# ]
#
#
# def set_app_price_on_chain(
#     app_id: int,
#     price_cents: int,
#     is_subscription: bool = False,
#     interval_days: int = 30,
#     private_key: Optional[str] = None,
# ) -> Tuple[bool, str]:
#     """
#     Set app pricing on VarityPayments contract.
#
#     Args:
#         app_id: The app ID from deployment
#         price_cents: Price in cents (e.g., 9900 = $99.00)
#         is_subscription: Whether this is a subscription price
#         interval_days: Billing interval in days (for subscriptions)
#         private_key: Developer's private key (from env if not provided)
#
#     Returns:
#         Tuple of (success, message/tx_hash)
#     """
#     try:
#         from web3 import Web3
#
#         # Connect to Varity L3
#         w3 = Web3(Web3.HTTPProvider(VARITY_L3_RPC))
#
#         if not w3.is_connected():
#             return False, "Failed to connect to Varity L3 network"
#
#         # Get private key from environment if not provided
#         if not private_key:
#             private_key = os.environ.get("VARITY_PRIVATE_KEY") or os.environ.get(
#                 "WALLET_PRIVATE_KEY"
#             )
#
#             # Try .env file
#             if not private_key:
#                 env_file = Path(".env")
#                 if env_file.exists():
#                     for line in env_file.read_text().split("\n"):
#                         if line.startswith("VARITY_PRIVATE_KEY="):
#                             private_key = line.split("=", 1)[1].strip()
#                             break
#                         elif line.startswith("WALLET_PRIVATE_KEY="):
#                             private_key = line.split("=", 1)[1].strip()
#                             break
#
#         if not private_key:
#             return False, "No private key found. Set VARITY_PRIVATE_KEY or WALLET_PRIVATE_KEY"
#
#         # Get account from private key
#         account = w3.eth.account.from_key(private_key)
#
#         # Convert price from cents to USDC (6 decimals)
#         # $99.00 = 9900 cents = 99_000000 USDC (6 decimals)
#         price_usdc = price_cents * 10000  # cents * 10000 = USDC 6 decimals
#
#         # Create contract instance
#         contract = w3.eth.contract(
#             address=Web3.to_checksum_address(VARITY_PAYMENTS_ADDRESS),
#             abi=VARITY_PAYMENTS_ABI,
#         )
#
#         # Build transaction
#         tx_params = {
#             "from": account.address,
#             "nonce": w3.eth.get_transaction_count(account.address),
#             "chainId": 33529,  # Varity L3 Chain ID
#         }
#
#         # Estimate gas
#         try:
#             func = contract.functions.setAppPrice(
#                 app_id, price_usdc, is_subscription, interval_days
#             )
#             estimated_gas = func.estimate_gas(tx_params)
#             tx_params["gas"] = int(estimated_gas * 1.2)
#         except Exception as e:
#             # Use default gas if estimation fails
#             tx_params["gas"] = 200000
#
#         # Get gas price
#         tx_params["gasPrice"] = w3.eth.gas_price
#
#         # Build and sign transaction
#         transaction = contract.functions.setAppPrice(
#             app_id, price_usdc, is_subscription, interval_days
#         ).build_transaction(tx_params)
#
#         signed_tx = w3.eth.account.sign_transaction(transaction, private_key)
#
#         # Send transaction
#         tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
#
#         # Wait for confirmation
#         receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
#
#         if receipt["status"] == 1:
#             return True, tx_hash.hex()
#         else:
#             return False, f"Transaction failed: {tx_hash.hex()}"
#
#     except ImportError:
#         return False, "web3.py not installed. Run: pip install web3"
#     except Exception as e:
#         return False, str(e)


@click.group()
def app():
    """
    Deploy and manage applications

    Deploy applications with one command.

    \b
    Features:
    • Deploy static sites and dynamic apps
    • Auto-submission to Varity App Store
    • Built-in database and auth

    \b
    Quick Start:
      varitykit app deploy               # Deploy current directory
      varitykit app deploy --path ./my-app
      varitykit app list                 # List deployments
    """
    pass


@app.command()
@click.option(
    "--hosting",
    default="static",
    help="Hosting type: 'static' for static sites (default), 'dynamic' for apps with backend (coming soon)",
    type=click.Choice(["static", "dynamic"], case_sensitive=False),
)
@click.option(
    "--submit-to-store", is_flag=True, help="Auto-submit to Varity App Store"
)
@click.option(
    "--tier",
    default=None,
    help="Infrastructure tier: free, starter ($49/mo), growth ($99/mo), enterprise ($199/mo)",
    type=click.Choice(["free", "starter", "growth", "enterprise"], case_sensitive=False),
)
@click.option(
    "--name",
    default=None,
    help="Custom subdomain for {name}.varity.app",
)
@click.option(
    "--path",
    default=".",
    help="Project directory (default: current directory)",
    type=click.Path(exists=True),
)
@click.pass_context
def deploy(ctx, hosting, submit_to_store, tier, name, path):
    """
    Deploy your application.

    This command will:
    1. Detect your project type (Next.js, React, Vue)
    2. Detect and configure Varity features (database, auth, etc.)
    3. Build your application with auto-injected credentials
    4. Deploy and return your app URL
    5. Optionally submit to the Varity App Store

    \b
    Hosting Options:
      • static: Static sites (default)
      • dynamic: Apps with backend (coming soon)

    \b
    Examples:
      # Deploy your app
      varitykit app deploy

      # Deploy and submit to App Store
      varitykit app deploy --submit-to-store

      # Deploy with a specific tier
      varitykit app deploy --tier starter --submit-to-store

    \b
    Supported Frameworks:
      • Next.js 13+ (App Router with static export)
      • React 18+ (Create React App, Vite)
      • Vue 3+
    """
    logger = ctx.obj["logger"]
    network = "varity"

    try:
        # Show banner
        console.print(
            Panel.fit(
                "[bold blue]Varity App Deployment[/bold blue]\n"
                "Deploy your app in seconds",
                border_style="blue",
            )
        )

        if submit_to_store:
            # Prompt for tier selection if not provided via CLI flag
            if tier is None:
                from rich.prompt import IntPrompt

                console.print("[bold]Select Infrastructure Tier:[/bold]")
                console.print("  1. [green]Free[/green]       - $0/mo   (Testnet, unlimited transactions)")
                console.print("  2. [cyan]Starter[/cyan]    - $49/mo  (50k transactions/mo)")
                console.print("  3. [blue]Growth[/blue]     - $99/mo  (250k transactions/mo)")
                console.print("  4. [magenta]Enterprise[/magenta] - $199/mo (1M transactions/mo)")
                tier_choice = IntPrompt.ask(
                    "\nTier",
                    choices=["1", "2", "3", "4"],
                    default=1,
                )
                tier_map = {1: "free", 2: "starter", 3: "growth", 4: "enterprise"}
                tier = tier_map[tier_choice]
                console.print(f"  Selected: [bold]{tier}[/bold]\n")

        # Convert path to absolute
        project_path = Path(path).resolve()

        # Auto-detect partnership services from package.json
        detected_services = []
        if submit_to_store:
            package_json_path = project_path / "package.json"
            if package_json_path.exists():
                import json as _json
                from varitykit.core.app_store.types import SERVICE_DETECTION_PATTERNS, SERVICE_INFO

                with open(package_json_path, "r", encoding="utf-8") as f:
                    pkg_data = _json.load(f)

                all_deps = {}
                all_deps.update(pkg_data.get("dependencies", {}))
                all_deps.update(pkg_data.get("devDependencies", {}))

                detected_set = set()
                for dep_name in all_deps:
                    for pattern, svc in SERVICE_DETECTION_PATTERNS.items():
                        if dep_name == pattern or dep_name.startswith(pattern.rstrip("*")):
                            detected_set.add(svc)

                detected_services = sorted(detected_set, key=lambda s: s.value)

                if detected_services:
                    console.print("[bold]Detected Partnership Services:[/bold]")
                    total_service_cost = 0
                    for svc in detected_services:
                        info = SERVICE_INFO[svc]
                        console.print(f"  [cyan]{info['name']}[/cyan] - ${info['price']}/mo")
                        total_service_cost += info['price']
                    console.print(f"  [bold]Total service costs: ${total_service_cost}/mo[/bold]\n")

        console.print(f"[cyan]Project:[/cyan] {project_path}")
        if tier:
            console.print(f"[cyan]Tier:[/cyan] {tier}")
        console.print()

        # Step 1: Analyze project for feature usage
        console.print("[bold]Analyzing project...[/bold]")
        from varitykit.utils.code_analyzer import detect_features

        features = detect_features(str(project_path))

        # Display detected features
        if features.get('database'):
            console.print("  ✓ [cyan]Database:[/cyan] Enabled")
        if features.get('auth'):
            console.print("  ✓ [cyan]Auth:[/cyan] Enabled")
        if features.get('payment_widget'):
            console.print("  ✓ [green]Payments:[/green] Enabled")
        elif submit_to_store and tier and tier != 'free':
            console.print("  ⚠️ [yellow]Payments:[/yellow] Not detected (required for paid tiers)")
            console.print("\n  [yellow]ℹ️  No payment integration detected.[/yellow]")
            console.print("  [dim]You can add payment support later via your developer dashboard.[/dim]")
            console.print("  [dim]Docs: https://docs.varity.so/build/payments[/dim]\n")

        # Step 2: Generate and inject database credentials if needed
        credentials = None
        env_file_path = None

        if features.get('database'):
            console.print("\n[bold]Setting up database...[/bold]")

            from varitykit.services.credentials import generate_app_credentials

            try:
                credentials = generate_app_credentials()
                console.print(f"  ✓ App ID: [cyan]{credentials['app_id']}[/cyan]")
                console.print(f"  ✓ Database credentials ready")

                # Create .env.local file with credentials for build
                env_file_path = project_path / '.env.local'
                env_content = f"""# Varity App Credentials (Auto-generated)
# DO NOT COMMIT TO GIT

VITE_VARITY_APP_ID={credentials['app_id']}
VITE_VARITY_APP_TOKEN={credentials['jwt_token']}
VITE_VARITY_DB_PROXY_URL={credentials['db_proxy_url']}

# Also support REACT_APP_ prefix for Create React App
REACT_APP_VARITY_APP_ID={credentials['app_id']}
REACT_APP_VARITY_APP_TOKEN={credentials['jwt_token']}
REACT_APP_VARITY_DB_PROXY_URL={credentials['db_proxy_url']}

# Also support NEXT_PUBLIC_ prefix for Next.js
NEXT_PUBLIC_VARITY_APP_ID={credentials['app_id']}
NEXT_PUBLIC_VARITY_APP_TOKEN={credentials['jwt_token']}
NEXT_PUBLIC_VARITY_DB_PROXY_URL={credentials['db_proxy_url']}
"""

                with open(env_file_path, 'w') as f:
                    f.write(env_content)

                console.print("  ✓ Injected database credentials into build")

            except ImportError as e:
                console.print(f"  [yellow]⚠️  Could not generate credentials: {e}[/yellow]")
                console.print("  [yellow]   Install PyJWT: pip install PyJWT[/yellow]")

        # Auto-fetch hosting credentials (zero-config)
        if not os.environ.get("THIRDWEB_CLIENT_ID"):
            try:
                from varitykit.services.credential_fetcher import fetch_thirdweb_credentials
                creds = fetch_thirdweb_credentials()
                os.environ["THIRDWEB_CLIENT_ID"] = creds.thirdweb_client_id
                if creds.thirdweb_secret_key:
                    os.environ["THIRDWEB_SECRET_KEY"] = creds.thirdweb_secret_key
                console.print("  ✓ Hosting credentials ready")
            except Exception as e:
                console.print(f"  [yellow]⚠️  Could not connect to Varity servers: {e}[/yellow]")
                console.print("  [yellow]   Please try again or check https://status.varity.so[/yellow]")

        # Import and use DeploymentOrchestrator
        from varitykit.core.deployment_orchestrator import DeploymentOrchestrator

        orchestrator = DeploymentOrchestrator(verbose=False)  # We'll handle output ourselves

        # Execute deployment (app store submission handled separately via browser)
        try:
            result = orchestrator.deploy(
                project_path=str(project_path),
                network=network,
                hosting=hosting,
                submit_to_store=False,
                tier=tier or "free",
                custom_name=name,
            )
        finally:
            # Clean up credentials file
            if env_file_path and env_file_path.exists():
                env_file_path.unlink()
                logger.debug("Cleaned up temporary credentials file")

        # Display success
        console.print("\n" + "="*60)
        console.print("[bold green]✅ Deployment Successful![/bold green]")
        console.print("="*60)

        deployment_text = f"""[bold cyan]Your App[/bold cyan]

[cyan]App URL:[/cyan] {result.frontend_url}
[cyan]Deployment ID:[/cyan] {result.deployment_id}"""

        if result.custom_domain and result.thirdweb_url:
            deployment_text += f"\n[dim]IPFS:[/dim]  {result.thirdweb_url}"

        if features.get('database') and credentials:
            deployment_text += f"\n\n[bold cyan]Database[/bold cyan]\n[cyan]Status:[/cyan] ✅ Ready\n[cyan]App ID:[/cyan] {credentials['app_id']}"

        console.print(Panel.fit(deployment_text, border_style="green"))

        console.print("="*60)

        # Next steps
        next_steps = "[cyan]What's next?[/cyan]\n"
        next_steps += "  Submit to App Store:  varitykit app deploy --submit-to-store\n"
        next_steps += "  Read the docs:        https://docs.varity.so\n"
        next_steps += "  Get help:             https://discord.gg/varity\n"
        next_steps += "  Report a bug:         https://github.com/varity-labs/varity-sdk/issues"
        console.print(Panel.fit(next_steps, border_style="cyan"))
        console.print()

        # Get project metadata for share templates
        app_name = project_path.name
        try:
            import json as _json_share
            pkg_path = project_path / "package.json"
            if pkg_path.exists():
                with open(pkg_path, "r", encoding="utf-8") as f:
                    pkg = _json_share.load(f)
                    app_name = pkg.get("name", app_name)
        except Exception:
            pass

        framework = result.manifest.get("project", {}).get("type", "unknown")
        build_time = result.manifest.get("build", {}).get("time_seconds", 0)
        build_size = result.manifest.get("build", {}).get("size_mb", 0)

        # Share your deployment
        share_text = "[bold magenta]Share Your Deployment![/bold magenta]\n\n"
        share_text += "[bold]Twitter/X:[/bold]\n"
        share_text += f'  Just deployed {app_name} on @VarityLabs in under 60 seconds!\n'
        share_text += f'  70% cheaper than AWS, zero config required.\n'
        share_text += f'  Check it out: {result.frontend_url}\n'
        share_text += f'  #BuildWithVarity #ShippingFast\n\n'
        share_text += "[bold]LinkedIn:[/bold]\n"
        share_text += f'  Excited to share — I just deployed {app_name} using Varity,\n'
        share_text += f'  a zero-config platform that\'s 70% cheaper than AWS.\n'
        share_text += f'  - 60-second deploy from CLI\n'
        share_text += f'  - Auth, database, storage included\n'
        share_text += f'  - No Docker, no config files\n'
        share_text += f'  Live: {result.frontend_url}\n'
        share_text += f'  #WebDevelopment #CloudComputing\n\n'
        share_text += "[bold]Discord/Slack:[/bold]\n"
        share_text += f'  Shipped {app_name} on Varity!\n'
        share_text += f'  {result.frontend_url}\n'
        share_text += f'  Build: {build_time:.1f}s | Framework: {framework} | Size: {build_size:.1f}MB'
        console.print(Panel.fit(share_text, border_style="magenta"))
        console.print()

        # Generate deployment badge
        try:
            from varitykit.utils.badge_generator import save_badge
            badge_path = save_badge(result.deployment_id, app_name)
            badge_text = "[bold]README Badge[/bold]\n\n"
            badge_text += f"  Add this to your README.md:\n\n"
            badge_text += f"  [![Deployed on Varity]({badge_path})]({result.frontend_url})\n\n"
            badge_text += f"  [dim]Badge saved to: {badge_path}[/dim]"
            console.print(Panel.fit(badge_text, border_style="blue"))
            console.print()
        except Exception as e:
            logger.debug(f"Badge generation failed: {e}")

        # Open developer portal for app store submission
        if submit_to_store:
            import webbrowser
            from urllib.parse import urlencode

            portal_params = urlencode({
                'cid': result.cid,
                'tier': tier or 'free',
                'url': result.frontend_url,
                'deployment_id': result.deployment_id,
                'services': ','.join(s.value for s in detected_services) if detected_services else '',
            })
            portal_url = f"https://developer.store.varity.so/submit?{portal_params}"
            console.print(f"[bold]Opening Varity Developer Portal...[/bold]")
            console.print(f"[cyan]Portal:[/cyan] {portal_url}\n")
            if tier == "free":
                console.print("[dim]Sign in and fill in your app details to submit.[/dim]\n")
            else:
                console.print("[dim]Sign in, complete payment, and fill in your app details.[/dim]\n")
            browser_opened = False
            try:
                import subprocess as _sp
                _sp.Popen(['explorer.exe', portal_url], stdout=_sp.DEVNULL, stderr=_sp.DEVNULL)
                browser_opened = True
            except (FileNotFoundError, OSError):
                pass
            if not browser_opened:
                try:
                    import subprocess as _sp
                    _sp.run(["wslview", portal_url], capture_output=True, timeout=5)
                    browser_opened = True
                except (FileNotFoundError, OSError, Exception):
                    pass
            if not browser_opened:
                try:
                    webbrowser.open(portal_url)
                except Exception:
                    pass
            console.print(f"\n[bold cyan]  Developer Portal:[/bold cyan] {portal_url}")
            console.print("  [dim]Copy the URL above if your browser didn't open automatically.[/dim]\n")

        # Advanced: On-chain pricing (available post-beta)
        # if price is not None:
        #     # Validate pricing options
        #     if subscription and interval < 1:
        #         console.print("[yellow]Warning: Invalid interval. Using default 30 days.[/yellow]")
        #         interval = 30
        #
        #     console.print("\n[bold]Setting app pricing on-chain...[/bold]")
        #     console.print(f"  [cyan]Price:[/cyan] ${price / 100:.2f}")
        #     console.print(f"  [cyan]Type:[/cyan] {'Subscription' if subscription else 'One-time'}")
        #     if subscription:
        #         console.print(f"  [cyan]Interval:[/cyan] {interval} days")
        #
        #     app_id = getattr(result, 'app_id', None)
        #     if app_id is None:
        #         import hashlib
        #         app_id = int(hashlib.sha256(result.deployment_id.encode()).hexdigest()[:8], 16)
        #         console.print(f"  [dim]Generated App ID: {app_id}[/dim]")
        #
        #     success, result_msg = set_app_price_on_chain(
        #         app_id=app_id,
        #         price_cents=price,
        #         is_subscription=subscription,
        #         interval_days=interval,
        #     )
        #
        #     if success:
        #         console.print(f"\n[bold green]Pricing set![/bold green]")
        #         console.print(f"  [cyan]Transaction:[/cyan] {result_msg}")
        #         console.print(f"  [cyan]App ID:[/cyan] {app_id}")
        #         console.print(f"  [cyan]Price:[/cyan] ${price / 100:.2f} ({'subscription' if subscription else 'one-time'})")
        #     else:
        #         console.print(f"\n[yellow]Warning: Failed to set pricing[/yellow]")
        #         console.print(f"  [yellow]Reason: {result_msg}[/yellow]")
        #         console.print("  [dim]You can set pricing later via the Developer Portal or CLI:[/dim]")
        #         console.print(f"  [dim]  varitykit pricing set --app-id {app_id} --price {price}[/dim]")

        logger.info(f"Deployment successful: {result.deployment_id}")

    except Exception as e:
        console.print(f"\n[bold red]❌ Deployment Failed[/bold red]")
        console.print(f"[red]Error: {str(e)}[/red]\n")

        # Show helpful error messages
        error_str = str(e).lower()
        if "build" in error_str:
            console.print("[yellow]Tip: Try running your build command manually first[/yellow]")
            console.print("   Example: npm run build\n")

        logger.error(f"Deployment failed: {e}")
        raise click.Abort()


@app.command()
@click.option("--network", "-n", help="Filter by network")
@click.option("--limit", "-l", default=10, help="Number of deployments to show")
@click.pass_context
def list(ctx, network, limit):
    """
    List all deployments

    Shows recent deployments with their status, URLs, and metadata.

    \b
    Examples:
      varitykit app list
      varitykit app list --network varity
      varitykit app list --limit 20
    """
    logger = ctx.obj["logger"]

    try:
        from rich.table import Table
        from varitykit.core.deployment_history import DeploymentHistory

        history = DeploymentHistory()
        deployments = history.list_deployments(network=network, limit=limit)

        if not deployments:
            console.print("\n[yellow]No deployments found[/yellow]")
            if network:
                console.print(f"   Network filter: [cyan]{network}[/cyan]")
            console.print(f"   Storage location: [cyan]{history.storage_path}[/cyan]\n")
            return

        # Create Rich table
        table = Table(
            title=f"Recent Deployments ({len(deployments)} of {history.get_deployment_count(network)})"
        )
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("Network", style="green")
        table.add_column("Type", style="yellow")
        table.add_column("Frontend URL", style="blue", overflow="fold")
        table.add_column("Deployed", style="magenta")

        for dep in deployments:
            deployment_id = dep.get("deployment_id", "unknown")
            dep_network = dep.get("network", "unknown")

            # Extract deployment type
            deployment_type = dep.get("deployment", {}).get("type", "ipfs")
            if "deployment" not in dep and "ipfs" in dep:
                deployment_type = "ipfs"

            # Extract frontend URL
            frontend_url = "N/A"
            if "deployment" in dep:
                if "frontend" in dep["deployment"]:
                    frontend_url = dep["deployment"]["frontend"].get("url", "N/A")
                elif "ipfs" in dep["deployment"]:
                    frontend_url = dep["deployment"]["ipfs"].get("gateway_url", "N/A")
            elif "ipfs" in dep:
                frontend_url = dep["ipfs"].get("gateway_url", "N/A")

            # Truncate URL if too long
            if len(frontend_url) > 50:
                frontend_url = frontend_url[:47] + "..."

            # Format timestamp
            timestamp = dep.get("timestamp", "unknown")
            if timestamp != "unknown":
                try:
                    from datetime import datetime

                    dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                    timestamp = dt.strftime("%Y-%m-%d %H:%M")
                except Exception:
                    pass

            table.add_row(deployment_id, dep_network, deployment_type, frontend_url, timestamp)

        console.print("\n")
        console.print(table)
        console.print("\n")

        logger.info(f"Listed {len(deployments)} deployments")

    except Exception as e:
        console.print(f"\n[red]Error listing deployments: {str(e)}[/red]\n")
        logger.error(f"Failed to list deployments: {e}")
        raise click.Abort()


@app.command()
@click.argument("deployment_id", required=True)
@click.pass_context
def info(ctx, deployment_id):
    """
    Show deployment details

    Display detailed information about a specific deployment including
    URLs, CIDs, contract addresses, and metadata.

    \b
    Example:
      varitykit app info deploy-1737492000
    """
    logger = ctx.obj["logger"]

    try:
        from varitykit.core.deployment_history import DeploymentHistory

        history = DeploymentHistory()
        deployment = history.get_deployment(deployment_id)

        if deployment is None:
            console.print(f"\n[red]Deployment {deployment_id} not found[/red]\n")
            console.print("Available deployments:")
            deployments = history.list_deployments(limit=5)
            for dep in deployments:
                console.print(f"  • {dep.get('deployment_id', 'unknown')}")
            console.print()
            raise click.Abort()

        # Extract deployment details
        version = deployment.get("version", "1.0")
        network = deployment.get("network", "unknown")
        timestamp = deployment.get("timestamp", "unknown")

        # Project info
        project = deployment.get("project", {})
        project_type = project.get("type", "unknown")
        framework_version = project.get("framework_version", "unknown")
        project_path = project.get("path", "N/A")

        # Build info
        build = deployment.get("build", {})
        build_success = build.get("success", False)
        build_files = build.get("files", 0)
        build_size_mb = build.get("size_mb", 0.0)
        build_time = build.get("time_seconds", 0.0)

        # Deployment URLs
        frontend_url = "N/A"
        backend_url = "N/A"
        ipfs_cid = "N/A"
        ipfs_gateway = "N/A"
        thirdweb_url = "N/A"
        deployment_type = "unknown"

        if "deployment" in deployment:
            deployment_type = deployment["deployment"].get("type", "unknown")

            # Frontend
            if "frontend" in deployment["deployment"]:
                frontend_url = deployment["deployment"]["frontend"].get("url", "N/A")

            # Backend
            if "backend" in deployment["deployment"]:
                backend_url = deployment["deployment"]["backend"].get("url", "N/A")

            # IPFS
            if "ipfs" in deployment["deployment"]:
                ipfs_cid = deployment["deployment"]["ipfs"].get("cid", "N/A")
                ipfs_gateway = deployment["deployment"]["ipfs"].get("gateway_url", "N/A")
                thirdweb_url = deployment["deployment"]["ipfs"].get("thirdweb_url", "N/A")
        elif "ipfs" in deployment:
            # Phase 1 format
            deployment_type = "ipfs"
            ipfs_cid = deployment["ipfs"].get("cid", "N/A")
            ipfs_gateway = deployment["ipfs"].get("gateway_url", "N/A")
            thirdweb_url = deployment["ipfs"].get("thirdweb_url", "N/A")
            frontend_url = ipfs_gateway

        # App Store info
        app_store = deployment.get("app_store", {})
        app_store_submitted = app_store.get("submitted", False)
        app_store_id = app_store.get("app_id", "N/A")
        app_store_url = app_store.get("url", "N/A")
        app_store_status = app_store.get("status", "N/A")

        # Format timestamp
        if timestamp != "unknown":
            try:
                from datetime import datetime

                dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                timestamp = dt.strftime("%Y-%m-%d %H:%M:%S %Z")
            except Exception:
                pass

        # Build info text
        info_text = f"""[bold]Deployment Information[/bold]

[cyan]Deployment ID:[/cyan] {deployment_id}
[cyan]Version:[/cyan] {version}
[cyan]Network:[/cyan] {network}
[cyan]Timestamp:[/cyan] {timestamp}
[cyan]Type:[/cyan] {deployment_type}

[bold]Project[/bold]
[cyan]Type:[/cyan] {project_type} {framework_version}
[cyan]Path:[/cyan] {project_path}

[bold]Build[/bold]
[cyan]Success:[/cyan] {'✅ Yes' if build_success else '❌ No'}
[cyan]Files:[/cyan] {build_files}
[cyan]Size:[/cyan] {build_size_mb:.2f} MB
[cyan]Build Time:[/cyan] {build_time:.2f}s

[bold]URLs[/bold]
[cyan]App URL:[/cyan] {frontend_url}
[cyan]Backend:[/cyan] {backend_url}
[cyan]CDN:[/cyan] {thirdweb_url}

[bold]App Store[/bold]
[cyan]Submitted:[/cyan] {'✅ Yes' if app_store_submitted else '❌ No'}
[cyan]App ID:[/cyan] {app_store_id}
[cyan]Status:[/cyan] {app_store_status}
[cyan]URL:[/cyan] {app_store_url}
"""

        console.print("\n")
        console.print(
            Panel.fit(info_text, title=f"Deployment: {deployment_id}", border_style="cyan")
        )
        console.print("\n")

        logger.info(f"Retrieved deployment info: {deployment_id}")

    except Exception as e:
        if "not found" not in str(e).lower():
            console.print(f"\n[red]Error retrieving deployment: {str(e)}[/red]\n")
            logger.error(f"Failed to get deployment info: {e}")
        raise click.Abort()


@app.command()
@click.argument("deployment_id", required=True)
@click.option("--confirm", is_flag=True, help="Skip confirmation prompt")
@click.pass_context
def rollback(ctx, deployment_id, confirm):
    """
    Rollback to a previous deployment

    ⚠️  This will redeploy the application using the configuration from
    the specified deployment.

    \b
    Examples:
      varitykit app rollback deploy-1737492000
      varitykit app rollback deploy-1737492000 --confirm
    """
    logger = ctx.obj["logger"]

    try:
        from varitykit.core.deployment_history import DeploymentHistory

        history = DeploymentHistory()
        deployment = history.get_deployment(deployment_id)

        if deployment is None:
            console.print(f"\n[red]Deployment {deployment_id} not found[/red]\n")
            console.print("Available deployments:")
            deployments = history.list_deployments(limit=5)
            for dep in deployments:
                console.print(f"  • {dep.get('deployment_id', 'unknown')}")
            console.print()
            raise click.Abort()

        # Show deployment details
        console.print(f"\n[bold yellow]⏮️  Rollback to Deployment[/bold yellow]\n")

        timestamp = deployment.get("timestamp", "unknown")
        if timestamp != "unknown":
            try:
                from datetime import datetime

                dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                timestamp = dt.strftime("%Y-%m-%d %H:%M:%S")
            except Exception:
                pass

        # Extract URLs
        frontend_url = "N/A"
        if "deployment" in deployment:
            if "frontend" in deployment["deployment"]:
                frontend_url = deployment["deployment"]["frontend"].get("url", "N/A")
            elif "ipfs" in deployment["deployment"]:
                frontend_url = deployment["deployment"]["ipfs"].get("gateway_url", "N/A")
        elif "ipfs" in deployment:
            frontend_url = deployment["ipfs"].get("gateway_url", "N/A")

        console.print(
            Panel.fit(
                f"[cyan]Deployment ID:[/cyan] {deployment_id}\n"
                f"[cyan]Network:[/cyan] {deployment.get('network', 'unknown')}\n"
                f"[cyan]Deployed:[/cyan] {timestamp}\n"
                f"[cyan]Frontend:[/cyan] {frontend_url}",
                title="Deployment Details",
                border_style="yellow",
            )
        )

        # Confirmation prompt
        if not confirm:
            console.print(
                "\n[yellow]⚠️  Warning: This will create a new deployment with the same configuration[/yellow]\n"
            )
            if not click.confirm("Continue with rollback?"):
                console.print("\n[yellow]Rollback cancelled[/yellow]\n")
                raise click.Abort()

        console.print(f"\n[yellow]Rolling back to {deployment_id}...[/yellow]\n")

        # Perform rollback
        new_deployment = history.rollback(deployment_id)

        # Display success
        console.print("\n[bold green]✅ Rollback Complete![/bold green]\n")
        console.print(
            Panel.fit(
                f"[bold cyan]New Deployment[/bold cyan]\n\n"
                f"[cyan]Deployment ID:[/cyan] {new_deployment.deployment_id}\n"
                f"[cyan]Frontend URL:[/cyan] {new_deployment.frontend_url}\n"
                f"[cyan]Deployment Hash:[/cyan] {new_deployment.cid}\n\n"
                f"[dim]Previous deployment restored successfully[/dim]",
                border_style="green",
            )
        )
        console.print()

        logger.info(f"Rollback successful: {deployment_id} → {new_deployment.deployment_id}")

    except click.Abort:
        raise
    except Exception as e:
        console.print(f"\n[red]Rollback failed: {str(e)}[/red]\n")
        logger.error(f"Rollback failed: {e}")
        raise click.Abort()


@app.command()
@click.option("--network", "-n", help="Filter by network")
@click.pass_context
def status(ctx, network):
    """
    Show deployment status

    Display the most recent deployment status for each network.

    \b
    Examples:
      varitykit app status
      varitykit app status --network varity
    """
    logger = ctx.obj["logger"]

    try:
        from varitykit.core.deployment_history import DeploymentHistory

        history = DeploymentHistory()
        latest = history.get_latest(network=network)

        if latest is None:
            console.print("\n[yellow]No deployments found[/yellow]")
            if network:
                console.print(f"   Network filter: [cyan]{network}[/cyan]")
            console.print(f"   Storage location: [cyan]{history.storage_path}[/cyan]\n")
            return

        # Extract deployment details
        deployment_id = latest.get("deployment_id", "unknown")
        dep_network = latest.get("network", "unknown")
        timestamp = latest.get("timestamp", "unknown")

        # Format timestamp
        if timestamp != "unknown":
            try:
                from datetime import datetime

                dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                timestamp = dt.strftime("%Y-%m-%d %H:%M:%S")
            except Exception:
                pass

        # Extract URLs and status
        frontend_url = "N/A"
        backend_url = "N/A"
        deployment_type = "unknown"
        deployment_status = "✅ Active"

        if "deployment" in latest:
            deployment_type = latest["deployment"].get("type", "unknown")

            if "frontend" in latest["deployment"]:
                frontend_url = latest["deployment"]["frontend"].get("url", "N/A")

            if "backend" in latest["deployment"]:
                backend_url = latest["deployment"]["backend"].get("url", "N/A")
        elif "ipfs" in latest:
            deployment_type = "ipfs"
            frontend_url = latest["ipfs"].get("gateway_url", "N/A")

        # Build info
        build = latest.get("build", {})
        build_success = build.get("success", False)
        build_files = build.get("files", 0)
        build_size_mb = build.get("size_mb", 0.0)

        # App Store info
        app_store = latest.get("app_store", {})
        app_store_submitted = app_store.get("submitted", False)
        app_store_status = app_store.get("status", "N/A")

        # Display status
        status_text = f"""[bold]Latest Deployment Status[/bold]

[cyan]Deployment ID:[/cyan] {deployment_id}
[cyan]Network:[/cyan] {dep_network}
[cyan]Type:[/cyan] {deployment_type}
[cyan]Status:[/cyan] {deployment_status}
[cyan]Deployed:[/cyan] {timestamp}

[bold]URLs[/bold]
[cyan]Frontend:[/cyan] {frontend_url}
[cyan]Backend:[/cyan] {backend_url}

[bold]Build[/bold]
[cyan]Success:[/cyan] {'✅ Yes' if build_success else '❌ No'}
[cyan]Files:[/cyan] {build_files}
[cyan]Size:[/cyan] {build_size_mb:.2f} MB

[bold]App Store[/bold]
[cyan]Submitted:[/cyan] {'✅ Yes' if app_store_submitted else '❌ No'}
[cyan]Status:[/cyan] {app_store_status}
"""

        console.print("\n")
        console.print(Panel.fit(status_text, title="Deployment Status", border_style="cyan"))

        # Show summary
        total_deployments = history.get_deployment_count(network=network)
        console.print(
            f"\n[dim]Total deployments{' for ' + network if network else ''}: {total_deployments}[/dim]"
        )
        console.print(f"[dim]Use 'varitykit app list' to see all deployments[/dim]\n")

        logger.info(f"Retrieved deployment status: {deployment_id}")

    except Exception as e:
        console.print(f"\n[red]Error retrieving status: {str(e)}[/red]\n")
        logger.error(f"Failed to get deployment status: {e}")
        raise click.Abort()
