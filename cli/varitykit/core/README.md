# Varity Core Deployment System

**Phase 1 Day 1 Implementation - Foundation Components**

This directory contains the core components for the Varity deployment system.

## Components

### 1. ProjectDetector

**File**: `project_detector.py`

Detects project type by analyzing files in the project directory.

**Supported Project Types**:
- Next.js (static export and SSR)
- React (Create React App and Vite)
- Vue.js
- Node.js backend (Express, Fastify)
- Python backend

**Usage**:
```python
from varietykit.core import ProjectDetector

detector = ProjectDetector()
project_info = detector.detect('/path/to/project')

print(f"Type: {project_info.project_type}")
print(f"Build command: {project_info.build_command}")
print(f"Output directory: {project_info.output_dir}")
print(f"Package manager: {project_info.package_manager}")
```

**Detection Logic**:
- Reads `package.json` to identify dependencies
- Checks for framework-specific files (next.config.js, etc.)
- Detects package manager (npm, pnpm, yarn) from lockfiles
- Identifies build output directory based on framework
- Detects backend presence (server/ directory)

### 2. BuildManager

**File**: `build_manager.py`

Executes build commands and collects artifacts.

**Features**:
- Runs build command with real-time output streaming
- Collects all files from build directory
- Calculates total build size
- Measures build time
- Handles build failures gracefully
- Tries alternative output directories

**Usage**:
```python
from varietykit.core import BuildManager, ProjectDetector

# Detect project
detector = ProjectDetector()
project_info = detector.detect('/path/to/project')

# Build project
manager = BuildManager()
artifacts = manager.build(
    project_path='/path/to/project',
    build_command=project_info.build_command,
    output_dir=project_info.output_dir
)

print(f"Build succeeded: {artifacts.success}")
print(f"Files collected: {len(artifacts.files)}")
print(f"Total size: {artifacts.total_size_mb:.2f} MB")
print(f"Build time: {artifacts.build_time_seconds:.1f}s")
```

**Error Handling**:
- Missing build directory → Tries alternatives (build, dist, out)
- Empty build directory → Clear error message
- Build command fails → Shows exit code and output
- Invalid command → Helpful error message

### 3. Data Types

**File**: `types.py`

Core data structures used throughout the deployment system.

**Classes**:
- `ProjectInfo` - Project detection results
- `BuildArtifacts` - Build output details
- `DeploymentOptions` - Deployment configuration
- `DeploymentResult` - Complete deployment result

**Error Classes**:
- `DeploymentError` - Base deployment error
- `ProjectDetectionError` - Project detection failed
- `BuildError` - Build failed
- `IPFSUploadError` - IPFS upload failed

## Testing

Run tests with pytest:

```bash
# Test project detection
pytest varietykit/tests/test_project_detector.py -v

# Test build manager
pytest varietykit/tests/test_build_manager.py -v

# Run all tests
pytest varietykit/tests/ -v
```

## Example Workflow

Complete workflow from detection to build:

```python
from varietykit.core import ProjectDetector, BuildManager

# 1. Detect project type
detector = ProjectDetector()
project_info = detector.detect('.')

print(f"Detected {project_info.project_type} project")
print(f"Will use: {project_info.build_command}")

# 2. Build project
manager = BuildManager()
artifacts = manager.build(
    project_path='.',
    build_command=project_info.build_command,
    output_dir=project_info.output_dir
)

# 3. Use artifacts for deployment
print(f"\nBuild complete!")
print(f"  Files: {len(artifacts.files)}")
print(f"  Size: {artifacts.total_size_mb:.2f} MB")
print(f"  Time: {artifacts.build_time_seconds:.1f}s")
print(f"  Entrypoint: {artifacts.entrypoint}")

# Next: Upload to IPFS (Agent 2)
```

## Integration with Deployment System

These components are the foundation for the full deployment orchestrator:

```
ProjectDetector → BuildManager → IPFSUploader → DeploymentOrchestrator
     (Agent 1)       (Agent 1)      (Agent 2)         (Agent 3)
```

## Real Project Testing

Test with the actual generic-template-dashboard:

```bash
cd /home/macoding/varity-workspace/varity-sdk/apps/generic-template-dashboard
python3 -c "
from varietykit.core import ProjectDetector, BuildManager

# Detect
detector = ProjectDetector()
info = detector.detect('.')
print(f'Detected: {info.project_type}')
print(f'Command: {info.build_command}')
print(f'Output: {info.output_dir}')

# Note: Don't actually build (would take time)
# Just verify detection works
"
```

## Success Criteria

**ProjectDetector**:
- ✅ Detects Next.js, React, Vue projects
- ✅ Identifies build command and output directory
- ✅ Detects package manager
- ✅ Handles backend detection
- ✅ Clear error messages

**BuildManager**:
- ✅ Executes build commands
- ✅ Streams output in real-time
- ✅ Collects all build artifacts
- ✅ Calculates sizes and timing
- ✅ Handles errors gracefully

**Tests**:
- ✅ Comprehensive unit tests
- ✅ Integration tests with real project
- ✅ Error case coverage

## Next Steps

After Day 1 completion:
1. **Day 2**: IPFSUploader (Agent 2) - Upload artifacts to IPFS
2. **Day 3**: DeploymentOrchestrator (Agent 3) - Coordinate full flow
3. **Day 4**: CLI Command (Agent 4) - `varietykit app deploy`

## Notes

- All file paths are absolute (no relative paths)
- Build output is streamed in real-time for user feedback
- Error messages are clear and actionable
- Components are fully testable in isolation
- Designed to integrate with other agents' work

---

## 4. DeploymentOrchestrator (Agent 3)

