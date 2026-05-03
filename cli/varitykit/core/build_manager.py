"""
Build manager for executing project builds.

This module handles building projects based on detected type and framework.
"""

import os
import shutil
import subprocess
import time
from pathlib import Path
from typing import Dict, List, Optional

from .types import BuildArtifacts, BuildError


class BuildManager:
    """
    Execute build commands and collect artifacts.

    Responsibilities:
    - Run appropriate build command based on project type
    - Stream build output to console
    - Collect build artifacts from output directory
    - Validate build success
    """

    def build(self, project_path: str, build_command: str, output_dir: str, extra_env: Optional[Dict[str, str]] = None) -> BuildArtifacts:
        """
        Execute build command and collect output artifacts.

        Args:
            project_path: Path to the project directory
            build_command: Build command to execute (e.g., 'npm run build')
            output_dir: Expected output directory (e.g., './out', './build')
            extra_env: Additional environment variables to inject into the build process

        Returns:
            BuildArtifacts with file paths, sizes, and timing info

        Raises:
            BuildError: If build fails or output directory is missing
        """
        path = Path(project_path)

        if not path.exists():
            raise BuildError(f"Project path does not exist: {project_path}")

        # Skip build if no build command (e.g., plain Node.js)
        if not build_command or build_command.strip() == "":
            print("No build command specified, skipping build step")
            return self._collect_artifacts(path, output_dir, 0.0)

        # Clean stale caches before build to ensure deterministic output
        for cache_dir in [".next", "out"]:
            cache_path = path / cache_dir
            if cache_path.exists():
                print(f"Cleaning stale cache: {cache_dir}/")
                try:
                    shutil.rmtree(cache_path)
                except OSError:
                    if os.name == 'nt':
                        subprocess.run(["cmd", "/c", "rmdir", "/s", "/q", str(cache_path)], check=True)
                    else:
                        subprocess.run(["rm", "-rf", str(cache_path)], check=True)

        # Execute build
        start_time = time.time()
        print(f"\nRunning build command: {build_command}")
        print("-" * 60)

        # On Windows, shell=True requires a string command; on Unix, use a list
        use_shell = os.name == 'nt'
        cmd = build_command if use_shell else build_command.split()

        # Build with production environment to ensure minified output
        build_env = os.environ.copy()
        build_env["NODE_ENV"] = "production"
        if "NODE_OPTIONS" not in build_env:
            build_env["NODE_OPTIONS"] = "--max-old-space-size=4096"
        if extra_env:
            build_env.update(extra_env)

        try:
            # Execute build with real-time output
            process = subprocess.Popen(
                cmd,
                cwd=str(path),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                env=build_env,
                shell=use_shell,
            )

            # Stream output in real-time
            if process.stdout:
                for line in process.stdout:
                    print(line, end="")

            # Wait for completion
            return_code = process.wait()

            build_time = time.time() - start_time

            if return_code != 0:
                raise BuildError(
                    f"Build failed with exit code {return_code}.\n"
                    f"Command: {build_command}\n"
                    f"Check the output above for error details."
                )

            print("-" * 60)
            print(f"Build completed successfully in {build_time:.1f}s\n")

        except (FileNotFoundError, PermissionError):
            # FileNotFoundError: POSIX standard when command doesn't exist (ENOENT)
            # PermissionError: raised on some Linux/WSL configs for nonexistent commands (EACCES)
            first_token = build_command.split()[0] if build_command else build_command
            raise BuildError(
                f"Build command not found: {first_token}\n"
                f"Make sure the package manager is installed.\n"
                f"Command attempted: {build_command}"
            )
        except subprocess.SubprocessError as e:
            raise BuildError(f"Build process failed: {e}")

        # Collect build artifacts
        return self._collect_artifacts(path, output_dir, build_time)

    def _collect_artifacts(
        self, project_path: Path, output_dir: str, build_time: float
    ) -> BuildArtifacts:
        """
        Collect build artifacts from output directory.

        Args:
            project_path: Path to the project directory
            output_dir: Output directory relative to project_path
            build_time: Time taken to build in seconds

        Returns:
            BuildArtifacts with collected files

        Raises:
            BuildError: If output directory is missing or empty
        """
        build_path = project_path / output_dir

        # Check if build directory exists
        if not build_path.exists():
            # Try common alternative directories
            alternatives = self._get_alternative_dirs(project_path)
            found_alternative = None

            for alt_dir in alternatives:
                if (project_path / alt_dir).exists():
                    found_alternative = alt_dir
                    build_path = project_path / alt_dir
                    print(f"Note: Using {alt_dir} instead of {output_dir}")
                    break

            if not found_alternative:
                raise BuildError(
                    f"Build output directory not found: {output_dir}\n"
                    f"Checked: {build_path}\n"
                    f"Also checked alternatives: {', '.join(alternatives)}"
                )

        # Collect all files recursively
        all_files = list(build_path.rglob("*"))
        files = [f for f in all_files if f.is_file()]

        if not files:
            raise BuildError(
                f"Build directory is empty: {build_path}\n"
                f"Build may have failed without raising an error."
            )

        # Calculate total size
        total_size_bytes = sum(f.stat().st_size for f in files)
        total_size_mb = total_size_bytes / (1024 * 1024)

        # Get relative paths
        relative_files = [str(f.relative_to(build_path)) for f in files]

        # Determine entrypoint
        entrypoint = self._determine_entrypoint(build_path)

        print(f"Collected {len(files)} files ({total_size_mb:.2f} MB)")

        return BuildArtifacts(
            success=True,
            output_dir=str(build_path),
            files=relative_files,
            entrypoint=entrypoint,
            total_size_mb=total_size_mb,
            build_time_seconds=build_time,
        )

    def _get_alternative_dirs(self, project_path: Path) -> List[str]:
        """
        Get alternative build directories to check.

        Args:
            project_path: Path to the project directory

        Returns:
            List of alternative directory names
        """
        return ["build", "dist", "out", ".next", "public"]

    def _determine_entrypoint(self, build_path: Path) -> str:
        """
        Determine the entrypoint file for the build.

        Args:
            build_path: Path to the build directory

        Returns:
            Entrypoint filename (e.g., 'index.html')
        """
        # Check for common entrypoint files
        common_entrypoints = ["index.html", "index.htm", "main.html", "app.html"]

        for entrypoint in common_entrypoints:
            if (build_path / entrypoint).exists():
                return entrypoint

        # For Next.js .next directory
        if build_path.name == ".next":
            return "server.js"  # Next.js server entrypoint

        # Default to index.html
        return "index.html"
