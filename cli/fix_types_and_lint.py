#!/usr/bin/env python3
"""
Automated script to fix common type errors and pylint warnings.
Runs systematically through all Python files.
"""

import re
import sys
from pathlib import Path
from typing import List, Tuple

def add_encoding_to_opens(content: str) -> Tuple[str, int]:
    """Add encoding='utf-8' to all open() calls"""
    count = 0

    # Pattern: open(...) without encoding
    pattern = r'open\(((?:[^)]|[\r\n])*?)\)(?!\s*#.*encoding)'

    def replace_open(match):
        nonlocal count
        args = match.group(1)
        # Check if encoding already present
        if 'encoding' not in args:
            count += 1
            # Add encoding parameter
            if args.strip().endswith(','):
                return f'open({args} encoding="utf-8")'
            else:
                return f'open({args}, encoding="utf-8")'
        return match.group(0)

    result = re.sub(pattern, replace_open, content)
    return result, count

def fix_bare_except(content: str) -> Tuple[str, int]:
    """Replace bare except: with except Exception:"""
    count = 0
    lines = content.split('\n')
    result_lines = []

    for line in lines:
        if re.match(r'\s*except\s*:', line):
            # Replace bare except
            count += 1
            result_lines.append(re.sub(r'except\s*:', 'except Exception:', line))
        else:
            result_lines.append(line)

    return '\n'.join(result_lines), count

def add_subprocess_check(content: str) -> Tuple[str, int]:
    """Add check=True to subprocess.run() calls"""
    count = 0

    # Pattern: subprocess.run(...) without check=
    pattern = r'subprocess\.run\(((?:[^)]|[\r\n])*?)\)(?!\s*#.*check)'

    def replace_subprocess(match):
        nonlocal count
        args = match.group(1)
        # Check if check= already present
        if 'check=' not in args:
            count += 1
            # Add check=True parameter
            if args.strip().endswith(','):
                return f'subprocess.run({args} check=True)'
            else:
                return f'subprocess.run({args}, check=True)'
        return match.group(0)

    result = re.sub(pattern, replace_subprocess, content)
    return result, count

def add_return_type_annotations(content: str) -> Tuple[str, int]:
    """Add -> None to functions without return type"""
    count = 0
    lines = content.split('\n')
    result_lines = []

    i = 0
    while i < len(lines):
        line = lines[i]

        # Match function definition without return type
        match = re.match(r'(\s*)def\s+(\w+)\s*\((.*?)\)\s*:', line)
        if match and '->' not in line:
            indent, func_name, params = match.groups()

            # Skip __init__, __str__, __repr__, properties, and click commands
            if func_name in ['__init__', '__str__', '__repr__', '__eq__', '__hash__']:
                result_lines.append(line)
            elif '@property' in '\n'.join(lines[max(0,i-5):i]):
                result_lines.append(line)
            elif any(decorator in '\n'.join(lines[max(0,i-10):i]) for decorator in ['@click.', '@app.', '@deploy.']):
                result_lines.append(line)
            else:
                # Check if function has return statement
                func_body = []
                j = i + 1
                base_indent = len(indent)
                while j < len(lines):
                    next_line = lines[j]
                    if next_line.strip() and not next_line.startswith(' ' * (base_indent + 4)):
                        break
                    func_body.append(next_line)
                    j += 1

                has_return_value = any('return ' in l and 'return' in l and not l.strip().startswith('#') for l in func_body if 'return' in l and l.strip() != 'return')

                if not has_return_value:
                    count += 1
                    result_lines.append(f'{indent}def {func_name}({params}) -> None:')
                else:
                    result_lines.append(line)
        else:
            result_lines.append(line)

        i += 1

    return '\n'.join(result_lines), count

