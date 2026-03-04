"""
Post-build path rewriter for static hosting compatibility.

Next.js generates absolute paths (/_next/...) that break on gateways
where the app is served from a subdirectory (/ipfs/QmXXX/). This module
rewrites all paths to be relative, making the static export portable.
"""

import re
from pathlib import Path


def rewrite_paths_for_static_hosting(output_dir: str) -> int:
    """
    Rewrite absolute /_next/ paths to relative paths in all HTML and JS files.

    For each file, calculates the correct relative prefix based on the file's
    depth relative to the output directory root:
      - /index.html                      -> prefix = ""     -> "_next/..."
      - /login/index.html                -> prefix = "../"  -> "../_next/..."
      - /dashboard/settings/index.html   -> prefix = "../../" -> "../../_next/..."

    Also rewrites:
      - /icon.svg -> relative icon.svg
      - Internal navigation links (e.g., /login/ -> relative)

    Args:
        output_dir: Path to the build output directory (e.g., "out/")

    Returns:
        Number of files modified
    """
    output_path = Path(output_dir)
    files_modified = 0

    # Process HTML files — depth-aware rewriting
    for html_file in output_path.rglob("*.html"):
        relative = html_file.relative_to(output_path)
        depth = len(relative.parts) - 1  # subtract the filename itself
        prefix = "../" * depth

        content = html_file.read_text(encoding="utf-8")
        original = content

        # Rewrite asset paths: /_next/ -> {prefix}_next/
        content = content.replace('"/_next/', f'"{prefix}_next/')
        content = content.replace("'/_next/", f"'{prefix}_next/")

        # Rewrite icon path: /icon.svg -> {prefix}icon.svg
        content = re.sub(r'"/icon\.svg', f'"{prefix}icon.svg', content)

        # Rewrite navigation links: href="/login" -> href="{prefix}login"
        # Preserve protocol-relative URLs (//) and anchor links (#)
        content = re.sub(
            r'href="/(?!/)([^"]*)"',
            lambda m: f'href="{prefix}{m.group(1)}"',
            content,
        )

        if content != original:
            html_file.write_text(content, encoding="utf-8")
            files_modified += 1

    # Process JS files — rewrite the webpack public path
    # The webpack runtime contains: a.p="/_next/" which MUST be rewritten
    # We replace it with a self-executing function that calculates the correct
    # relative path at runtime from document.currentScript.src
    for js_file in output_path.rglob("*.js"):
        content = js_file.read_text(encoding="utf-8", errors="replace")
        original = content

        # Replace the webpack public path assignment
        # Pattern: ="/_next/" (the assignment in webpack runtime)
        content = content.replace(
            '="/_next/"',
            '=(function(){try{var s=document.currentScript||document.querySelector("script[src]");'
            'if(s&&s.src){var u=s.src,i=u.lastIndexOf("/_next/");'
            'if(i!==-1)return u.substring(0,i)+"/_next/"}'
            '}catch(e){}return"_next/";})()',
        )

        if content != original:
            js_file.write_text(content, encoding="utf-8")
            files_modified += 1

    return files_modified
