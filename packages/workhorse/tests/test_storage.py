import pytest

from settler_workhorse.storage.client import LocalStorageClient


def test_local_storage(tmp_path):
    """Test local storage."""
    client = LocalStorageClient(str(tmp_path))
    file_path = "test.txt"
    content = b"hello"

    with open(tmp_path / file_path, "wb") as f:
        f.write(content)

    assert client.download_file(file_path) == content


def test_local_storage_path_traversal(tmp_path):
    """Test local storage path traversal prevention."""
    client = LocalStorageClient(str(tmp_path))

    with pytest.raises(ValueError, match="path traversal not allowed"):
        client.download_file("../../../etc/passwd")


def test_local_storage_absolute_path(tmp_path):
    """Test local storage absolute path prevention."""
    client = LocalStorageClient(str(tmp_path))

    with pytest.raises(ValueError, match="absolute paths not allowed"):
        client.download_file("/etc/passwd")


def test_local_storage_path_traversal_sibling(tmp_path):
    """Test local storage path traversal prevention for sibling directories."""
    base = tmp_path / "data"
    base.mkdir()
    sibling = tmp_path / "data-secrets"
    sibling.mkdir()
    secret_file = sibling / "secret.txt"

    with open(secret_file, "wb") as f:
        f.write(b"secret")

    client = LocalStorageClient(str(base))

    with pytest.raises(ValueError, match="path traversal not allowed"):
        client.download_file("../data-secrets/secret.txt")
