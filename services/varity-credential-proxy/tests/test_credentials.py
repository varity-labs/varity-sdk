"""Tests for credential endpoints — auth, tier-based filtering, error handling."""

import os
os.environ["ENV"] = "development"
os.environ["VARITY_THIRDWEB_SECRET_KEY"] = "test_secret_key_for_testing"
os.environ["VARITY_THIRDWEB_CLIENT_ID"] = "test_client_id"
os.environ["VARITY_PRIVY_APP_ID"] = "test_privy_app_id"
os.environ["VARITY_CLI_PRODUCTION_KEY"] = "test_prod_key_32chars_minimum_ok"
os.environ["VARITY_CLI_BETA_KEY"] = "test_beta_key_32chars_minimum_ok"
os.environ["VARITY_CLI_DEV_KEY"] = "test_dev_key_local"

from fastapi.testclient import TestClient
from src.main import app


client = TestClient(app)

PROD_KEY = "test_prod_key_32chars_minimum_ok"
BETA_KEY = "test_beta_key_32chars_minimum_ok"
DEV_KEY = "test_dev_key_local"


class TestThirdwebCredentials:
    """Tests for GET /api/credentials/thirdweb"""

    def test_returns_credentials_with_production_key(self):
        response = client.get(
            "/api/credentials/thirdweb",
            headers={"Authorization": f"Bearer {PROD_KEY}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
        assert "secret_key" in data
        assert data["client_id"] == "test_client_id"
        assert data["secret_key"] == "test_secret_key_for_testing"

    def test_returns_credentials_with_beta_key(self):
        response = client.get(
            "/api/credentials/thirdweb",
            headers={"Authorization": f"Bearer {BETA_KEY}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["secret_key"] == "test_secret_key_for_testing"

    def test_dev_tier_gets_no_secret_key(self):
        """Dev tier should only get client_id, NOT the secret key."""
        response = client.get(
            "/api/credentials/thirdweb",
            headers={"Authorization": f"Bearer {DEV_KEY}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["client_id"] == "test_client_id"
        assert data["secret_key"] == ""

    def test_rejects_no_auth_header(self):
        """FastAPI HTTPBearer returns 403 when no Bearer scheme is present."""
        response = client.get("/api/credentials/thirdweb")
        assert response.status_code == 403

    def test_rejects_invalid_key(self):
        """Our middleware returns 401 for invalid but properly formatted Bearer tokens."""
        response = client.get(
            "/api/credentials/thirdweb",
            headers={"Authorization": "Bearer invalid_key_here"},
        )
        assert response.status_code == 401

    def test_rejects_empty_bearer(self):
        """FastAPI HTTPBearer returns 403 for empty Bearer value."""
        response = client.get(
            "/api/credentials/thirdweb",
            headers={"Authorization": "Bearer "},
        )
        assert response.status_code == 403

    def test_rejects_non_bearer_auth(self):
        """FastAPI HTTPBearer returns 403 for non-Bearer auth schemes."""
        response = client.get(
            "/api/credentials/thirdweb",
            headers={"Authorization": "Basic abc123"},
        )
        assert response.status_code == 403


class TestPrivyCredentials:
    """Tests for GET /api/credentials/privy"""

    def test_returns_privy_app_id(self):
        response = client.get(
            "/api/credentials/privy",
            headers={"Authorization": f"Bearer {PROD_KEY}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["app_id"] == "test_privy_app_id"

    def test_rejects_no_auth(self):
        """FastAPI HTTPBearer returns 403 when no Bearer scheme is present."""
        response = client.get("/api/credentials/privy")
        assert response.status_code == 403

    def test_all_tiers_get_privy_app_id(self):
        """Privy app_id is safe for all tiers (it's public)."""
        for key in [PROD_KEY, BETA_KEY, DEV_KEY]:
            response = client.get(
                "/api/credentials/privy",
                headers={"Authorization": f"Bearer {key}"},
            )
            assert response.status_code == 200
            assert response.json()["app_id"] == "test_privy_app_id"


class TestErrorHandling:
    """Tests for error responses and security."""

    def test_404_for_unknown_endpoint(self):
        response = client.get(
            "/api/credentials/unknown",
            headers={"Authorization": f"Bearer {PROD_KEY}"},
        )
        assert response.status_code in [404, 422]

    def test_error_response_never_contains_credentials(self):
        """Error responses should never leak credentials."""
        response = client.get(
            "/api/credentials/thirdweb",
            headers={"Authorization": "Bearer wrong_key"},
        )
        body = response.text
        assert "test_secret_key_for_testing" not in body
        assert "test_prod_key_32chars_minimum_ok" not in body
