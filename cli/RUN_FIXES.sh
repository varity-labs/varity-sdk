#!/bin/bash
# Automated script to fix type errors and pylint warnings in Varity SDK CLI

set -e

cd "$(dirname "$0")"

echo "=== Varity SDK Type & Lint Fixes ==="
echo "Starting automated fixes..."

# Step 1: Format code with black
echo ""
echo "[1/5] Formatting code with black..."
python3 -m black varietykit/ --quiet
echo "✓ Black formatting complete"

# Step 2: Sort imports with isort
echo ""
echo "[2/5] Sorting imports with isort..."
python3 -m isort varietykit/ --profile black --quiet
echo "✓ Import sorting complete"

# Step 3: Remove unused imports with autoflake
echo ""
echo "[3/5] Removing unused imports..."
python3 -m autoflake --remove-all-unused-imports --remove-unused-variables --in-place --recursive varietykit/
echo "✓ Unused imports removed"

# Step 4: Fix common type issues with custom script
echo ""
echo "[4/5] Fixing common type and pylint issues..."

# Create inline Python fixer
python3 << 'PYTHON_SCRIPT'
from pathlib import Path
import re

def fix_file(file_path):
    """Fix common issues in a Python file"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original = content
        changes = []

        # Fix 1: Add encoding to open() calls
        def add_encoding(match):
            args = match.group(1)
            if 'encoding' not in args and 'rb' not in args and 'wb' not in args:
                if args.strip().endswith(','):
                    return f'open({args} encoding="utf-8")'
                else:
                    return f'open({args}, encoding="utf-8")'
            return match.group(0)

        new_content = re.sub(r'open\(([^)]+)\)', add_encoding, content)
        if new_content != content:
            changes.append("encoding")
            content = new_content

        # Fix 2: Replace bare except
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if re.match(r'^\s*except\s*:\s*$', line):
                lines[i] = re.sub(r'except\s*:', 'except Exception:', line)
                if "bare-except" not in changes:
                    changes.append("bare-except")
        content = '\n'.join(lines)

        # Fix 3: Add check=True to subprocess.run
        def add_check(match):
            args = match.group(1)
            if 'check=' not in args:
                if args.strip().endswith(','):
                    return f'subprocess.run({args} check=True)'
                else:
                    return f'subprocess.run({args}, check=True)'
            return match.group(0)

        new_content = re.sub(r'subprocess\.run\(([^)]+)\)', add_check, content)
        if new_content != content:
            changes.append("subprocess-check")
            content = new_content

        # Fix 4: Add typing imports if needed
        if 'Dict[' in content or 'List[' in content or '-> dict' in content or '-> list' in content:
            if 'from typing import' in content:
                # Add to existing import
                if 'Dict' not in content or 'List' not in content or 'Any' not in content:
                    for i, line in enumerate(content.split('\n')):
                        if line.startswith('from typing import'):
                            imports = set([x.strip() for x in line.replace('from typing import', '').split(',')])
                            imports.update(['Dict', 'List', 'Any', 'Optional'])
                            new_import = 'from typing import ' + ', '.join(sorted(imports))
                            content = content.replace(line, new_import, 1)
                            changes.append("typing-imports")
                            break
            elif 'import' in content:
                # Add new typing import after first import
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if line.startswith('import ') or line.startswith('from '):
                        lines.insert(i + 1, 'from typing import Any, Dict, List, Optional')
                        content = '\n'.join(lines)
                        changes.append("typing-imports")
                        break

        # Fix 5: Replace dict -> Dict[str, Any] in return types
        content = re.sub(r'->\s*dict\s*:', '-> Dict[str, Any]:', content)
        content = re.sub(r'->\s*list\s*:', '-> List[Any]:', content)

        # Fix 6: Replace dict/list in parameters
        content = re.sub(r'(\w+):\s*dict([,)])', r'\1: Dict[str, Any]\2', content)
        content = re.sub(r'(\w+):\s*list([,)])', r'\1: List[Any]\2', content)

        # Write back if changed
        if content != original:
            file_path.write_text(content, encoding='utf-8')
            return changes
        return []

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return []

# Process all Python files
base_dir = Path('varietykit')
total_changes = {}
files_modified = 0

for py_file in base_dir.rglob('*.py'):
    changes = fix_file(py_file)
    if changes:
        files_modified += 1
        for change in changes:
            total_changes[change] = total_changes.get(change, 0) + 1

print(f"✓ Fixed {files_modified} files")
print(f"  Changes: {total_changes}")

PYTHON_SCRIPT

echo "✓ Type and lint fixes applied"

# Step 5: Run verification
echo ""
echo "[5/5] Running verification..."
echo ""
echo "--- mypy type checking ---"
python3 -m mypy varietykit/ --show-error-codes --no-error-summary 2>&1 | head -30 || true

echo ""
echo "--- mypy error count ---"
ERROR_COUNT=$(python3 -m mypy varietykit/ --no-error-summary 2>&1 | wc -l)
echo "Total mypy errors: $ERROR_COUNT"

echo ""
echo "--- pylint checking (E-level only) ---"
python3 -m pylint varietykit/ --disable=all --enable=E --score=no 2>&1 | head -30 || true

echo ""
echo "--- pylint score ---"
python3 -m pylint varietykit/ --score=yes 2>&1 | grep "rated at" || true

echo ""
echo "=== Summary ==="
echo "✓ Black formatting: DONE"
echo "✓ Import sorting: DONE"
echo "✓ Unused imports removed: DONE"
echo "✓ Type & lint fixes: DONE"
echo "✓ Verification: DONE"
echo ""
echo "Mypy errors remaining: $ERROR_COUNT (target: <50)"
echo ""
echo "Review the output above to see remaining issues."
echo "If errors remain, manual fixes may be needed for complex cases."