def add_dict_list_type_params(content: str) -> Tuple[str, int]:
    """Add type parameters to Dict and List in function signatures"""
    count = 0

    # Add imports if needed
    if 'from typing import' in content and 'Dict' not in content:
        content = content.replace('from typing import', 'from typing import Dict,', 1)
    if 'from typing import' in content and 'List' not in content:
        content = content.replace('from typing import', 'from typing import List,', 1)
    if 'from typing import' in content and 'Any' not in content:
        content = content.replace('from typing import', 'from typing import Any,', 1)

    # Replace dict -> Dict[str, Any] in function signatures
    pattern = r'(def\s+\w+\([^)]*?):\s*dict(\s*[,)])'
    replacement = r'\1: Dict[str, Any]\2'
    new_content, n = re.subn(pattern, replacement, content)
    count += n

    # Replace list -> List[Any] in function signatures
    pattern = r'(def\s+\w+\([^)]*?):\s*list(\s*[,)])'
    replacement = r'\1: List[Any]\2'
    new_content, n = re.subn(pattern, new_content)
    count += n

    # Replace -> dict with -> Dict[str, Any]
    pattern = r'->\s*dict\s*:'
    replacement = r'-> Dict[str, Any]:'
    new_content, n = re.subn(pattern, new_content)
    count += n

    # Replace -> list with -> List[Any]
    pattern = r'->\s*list\s*:'
    replacement = r'-> List[Any]:'
    new_content, n = re.subn(pattern, new_content)
    count += n

    return new_content, count

def process_file(file_path: Path) -> dict:
    """Process a single Python file"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original_content = content

        fixes = {}

        # Apply fixes
        content, n1 = add_encoding_to_opens(content)
        fixes['encoding'] = n1

        content, n2 = fix_bare_except(content)
        fixes['except'] = n2

        content, n3 = add_subprocess_check(content)
        fixes['subprocess'] = n3

        content, n4 = add_return_type_annotations(content)
        fixes['return_types'] = n4

        content, n5 = add_dict_list_type_params(content)
        fixes['type_params'] = n5

        # Write back if changed
        if content != original_content:
            file_path.write_text(content, encoding='utf-8')
            fixes['modified'] = True
        else:
            fixes['modified'] = False

        return fixes

    except Exception as e:
        return {'error': str(e)}

def main():
    """Main entry point"""
    base_dir = Path(__file__).parent / 'varietykit'

    if not base_dir.exists():
        print(f"Error: {base_dir} not found")
        sys.exit(1)

    # Find all Python files
    py_files = list(base_dir.rglob('*.py'))
    print(f"Found {len(py_files)} Python files")

    total_fixes = {
        'encoding': 0,
        'except': 0,
        'subprocess': 0,
        'return_types': 0,
        'type_params': 0,
        'files_modified': 0,
        'files_with_errors': 0
    }

    for file_path in py_files:
        print(f"Processing {file_path.relative_to(base_dir.parent)}...", end=' ')
        fixes = process_file(file_path)

        if 'error' in fixes:
            print(f"ERROR: {fixes['error']}")
            total_fixes['files_with_errors'] += 1
        elif fixes.get('modified'):
            print(f"✓ ({fixes['encoding']}E {fixes['except']}X {fixes['subprocess']}S {fixes['return_types']}R {fixes['type_params']}T)")
            for key in ['encoding', 'except', 'subprocess', 'return_types', 'type_params']:
                total_fixes[key] += fixes[key]
            total_fixes['files_modified'] += 1
        else:
            print("OK")

    print(f"\n=== Summary ===")
    print(f"Files processed: {len(py_files)}")
    print(f"Files modified: {total_fixes['files_modified']}")
    print(f"Files with errors: {total_fixes['files_with_errors']}")
    print(f"\nFixes applied:")
    print(f"  - Encoding added to open(): {total_fixes['encoding']}")
    print(f"  - Bare except fixed: {total_fixes['except']}")
    print(f"  - subprocess.run check=True added: {total_fixes['subprocess']}")
    print(f"  - Return type annotations added: {total_fixes['return_types']}")
    print(f"  - Dict/List type parameters added: {total_fixes['type_params']}")

    return 0 if total_fixes['files_with_errors'] == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
