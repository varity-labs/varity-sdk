"""
Application deployment commands for VarityKit

Deploy applications with one command.
"""

import os
import sys
import json
import time
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

import click
from rich.console import Console
from rich.markup import escape
from rich.panel import Panel

from varitykit.utils.logger import get_logger

console = Console()

_INGRESS_NOT_READY_STATUS = {502, 503}


def _probe_http_status(url: str, timeout: float = 10.0):
    """Return HTTP status code for `url`, or None on network/protocol errors."""
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return getattr(resp, "status", None) or resp.getcode()
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return None


def _wait_for_live_url(
    url: str,
    timeout: float = 120.0,
    poll_interval: float = 5.0,
    require_http_200: bool = False,
    consecutive_successes: int = 1,
) -> bool:
    """Wait until the public app URL is reachable.

    Default mode accepts any non-502/503 response.
    Strict mode (`require_http_200=True`) requires stable HTTP 200 responses.
    """
    start = time.monotonic()
    streak = 0
    while True:
        if time.monotonic() - start >= timeout:
            return False

        status = _probe_http_status(url)
        if require_http_200:
            if status == 200:
                streak += 1
                if streak >= max(1, consecutive_successes):
                    return True
            else:
                streak = 0
        else:
            if status is not None and status not in _INGRESS_NOT_READY_STATUS:
                return True

        time.sleep(poll_interval)


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


