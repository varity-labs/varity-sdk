"""Tests for learned_recommender.py — embedding-based similar-repo lookup + voting.

Tests the LearnedRecommender class, including:
- Rules-engine fallback when WM is unavailable or has < MIN_RUNS
- Signal-to-text conversion for tsvector search
- Voting logic among successful neighbor outcomes
- RecommenderProposal entity writing
- Integration with deployment_orchestrator (silent A/B wiring)
"""

from unittest.mock import MagicMock, patch

import pytest

from varitykit.core.learned_recommender import (
    LearnedRecommender,
    Recommendation,
    _signals_to_text,
)


SAMPLE_SIGNALS = {
    "project_type": "nextjs",
    "hosting_requested": "akash",
    "port": 3000,
    "image": "node:20-bookworm-slim",
    "memory_mb": 8192,
    "sidecars_added": ["postgres", "redis"],
    "dependency_signals": {
        "has_pg": True,
        "has_redis": True,
        "has_mongodb": False,
        "has_ollama": False,
        "has_mysql": False,
        "has_prisma": True,
    },
}


# ---------------------------------------------------------------------------
# _signals_to_text
# ---------------------------------------------------------------------------

class TestSignalsToText:
    def test_full_signals(self):
        text = _signals_to_text(SAMPLE_SIGNALS)
        assert "nextjs" in text
        assert "akash" in text
        assert "postgres" in text
        assert "redis" in text
        assert "3000" in text

    def test_dependency_signals_expand_truthy_only(self):
        text = _signals_to_text(SAMPLE_SIGNALS)
        assert "pg" in text
        assert "redis" in text
        assert "prisma" in text
        assert "mongodb" not in text
        assert "ollama" not in text

    def test_empty_signals(self):
        text = _signals_to_text({})
        assert text == ""

    def test_partial_signals(self):
        text = _signals_to_text({"project_type": "python"})
        assert text == "python"


# ---------------------------------------------------------------------------
# Rules fallback
# ---------------------------------------------------------------------------

class TestRulesFallback:
    def test_no_wm_connection_returns_rules(self):
        with patch("varitykit.core.learned_recommender._get_connection", return_value=None):
            rec = LearnedRecommender()
            result = rec.recommend(SAMPLE_SIGNALS)
        assert result.basis == "rules"
        assert result.score == 0.0
        assert "no_wm_connection" in result.details.get("fallback_reason", "")

    def test_insufficient_runs_returns_rules(self):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = (50,)
        mock_cursor.__enter__ = MagicMock(return_value=mock_cursor)
        mock_cursor.__exit__ = MagicMock(return_value=False)
        mock_conn.cursor.return_value = mock_cursor

        with patch("varitykit.core.learned_recommender._get_connection", return_value=mock_conn):
            rec = LearnedRecommender(min_runs=100)
            result = rec.recommend(SAMPLE_SIGNALS)
        assert result.basis == "rules"
        assert "insufficient_data" in result.details.get("fallback_reason", "")

    def test_rules_fallback_extracts_sidecars_from_dependency_signals(self):
        result = LearnedRecommender._rules_fallback(SAMPLE_SIGNALS)
        assert "postgres" in result.sidecars
        assert "redis" in result.sidecars
        assert "mongodb" not in result.sidecars
        assert result.hosting == "akash"
        assert result.port == 3000

    def test_rules_fallback_empty_signals(self):
        result = LearnedRecommender._rules_fallback({})
        assert result.sidecars == []
        assert result.hosting == "akash"
        assert result.port is None
        assert result.basis == "rules"

    def test_rules_fallback_mysql_and_mongodb(self):
        signals = {
            "dependency_signals": {"has_mysql": True, "has_mongodb": True},
            "hosting_requested": "ipfs",
            "port": 8080,
        }
        result = LearnedRecommender._rules_fallback(signals)
        assert "mysql" in result.sidecars
        assert "mongodb" in result.sidecars
        assert result.hosting == "ipfs"
        assert result.port == 8080


# ---------------------------------------------------------------------------
# Voting logic
# ---------------------------------------------------------------------------

