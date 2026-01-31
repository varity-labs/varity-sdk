# Integration Guide for Other Agents

**For**: Agents 2, 3, and 4
**From**: Agent 1
**Date**: January 21, 2026

This guide shows how to integrate with the ProjectDetector and BuildManager components completed on Day 1.

---

## Quick Start

```python
from varietykit.core import ProjectDetector, BuildManager

# Step 1: Detect project
detector = ProjectDetector()
project_info = detector.detect('/path/to/project')

# Step 2: Build project
manager = BuildManager()
artifacts = manager.build(
    project_path='/path/to/project',
    build_command=project_info.build_command,
    output_dir=project_info.output_dir
)

# Step 3: Use artifacts (your code here)
print(f"Build artifacts in: {artifacts.output_dir}")
print(f"Total files: {len(artifacts.files)}")
print(f"Size: {artifacts.total_size_mb:.2f} MB")
```

---

## For Agent 2 (IPFSUploader)

### Your Task
Upload build artifacts to IPFS using thirdweb Storage.

### Integration Points

```python
from varietykit.core import BuildArtifacts

class IPFSUploader:
    """Your IPFS uploader implementation"""

    def upload(self, artifacts: BuildArtifacts) -> dict:
        """
        Upload build artifacts to IPFS.

        Args:
            artifacts: BuildArtifacts from BuildManager

        Returns:
            dict with:
                - cid: IPFS Content Identifier
                - gateway_url: IPFS gateway URL
                - thirdweb_url: thirdweb CDN URL
                - total_size: Total bytes uploaded
                - file_count: Number of files
        """
        # Get build directory
        build_dir = artifacts.output_dir

        # Get list of files
        files = artifacts.files  # List of relative paths

        # Call your Node.js script
        result = self._call_upload_script(build_dir)

        return result
```

### What You Get

From `BuildArtifacts`:
- `output_dir` (str) - Absolute path to build directory
- `files` (List[str]) - Relative paths from output_dir
- `entrypoint` (str) - Main file (index.html)
- `total_size_mb` (float) - Total size in MB
- `success` (bool) - Build succeeded

### What You Return

```python
{
    'cid': 'QmXoYPZzD4VWJ8G5h5vB9JgK...',
    'gateway_url': 'https://ipfs.io/ipfs/QmXoY...',
    'thirdweb_url': 'https://QmXoY....ipfscdn.io',
    'total_size': 2621440,  # bytes
    'file_count': 42
}
```

---

## For Agent 3 (DeploymentOrchestrator)

### Your Task
Coordinate all deployment steps from detection to upload to metadata storage.

### Integration Points

```python
from varietykit.core import ProjectDetector, BuildManager
from varietykit.core.types import DeploymentResult

class DeploymentOrchestrator:
    """Your orchestrator implementation"""

    def __init__(self):
        self.detector = ProjectDetector()
        self.builder = BuildManager()
        # self.uploader will come from Agent 2

    def deploy(self, project_path: str, network: str) -> DeploymentResult:
        """
        Execute complete deployment workflow.

        Args:
            project_path: Path to project
            network: Target network (e.g., 'varity')

        Returns:
            DeploymentResult with all URLs and metadata
        """
        # Step 1: Detect project
        print("📦 Detecting project type...")
        project_info = self.detector.detect(project_path)
        print(f"   Detected: {project_info.project_type}")

        # Step 2: Build
        print("🔨 Building project...")
        artifacts = self.builder.build(
            project_path=project_path,
            build_command=project_info.build_command,
            output_dir=project_info.output_dir
        )
        print(f"   Built {len(artifacts.files)} files ({artifacts.total_size_mb:.2f} MB)")

        # Step 3: Upload (Agent 2's code)
        print("☁️  Uploading to IPFS...")
        ipfs_result = self.uploader.upload(artifacts)
        print(f"   CID: {ipfs_result['cid']}")

        # Step 4: Create manifest
        manifest = self._create_manifest(project_info, artifacts, ipfs_result)

        # Step 5: Save deployment
        self._save_deployment(manifest)

        # Step 6: Return result
        return DeploymentResult(
            deployment_id=manifest['deployment_id'],
            frontend_url=ipfs_result['gateway_url'],
            thirdweb_url=ipfs_result['thirdweb_url'],
            cid=ipfs_result['cid'],
            app_store_url=None,  # Phase 2
            manifest=manifest
        )
```

### Error Handling

```python
from varietykit.core.types import (
    ProjectDetectionError,
    BuildError,
    IPFSUploadError,
    DeploymentError
)

try:
    result = orchestrator.deploy(project_path, network)
except ProjectDetectionError as e:
    print(f"Could not detect project: {e}")
    # Suggest supported types
except BuildError as e:
    print(f"Build failed: {e}")
    # Check build logs
except IPFSUploadError as e:
    print(f"Upload failed: {e}")
    # Check THIRDWEB_CLIENT_ID
except DeploymentError as e:
    print(f"Deployment failed: {e}")
```

---

## For Agent 4 (CLI Command)

### Your Task
Create `varietykit app deploy` command that uses the orchestrator.

### Integration Points

