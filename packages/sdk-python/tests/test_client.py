"""Tests for Settler Python SDK."""

import pytest
from unittest.mock import patch, MagicMock
from settler import (
    SettlerClient,
    SettlerError,
    NetworkError,
    AuthenticationError,
    ValidationError,
    NotFoundError,
    RateLimitError,
    ServerError,
)


class TestSettlerClient:
    def test_requires_api_key(self):
        with pytest.raises(ValueError, match="API key is required"):
            SettlerClient(api_key="")

    def test_default_base_url(self):
        client = SettlerClient(api_key="sk_test")
        assert client._base_url == "https://api.settler.io/api/v1"

    def test_custom_base_url(self):
        client = SettlerClient(api_key="sk_test", base_url="http://localhost:3000/api/v1")
        assert client._base_url == "http://localhost:3000/api/v1"

    def test_api_key_auth_header(self):
        client = SettlerClient(api_key="sk_test_key")
        headers = client._get_headers()
        assert headers["X-API-Key"] == "sk_test_key"
        assert "Authorization" not in headers

    def test_bearer_auth_header(self):
        client = SettlerClient(api_key="eyJhbGciOiJIUzI1NiJ9.test")
        headers = client._get_headers()
        assert headers["Authorization"] == "Bearer eyJhbGciOiJIUzI1NiJ9.test"
        assert "X-API-Key" not in headers

    def test_rk_prefix_uses_api_key(self):
        client = SettlerClient(api_key="rk_test_key")
        headers = client._get_headers()
        assert headers["X-API-Key"] == "rk_test_key"

    def test_sub_clients_initialized(self):
        client = SettlerClient(api_key="sk_test")
        assert client.transactions is not None
        assert client.settlements is not None
        assert client.fees is not None
        assert client.exports is not None
        assert client.currency is not None
        assert client.webhooks is not None
        assert client.jobs is not None
        assert client.reports is not None


class TestExceptionHierarchy:
    def test_base_error(self):
        err = SettlerError("test", 500)
        assert str(err) == "test"
        assert err.status_code == 500

    def test_network_error_is_settler_error(self):
        assert issubclass(NetworkError, SettlerError)

    def test_auth_error_is_settler_error(self):
        assert issubclass(AuthenticationError, SettlerError)

    def test_validation_error_is_settler_error(self):
        assert issubclass(ValidationError, SettlerError)

    def test_not_found_error_is_settler_error(self):
        assert issubclass(NotFoundError, SettlerError)

    def test_rate_limit_error_is_settler_error(self):
        assert issubclass(RateLimitError, SettlerError)

    def test_server_error_is_settler_error(self):
        assert issubclass(ServerError, SettlerError)


class TestErrorMapping:
    """Test that HTTP status codes map to correct exception types."""

    def _mock_response(self, status_code, body='{"message":"test"}'):
        resp = MagicMock()
        resp.status_code = status_code
        resp.content = body.encode()
        resp.headers = {"content-type": "application/json"}
        resp.json.return_value = {"message": "test"}
        resp.text = body
        return resp

    def test_400_raises_validation(self):
        client = SettlerClient(api_key="sk_test")
        with pytest.raises(ValidationError):
            client._handle_response(self._mock_response(400))

    def test_401_raises_auth(self):
        client = SettlerClient(api_key="sk_test")
        with pytest.raises(AuthenticationError):
            client._handle_response(self._mock_response(401))

    def test_404_raises_not_found(self):
        client = SettlerClient(api_key="sk_test")
        with pytest.raises(NotFoundError):
            client._handle_response(self._mock_response(404))

    def test_429_raises_rate_limit(self):
        client = SettlerClient(api_key="sk_test")
        with pytest.raises(RateLimitError):
            client._handle_response(self._mock_response(429))

    def test_500_raises_server(self):
        client = SettlerClient(api_key="sk_test")
        with pytest.raises(ServerError):
            client._handle_response(self._mock_response(500))

    def test_200_returns_data(self):
        client = SettlerClient(api_key="sk_test")
        resp = self._mock_response(200)
        result = client._handle_response(resp)
        assert result == {"message": "test"}
