"""
Doctor command - environment validation for Varity developers
"""

import click
from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from varitykit.utils.validators import (
    EnvironmentValidator,
    NetworkValidator,
    SystemValidator,
)


@click.command()
@click.option("--fix", is_flag=True, help="Attempt to automatically fix issues")
@click.option("--full", is_flag=True, help="Run full diagnostics including all infrastructure checks")
@click.pass_context
def doctor(ctx, fix, full):
    """
    Check your development environment is ready.

    Validates that all required tools are installed and your environment
    is correctly configured for building and deploying Varity apps.

    \b
    Examples:
      varitykit doctor         # Quick environment check
      varitykit doctor --full  # Full check with infrastructure
    """
    console = Console()
    logger = ctx.obj["logger"]

    logger.info("Running environment diagnostics...")

    console.print(
        Panel.fit(
            "[bold cyan]Varity Environment Check[/bold cyan]\n"
            f"Validating your development setup...",
            border_style="cyan",
        )
    )

    # Create results table
    table = Table(
        title="Environment Check Results",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold magenta",
    )
    table.add_column("Category", style="cyan", width=22)
    table.add_column("Check", style="white", width=22)
    table.add_column("Status", width=12)
    table.add_column("Details", style="dim")

    all_passed = True
    warnings = []
    failures = []
    check_count = 0

    # ============================================================
    # CATEGORY 1: Required Tools
    # ============================================================
    console.print("\n[bold]1/4 Checking required tools...[/bold]")
    env_results = EnvironmentValidator.validate_environment()

    # Only check the tools web2 devs actually need
    required_tools = ["node", "npm", "git"]

    for tool, result in env_results.items():
        if tool not in required_tools and tool not in ("docker", "docker-compose", "python"):
            # Include any extra tools that might exist
            required_tools.append(tool)

    for tool in required_tools:
        if tool in env_results:
            result = env_results[tool]
            check_count += 1
            if result.passed:
                table.add_row(
                    "Required Tools", tool, "[green]✓ PASS[/green]", result.details or result.message
                )
            else:
                table.add_row(
                    "Required Tools", tool, "[red]✗ FAIL[/red]", result.details or result.message
                )
                all_passed = False
                failures.append(f"{tool}: {result.message}")

    # ============================================================
    # CATEGORY 2: System Resources
    # ============================================================
    console.print("[bold]2/4 Checking system resources...[/bold]")

    # Disk space
    disk_result = SystemValidator.check_disk_space(min_gb=5)
    check_count += 1
    if disk_result.passed:
        table.add_row(
            "System", "Disk Space", "[green]✓ PASS[/green]", disk_result.message
        )
    else:
        table.add_row(
            "System", "Disk Space", "[red]✗ FAIL[/red]",
            disk_result.details or disk_result.message,
        )
        all_passed = False
        failures.append(f"Disk Space: {disk_result.message}")

    # Memory
    memory_result = SystemValidator.check_memory(min_gb=2)
    check_count += 1
    if memory_result.passed:
        table.add_row(
            "System", "Memory", "[green]✓ PASS[/green]", memory_result.message
        )
    else:
        table.add_row(
            "System", "Memory", "[yellow]⚠ WARN[/yellow]",
            memory_result.details or memory_result.message,
        )
        warnings.append(f"Memory: {memory_result.message}")

    # ============================================================
    # CATEGORY 3: Project Configuration
    # ============================================================
    console.print("[bold]3/4 Checking project configuration...[/bold]")

    # varity.config.json
    config_result = SystemValidator.check_config_file()
    check_count += 1
    if config_result.passed:
        table.add_row(
            "Project", "varity.config.json", "[green]✓ PASS[/green]",
            config_result.details or config_result.message,
        )
    else:
        table.add_row(
            "Project", "varity.config.json", "[yellow]⚠ WARN[/yellow]",
            config_result.details or config_result.message,
        )
        warnings.append(f"Config: {config_result.message}")

    # .env file
    env_file_result = SystemValidator.check_env_file()
    check_count += 1
    if env_file_result.passed:
        table.add_row(
            "Project", ".env File", "[green]✓ PASS[/green]", env_file_result.message
        )
    else:
        table.add_row(
            "Project", ".env File", "[yellow]⚠ WARN[/yellow]",
            "Optional - shared dev credentials used by default",
        )
        warnings.append(f".env: Optional - shared dev credentials used by default")

    # ============================================================
    # CATEGORY 4: Network
    # ============================================================
    console.print("[bold]4/4 Checking network connectivity...[/bold]")
    network_result = NetworkValidator.check_internet_connection()
    check_count += 1

    if network_result.passed:
        table.add_row(
            "Network", "Internet", "[green]✓ PASS[/green]", "Connected"
        )
    else:
        table.add_row(
            "Network", "Internet", "[red]✗ FAIL[/red]",
            "Internet connection required for deployment",
        )
        all_passed = False
        failures.append(f"Internet: No connection detected")

    # ============================================================
    # FULL MODE: Infrastructure checks
    # ============================================================
    if full:
        console.print("\n[bold]Running infrastructure checks...[/bold]")

        # Check Varity deployment infrastructure
        infra_endpoints = {
            "Varity Hosting": "https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz",
        }

        for name, rpc_url in infra_endpoints.items():
            check_count += 1
            rpc_result = NetworkValidator.check_blockchain_rpc(rpc_url, name)

            if rpc_result.passed:
                table.add_row(
                    "Infrastructure", name, "[green]✓ PASS[/green]",
                    "Reachable",
                )
            else:
                table.add_row(
                    "Infrastructure", name, "[yellow]⚠ WARN[/yellow]",
                    "Not reachable - deployments may fail",
                )
                warnings.append(f"{name}: Not reachable")

        # Port checks
        ports = {3000: "Dev Server"}
        for port, description in ports.items():
            check_count += 1
            port_result = NetworkValidator.check_port_available(port)
            if port_result.passed:
                table.add_row(
                    "Infrastructure", f"Port {port} ({description})", "[green]✓ PASS[/green]", "Available"
                )
            else:
                table.add_row(
                    "Infrastructure", f"Port {port} ({description})", "[yellow]⚠ WARN[/yellow]", "In use"
                )
                warnings.append(f"Port {port}: In use")

    # ============================================================
    # Display Results
    # ============================================================
    console.print("\n")
    console.print(table)

    # Summary
    console.print(f"\n[bold]Total: {check_count} checks[/bold]")

    if failures:
        console.print(f"\n[bold red]Failed: {len(failures)}[/bold red]")
        for failure in failures:
            console.print(f"  [red]✗[/red] {failure}")

    if warnings:
        console.print(f"\n[bold yellow]Warnings: {len(warnings)}[/bold yellow]")
        for warning in warnings[:5]:
            console.print(f"  [yellow]⚠[/yellow] {warning}")
        if len(warnings) > 5:
            console.print(f"  [dim]... and {len(warnings) - 5} more[/dim]")

    # Final summary
    if all_passed:
        console.print("\n")
        console.print(
            Panel.fit(
                "[bold green]✓ All checks passed![/bold green]\n"
                "Your environment is ready. Run [bold]varitykit app deploy[/bold] to deploy your app.",
                border_style="green",
            )
        )
        logger.info(f"Environment check passed ({check_count} checks)")
        ctx.exit(0)
    else:
        console.print("\n")
        console.print(
            Panel.fit(
                f"[bold red]✗ {len(failures)} checks failed[/bold red]\n"
                "Please fix the issues above and run [bold]varitykit doctor[/bold] again.",
                border_style="red",
            )
        )

        # Installation help
        failed_tools = [tool for tool in required_tools if tool in env_results and not env_results[tool].passed]

        if failed_tools:
            console.print("\n[bold]How to fix:[/bold]\n")
            if "node" in failed_tools or "npm" in failed_tools:
                console.print("  [cyan]Node.js:[/cyan] https://nodejs.org/ (v18 or higher)")
            if "git" in failed_tools:
                console.print("  [cyan]Git:[/cyan] https://git-scm.com/downloads")
            console.print()

        if fix:
            console.print("[yellow]Auto-fix is not yet available.[/yellow]\n")

        logger.error(f"Environment check failed ({len(failures)} failures)")
        ctx.exit(1)
