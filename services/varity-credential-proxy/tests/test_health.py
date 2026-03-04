"""Tests for the health check endpoint."""

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


def test_health_returns_200():
    response = client.get("/health")
    assert response.status_code == 200


def test_health_response_structure():
    response = client.get("/health")
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "varity-credential-proxy"
    assert data["version"] == "1.0.0"
    assert "environment" in data


def test_health_no_auth_required():
    """Health check should work without any authorization header."""
    response = client.get("/health")
    assert response.status_code == 200