def _make_mock_conn_for_voting(run_props_map):
    """Build a mock connection that returns run props for _fetch_run_props."""
    mock_conn = MagicMock()
    mock_cursor = MagicMock()

    rows = [(eid, props) for eid, props in run_props_map.items()]
    mock_cursor.fetchall.return_value = rows
    mock_cursor.__enter__ = MagicMock(return_value=mock_cursor)
    mock_cursor.__exit__ = MagicMock(return_value=False)
    mock_conn.cursor.return_value = mock_cursor
    return mock_conn


class TestVoting:
    def test_vote_selects_most_common_strategy(self):
        similar = [
            ("run-1", 0.95), ("run-2", 0.90), ("run-3", 0.85),
            ("run-4", 0.80), ("run-5", 0.75),
        ]
        outcomes = {
            "out-1": {"run_id": "run-1", "success": True},
            "out-2": {"run_id": "run-2", "success": True},
            "out-3": {"run_id": "run-3", "success": True},
            "out-4": {"run_id": "run-4", "success": False},
            "out-5": {"run_id": "run-5", "success": True},
        }
        run_props = {
            "run-1": {"sidecars_added": ["postgres"], "hosting_requested": "akash", "port": 3000},
            "run-2": {"sidecars_added": ["postgres"], "hosting_requested": "akash", "port": 3000},
            "run-3": {"sidecars_added": ["postgres", "redis"], "hosting_requested": "akash", "port": 3000},
            "run-5": {"sidecars_added": ["postgres"], "hosting_requested": "akash", "port": 8080},
        }

        mock_conn = _make_mock_conn_for_voting(run_props)
        with patch("varitykit.core.learned_recommender._get_connection", return_value=mock_conn):
            rec = LearnedRecommender(k=5)
            result = rec._vote(similar, outcomes, SAMPLE_SIGNALS)

        assert result.basis == "learned"
        assert result.sidecars == ["postgres"]
        assert result.hosting == "akash"
        assert result.port == 3000
        assert result.score == pytest.approx(4 / 5, abs=0.01)

    def test_vote_no_successful_neighbors_falls_back(self):
        similar = [("run-1", 0.9)]
        outcomes = {"out-1": {"run_id": "run-1", "success": False}}

        mock_conn = _make_mock_conn_for_voting({})
        with patch("varitykit.core.learned_recommender._get_connection", return_value=mock_conn):
            rec = LearnedRecommender(k=1)
            result = rec._vote(similar, outcomes, SAMPLE_SIGNALS)

        assert result.basis == "rules"
        assert "no_successful_neighbors" in result.details.get("fallback_reason", "")

    def test_vote_empty_outcomes_falls_back(self):
        similar = [("run-1", 0.9), ("run-2", 0.8)]
        outcomes = {}

        mock_conn = _make_mock_conn_for_voting({})
        with patch("varitykit.core.learned_recommender._get_connection", return_value=mock_conn):
            rec = LearnedRecommender(k=2)
            result = rec._vote(similar, outcomes, SAMPLE_SIGNALS)

        assert result.basis == "rules"


# ---------------------------------------------------------------------------
# RecommenderProposal writing
# ---------------------------------------------------------------------------

