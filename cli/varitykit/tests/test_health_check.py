"""
Rigorous tests for the Akash deploy health-check wait.

The health check polls the provider URL until the *container* responds.
Any HTTP status from the container (2xx, 3xx, 4xx, 5xx) means it is
alive — deploy succeeded. Only 502/503 are rejected because those come
from the Akash ingress when the backend isn't ready yet.

  * 2xx (200, 201, 204) → healthy
  * 3xx / 4xx / 5xx (except 502, 503) → healthy (container alive)
  * 502 / 503 → NOT healthy (ingress says backend not ready)
  * Network errors (connection refused, DNS, timeout) → keep polling
  * Overall timeout → return False, let caller surface dseq+url so the
    user can pull logs
  * URL without a scheme → http:// prepended before we probe
"""

import io
import urllib.error
from unittest.mock import patch

import pytest

from varitykit.services.akash_deploy_service import (
    _ensure_scheme,
    _wait_for_healthy,
)


# ---------------------------------------------------------------------------
# Fakes / helpers
# ---------------------------------------------------------------------------

class _FakeResponse:
    """Minimal stand-in for the object `urllib.request.urlopen` returns."""

    def __init__(self, status: int):
        self.status = status

    def getcode(self):
        return self.status

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


def _http_error(code: int) -> urllib.error.HTTPError:
    return urllib.error.HTTPError(
        url="http://x/",
        code=code,
        msg="error",
        hdrs=None,
        fp=io.BytesIO(b""),
    )


# A poll interval small enough that even a 10-poll test finishes well
# under a second. Production defaults are 5s poll / 300s timeout.
FAST_POLL = 0.001
FAST_TIMEOUT = 1.0


# ---------------------------------------------------------------------------
# Test 1: default mode requires a stable success streak
# ---------------------------------------------------------------------------

def test_wait_returns_true_when_first_poll_is_200():
    with patch(
        "varitykit.services.akash_deploy_service.urllib.request.urlopen",
        return_value=_FakeResponse(200),
    ) as mock_open:
        ok = _wait_for_healthy(
            url="http://example.com/",
            timeout=FAST_TIMEOUT,
            poll_interval=FAST_POLL,
        )

    assert ok is True
    assert mock_open.call_count == 3


# ---------------------------------------------------------------------------
# Test 2: healthy streak can arrive after initial failures
# ---------------------------------------------------------------------------

def test_wait_returns_true_when_third_poll_is_200():
    # First two polls: connection refused. Then three 200s for stable readiness.
    side_effects = [
        ConnectionRefusedError("nope"),
        ConnectionRefusedError("still no"),
        _FakeResponse(200),
        _FakeResponse(200),
        _FakeResponse(200),
    ]

    with patch(
        "varitykit.services.akash_deploy_service.urllib.request.urlopen",
        side_effect=side_effects,
    ) as mock_open:
        ok = _wait_for_healthy(
            url="http://example.com/",
            timeout=FAST_TIMEOUT,
            poll_interval=FAST_POLL,
        )

    assert ok is True
    assert mock_open.call_count == 5


# ---------------------------------------------------------------------------
# Test 3: never healthy → returns False after timeout
# ---------------------------------------------------------------------------

def test_wait_returns_false_when_never_healthy():
    # Always 502 Bad Gateway — a response, but never a healthy one.
    with patch(
        "varitykit.services.akash_deploy_service.urllib.request.urlopen",
        side_effect=_http_error(502),
    ) as mock_open:
        ok = _wait_for_healthy(
            url="http://example.com/",
            timeout=0.05,            # 50ms — several polls then quit
            poll_interval=FAST_POLL,
        )

    assert ok is False
    # We should have polled *at least once* before giving up.
    assert mock_open.call_count >= 1


# ---------------------------------------------------------------------------
# Test 4: every 2xx code is accepted
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("status", [200, 201, 202, 204, 206, 299])
def test_wait_accepts_any_2xx(status):
    with patch(
        "varitykit.services.akash_deploy_service.urllib.request.urlopen",
        return_value=_FakeResponse(status),
    ):
        ok = _wait_for_healthy(
            url="http://example.com/",
            timeout=FAST_TIMEOUT,
            poll_interval=FAST_POLL,
        )

    assert ok is True, f"Expected {status} to be treated as healthy"


# ---------------------------------------------------------------------------
# Test 5a: container-level responses (3xx/4xx/5xx except 502/503) ARE accepted
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("status", [301, 302, 308, 400, 401, 404, 500])
def test_wait_accepts_container_alive_responses(status):
    # Any HTTP response from the container itself proves it is alive.
    with patch(
        "varitykit.services.akash_deploy_service.urllib.request.urlopen",
        side_effect=_http_error(status),
    ):
        ok = _wait_for_healthy(
            url="http://example.com/",
            timeout=FAST_TIMEOUT,
            poll_interval=FAST_POLL,
        )

    assert ok is True, f"Expected {status} to be treated as healthy (container alive)"


# ---------------------------------------------------------------------------
# Test 5b: 502/503 (ingress "backend not ready") are NOT accepted
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("status", [502, 503])
def test_wait_rejects_ingress_not_ready(status):
    with patch(
        "varitykit.services.akash_deploy_service.urllib.request.urlopen",
        side_effect=_http_error(status),
    ):
        ok = _wait_for_healthy(
            url="http://example.com/",
            timeout=0.05,
            poll_interval=FAST_POLL,
        )

    assert ok is False, f"Expected {status} to NOT be treated as healthy (ingress not ready)"


