"""
Vercel → Varity migration toolkit.

Primary entry points:
  - analyze(path) → MigrationReport (what's Vercel-specific, what needs changing)
  - apply(path, report) → AppliedChanges (transforms applied, or dry-run diff)
  - rollback(path) → reverts to pre-migration state

Design: codemods are small, composable, each targets ONE Vercel-ism. The
user facing the MCP never sees any of this — they say 'migrate my app' and
the orchestrator calls analyze+apply+deploy as one atomic flow.
"""

from varitykit.migrate.detector import MigrationReport, analyze
from varitykit.migrate.codemods import AppliedChanges, apply

__all__ = ["analyze", "apply", "MigrationReport", "AppliedChanges"]