def _push_prebuilt_artifacts(
    project_path: Path,
    project_type: str,
    hosting: str,
    console_: Console,
) -> bool:
    """
    Force-add, commit, and push pre-built Next.js artifacts (`.next/`) to the
    current branch so that the Akash container can skip `npm install && npm run
    build` at runtime.

    This is a critical fix for heavy Next.js apps (MUI + thirdweb + Privy):
    building inside a 4Gi Akash container reliably OOMs. By shipping `.next/`
    via git, the container's entrypoint detects it and skips the build.

    Behavior:
      - Only runs when `hosting == "akash"` and `project_type` is a Node-family
        framework (`nextjs`, `react`, `vue`, `nodejs`) AND `.next/` exists.
      - Uses `git add -f` because `.next/` is gitignored by default.
      - Uses `git commit --no-verify` so user pre-commit hooks (which may
        themselves run a build) don't re-trigger the expensive build.
      - Uses `git push` (no args) — pushes current branch to its tracking remote.
      - On any failure: prints a warning and returns False. NEVER raises.
        The deploy still succeeds; the Akash container will build at runtime
        (slower path, but the app eventually comes up).

    Args:
        project_path: Absolute path to the project directory.
        project_type: Detected project type (e.g., "nextjs").
        hosting: Resolved hosting type (e.g., "akash", "static", "ipfs").
        console_: Rich Console used to emit status messages.

    Returns:
        True if the push succeeded end-to-end; False if skipped or warned.
    """
    # Only Akash dynamic deploys benefit from this; static/IPFS don't use `.next/`.
    if hosting != "akash":
        return False

    # Only Node-family frameworks produce `.next/`. Python/other are out of scope.
    if project_type not in {"nextjs", "react", "vue", "nodejs"}:
        return False

    next_dir = project_path / ".next"
    if not next_dir.exists() or not next_dir.is_dir():
        # No `.next/` → nothing to ship. IPFS/static path may still apply,
        # or the project simply isn't a Next.js app. Not an error.
        return False

    # Discover the git repo root — handles projects nested in a repo subdirectory.
    try:
        git_root_result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=str(project_path),
            capture_output=True,
            text=True,
        )
    except (FileNotFoundError, OSError):
        console_.print(
            "[yellow]⚠ Could not push pre-built artifacts; "
            "build will run at runtime (slower)[/yellow]"
        )
        return False

    if git_root_result.returncode != 0:
        console_.print(
            "[yellow]⚠ Could not push pre-built artifacts; "
            "build will run at runtime (slower)[/yellow]"
        )
        return False

    git_root = git_root_result.stdout.strip()

    console_.print(
        "  Uploading pre-built output to GitHub (so deploy skips build step)..."
    )

    # Force-add `.next/` EXCEPT `.next/cache/` (webpack/SWC cache, can be
    # hundreds of MB — pointless for serving) and `.next/trace` (dev
    # telemetry). `next start` needs the rest: BUILD_ID, static/, server/,
    # standalone/ (if output:'standalone'), and ~10 JSON manifests. Being
    # surgical about subpaths misses version-specific files; the cleaner
    # approach is "everything except the bloat."
    try:
        add_result = subprocess.run(
            ["git", "add", "-f", ".next"],
            cwd=str(project_path),
            capture_output=True,
            text=True,
        )
        # Unstage the cache/trace dirs. --ignore-unmatch so this is safe
        # when they don't exist.
        subprocess.run(
            ["git", "rm", "--cached", "-r", "--ignore-unmatch",
             ".next/cache", ".next/trace"],
            cwd=str(project_path),
            capture_output=True,
            text=True,
        )
    except (FileNotFoundError, OSError):
        console_.print(
            "[yellow]⚠ Could not push pre-built artifacts; "
            "build will run at runtime (slower)[/yellow]"
        )
        return False

    if add_result.returncode != 0:
        stderr_trim = (add_result.stderr or "").strip().splitlines()
        detail = stderr_trim[-1] if stderr_trim else ""
        console_.print(
            "[yellow]⚠ Could not push pre-built artifacts; "
            "build will run at runtime (slower)[/yellow]"
        )
        if detail:
            console_.print(f"  [dim]{detail}[/dim]")
        return False

    # Commit — use --no-verify to bypass pre-commit hooks that might re-run
    # the entire build (generic-template-dashboard has such a hook).
    commit_result = subprocess.run(
        ["git", "commit", "-m", "chore: Varity pre-built artifacts [skip ci]", "--no-verify"],
        cwd=git_root,
        capture_output=True,
        text=True,
    )

    # A non-zero return from `git commit` commonly means "nothing to commit" —
    # the `.next/` contents were byte-identical to the last push. That's fine;
    # we still try to push (in case an earlier commit hasn't been pushed yet).
    commit_skipped = False
    if commit_result.returncode != 0:
        combined = ((commit_result.stdout or "") + (commit_result.stderr or "")).lower()
        if "nothing to commit" in combined or "no changes added" in combined:
            commit_skipped = True
        else:
            stderr_trim = (commit_result.stderr or commit_result.stdout or "").strip().splitlines()
            detail = stderr_trim[-1] if stderr_trim else ""
            console_.print(
                "[yellow]⚠ Could not push pre-built artifacts; "
                "build will run at runtime (slower)[/yellow]"
            )
            if detail:
                console_.print(f"  [dim]{detail}[/dim]")
            return False

    # Push current branch to its tracking remote.
    push_result = subprocess.run(
        ["git", "push"],
        cwd=git_root,
        capture_output=True,
        text=True,
    )

    if push_result.returncode != 0:
        stderr_trim = (push_result.stderr or push_result.stdout or "").strip().splitlines()
        detail = stderr_trim[-1] if stderr_trim else ""
        console_.print(
            "[yellow]⚠ Could not push pre-built artifacts; "
            "build will run at runtime (slower)[/yellow]"
        )
        if detail:
            console_.print(f"  [dim]{detail}[/dim]")
        return False

    if commit_skipped:
        console_.print("  ✓ Pre-built artifacts already up-to-date")
    else:
        console_.print("  ✓ Pre-built artifacts uploaded")
    return True


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
    default="auto",
    help="Hosting type: 'auto' (detect), 'static' for static sites, 'dynamic' for server apps",
    type=click.Choice(["auto", "static", "dynamic"], case_sensitive=False),
)
@click.option(
    "--submit-to-store", is_flag=True, help="Auto-submit to Varity App Store"
)
@click.option(
    "--target",
    default=None,
    help="Target platform (default: varity)",
    type=click.Choice(["varity"], case_sensitive=False),
    hidden=True,
)
@click.option(
    "--mode",
    default="auto",
    help="Deployment mode: auto (recommended, default), guided (show options), expert (manual --target)",
    type=click.Choice(["auto", "guided", "expert"], case_sensitive=False),
)
@click.option(
    "--tier",
    default=None,
    help="Infrastructure tier: free, starter, growth, enterprise, scale",
    type=click.Choice(["free", "starter", "growth", "enterprise", "scale"], case_sensitive=False),
)
@click.option(
    "--name",
    default=None,
    help="Custom app name for varity.app/{name}",
)
@click.option(
    "--skip-build", is_flag=True, help="Skip build step (use existing build output)",
)
@click.option(
    "--repo-url",
    default=None,
    help="GitHub repository URL (required for dynamic hosting). Auto-detected from .git/config if not provided.",
)
@click.option(
    "--path",
    default=".",
    help="Project directory (default: current directory)",
    type=click.Path(exists=True),
)
@click.option(
    "--dry-run", is_flag=True, help="Simulate deployment: detect framework and show what would deploy, without deploying.",
)
@click.pass_context
def deploy(ctx, hosting, target, submit_to_store, mode, tier, name, skip_build, repo_url, path, dry_run):
    """
    Deploy your application.

    This command will:
    1. Detect your project type (Next.js, React, Vue)
    2. Analyze your app and recommend the optimal platform (auto/guided mode)
    3. Detect and configure Varity features (database, auth, etc.)
    4. Build your application with auto-injected credentials
    5. Deploy and return your app URL
    6. Optionally submit to the Varity App Store

    \b
    Deployment Modes:
      • auto: Auto-picks optimal platform (default, recommended)
      • guided: Show all platform options, let you choose
      • expert: Manual --target selection

    \b
    Hosting Options:
      • auto: Auto-detect (default, recommended)
      • static: Static sites (global CDN)
      • dynamic: Dynamic apps with server (cloud hosting)

    \b
    Examples:
      # Deploy (recommended)
      varitykit app deploy

      # Deploy and submit to App Store
      varitykit app deploy --submit-to-store

      # Deploy dynamic app (Next.js server, Express, etc.)
      varitykit app deploy --hosting dynamic

      # Deploy with a specific tier
      varitykit app deploy --tier starter --submit-to-store

    \b
    Supported Frameworks:
      • Next.js 13+ (App Router with static export)
      • React 18+ (Create React App, Vite)
      • Vue 3+
    """
    logger = (ctx.obj or {}).get("logger") or get_logger()
    network = "varity"

    # Convert path to absolute early for orchestration
    project_path = Path(path).resolve()

    # Deploy-key gate — applies to ALL deploys (static AND dynamic).
    # Beta testers must add a payment method in the developer portal to get
    # their deploy key, then run `varitykit login --key ...`. Without a key,
    # the credential proxy rejects both IPFS upload and Akash deploys.
    # Fail fast here with a clear message instead of letting the deploy get
    # deep enough to show a cryptic 401 stack trace.
    from varitykit.services.credential_fetcher import _get_cli_api_key
    if not _get_cli_api_key():
        console.print(
            "\n[red]Deploy blocked — no deploy key configured.[/red]\n\n"
            "Run [cyan]varitykit login[/cyan] to get your deploy key from the "
            "developer portal (it's generated after you add a payment method).\n"
            "Then retry this command.\n"
        )
        raise click.Abort()

    # Normalize --target aliases to internal chain IDs
    target_to_chain = {"varity": "varity-l3"}
    chain = target_to_chain.get(target, target) if target else None

    # Normalize hosting option: "dynamic" is an alias for "akash"
    if hosting == "dynamic":
        hosting = "akash"

    # Auto-detect hosting type if set to "auto"
    if hosting == "auto":
        from varitykit.services.akash_deploy_service import detect_hosting_type
        hosting = detect_hosting_type(str(project_path))
        # Hosting type detected silently — shown in banner below

    # Resolve platform using intelligent orchestration
    from varitykit.commands.chains import CHAIN_CONFIGS, DEFAULT_CHAIN

    selected_chain = None
    orchestration_result = None

    # EXPERT mode: Use explicit --target or default, skip orchestration
    if mode == "expert":
        selected_chain = chain or DEFAULT_CHAIN
        if not chain:
            console.print("[dim]Expert mode: Using default platform (no orchestration)[/dim]\n")

    # AUTO or GUIDED mode: Use intelligent orchestration
    elif mode in ["auto", "guided"]:
        # Check if --target was explicitly provided
        if chain:
            console.print(f"[yellow]Warning: --target flag ignored in {mode} mode (orchestration will recommend optimal platform)[/yellow]\n")

        try:
            # Call orchestration CLI
            # Go up 4 levels from app_deploy.py: commands/ → varitykit/ → cli/ → varity-sdk/
            sdk_path = Path(__file__).parent.parent.parent.parent / "packages" / "core" / "varity-sdk"
            orchestration_cli = sdk_path / "src" / "orchestration" / "cli.ts"

            if not orchestration_cli.exists():
                selected_chain = DEFAULT_CHAIN
            else:
                # Try tsx first (fast), fallback to npx tsx (slow but always works)
                tsx_cmd = ["tsx", str(orchestration_cli), "recommend", str(project_path), mode]
                npx_tsx_cmd = ["npx", "tsx", str(orchestration_cli), "recommend", str(project_path), mode]
                
                # Try with tsx first
                try:
                    result = subprocess.run(
                        tsx_cmd,
                        capture_output=True,
                        text=True,
                        timeout=30,
                    )
                except FileNotFoundError:
                    # tsx not found, try npx tsx (slower)
                    console.print("[dim](Using npx tsx - slower startup, consider: npm install -g tsx)[/dim]")
                    result = subprocess.run(
                        npx_tsx_cmd,
                        capture_output=True,
                        text=True,
                        timeout=30,
                    )

                if result.returncode != 0:
                    selected_chain = DEFAULT_CHAIN
                else:
                    orchestration_result = json.loads(result.stdout)

                    # AUTO mode: Use top recommendation automatically
                    if mode == "auto":
                        recommendation = orchestration_result["recommendation"]
                        selected_chain = recommendation["chainId"]

                        console.print(f"  Framework: {orchestration_result['analysis']['framework']}")
                        console.print(f"  Type: {orchestration_result['analysis']['appType']}")
                        console.print(f"  Selected: [green]{recommendation['chainName']}[/green] (score: {recommendation['score']}/100)")
                        console.print()

                        # Show reasoning
                        if recommendation.get("reasoning"):
                            console.print("[bold]Reasoning:[/bold]")
                            for reason in recommendation["reasoning"][:3]:  # Show top 3 reasons
                                # Remove checkmarks from reasoning
                                clean_reason = reason.replace("✓ ", "  - ").replace("○ ", "  - ").replace("⚠ ", "  - ")
                                console.print(clean_reason)
                            console.print()

                    # GUIDED mode: Show all options and let user pick
                    elif mode == "guided":
                        recommendations = orchestration_result["recommendations"]

                        console.print(f"  Framework: {orchestration_result['analysis']['framework']}")
                        console.print(f"  Type: {orchestration_result['analysis']['appType']}")
                        console.print()
                        console.print("[bold]Available infrastructure options:[/bold]\n")

                        from rich.prompt import IntPrompt

                        for idx, rec in enumerate(recommendations, 1):
                            console.print(f"  {idx}. [bold]{rec['chainName']}[/bold] (score: {rec['score']}/100)")
                            if rec.get("reasoning"):
                                for reason in rec["reasoning"][:2]:  # Show top 2 reasons per option
                                    # Remove checkmarks from reasoning
                                    clean_reason = reason.replace("✓ ", "     - ").replace("○ ", "     - ").replace("⚠ ", "     - ")
                                    console.print(clean_reason)
                            console.print()

                        choice = IntPrompt.ask(
                            "Select infrastructure",
                            choices=[str(i) for i in range(1, len(recommendations) + 1)],
                            default=1,
                        )

                        selected_chain = recommendations[choice - 1]["chainId"]
                        console.print(f"  Selected: [bold]{recommendations[choice - 1]['chainName']}[/bold]\n")

        except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
            selected_chain = DEFAULT_CHAIN

    # Ensure we have a selected chain
    if not selected_chain:
        selected_chain = DEFAULT_CHAIN

    chain_config = CHAIN_CONFIGS.get(selected_chain, CHAIN_CONFIGS[DEFAULT_CHAIN])

    try:
        # Show banner
        chain_label = chain_config["name"]
        console.print(
            Panel.fit(
                f"[bold blue]Varity App Deployment[/bold blue]\n"
                f"Deploy your app in seconds\n"
                f"[dim]Platform: {chain_label}[/dim]",
                border_style="blue",
            )
        )

        if submit_to_store:
            # Prompt for tier selection if not provided via CLI flag
            if tier is None:
                from rich.prompt import IntPrompt

                console.print("[bold]Select Infrastructure Tier:[/bold]")
                console.print("  1. [green]Free[/green]       - For development and small projects")
                console.print("  2. [cyan]Starter[/cyan]    - For production apps")
                console.print("  3. [blue]Growth[/blue]     - For scaling apps")
                console.print("  4. [magenta]Enterprise[/magenta] - For high-traffic apps")
                tier_choice = IntPrompt.ask(
                    "\nTier",
                    choices=["1", "2", "3", "4"],
                    default=1,
                )
                tier_map = {1: "free", 2: "starter", 3: "growth", 4: "enterprise"}
                tier = tier_map[tier_choice]
                console.print(f"  Selected: [bold]{tier}[/bold]\n")

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

                # newline='' disables Python's automatic \n→CRLF conversion
                # on Windows. Next.js reads .env.local line-by-line and treats
                # bare \r as part of the value — producing invisible trailing
                # \r on every env var and corrupting credential resolution.
                with open(env_file_path, 'w', encoding='utf-8', newline='') as f:
                    f.write(env_content)

                console.print("  ✓ Injected database credentials into build")

            except ImportError:
                console.print("  [yellow]⚠️  Database setup skipped — missing dependency. Run: pip install PyJWT[/yellow]")

        # Auto-fetch hosting credentials (zero-config)
        if not os.environ.get("THIRDWEB_SECRET_KEY"):
            def _apply_hosting_creds(creds):
                """Apply credentials and print accurate status."""
                os.environ["THIRDWEB_CLIENT_ID"] = creds.thirdweb_client_id
                if creds.thirdweb_secret_key:
                    os.environ["THIRDWEB_SECRET_KEY"] = creds.thirdweb_secret_key
                    console.print("  ✓ Hosting credentials ready")
                else:
                    console.print("  [yellow]⚠️  Hosting: public-only credentials (deploy key may be invalid)[/yellow]")
                    console.print("  [dim]Run 'varitykit login' to configure your deploy key[/dim]")

            from varitykit.services.credential_fetcher import fetch_thirdweb_credentials
            try:
                creds = fetch_thirdweb_credentials()
                _apply_hosting_creds(creds)
            except Exception:
                # Retry once — credential proxy can be flaky on cold start
                import time
                time.sleep(1)
                try:
                    creds = fetch_thirdweb_credentials()
                    _apply_hosting_creds(creds)
                except Exception:
                    console.print("  [yellow]⚠️  Could not connect to Varity servers. Please try again.[/yellow]")

        # Import and use DeploymentOrchestrator
        from varitykit.core.deployment_orchestrator import DeploymentOrchestrator

        orchestrator = DeploymentOrchestrator(verbose=False)  # We'll handle output ourselves

        # Dry-run: print summary and exit without building or deploying
        if dry_run:
            from varitykit.core.project_detector import ProjectDetector
            _det = ProjectDetector()
            try:
                _info = _det.detect(str(project_path))
                framework = _info.project_type
            except Exception:
                framework = "unknown"
            hosting_label = "static CDN" if hosting not in ("akash", "dynamic") else "dynamic (cloud compute)"
            console.print("\n[bold yellow]DRY RUN — no deployment will occur[/bold yellow]\n")
            console.print(f"  Project:  {project_path}")
            console.print(f"  Framework: {framework}")
            console.print(f"  Hosting:  {hosting_label}")
            console.print(f"  Platform: {chain_config.get('name', selected_chain)}")
            if submit_to_store:
                console.print("  App Store: would submit after deploy")
            console.print("\n[dim]Run without --dry-run to deploy.[/dim]\n")
            return

        # Pre-build + push `.next/` for Akash Next.js deploys.
        # Context: heavy Next.js apps (MUI + thirdweb + Privy, 1400+ npm packages)
        # OOM when building inside a 4Gi Akash container. Running `npm run build`
        # locally and shipping `.next/` via git lets the container skip the build.
        # The SDL already has `if [ ! -d .next ] && [ -f next.config.js ]; then
        # npm run build; fi`, so if `.next/` is present in the cloned repo the
        # build step is skipped automatically.
        if hosting == "akash":
            # Pre-built artifact push runs regardless of --skip-build. The
            # flag means "don't RUN a build here" (e.g. MCP already ran
            # varity_build separately). It does NOT mean "don't push the
            # artifacts that build produced." Without this push, MCP deploys
            # of Next.js apps ship without `.next/` → Akash container tries
            # `npm run build` at runtime → OOM / 5-min timeout.
            try:
                from varitykit.core.project_detector import ProjectDetector
                _detector = ProjectDetector()
                _project_info = _detector.detect(str(project_path))
            except Exception:
                _project_info = None

            if _project_info and _project_info.project_type in {"nextjs", "react", "vue", "nodejs"}:
                # If the caller asked us to build (not --skip-build), run it.
                if _project_info.project_type == "nextjs" and not skip_build:
                    try:
                        from varitykit.core.build_manager import BuildManager
                        console.print("[bold]Running local build...[/bold]")
                        _builder = BuildManager()
                        _build_artifacts = _builder.build(
                            project_path=str(project_path),
                            build_command=_project_info.build_command,
                            output_dir=_project_info.output_dir,
                        )
                        if not (_build_artifacts and _build_artifacts.success):
                            console.print(
                                "  [yellow]⚠ Local build returned no artifacts[/yellow]"
                            )
                    except Exception as _e:
                        console.print(
                            f"  [yellow]⚠ Local pre-build skipped: {_e}[/yellow]"
                        )
                        console.print(
                            "  [dim]build will run at runtime (slower).[/dim]"
                        )

                # Push pre-built artifacts if `.next/` exists — whether we
                # built here or the MCP built earlier.
                _push_prebuilt_artifacts(
                    project_path=project_path,
                    project_type=_project_info.project_type,
                    hosting=hosting,
                    console_=console,
                )

        # Execute deployment (app store submission handled separately via browser)
        try:
            result = orchestrator.deploy(
                project_path=str(project_path),
                network=network,
                hosting=hosting,
                submit_to_store=False,
                tier=tier or "free",
                custom_name=name,
                skip_build=skip_build,
                repo_url=repo_url,
            )
        except Exception:
            # Preserve credentials on failure so developer can retry
            if env_file_path and env_file_path.exists():
                console.print("  [dim]Credentials preserved in .env.local for retry[/dim]")
            raise

        # Clean up credentials file only after successful deployment
        if env_file_path and env_file_path.exists():
            env_file_path.unlink()
            logger.debug("Cleaned up temporary credentials file")

        # Guardrail: don't report success until the user-facing URL responds.
        # Orchestration can complete while gateway/provider is still returning
        # ingress warmup 502/503, which is a broken first-run UX.
        if result.hosting_type == "akash" and result.frontend_url:
            console.print("  [dim]Verifying live URL readiness...[/dim]")
            strict_mode = os.environ.get("VARITYKIT_STRICT_PUBLIC_URL_200") == "1"
            live_ok = _wait_for_live_url(
                result.frontend_url,
                timeout=300.0 if strict_mode else 120.0,
                poll_interval=5.0,
                require_http_200=strict_mode,
                consecutive_successes=3 if strict_mode else 1,
            )
            if not live_ok:
                expected = "stable HTTP 200" if strict_mode else "non-502/503 response"
                raise click.ClickException(
                    f"Deployment finished but live URL did not reach {expected} within "
                    f"{300 if strict_mode else 120}s. "
                    f"URL: {result.frontend_url}. "
                    f"Provider: {getattr(result, 'provider_url', 'N/A')}. "
                    "This indicates a remaining runtime/gateway blocker."
                )

        # Display success
        console.print("\n" + "="*60)
        console.print("[bold green]✅ Deployed![/bold green]")
        console.print("="*60)

        if result.hosting_type == "akash":
            # Akash deployment success output
            deployment_text = f"""[bold cyan]Your App[/bold cyan]

[cyan]URL:[/cyan]            {result.frontend_url}
[cyan]Deployment ID:[/cyan]  {result.deployment_id}
[cyan]Monthly Cost:[/cyan]   ~${result.estimated_monthly_cost:.0f}"""

            if result.free_credits_remaining > 0:
                deployment_text += f"\n[cyan]Free Credits:[/cyan]   ${result.free_credits_remaining:.0f} remaining"

            if result.provider_url and result.provider_url != result.frontend_url:
                deployment_text += f"\n[dim]Provider:[/dim]      {result.provider_url}"

        else:
            # IPFS/static deployment success output
            deployment_text = f"""[bold cyan]Your App[/bold cyan]

[cyan]App URL:[/cyan] {result.frontend_url}
[cyan]Deployment ID:[/cyan] {result.deployment_id}"""

            # Backup URL hidden — custom domain is the primary URL

        if features.get('database') and credentials:
            deployment_text += f"\n\n[bold cyan]Database[/bold cyan]\n[cyan]Status:[/cyan] ✅ Ready\n[cyan]App ID:[/cyan] {credentials['app_id']}"

        console.print(Panel.fit(deployment_text, border_style="green"))

        # Show login tip if deploying without a deploy key
        if result.custom_domain:
            from varitykit.services.gateway_client import get_deploy_key
            if not get_deploy_key():
                console.print("\n  [yellow]Tip:[/yellow] Run [bold]varitykit login[/bold] to protect your domain from being claimed by others.")

        console.print("="*60)

        # Next steps
        next_steps = "[cyan]What's next?[/cyan]\n"
        next_steps += "  Publish to App Store: use varity_submit_to_store (MCP tool)\n"
        next_steps += "  Read the docs:        https://docs.varity.so\n"
        next_steps += "  Get help:             https://discord.gg/7vWsdwa2Bg\n"
        next_steps += "  Report a bug:         https://github.com/varity-labs/varity-sdk/issues"
        console.print(Panel.fit(next_steps, border_style="cyan"))
        console.print()

        # Open deployment card in browser — the first thing the developer sees
        # The card page has share buttons (X, LinkedIn), download, and "Visit App"
        card_url = ""
        if result.custom_domain:
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

            subdomain = result.custom_domain.rstrip("/").split("/")[-1] if "/" in str(result.custom_domain) else ""
            if not subdomain:
                subdomain = app_name.lower().replace(" ", "-")
            card_url = f"https://varity.app/card/{subdomain}"

            import webbrowser
            console.print()
            console.print("  [bold magenta]Opening your deployment card...[/bold magenta]")
            console.print(f"  Share it on X, LinkedIn, or download the image.")
            console.print()
            try:
                webbrowser.open(card_url)
            except Exception:
                console.print(f"  [dim]Card: {card_url}[/dim]")

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
            # Cross-OS browser open:
            # 1. Python stdlib webbrowser.open — correct default for every OS
            #    (uses `open` on Mac, os.startfile on Windows, xdg-open on Linux)
            # 2. WSL needs a separate fallback because webbrowser.open silently
            #    fails inside WSL — wslview is the canonical WSL tool.
            browser_opened = False
            try:
                browser_opened = webbrowser.open(portal_url)
            except Exception:
                pass
            if not browser_opened and sys.platform == "linux":
                # WSL fallback — harmless no-op on native Linux if wslview missing
                try:
                    import subprocess as _sp
                    _sp.run(
                        ["wslview", portal_url],
                        capture_output=True,
                        timeout=5,
                        check=False,
                    )
                    browser_opened = True
                except (FileNotFoundError, OSError):
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
        # escape() prevents Rich from mis-parsing exception messages that contain
        # square brackets (e.g. OSError "[Errno 13]", MarkupError "Tag '[x]'").
        # Without this, a secondary MarkupError escapes the except block, so
        # click.Abort() is never reached, "Aborted!" never appears in stderr,
        # and the MCP tool falls through to DEPLOY_FAILED even when the deploy
        # actually succeeded before the post-deploy step failed.
        console.print(f"[red]Error: {escape(str(e))}[/red]\n")

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
    logger = (ctx.obj or {}).get("logger") or get_logger()

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
        table.add_column("Domain", style="green", no_wrap=True)
        table.add_column("Deployed", style="magenta")

        for dep in deployments:
            deployment_id = dep.get("deployment_id", "unknown")
            dep_network = dep.get("network", "unknown")

            # Extract deployment type — map internal "ipfs" to user-facing "static"
            raw_type = dep.get("deployment", {}).get("type", "static")
            if "deployment" not in dep and "ipfs" in dep:
                raw_type = "ipfs"
            deployment_type = "static" if raw_type == "ipfs" else raw_type

            # Extract frontend URL — prefer custom domain over raw storage gateway
            frontend_url = "N/A"
            custom_domain_url = dep.get("custom_domain", {}).get("url", "")
            if "deployment" in dep:
                if "frontend" in dep["deployment"]:
                    frontend_url = dep["deployment"]["frontend"].get("url", "N/A")
                elif "ipfs" in dep["deployment"]:
                    frontend_url = custom_domain_url or dep["deployment"]["ipfs"].get("gateway_url", "N/A")
            elif "ipfs" in dep:
                frontend_url = custom_domain_url or dep["ipfs"].get("gateway_url", "N/A")

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

            # Custom domain
            domain = dep.get("custom_domain", {}).get("url", "—")

            table.add_row(deployment_id, dep_network, deployment_type, frontend_url, domain, timestamp)

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
    URLs, build details, and status.

    \b
    Example:
      varitykit app info deploy-1737492000
    """
    logger = (ctx.obj or {}).get("logger") or get_logger()

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

        # Deployment URLs — "ipfs" is an internal type; surface it as "static"
        frontend_url = "N/A"
        backend_url = "N/A"
        deployment_type = "unknown"

        _custom_domain_url = deployment.get("custom_domain", {}).get("url", "")

        if "deployment" in deployment:
            raw_type = deployment["deployment"].get("type", "unknown")
            deployment_type = "static" if raw_type == "ipfs" else raw_type

            # Frontend
            if "frontend" in deployment["deployment"]:
                frontend_url = deployment["deployment"]["frontend"].get("url", "N/A")

            # Backend
            if "backend" in deployment["deployment"]:
                backend_url = deployment["deployment"]["backend"].get("url", "N/A")

            # Static (formerly ipfs) — prefer custom domain URL
            if "ipfs" in deployment["deployment"]:
                frontend_url = _custom_domain_url or deployment["deployment"]["ipfs"].get("gateway_url", "N/A")
        elif "ipfs" in deployment:
            deployment_type = "static"
            frontend_url = _custom_domain_url or deployment["ipfs"].get("gateway_url", "N/A")

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

[bold]App Store[/bold]
[cyan]Submitted:[/cyan] {'✅ Yes' if app_store_submitted else '❌ No'}
[cyan]App ID:[/cyan] {app_store_id}
[cyan]Status:[/cyan] {app_store_status}
[cyan]URL:[/cyan] {app_store_url}
"""

        # Add custom domain section if present
        custom_domain = deployment.get("custom_domain", {})
        if custom_domain:
            sub = custom_domain.get('subdomain', '')
            info_text += f"""
[bold]Custom Domain[/bold]
[cyan]Domain:[/cyan] varity.app/{sub or 'N/A'}
[cyan]URL:[/cyan] {custom_domain.get('url', 'N/A')}
"""
            if sub:
                info_text += f"[cyan]Card:[/cyan] https://varity.app/card/{sub}\n"

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
    logger = (ctx.obj or {}).get("logger") or get_logger()

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
    logger = (ctx.obj or {}).get("logger") or get_logger()

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
            raw_type = latest["deployment"].get("type", "unknown")
            deployment_type = "static" if raw_type == "ipfs" else raw_type

            if "frontend" in latest["deployment"]:
                frontend_url = latest["deployment"]["frontend"].get("url", "N/A")

            if "backend" in latest["deployment"]:
                backend_url = latest["deployment"]["backend"].get("url", "N/A")
        elif "ipfs" in latest:
            deployment_type = "static"
            # Prefer the custom domain URL; hide raw storage gateway URLs
            custom_domain = latest.get("custom_domain", {})
            if custom_domain.get("url"):
                frontend_url = custom_domain["url"]
            else:
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
