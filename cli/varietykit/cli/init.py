"""
Init command - scaffolds new project from template using AI Configuration Engine
"""

import shutil
from pathlib import Path

import click
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.prompt import Confirm, Prompt
from varietykit.core.config import ConfigManager, Environment
from varietykit.core.templates import TemplateManager
from varietykit.utils.validators import ConfigValidator


def _setup_github_workflow(console: Console) -> bool:
    """
    Create GitHub Actions workflow for Akash deployment.

    Copies the varity-deploy.yml template to .github/workflows/

    Returns:
        True if successful, False otherwise
    """
    # Create workflow directory
    workflow_dir = Path('.github/workflows')
    workflow_dir.mkdir(parents=True, exist_ok=True)

    workflow_path = workflow_dir / 'varity-deploy.yml'

    # Get template path
    template_path = Path(__file__).parent.parent / 'templates' / 'github-actions' / 'varity-deploy.yml'

    if not template_path.exists():
        console.print(f"[red]Template not found: {template_path}[/red]")
        return False

    # Copy template
    shutil.copy(template_path, workflow_path)

    console.print("[green]Created .github/workflows/varity-deploy.yml[/green]")
    console.print("")
    console.print("[bold]Required GitHub Secrets:[/bold]")
    console.print("  Add these secrets to your repository (Settings > Secrets > Actions):")
    console.print("")
    console.print("  [cyan]AKASH_CONSOLE_API_KEY[/cyan]")
    console.print("    Get from: console.akash.network > Settings > API Keys")
    console.print("")
    console.print("  [cyan]GHCR_TOKEN[/cyan]")
    console.print("    GitHub PAT with write:packages scope")
    console.print("    Create at: github.com > Settings > Developer Settings > Personal access tokens")
    console.print("")
    console.print("[bold]Next steps:[/bold]")
    console.print("  1. Add the secrets above to your GitHub repository")
    console.print("  2. Commit and push the workflow file:")
    console.print("     [dim]git add .github/workflows/varity-deploy.yml[/dim]")
    console.print("     [dim]git commit -m 'Add Varity deployment workflow'[/dim]")
    console.print("     [dim]git push origin main[/dim]")
    console.print("")
    console.print("  [green]On push to main, your app will automatically deploy to Akash![/green]")

    return True


