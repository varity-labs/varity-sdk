"""Embedding-based similar-repo lookup + voting recommender.

Augments the deterministic rules engine by finding K most similar past
OrchestrationRuns in the World Model, checking their DeployOutcomes,
and voting on the best deployment strategy.

v1 strategy:
  - < MIN_RUNS OrchestrationRuns in WM -> pure rules-engine fallback
  - >= MIN_RUNS -> embed input signals, cosine-search via pgvector (or
    tsvector fallback), vote among successful outcomes
  - Score < SCORE_THRESHOLD -> defer to rules engine
"""

import json
import logging
import os
import time
import uuid
from collections import Counter
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

MIN_RUNS = 100
K_NEIGHBORS = 20
SCORE_THRESHOLD = 0.6

_SIGNAL_KEYS = (
    "project_type", "hosting_requested", "dependency_signals",
    "sidecars_added", "port", "image", "memory_mb",
)


@dataclass
class Recommendation:
    sidecars: List[str]
    hosting: str
    port: Optional[int]
    score: float
    basis: str  # "rules" | "learned" | "hybrid"
    details: Dict[str, Any] = field(default_factory=dict)


def _wm_conn_params() -> Optional[Dict[str, Any]]:
    host = os.environ.get("WORLD_MODEL_DB_HOST") or os.environ.get("GRAPHITI_DB_HOST")
    if not host:
        return None
    return {
        "host": host,
        "port": int(
            os.environ.get("WORLD_MODEL_DB_PORT")
            or os.environ.get("GRAPHITI_DB_PORT", "30096")
        ),
        "user": (
            os.environ.get("WORLD_MODEL_DB_USER")
            or os.environ.get("GRAPHITI_DB_USER", "varity_wm")
        ),
        "dbname": (
            os.environ.get("WORLD_MODEL_DB_NAME")
            or os.environ.get("GRAPHITI_DB_NAME", "varity_world_model")
        ),
        "password": (
            os.environ.get("WORLD_MODEL_DB_PASSWORD")
            or os.environ.get("GRAPHITI_DB_PASSWORD", "")
        ),
        "connect_timeout": 5,
    }


def _get_connection():
    """Return a psycopg2 connection to the WM DB, or None."""
    params = _wm_conn_params()
    if not params:
        return None
    try:
        import psycopg2
        return psycopg2.connect(**params)
    except Exception:
        logger.debug("WM DB connection failed", exc_info=True)
        return None


def _signals_to_text(signals: Dict) -> str:
    """Flatten deployment signals into a tsvector-friendly text string."""
    parts = []
    for key in _SIGNAL_KEYS:
        val = signals.get(key)
        if val is None:
            continue
        if isinstance(val, dict):
            for k, v in val.items():
                if v:
                    parts.append(k.replace("has_", ""))
        elif isinstance(val, list):
            parts.extend(str(v) for v in val)
        else:
            parts.append(str(val))
    return " ".join(parts)


def _has_pgvector(conn) -> bool:
    """Check if the pgvector extension is available."""
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM pg_extension WHERE extname = 'vector'"
            )
            return cur.fetchone() is not None
    except Exception:
        return False


def _has_embedding_column(conn) -> bool:
    """Check if world_model_entities has a usable embedding column."""
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_name = 'world_model_entities' "
                "AND column_name = 'embedding' "
                "AND data_type != 'text'"
            )
            return cur.fetchone() is not None
    except Exception:
        return False