def test_wait_accepts_3xx_returned_directly():
    # A 3xx response object (not raised as HTTPError) also means
    # the container is alive — accept it.
    with patch(
        "varitykit.services.akash_deploy_service.urllib.request.urlopen",
        return_value=_FakeResponse(301),
    ):
        ok = _wait_for_healthy(
            url="http://example.com/",
            timeout=FAST_TIMEOUT,
            poll_interval=FAST_POLL,
        )

    assert ok is True


# ---------------------------------------------------------------------------
# Test 6: network errors during polling do not fail — keep polling
# ---------------------------------------------------------------------------

def test_wait_ignores_connection_refused():
    # 4 refuseds, then three healthy responses to satisfy default streak.
    side_effects = [ConnectionRefusedError("x")] * 4 + [
        _FakeResponse(200),
        _FakeResponse(200),
        _FakeResponse(200),
    ]
    with patch(
        "varitykit.services.akash_deploy_service.urllib.request.urlopen",
        side_effect=side_effects,
    ) as mock_open:
        ok = _wait_for_healthy(
            url="http://example.com/",
            timeout=FAST_TIMEOUT,
            poll_interval=FAST_POLL,
        )

    assert ok is True
    assert mock_open.call_count == 7


def test_wait_ignores_urlerror_dns_fail():
    side_effects = [
        urllib.error.URLError("Name or service not known"),
        urllib.error.URLError("still no DNS"),
        _FakeResponse(200),
        _FakeResponse(200),
        _FakeResponse(200),
    ]
    with patch(
        "varitykit.services.akash_deploy_service.urllib.request.urlopen",
        side_effect=side_effects,
    ):
        ok = _wait_for_healthy(
            url="http://example.com/",
            timeout=FAST_TIMEOUT,
            poll_interval=FAST_POLL,
        )

    assert ok is True


def test_wait_ignores_socket_timeout():
    import socket

    side_effects = [
        socket.timeout("read timed out"),
        socket.timeout("still slow"),
        _FakeResponse(200),
        _FakeResponse(200),
        _FakeResponse(200),
    ]
    with patch(
        "varitykit.services.akash_deploy_service.urllib.request.urlopen",
        side_effect=side_effects,
    ):
        ok = _wait_for_healthy(
            url="http://example.com/",
            timeout=FAST_TIMEOUT,
            poll_interval=FAST_POLL,
        )

    assert ok is True


def test_wait_returns_false_when_only_network_errors_until_timeout():
    # Nothing but connection refused — we should give up, not hang or raise.
    with patch(
        "varitykit.services.akash_deploy_service.urllib.request.urlopen",
        side_effect=ConnectionRefusedError("nope"),
    ) as mock_open:
        ok = _wait_for_healthy(
            url="http://example.com/",
            timeout=0.05,
            poll_interval=FAST_POLL,
        )

    assert ok is False
    assert mock_open.call_count >= 1


# ---------------------------------------------------------------------------
# Test 7: URL without scheme gets http:// prepended
# ---------------------------------------------------------------------------

def test_ensure_scheme_prepends_http_when_missing():
    assert _ensure_scheme("provider.akash.xyz:8080") == "http://provider.akash.xyz:8080"
    assert _ensure_scheme("example.com") == "http://example.com"


def test_ensure_scheme_preserves_http():
    assert _ensure_scheme("http://example.com") == "http://example.com"


def test_ensure_scheme_preserves_https():
    assert _ensure_scheme("https://example.com/foo") == "https://example.com/foo"


def test_ensure_scheme_passes_empty_through():
    assert _ensure_scheme("") == ""


def test_wait_probes_the_scheme_prepended_url():
    """_wait_for_healthy itself doesn't prepend — that's _ensure_scheme's job
    and the caller uses it — but a plain host:port url with an explicit
    http:// scheme must still work through the normal code path."""
    captured = {}

    def fake_urlopen(req, timeout=None):
        captured["url"] = req.full_url
        return _FakeResponse(200)

    with patch(
        "varitykit.services.akash_deploy_service.urllib.request.urlopen",
        side_effect=fake_urlopen,
    ):
        url = _ensure_scheme("provider.akash.xyz:8080")
        ok = _wait_for_healthy(
            url=url,
            timeout=FAST_TIMEOUT,
            poll_interval=FAST_POLL,
        )

    assert ok is True
    assert captured["url"] == "http://provider.akash.xyz:8080"


# ---------------------------------------------------------------------------
# Bonus: progress logging is throttled so we don't spam the console.
# If this breaks we're either logging every poll (annoying) or never
# logging (confusing). Keep the behavior explicit.
# ---------------------------------------------------------------------------

def test_progress_messages_are_throttled():
    messages: list = []

    def log(msg: str) -> None:
        messages.append(msg)

    # Always fails. Run for ~150ms so we'd get ~15 polls at 10ms each,
    # but with progress_interval=0.05s we should only see a handful of
    # "Still warming" lines, not one per poll.
    with patch(
        "varitykit.services.akash_deploy_service.urllib.request.urlopen",
        side_effect=ConnectionRefusedError("x"),
    ):
        _wait_for_healthy(
            url="http://example.com/",
            log=log,
            timeout=0.15,
            poll_interval=0.01,
            progress_interval=0.05,
        )

    warming = [m for m in messages if "Still warming" in m]
    # We expect at least one "still warming" during the wait, but far
    # fewer than the number of polls.
    assert len(warming) >= 1
    assert len(warming) <= 5
