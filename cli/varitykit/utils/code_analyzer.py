"""
Code analyzer utilities for detecting feature usage in projects.

Scans JavaScript/TypeScript files to detect @varity/sdk features being used.
"""
import os
import re
from pathlib import Path
from typing import Dict, List, Set


def detect_database_usage(project_dir: str) -> bool:
    """
    Detect if the project uses @varity/sdk database module.

    Scans JavaScript/TypeScript files for:
    - import { db } from '@varity/sdk'
    - import { Database } from '@varity/sdk'

    Args:
        project_dir: Path to the project directory

    Returns:
        True if database usage detected, False otherwise
    """
    # File extensions to scan
    extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']

    # Import/export patterns to match (also detect re-exports)
    patterns = [
        r"(?:import|export)\s*{\s*db\s*}\s*from\s*['\"]@varity/sdk['\"]",
        r"(?:import|export)\s*{\s*Database\s*}\s*from\s*['\"]@varity/sdk['\"]",
        r"(?:import|export)\s*{\s*.*\bdb\b.*\s*}\s*from\s*['\"]@varity/sdk['\"]",
        r"from\s*['\"]@varity/sdk['\"]\s*import\s*{\s*db\s*}",
        # Also check for @varity-labs/sdk (the npm package name)
        r"(?:import|export)\s*{\s*db\s*}\s*from\s*['\"]@varity-labs/sdk['\"]",
        r"(?:import|export)\s*{\s*Database\s*}\s*from\s*['\"]@varity-labs/sdk['\"]",
        r"(?:import|export)\s*{\s*.*\bdb\b.*\s*}\s*from\s*['\"]@varity-labs/sdk['\"]",
    ]

    compiled_patterns = [re.compile(p, re.MULTILINE) for p in patterns]

    # Scan project files
    for root, dirs, files in os.walk(project_dir):
        # Skip node_modules and build directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', 'dist', 'build', '.next', '.git', '.varity', '.cache', 'out']]

        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Check if any pattern matches
                    for pattern in compiled_patterns:
                        if pattern.search(content):
                            return True

                except (UnicodeDecodeError, PermissionError):
                    continue

    return False


def detect_auth_usage(project_dir: str) -> bool:
    """
    Detect if the project uses @varity/sdk auth module.

    Args:
        project_dir: Path to the project directory

    Returns:
        True if auth usage detected, False otherwise
    """
    extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']

    patterns = [
        r"(?:import|export)\s*{\s*auth\s*}\s*from\s*['\"]@varity/sdk['\"]",
        r"(?:import|export)\s*{\s*.*\bauth\b.*\s*}\s*from\s*['\"]@varity/sdk['\"]",
        r"(?:import|export)\s*{\s*auth\s*}\s*from\s*['\"]@varity-labs/sdk['\"]",
        r"(?:import|export)\s*{\s*.*\bauth\b.*\s*}\s*from\s*['\"]@varity-labs/sdk['\"]",
        # Also detect auth via ui-kit (PrivyStack, AuthProvider)
        r"import\s*{[^}]*\bPrivyStack\b[^}]*}\s*from\s*['\"]@varity-labs/ui-kit['\"]",
        r"import\s*{[^}]*\bPrivyStack\b[^}]*}\s*from\s*['\"]@varity/ui-kit['\"]",
        r"import\s*{[^}]*\bAuthProvider\b[^}]*}\s*from\s*['\"]@varity-labs/ui-kit['\"]",
        r"import\s*{[^}]*\bAuthProvider\b[^}]*}\s*from\s*['\"]@varity/ui-kit['\"]",
        # Detect Privy directly (common auth provider)
        r"import\s*{[^}]*\busePrivy\b[^}]*}\s*from\s*['\"]@privy-io/react-auth['\"]",
        r"import\s*{[^}]*\bPrivyProvider\b[^}]*}\s*from\s*['\"]@privy-io/react-auth['\"]",
    ]

    compiled_patterns = [re.compile(p, re.MULTILINE) for p in patterns]

    for root, dirs, files in os.walk(project_dir):
        dirs[:] = [d for d in dirs if d not in ['node_modules', 'dist', 'build', '.next', '.git', '.varity', '.cache', 'out']]

        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    for pattern in compiled_patterns:
                        if pattern.search(content):
                            return True

                except (UnicodeDecodeError, PermissionError):
                    continue

    return False


def detect_payment_widget_usage(project_dir: str) -> bool:
    """
    Detect if the project uses PaymentWidget from @varity/ui-kit.

    This is MANDATORY for apps that want to monetize through the Varity App Store.
    All payments must go through PaymentWidget to ensure 90/10 revenue split.

    Detects:
    - import { PaymentWidget } from '@varity/ui-kit'
    - import { PaymentGate } from '@varity/ui-kit'
    - import { useVarityPayment } from '@varity/ui-kit'

    Args:
        project_dir: Path to the project directory

    Returns:
        True if PaymentWidget/PaymentGate/useVarityPayment usage detected, False otherwise
    """
    extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']

    # Pattern matches any of: PaymentWidget, PaymentGate, useVarityPayment
    patterns = [
        # @varity/ui-kit imports
        r"import\s*{[^}]*\bPaymentWidget\b[^}]*}\s*from\s*['\"]@varity/ui-kit['\"]",
        r"import\s*{[^}]*\bPaymentGate\b[^}]*}\s*from\s*['\"]@varity/ui-kit['\"]",
        r"import\s*{[^}]*\buseVarityPayment\b[^}]*}\s*from\s*['\"]@varity/ui-kit['\"]",
        # @varity-labs/ui-kit imports (npm package name)
        r"import\s*{[^}]*\bPaymentWidget\b[^}]*}\s*from\s*['\"]@varity-labs/ui-kit['\"]",
        r"import\s*{[^}]*\bPaymentGate\b[^}]*}\s*from\s*['\"]@varity-labs/ui-kit['\"]",
        r"import\s*{[^}]*\buseVarityPayment\b[^}]*}\s*from\s*['\"]@varity-labs/ui-kit['\"]",
        # Component usage detection (JSX)
        r"<PaymentWidget\s",
        r"<PaymentGate\s",
        # Hook usage detection
        r"useVarityPayment\s*\(",
    ]

    compiled_patterns = [re.compile(p, re.MULTILINE) for p in patterns]

    for root, dirs, files in os.walk(project_dir):
        dirs[:] = [d for d in dirs if d not in ['node_modules', 'dist', 'build', '.next', '.git', '.varity', '.cache', 'out']]

        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    for pattern in compiled_patterns:
                        if pattern.search(content):
                            return True

                except (UnicodeDecodeError, PermissionError):
                    continue

    return False


def detect_features(project_dir: str) -> Dict[str, bool]:
    """
    Detect all Varity features used in the project.

    Args:
        project_dir: Path to the project directory

    Returns:
        Dict with feature flags:
        {
            'database': bool,
            'auth': bool,
            'payment_widget': bool  # MANDATORY for monetization
        }
    """
    return {
        'database': detect_database_usage(project_dir),
        'auth': detect_auth_usage(project_dir),
        'payment_widget': detect_payment_widget_usage(project_dir),
    }