class LearnedRecommender:
    """Embedding-based deployment strategy recommender.

    Given a new repo's signals, finds K most similar past OrchestrationRuns
    via the World Model, looks up their DeployOutcomes, and votes on the
    best strategy.
    """

    def __init__(
        self,
        min_runs: int = MIN_RUNS,
        k: int = K_NEIGHBORS,
        score_threshold: float = SCORE_THRESHOLD,
    ):
        self._min_runs = min_runs
        self._k = k
        self._score_threshold = score_threshold

    def recommend(self, signals: Dict) -> Recommendation:
        """Produce a deployment recommendation from repo signals.

        Args:
            signals: Dict with keys like project_type, dependency_signals,
                     hosting_requested, sidecars_added, port, image, memory_mb.

        Returns:
            Recommendation with sidecars, hosting, port, score, and basis.
        """
        conn = _get_connection()
        if conn is None:
            return self._rules_fallback(signals, reason="no_wm_connection")

        try:
            run_count = self._count_runs(conn)
            if run_count < self._min_runs:
                return self._rules_fallback(
                    signals,
                    reason=f"insufficient_data ({run_count}/{self._min_runs})",
                )

            similar = self._find_similar_runs(conn, signals)
            if not similar:
                return self._rules_fallback(signals, reason="no_similar_runs")

            outcomes = self._fetch_outcomes(conn, [r[0] for r in similar])
            result = self._vote(similar, outcomes, signals)

            if result.score < self._score_threshold:
                return self._rules_fallback(
                    signals,
                    reason=f"low_confidence ({result.score:.2f})",
                )

            return result
        except Exception:
            logger.debug("Learned recommender failed", exc_info=True)
            return self._rules_fallback(signals, reason="query_error")
        finally:
            conn.close()

    def write_proposal(self, signals: Dict, result: Recommendation) -> Optional[str]:
        """Write a RecommenderProposal entity to the World Model.

        Returns the entity_id if written, None otherwise.
        """
        conn = _get_connection()
        if conn is None:
            return None
        try:
            entity_id = f"rec-proposal-{uuid.uuid4().hex[:12]}"
            props = {
                "input_signals": {
                    k: signals.get(k) for k in _SIGNAL_KEYS if signals.get(k) is not None
                },
                "recommendation": asdict(result),
                "asserted_by": "learned_recommender",
                "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
            }
            with conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "INSERT INTO world_model_entities "
                        "(type, entity_id, props, valid_from) "
                        "VALUES (%s, %s, %s::jsonb, NOW())",
                        ("RecommenderProposal", entity_id, json.dumps(props, default=str)),
                    )
            return entity_id
        except Exception:
            logger.debug("Failed to write RecommenderProposal", exc_info=True)
            return None
        finally:
            conn.close()

    def _count_runs(self, conn) -> int:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM world_model_entities "
                "WHERE type = 'OrchestrationRun' AND valid_to IS NULL"
            )
            row = cur.fetchone()
            return row[0] if row else 0

    def _find_similar_runs(
        self, conn, signals: Dict
    ) -> List[Tuple[str, float]]:
        """Find K most similar OrchestrationRun entities.

        Returns list of (entity_id, similarity_score) tuples.

        Strategy:
          1. If pgvector extension + embedding column exist: cosine similarity
          2. Fallback: tsvector full-text ranking
        """
        use_vector = _has_pgvector(conn) and _has_embedding_column(conn)
        if use_vector:
            return self._vector_search(conn, signals)
        return self._tsvector_search(conn, signals)

    def _vector_search(
        self, conn, signals: Dict
    ) -> List[Tuple[str, float]]:
        """Cosine similarity search via pgvector.

        When a real embedding endpoint is available (VAR-397), this will
        embed the input signals directly. Until then, use tsvector-weighted
        pre-filter + cosine on stored embeddings.
        """
        project_type = signals.get("project_type", "")
        with conn.cursor() as cur:
            cur.execute(
                "SELECT entity_id, "
                "1 - (embedding <=> ("
                "  SELECT embedding FROM world_model_entities "
                "  WHERE type = 'OrchestrationRun' AND valid_to IS NULL "
                "  AND props->>'project_type' = %s "
                "  ORDER BY props->>'ts' DESC LIMIT 1"
                ")) AS sim "
                "FROM world_model_entities "
                "WHERE type = 'OrchestrationRun' AND valid_to IS NULL "
                "AND embedding IS NOT NULL "
                "ORDER BY sim DESC LIMIT %s",
                (project_type, self._k),
            )
            return [(row[0], float(row[1])) for row in cur.fetchall()]

    def _tsvector_search(
        self, conn, signals: Dict
    ) -> List[Tuple[str, float]]:
        """Full-text similarity search via tsvector as fallback."""
        text = _signals_to_text(signals)
        if not text.strip():
            return []

        tsquery_parts = []
        for word in text.split():
            cleaned = "".join(c for c in word if c.isalnum() or c == "_")
            if cleaned:
                tsquery_parts.append(cleaned)
        if not tsquery_parts:
            return []

        tsquery = " | ".join(tsquery_parts)

        with conn.cursor() as cur:
            cur.execute(
                "SELECT entity_id, "
                "ts_rank_cd("
                "  to_tsvector('simple', COALESCE(props::text, '')), "
                "  to_tsquery('simple', %s)"
                ") AS rank "
                "FROM world_model_entities "
                "WHERE type = 'OrchestrationRun' AND valid_to IS NULL "
                "ORDER BY rank DESC LIMIT %s",
                (tsquery, self._k),
            )
            return [(row[0], float(row[1])) for row in cur.fetchall()]

    def _fetch_outcomes(
        self, conn, run_ids: List[str]
    ) -> Dict[str, Dict]:
        """Fetch DeployOutcome props for each run_id."""
        if not run_ids:
            return {}
        with conn.cursor() as cur:
            cur.execute(
                "SELECT entity_id, props FROM world_model_entities "
                "WHERE type = 'DeployOutcome' AND valid_to IS NULL "
                "AND props->>'run_id' = ANY(%s)",
                (run_ids,),
            )
            return {
                row[0]: row[1] if isinstance(row[1], dict) else json.loads(row[1])
                for row in cur.fetchall()
            }

    def _vote(
        self,
        similar: List[Tuple[str, float]],
        outcomes: Dict[str, Dict],
        signals: Dict,
    ) -> Recommendation:
        """Vote on best strategy among successful similar runs.

        For each similar run whose DeployOutcome shows success=true,
        collect (sidecars, hosting, port). Return the most common
        combination.
        """
        run_ids = [r[0] for r in similar]

        sidecar_counter: Counter = Counter()
        hosting_counter: Counter = Counter()
        port_counter: Counter = Counter()
        successful_count = 0

        successful_run_props = self._fetch_run_props(
            _get_connection(), run_ids
        )

        for run_id in run_ids:
            outcome = None
            for oprops in outcomes.values():
                if oprops.get("run_id") == run_id:
                    outcome = oprops
                    break
            if outcome is None or not outcome.get("success"):
                continue

            successful_count += 1
            run_props = successful_run_props.get(run_id, {})

            sidecars = run_props.get("sidecars_added")
            if isinstance(sidecars, list):
                sidecar_key = tuple(sorted(sidecars))
                sidecar_counter[sidecar_key] += 1

            hosting = run_props.get("hosting_requested") or run_props.get("hosting_decision")
            if hosting:
                hosting_counter[hosting] += 1

            port = run_props.get("port")
            if port is not None:
                port_counter[port] += 1

        if successful_count == 0:
            return self._rules_fallback(signals, reason="no_successful_neighbors")

        score = successful_count / self._k

        best_sidecars = list(
            sidecar_counter.most_common(1)[0][0]
        ) if sidecar_counter else []
        best_hosting = (
            hosting_counter.most_common(1)[0][0]
        ) if hosting_counter else signals.get("hosting_requested", "akash")
        best_port = (
            port_counter.most_common(1)[0][0]
        ) if port_counter else signals.get("port")

        return Recommendation(
            sidecars=best_sidecars,
            hosting=best_hosting,
            port=best_port,
            score=round(score, 4),
            basis="learned",
            details={
                "k": self._k,
                "successful_neighbors": successful_count,
                "sidecar_votes": dict(
                    (str(k), v) for k, v in sidecar_counter.most_common(5)
                ),
                "hosting_votes": dict(hosting_counter.most_common(5)),
                "port_votes": dict(port_counter.most_common(5)),
            },
        )

    @staticmethod
    def _fetch_run_props(conn, run_ids: List[str]) -> Dict[str, Dict]:
        """Fetch OrchestrationRun props for a list of entity_ids."""
        if conn is None or not run_ids:
            return {}
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT entity_id, props FROM world_model_entities "
                    "WHERE type = 'OrchestrationRun' AND valid_to IS NULL "
                    "AND entity_id = ANY(%s)",
                    (run_ids,),
                )
                return {
                    row[0]: row[1] if isinstance(row[1], dict) else json.loads(row[1])
                    for row in cur.fetchall()
                }
        except Exception:
            return {}
        finally:
            conn.close()

    @staticmethod
    def _rules_fallback(signals: Dict, reason: str = "") -> Recommendation:
        """Extract recommendation from current signals using rules-engine logic.

        Mirrors the deterministic decisions already made by the orchestrator:
        project_type -> hosting, services -> sidecars, detected port, etc.
        """
        dep_signals = signals.get("dependency_signals", {})
        sidecars = []
        if dep_signals.get("has_pg") or dep_signals.get("has_prisma"):
            sidecars.append("postgres")
        if dep_signals.get("has_mysql"):
            sidecars.append("mysql")
        if dep_signals.get("has_redis"):
            sidecars.append("redis")
        if dep_signals.get("has_ollama"):
            sidecars.append("ollama")
        if dep_signals.get("has_mongodb"):
            sidecars.append("mongodb")

        hosting = signals.get("hosting_requested", "akash")
        port = signals.get("port")

        return Recommendation(
            sidecars=sidecars,
            hosting=hosting,
            port=port,
            score=0.0,
            basis="rules",
            details={"fallback_reason": reason} if reason else {},
        )