**File**: `deployment_orchestrator.py`

**Phase 1 Day 3 Implementation - Orchestration Layer**

Coordinates all deployment steps from project detection to IPFS upload to metadata storage.

### Features

- Orchestrates complete deployment workflow
- Coordinates Agent 1 (ProjectDetector, BuildManager) and Agent 2 (IPFSUploader)
- Creates deployment manifests
- Saves deployment metadata locally
- Retrieves and lists past deployments
- Handles all error cases gracefully

### Usage

```python
from varietykit.core import DeploymentOrchestrator

# Create orchestrator
orchestrator = DeploymentOrchestrator(verbose=True)

# Deploy project
result = orchestrator.deploy(
    project_path=".",
    network="varity",
    submit_to_store=False  # Phase 2
)

# Access deployment URLs
print(f"Frontend URL: {result.frontend_url}")
print(f"IPFS CID: {result.cid}")
print(f"Deployment ID: {result.deployment_id}")
```

### Deployment Workflow

The orchestrator executes the following steps:

```
1. Detect project type (ProjectDetector - Agent 1)
   ↓
2. Build project (BuildManager - Agent 1)
   ↓
3. Upload to IPFS (IPFSUploader - Agent 2)
   ↓
4. Create deployment manifest
   ↓
5. Save metadata to ~/.varietykit/deployments/
   ↓
6. Return DeploymentResult
```

### Deployment Metadata

Deployments are saved to `~/.varietykit/deployments/` as JSON files:

```json
{
  "version": "1.0",
  "deployment_id": "deploy-1737492000",
  "timestamp": "2026-01-22T10:00:00Z",
  "network": "varity",
  "project": {
    "type": "nextjs",
    "framework_version": "14.0.0",
    "build_command": "npm run build",
    "package_manager": "npm"
  },
  "build": {
    "success": true,
    "files": 42,
    "size_mb": 2.5,
    "time_seconds": 15.3,
    "output_dir": "out"
  },
  "ipfs": {
    "cid": "QmXoY...",
    "gateway_url": "https://ipfs.io/ipfs/QmXoY...",
    "thirdweb_url": "https://QmXoY....ipfscdn.io",
    "total_size": 2621440,
    "file_count": 42
  }
}
```

### Querying Deployments

```python
# Get specific deployment
manifest = orchestrator.get_deployment('deploy-1737492000')

# List all deployments
deployments = orchestrator.list_deployments()

# Filter by network
varity_deployments = orchestrator.list_deployments(network='varity')
```

### Error Handling

The orchestrator provides clear error handling for all failure scenarios:

```python
from varietykit.core import (
    ProjectDetectionError,
    BuildError,
    IPFSUploadError,
    DeploymentError
)

try:
    result = orchestrator.deploy()
except ProjectDetectionError as e:
    print(f"Could not detect project type: {e}")
    print("Supported: Next.js, React, Vue")
except BuildError as e:
    print(f"Build failed: {e}")
    print("Try running build manually first")
except IPFSUploadError as e:
    print(f"IPFS upload failed: {e}")
    print("Check THIRDWEB_CLIENT_ID is set")
except DeploymentError as e:
    print(f"Deployment failed: {e}")
```

### Agent Integration

The orchestrator uses lazy loading for agent dependencies:

```python
# Properties that lazy load when accessed
@property
def detector(self):
    """Lazy load ProjectDetector (Agent 1)"""

@property
def builder(self):
    """Lazy load BuildManager (Agent 1)"""

@property
def ipfs(self):
    """Lazy load IPFSUploader (Agent 2)"""
```

This allows the orchestrator to be implemented and tested before Agent 1 and Agent 2 are complete.

### Testing

**Location**: `tests/unit/test_deployment_orchestrator.py`

```bash
# Run orchestrator tests
pytest tests/unit/test_deployment_orchestrator.py -v
```

**Test Coverage**:
- ✅ Manifest creation
- ✅ Deployment metadata saving/loading
- ✅ Listing and filtering deployments
- ✅ Full deployment flow (with mocks)
- ✅ Error handling for all failure cases
- ✅ DeploymentResult string representation
- ✅ Metadata persistence

### Example Output

```
🚀 Starting deployment...
📦 Detecting project type...
   Detected: nextjs
🔨 Building project (npm run build)...
   Built 42 files (2.50 MB)
☁️  Uploading to IPFS...
   CID: QmXoYPZzD4VWJ8G5h5vB9JgK4VWJ8G5h5vB9JgK4VWJ8G5
   URL: https://ipfs.io/ipfs/QmXoY...
   Saved deployment metadata to: ~/.varietykit/deployments/deploy-1737492000.json
✅ Deployment complete!

   🌐 Your app: https://ipfs.io/ipfs/QmXoY...
   📋 Deployment ID: deploy-1737492000
```

### Phase 2 Extensions

Future enhancements for Phase 2:

- **App Store Submission**: Auto-submit to Varity App Store
- **Backend Deployment**: Deploy server/ directory to Akash
- **Contract Deployment**: Deploy contracts/ to Varity L3
- **Custom Domains**: Generate app.varity.so subdomains

### Status

**Current Status**: ✅ COMPLETE (Agent 3 - Day 3 Morning)

**Dependencies**:
- ⏳ Agent 1: ProjectDetector, BuildManager (In Progress)
- ⏳ Agent 2: IPFSUploader (In Progress)

**Success Criteria**: ✅ ALL MET
- ✅ Coordinates all deployment steps
- ✅ Returns valid DeploymentResult
- ✅ Saves deployment metadata
- ✅ Clear progress messages
- ✅ Comprehensive test coverage
- ✅ Ready for Agent 4 (CLI command) integration
