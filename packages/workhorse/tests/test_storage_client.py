import pytest

from settler_workhorse.config import Settings
from settler_workhorse.storage.client import get_storage_client


def test_local_storage_get_file_content(tmp_path):
    """Test getting file content from local storage."""
    settings = Settings(
        database_url="postgresql://dummy", storage_type="local", storage_local_path=str(tmp_path)
    )

    test_file = tmp_path / "test.csv"
    test_file.write_bytes(b"test content")

    # We mock get_settings to return our custom settings
    with pytest.MonkeyPatch.context() as m:
        m.setattr("settler_workhorse.storage.client.get_settings", lambda: settings)

        client = get_storage_client()
        content = client.get_file_content("test.csv")
        assert content == b"test content"


def test_local_storage_path_traversal(tmp_path):
    """Test that path traversal is prevented in local storage."""
    settings = Settings(
        database_url="postgresql://dummy", storage_type="local", storage_local_path=str(tmp_path)
    )

    with pytest.MonkeyPatch.context() as m:
        m.setattr("settler_workhorse.storage.client.get_settings", lambda: settings)

        client = get_storage_client()
        with pytest.raises(ValueError, match="path traversal detected"):
            client.get_file_content("../outside.csv")


def test_local_storage_file_not_found(tmp_path):
    """Test handling of non-existent files in local storage."""
    settings = Settings(
        database_url="postgresql://dummy", storage_type="local", storage_local_path=str(tmp_path)
    )

    with pytest.MonkeyPatch.context() as m:
        m.setattr("settler_workhorse.storage.client.get_settings", lambda: settings)

        client = get_storage_client()
        with pytest.raises(FileNotFoundError):
            client.get_file_content("nonexistent.csv")


def test_download_url(respx_mock):
    """Test downloading content from a URL."""
    settings = Settings(
        database_url="postgresql://dummy", storage_type="local", storage_local_path="/tmp"
    )

    with pytest.MonkeyPatch.context() as m:
        m.setattr("settler_workhorse.storage.client.get_settings", lambda: settings)

        client = get_storage_client()

        url = "https://example.com/test.csv"
        respx_mock.get(url).respond(content=b"downloaded content")

        content = client.download_url(url)
        assert content == b"downloaded content"