class TestWriteProposal:
    def test_write_proposal_no_connection_returns_none(self):
        with patch("varitykit.core.learned_recommender._get_connection", return_value=None):
            rec = LearnedRecommender()
            result = rec.write_proposal(SAMPLE_SIGNALS, Recommendation(
                sidecars=["postgres"], hosting="akash", port=3000,
                score=0.8, basis="learned",
            ))
        assert result is None

    def test_write_proposal_success(self):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.__enter__ = MagicMock(return_value=mock_cursor)
        mock_cursor.__exit__ = MagicMock(return_value=False)
        mock_conn.cursor.return_value = mock_cursor
        mock_conn.__enter__ = MagicMock(return_value=mock_conn)
        mock_conn.__exit__ = MagicMock(return_value=False)

        with patch("varitykit.core.learned_recommender._get_connection", return_value=mock_conn):
            rec = LearnedRecommender()
            entity_id = rec.write_proposal(SAMPLE_SIGNALS, Recommendation(
                sidecars=["postgres"], hosting="akash", port=3000,
                score=0.8, basis="learned",
            ))

        assert entity_id is not None
        assert entity_id.startswith("rec-proposal-")
        mock_cursor.execute.assert_called_once()
        call_args = mock_cursor.execute.call_args
        assert "RecommenderProposal" in call_args[0][1][0]

    def test_write_proposal_db_error_returns_none(self):
        mock_conn = MagicMock()
        mock_conn.__enter__ = MagicMock(side_effect=Exception("db error"))
        mock_conn.__exit__ = MagicMock(return_value=False)

        with patch("varitykit.core.learned_recommender._get_connection", return_value=mock_conn):
            rec = LearnedRecommender()
            result = rec.write_proposal(SAMPLE_SIGNALS, Recommendation(
                sidecars=[], hosting="akash", port=3000,
                score=0.5, basis="rules",
            ))
        assert result is None


# ---------------------------------------------------------------------------
# Recommendation dataclass
# ---------------------------------------------------------------------------

class TestRecommendation:
    def test_recommendation_fields(self):
        r = Recommendation(
            sidecars=["postgres", "redis"],
            hosting="akash",
            port=3000,
            score=0.85,
            basis="learned",
            details={"k": 20},
        )
        assert r.sidecars == ["postgres", "redis"]
        assert r.hosting == "akash"
        assert r.port == 3000
        assert r.score == 0.85
        assert r.basis == "learned"
        assert r.details["k"] == 20

    def test_recommendation_default_details(self):
        r = Recommendation(
            sidecars=[], hosting="ipfs", port=None,
            score=0.0, basis="rules",
        )
        assert r.details == {}


# ---------------------------------------------------------------------------
# Low-confidence threshold
# ---------------------------------------------------------------------------

class TestScoreThreshold:
    def test_low_score_defers_to_rules(self):
        """When voting produces a score below threshold, recommend() falls back to rules."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = (200,)
        mock_cursor.__enter__ = MagicMock(return_value=mock_cursor)
        mock_cursor.__exit__ = MagicMock(return_value=False)
        mock_conn.cursor.return_value = mock_cursor

        similar = [("run-1", 0.1), ("run-2", 0.1)]
        outcomes = {
            "out-1": {"run_id": "run-1", "success": True},
        }

        with patch("varitykit.core.learned_recommender._get_connection", return_value=mock_conn):
            rec = LearnedRecommender(min_runs=100, k=20, score_threshold=0.6)
            with patch.object(rec, "_count_runs", return_value=200):
                with patch.object(rec, "_find_similar_runs", return_value=similar):
                    with patch.object(rec, "_fetch_outcomes", return_value=outcomes):
                        with patch.object(rec, "_vote", return_value=Recommendation(
                            sidecars=["postgres"], hosting="akash", port=3000,
                            score=0.05, basis="learned",
                        )):
                            result = rec.recommend(SAMPLE_SIGNALS)

        assert result.basis == "rules"
        assert "low_confidence" in result.details.get("fallback_reason", "")


# ---------------------------------------------------------------------------
# Orchestrator integration (silent A/B wiring)
# ---------------------------------------------------------------------------

class TestOrchestratorIntegration:
    def test_run_learned_recommender_method_exists(self):
        from varitykit.core.deployment_orchestrator import DeploymentOrchestrator
        assert hasattr(DeploymentOrchestrator, "_run_learned_recommender")

    def test_run_learned_recommender_is_fire_and_forget(self):
        from varitykit.core.deployment_orchestrator import DeploymentOrchestrator
        with patch("varitykit.core.learned_recommender._get_connection", return_value=None):
            with patch("threading.Thread") as mock_thread:
                mock_instance = MagicMock()
                mock_thread.return_value = mock_instance
                DeploymentOrchestrator._run_learned_recommender(SAMPLE_SIGNALS)
                mock_thread.assert_called_once()
                assert mock_thread.call_args[1].get("daemon") is True
                mock_instance.start.assert_called_once()