@click.command()
@click.argument("project_name", required=False)
@click.option(
    "--template",
    "-t",
    type=click.Choice(
        ["saas-starter"], case_sensitive=False
    ),
    help="Template to use (default: saas-starter)",
)
@click.option("--path", "-p", type=click.Path(), help="Path where project should be created")
@click.option("--yes", "-y", is_flag=True, help="Skip confirmation prompts")
@click.option("--github", is_flag=True, help="Add GitHub Actions workflow for Akash deployment")
@click.pass_context
def init(ctx, project_name, template, path, yes, github):
    """
    Initialize a new Varity project

    Creates a new project from a template with AI-powered configuration.

    Examples:
        varietykit init my-app
        varietykit init --template saas-starter --path ./projects/my-app
        varietykit init  (interactive mode)
        varietykit init --github  (add GitHub Actions deployment workflow)
    """
    console = Console()
    logger = ctx.obj["logger"]

    # Handle --github flag (standalone mode)
    if github:
        console.print(
            Panel.fit(
                "[bold cyan]VarityKit GitHub Actions Setup[/bold cyan]\n"
                "Setting up automated Akash deployment...",
                border_style="cyan",
            )
        )
        console.print("")

        success = _setup_github_workflow(console)
        if success:
            logger.info("GitHub Actions workflow created successfully")
            ctx.exit(0)
        else:
            logger.error("Failed to create GitHub Actions workflow")
            ctx.exit(1)
        return

    console.print(
        Panel.fit(
            "[bold cyan]VarityKit Project Initializer[/bold cyan]\n"
            "Let's create your new application!",
            border_style="cyan",
        )
    )

    # Interactive mode if no project name provided
    if not project_name:
        console.print("\n[bold]Project Configuration[/bold]\n")
        project_name = Prompt.ask("Project name", default="my-varity-app")

    # Validate project name
    validation = ConfigValidator.validate_project_name(project_name)
    if not validation.passed:
        console.print(f"[red]✗ {validation.message}[/red]")
        if validation.details:
            console.print(f"[dim]{validation.details}[/dim]")
        ctx.exit(1)

    # Determine project path
    if path:
        project_path = Path(path).resolve()
    else:
        project_path = Path.cwd() / project_name

    # Validate directory
    dir_validation = ConfigValidator.validate_directory_empty(project_path)
    if not dir_validation.passed:
        if not yes:
            should_continue = Confirm.ask(
                f"[yellow]{dir_validation.message}[/yellow]\nContinue anyway?"
            )
            if not should_continue:
                console.print("[dim]Initialization cancelled.[/dim]")
                ctx.exit(0)

    # Select template (interactive if not provided)
    if not template:
        console.print("\n[bold]Select Template[/bold]\n")

        template_manager = TemplateManager()
        templates = template_manager.list_templates()

        # Display template options
        for i, tmpl in enumerate(templates, 1):
            console.print(f"  {i}. [cyan]{tmpl.name}[/cyan] - {tmpl.description}")

        template_choice = Prompt.ask(
            "\nChoose template", choices=[str(i) for i in range(1, len(templates) + 1)], default="1"
        )

        selected_template = templates[int(template_choice) - 1]
        template = selected_template.industry
    else:
        # Normalize template name
        template = template.lower()

    # Gather additional context
    console.print("\n[bold]Additional Configuration[/bold]\n")

    company_name = Prompt.ask("Company name", default=project_name.replace("-", " ").title())

    # Ask for features (simplified for now)
    context = {
        "company_name": company_name,
        "project_name": project_name,
        "project_slug": project_name.lower().replace(" ", "-"),
        "industry": template,
    }

    # Show summary
    console.print("\n[bold]Project Summary[/bold]\n")
    console.print(f"  [cyan]Project Name:[/cyan] {project_name}")
    console.print(f"  [cyan]Company Name:[/cyan] {company_name}")
    console.print(f"  [cyan]Template:[/cyan] {template}")
    console.print(f"  [cyan]Path:[/cyan] {project_path}")

    if not yes:
        should_create = Confirm.ask("\n[bold]Create project?[/bold]", default=True)
        if not should_create:
            console.print("[dim]Initialization cancelled.[/dim]")
            ctx.exit(0)

    # Create project
    logger.info(f"Creating project '{project_name}' at {project_path}")

    try:
        with Progress(
            SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console
        ) as progress:
            # Scaffold from template
            task = progress.add_task("Scaffolding project from template...", total=None)

            template_manager = TemplateManager()
            template_manager.scaffold_project(
                template_name=template,
                project_path=project_path,
                project_name=project_name,
                context=context,
            )

            progress.update(task, completed=True)

            # Create configuration
            task = progress.add_task("Creating configuration...", total=None)

            config_manager = ConfigManager()
            config = config_manager.create_project_config(
                project_name=project_name,
                project_path=project_path,
                environment=Environment.DEVELOPMENT,
            )

            # Save config to project directory
            config_path = project_path / ".varietykit.toml"
            config_manager.save_config(config, config_path)

            progress.update(task, completed=True)

            # Create .varity directory for local data
            task = progress.add_task("Setting up project structure...", total=None)

            varity_dir = project_path / ".varity"
            varity_dir.mkdir(exist_ok=True)

            # Create subdirectories
            (varity_dir / "cache").mkdir(exist_ok=True)
            (varity_dir / "logs").mkdir(exist_ok=True)
            (varity_dir / "data").mkdir(exist_ok=True)

            # Create .gitignore for .varity
            gitignore_path = varity_dir / ".gitignore"
            gitignore_path.write_text(
                "# VarityKit local data\n" "cache/\n" "logs/\n" "*.log\n" ".env.local\n"
            )

            progress.update(task, completed=True)

        # Success message
        console.print("\n")
        console.print(
            Panel.fit(
                f"[bold green]✓ Project created successfully![/bold green]\n\n"
                f"[cyan]Next steps:[/cyan]\n"
                f"  1. cd {project_path.name}\n"
                f"  2. varietykit bootstrap\n"
                f"  3. varietykit dev\n\n"
                f"[dim]For more information: varietykit --help[/dim]",
                border_style="green",
            )
        )

        logger.info(f"Project '{project_name}' created successfully at {project_path}")

    except Exception as e:
        console.print(f"\n[red]✗ Failed to create project: {e}[/red]")
        logger.error(f"Failed to create project: {e}")
        ctx.exit(1)
