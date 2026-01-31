"""
Application deployment commands for VarityKit

Deploy Web3 applications to decentralized infrastructure with one command.
"""

from pathlib import Path

import click
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()


@click.group()
def app():
    """
    Deploy and manage applications

    Deploy Web3 applications to decentralized infrastructure with one command.

    \b
    Features:
    • Frontend deployment to IPFS
    • Backend deployment to Akash (Phase 2)
    • Smart contract deployment
    • Auto-submission to Varity App Store (Phase 2)

    \b
    Quick Start:
      varietykit app deploy               # Deploy current directory
      varietykit app deploy --path ./my-app
      varietykit app list                 # List deployments
    """
    pass


@app.command()
@click.option(
    "--network",
    default="varity",
    help="Network to deploy to (default: varity)",
    type=click.Choice(["varity", "arbitrum", "base"], case_sensitive=False),
)
@click.option(
    "--submit-to-store", is_flag=True, help="Auto-submit to Varity App Store (Phase 2 feature)"
)
@click.option(
    "--path",
    default=".",
    help="Project directory (default: current directory)",
    type=click.Path(exists=True),
)
@click.pass_context
def deploy(ctx, network, submit_to_store, path):
    """
    Deploy application to decentralized infrastructure.

    This command will:
    1. Detect your project type (Next.js, React, Vue)
    2. Build your application
    3. Upload to IPFS via thirdweb Storage
    4. Return deployment URL

    \b
    Phase 1 (Current): IPFS deployment for frontend apps
    Phase 2 (Coming): Akash deployment + App Store submission

    \b
    Examples:
      # Deploy current directory
      varietykit app deploy

      # Deploy specific directory
      varietykit app deploy --path ./my-app

      # Deploy and submit to App Store (Phase 2)
      varietykit app deploy --submit-to-store

    \b
    Supported Frameworks:
      • Next.js 13+ (App Router with static export)
      • React 18+ (Create React App, Vite)
      • Vue 3+

    \b
    Before Deploying:
      1. Make sure THIRDWEB_CLIENT_ID is set:
         export THIRDWEB_CLIENT_ID=your_client_id
         Get one at: https://thirdweb.com/dashboard

      2. Ensure your app builds successfully:
         npm run build
    """
    logger = ctx.obj["logger"]

    try:
        # Show banner
        console.print(
            Panel.fit(
                "[bold blue]Varity App Deployment[/bold blue]\n"
                "Deploy to decentralized infrastructure (IPFS + Akash)",
                border_style="blue",
            )
        )

        # Show Phase 2 warning if --submit-to-store is used
        if submit_to_store:
            console.print("\n[yellow]⚠️  Note: --submit-to-store is a Phase 2 feature[/yellow]")
            console.print("   Manual submission available at: https://store.varity.so/submit\n")

        # Convert path to absolute
        project_path = Path(path).resolve()
        console.print(f"\n[cyan]Project:[/cyan] {project_path}")
        console.print(f"[cyan]Network:[/cyan] {network}\n")

        # Import and use DeploymentOrchestrator
        from varietykit.core.deployment_orchestrator import DeploymentOrchestrator

        orchestrator = DeploymentOrchestrator(verbose=False)  # We'll handle output ourselves

        # Execute deployment
        result = orchestrator.deploy(
            project_path=str(project_path), network=network, submit_to_store=submit_to_store
        )

        # Display success
        console.print("\n[bold green]✅ Deployment Successful![/bold green]\n")
        console.print(
            Panel.fit(
                f"[bold cyan]Deployment URLs[/bold cyan]\n\n"
                f"[cyan]Frontend URL:[/cyan] {result.frontend_url}\n"
                f"[cyan]thirdweb CDN:[/cyan] {result.thirdweb_url}\n"
                f"[cyan]IPFS CID:[/cyan] {result.cid}\n"
                f"[cyan]Deployment ID:[/cyan] {result.deployment_id}\n\n"
                f"[dim]Gateway: https://ipfs.io/ipfs/{result.cid}[/dim]",
                border_style="green",
            )
        )

        if submit_to_store and result.app_store_url:
            console.print(f"\n[cyan]App Store:[/cyan] {result.app_store_url}\n")

        logger.info(f"Deployment successful: {result.deployment_id}")

    except Exception as e:
        console.print(f"\n[bold red]❌ Deployment Failed[/bold red]")
        console.print(f"[red]Error: {str(e)}[/red]\n")

        # Show helpful error messages
        error_str = str(e).lower()
        if "build" in error_str:
            console.print("[yellow]💡 Tip: Try running your build command manually first[/yellow]")
            console.print("   Example: npm run build\n")
        elif "ipfs" in error_str or "thirdweb" in error_str:
            console.print("[yellow]💡 Tip: Check THIRDWEB_CLIENT_ID is set[/yellow]")
            console.print("   Get one at: https://thirdweb.com/dashboard\n")

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
      varietykit app list
      varietykit app list --network varity
      varietykit app list --limit 20
    """
    logger = ctx.obj["logger"]

    try:
        from rich.table import Table
        from varietykit.core.deployment_history import DeploymentHistory

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
      varietykit app info deploy-1737492000
    """
    logger = ctx.obj["logger"]

    try:
        from varietykit.core.deployment_history import DeploymentHistory

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
[cyan]Frontend:[/cyan] {frontend_url}
[cyan]Backend:[/cyan] {backend_url}
[cyan]thirdweb CDN:[/cyan] {thirdweb_url}
[cyan]IPFS Gateway:[/cyan] {ipfs_gateway}

[bold]IPFS[/bold]
[cyan]CID:[/cyan] {ipfs_cid}

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
      varietykit app rollback deploy-1737492000
      varietykit app rollback deploy-1737492000 --confirm
    """
    logger = ctx.obj["logger"]

    try:
        from varietykit.core.deployment_history import DeploymentHistory

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
                f"[cyan]IPFS CID:[/cyan] {new_deployment.cid}\n\n"
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
      varietykit app status
      varietykit app status --network varity
    """
    logger = ctx.obj["logger"]

    try:
        from varietykit.core.deployment_history import DeploymentHistory

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
        console.print(f"[dim]Use 'varietykit app list' to see all deployments[/dim]\n")

        logger.info(f"Retrieved deployment status: {deployment_id}")

    except Exception as e:
        console.print(f"\n[red]Error retrieving status: {str(e)}[/red]\n")
        logger.error(f"Failed to get deployment status: {e}")
        raise click.Abort()
