# Manual Fix Guide - Type Errors & Pylint Warnings

## Current Status
- Type errors: ~108 (estimate from audit reports)
- Target: 0 type errors
- Pylint E-level errors: 11
- Target: 0 E-level errors

## Quick Fix Commands

Run these commands in order from `/home/macoding/varity-workspace/varity-sdk/cli`:

```bash
cd /home/macoding/varity-workspace/varity-sdk/cli

# 1. Format code with black
black varietykit/

# 2. Sort imports
isort varietykit/ --profile black

# 3. Remove unused imports
autoflake --remove-all-unused-imports --remove-unused-variables --in-place --recursive varietykit/

# 4. Check results
mypy varietykit/ --no-error-summary | wc -l
pylint varietykit/ --disable=all --enable=E | grep "E[0-9]" | wc -l
```

## Manual Fixes Needed After Running Above

### 1. Add encoding to file operations

Search and replace pattern:
```python
# FIND:
with open(file_path, "r") as f:
with open(file_path, "w") as f:

# REPLACE WITH:
with open(file_path, "r", encoding="utf-8") as f:
with open(file_path, "w", encoding="utf-8") as f:
```

Files with most occurrences:
- varietykit/cli/deploy.py (lines 80, 89, 101, 321)
- varietykit/cli/template.py
- varietykit/cli/marketplace.py
- varietykit/core/project_detector.py (line 81 - already has it!)

### 2. Add return type annotations to functions

Pattern to fix:
```python
# BEFORE:
def save_deployment_state(network: str, deployment_data: dict):
def status(ctx, network):
def list(ctx, network, limit):

# AFTER:
def save_deployment_state(network: str, deployment_data: dict) -> None:
def status(ctx: click.Context, network: str) -> None:
def list_deployments(ctx: click.Context, network: str, limit: int) -> None:
```

Note: Renamed `list` to `list_deployments` to avoid shadowing builtin.

### 3. Fix variable shadowing

In `varietykit/cli/deploy.py` line 510:
```python
# BEFORE:
def list(ctx, network, limit):

# AFTER:
def list_cmd(ctx, network, limit):  # Or list_deployments
```

### 4. Add type hints to Dict and List

```python
# BEFORE:
def save_deployment_state(network: str, deployment_data: dict):
def get_deployment_history(network: str) -> list:

# AFTER:
from typing import Any, Dict, List

def save_deployment_state(network: str, deployment_data: Dict[str, Any]) -> None:
def get_deployment_history(network: str) -> List[Dict[str, Any]]:
```

### 5. Fix bare except clauses

Search for `except:` and replace with `except Exception as e:`

Example:
```python
# BEFORE:
try:
    ...
except:
    pass

# AFTER:
try:
    ...
except Exception as e:
    logger.error(f"Error: {e}")
```

### 6. Add check=True to subprocess.run()

Search for `subprocess.run(` and add `check=True`:

```python
# BEFORE:
subprocess.run(['npm', 'install'])

# AFTER:
subprocess.run(['npm', 'install'], check=True)
```

## Priority Files to Fix

Based on audit reports, fix in this order:

1. **varietykit/cli/deploy.py** (20+ issues)
   - Add encoding to open() calls (4 instances)
   - Add return types (5+ functions)
   - Fix `list` function name (shadows builtin)
   - Add Dict/List type parameters

2. **varietykit/commands/app_deploy.py** (10+ issues)
   - Add return types to click commands
   - Add type annotations

3. **varietykit/core/deployment_orchestrator.py** (15+ issues)
   - Add type annotations
   - Fix Optional type usage

4. **varietykit/core/akash/akash_deployer.py** (12+ issues)
   - Add type annotations
   - Fix subprocess calls

5. **varietykit/core/app_store/client.py** (10+ issues)
   - Add type annotations
   - Fix async typing

## Automated Fix Script

If you want to automate the most common fixes, run:

```python
import re
from pathlib import Path

def fix_common_issues(file_path: Path):
    content = file_path.read_text(encoding='utf-8')
    original = content

    # Fix 1: Add encoding to open()
    content = re.sub(
        r'open\(([^,)]+),\s*"([rw])"',
        r'open(\1, "\2", encoding="utf-8"',
        content
    )

    # Fix 2: Fix bare except
    content = re.sub(
        r'(\s+)except:\s*$',
        r'\1except Exception:',
        content,
        flags=re.MULTILINE
    )

    # Fix 3: Add check=True to subprocess.run()
    content = re.sub(
        r'subprocess\.run\(([^)]+)\)(?!.*check=)',
        lambda m: f'subprocess.run({m.group(1)}, check=True)' if 'check=' not in m.group(1) else m.group(0),
        content
    )

    if content != original:
        file_path.write_text(content, encoding='utf-8')
        return True
    return False

# Run on all Python files
base = Path('varietykit')
count = 0
for py_file in base.rglob('*.py'):
    if fix_common_issues(py_file):
        count += 1
        print(f"Fixed: {py_file}")

print(f"\nTotal files fixed: {count}")
```

Save this as `quick_fix.py` and run: `python3 quick_fix.py`

## Verification

After all fixes:

```bash
# Check mypy errors
mypy varietykit/ --show-error-codes --no-error-summary | tee mypy_results.txt
echo "Total errors:" $(wc -l < mypy_results.txt)

# Check pylint
pylint varietykit/ --disable=all --enable=E --score=yes

# Check if target met
MYPY_ERRORS=$(mypy varietykit/ --no-error-summary 2>&1 | wc -l)
if [ "$MYPY_ERRORS" -lt 50 ]; then
    echo "✓ MYPY TARGET MET: $MYPY_ERRORS errors (target: <50)"
else
    echo "✗ MYPY TARGET MISSED: $MYPY_ERRORS errors (target: <50)"
fi

PYLINT_ERRORS=$(pylint varietykit/ --disable=all --enable=E --score=no 2>&1 | grep "E[0-9]" | wc -l)
if [ "$PYLINT_ERRORS" -eq 0 ]; then
    echo "✓ PYLINT TARGET MET: 0 E-level errors"
else
    echo "✗ PYLINT TARGET MISSED: $PYLINT_ERRORS E-level errors"
fi
```

## Success Criteria

When you see:
```
✓ MYPY TARGET MET: X errors (target: <50)
✓ PYLINT TARGET MET: 0 E-level errors
```

Then add to your final commit:
```
EXIT_SIGNAL: Phase 2 complete - <50 type errors, 0 pylint E-level errors
```

## Estimated Time

- Automated fixes (black, isort, autoflake, quick_fix.py): 2-3 minutes
- Manual fixes (encoding, type annotations, shadowing): 1-2 hours
- Verification: 5 minutes

Total: 1-2 hours
