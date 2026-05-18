import base64
import os
import tempfile
import httpx
import pytest
import respx

# Set required env vars for tests
import os
os.environ['WORKHORSE_DATABASE_URL'] = 'postgresql://dummy:dummy@localhost:5432/dummy'

from settler_workhorse.storage import get_file_content
from settler_workhorse.config import get_settings


def test_get_file_content_base64():
    """Test getting content from base64 payload."""
    original_content = b"test content"
    b64_content = base64.b64encode(original_content).decode('ascii')

    payload = {"file_content_base64": b64_content}
    content = get_file_content(payload)

    assert content == original_content


@respx.mock
def test_get_file_content_url():
    """Test getting content from URL payload."""
    url = "https://example.com/data.csv"
    mock_content = b"csv,data\n1,2"

    respx.get(url).respond(status_code=200, content=mock_content)

    payload = {"file_url": url}
    content = get_file_content(payload)

    assert content == mock_content


def test_get_file_content_local_file(monkeypatch):
    """Test getting content from local file path payload."""
    settings = get_settings()

    with tempfile.TemporaryDirectory() as temp_dir:
        # Override storage path to our temp dir
        monkeypatch.setattr(settings, "storage_type", "local")
        monkeypatch.setattr(settings, "storage_local_path", temp_dir)

        # We need to mock get_settings to return our modified settings
        monkeypatch.setattr("settler_workhorse.storage.get_settings", lambda: settings)

        test_file = "test.csv"
        full_path = os.path.join(temp_dir, test_file)
        mock_content = b"local,file,data"

        with open(full_path, "wb") as f:
            f.write(mock_content)

        payload = {"file_path": test_file}
        content = get_file_content(payload)

        assert content == mock_content


def test_get_file_content_path_traversal(monkeypatch):
    """Test path traversal protection for local file path payload."""
    settings = get_settings()

    with tempfile.TemporaryDirectory() as temp_dir:
        monkeypatch.setattr(settings, "storage_type", "local")
        monkeypatch.setattr(settings, "storage_local_path", temp_dir)
        monkeypatch.setattr("settler_workhorse.storage.get_settings", lambda: settings)

        payload = {"file_path": "../etc/passwd"}

        with pytest.raises(ValueError, match="Path traversal detected|Invalid file_path"):
            get_file_content(payload)


def test_get_file_content_no_payload():
    """Test error when no valid payload is provided."""
    payload = {"other_key": "value"}

    with pytest.raises(ValueError, match="No file content provided"):
        get_file_content(payload)