```python
import click
from varietykit.core import DeploymentOrchestrator
from varietykit.core.types import DeploymentError

@click.group()
def app():
    """Deploy and manage applications"""
    pass

@app.command()
@click.option('--network', '-n', default='varity')
@click.option('--submit-to-store', is_flag=True)
def deploy(network, submit_to_store):
    """
    Deploy application to decentralized infrastructure.

    Examples:
        varietykit app deploy
        varietykit app deploy --network varity --submit-to-store
    """
    from rich.console import Console
    from rich.table import Table

    console = Console()

    # Initialize orchestrator (Agent 3's code)
    orchestrator = DeploymentOrchestrator()

    try:
        # Deploy
        console.print("[bold]🚀 Starting deployment...[/bold]\n")

        result = orchestrator.deploy(
            project_path='.',
            network=network
        )

        # Display results
        console.print("[bold green]✅ Deployment Successful![/bold green]\n")

        table = Table(title="Deployment Results")
        table.add_column("Component", style="cyan")
        table.add_column("URL", style="yellow")

        table.add_row("Frontend", result.frontend_url)
        table.add_row("IPFS CID", result.cid)
        table.add_row("thirdweb CDN", result.thirdweb_url)

        console.print(table)
        console.print(f"\n[dim]Deployment ID: {result.deployment_id}[/dim]")

    except DeploymentError as e:
        console.print(f"[bold red]✗ Deployment failed: {e}[/bold red]")
        raise click.Abort()
```

---

## Data Flow Diagram

```
User runs: varietykit app deploy
        ↓
   [Agent 4: CLI Command]
        ↓
   [Agent 3: DeploymentOrchestrator]
        ↓
        ├─→ [Agent 1: ProjectDetector.detect()]
        │       └─→ Returns ProjectInfo
        │
        ├─→ [Agent 1: BuildManager.build()]
        │       └─→ Returns BuildArtifacts
        │
        └─→ [Agent 2: IPFSUploader.upload()]
                └─→ Returns IPFS result
```

---

## Testing Your Integration

```python
# Mock Agent 1 components for your tests
from unittest.mock import Mock
from varietykit.core.types import ProjectInfo, BuildArtifacts

# Mock detector
mock_detector = Mock()
mock_detector.detect.return_value = ProjectInfo(
    project_type='nextjs',
    framework_version='14.0.0',
    build_command='npm run build',
    output_dir='out',
    package_manager='npm',
    has_backend=False
)

# Mock builder
mock_builder = Mock()
mock_builder.build.return_value = BuildArtifacts(
    success=True,
    output_dir='/tmp/project/out',
    files=['index.html', 'styles.css'],
    entrypoint='index.html',
    total_size_mb=2.5,
    build_time_seconds=15.3
)

# Use in your tests
orchestrator = DeploymentOrchestrator()
orchestrator.detector = mock_detector
orchestrator.builder = mock_builder

result = orchestrator.deploy('.', 'varity')
```

---

## Common Patterns

### Pattern 1: Progress Tracking

```python
print("📦 Detecting project type...")
project_info = detector.detect(project_path)
print(f"   ✓ Detected: {project_info.project_type}")

print("🔨 Building project...")
artifacts = builder.build(...)
print(f"   ✓ Built {len(artifacts.files)} files")

print("☁️  Uploading to IPFS...")
result = uploader.upload(artifacts)
print(f"   ✓ Uploaded to {result['cid']}")
```

### Pattern 2: Size Validation

```python
artifacts = builder.build(...)

# Warn if build is large
if artifacts.total_size_mb > 100:
    print(f"⚠️  Warning: Build is large ({artifacts.total_size_mb:.1f} MB)")
    print("   Consider optimizing assets")

# Reject if too large for free tier
if artifacts.total_size_mb > 500:
    raise DeploymentError("Build exceeds 500 MB limit")
```

### Pattern 3: Manifest Creation

```python
import time

manifest = {
    'version': '1.0',
    'deployment_id': f"deploy-{int(time.time())}",
    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
    'network': network,
    'project': {
        'type': project_info.project_type,
        'framework_version': project_info.framework_version,
        'build_command': project_info.build_command,
        'package_manager': project_info.package_manager
    },
    'build': {
        'success': artifacts.success,
        'files': len(artifacts.files),
        'size_mb': artifacts.total_size_mb,
        'time_seconds': artifacts.build_time_seconds,
        'output_dir': artifacts.output_dir
    },
    'ipfs': {
        'cid': ipfs_result['cid'],
        'gateway_url': ipfs_result['gateway_url'],
        'thirdweb_url': ipfs_result['thirdweb_url']
    }
}
```

---

## Questions?

If you need clarification or have integration questions:

1. Check the README: `varietykit/core/README.md`
2. Check the completion report: `varietykit/core/DAY_1_COMPLETION_REPORT.md`
3. Look at test examples: `varietykit/tests/test_*.py`
4. Refer to architecture spec: `/claude/.planning/APP_DEPLOYMENT_SYSTEM/ARCHITECTURE_SPEC.md`

---

**Status**: ✅ Day 1 Complete - Ready for Integration
**Next**: Agents 2, 3, 4 can start immediately
