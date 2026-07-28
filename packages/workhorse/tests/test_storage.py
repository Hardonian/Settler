from unittest.mock import MagicMock, patch

import pytest

from settler_workhorse.config import Settings
from settler_workhorse.utils.storage import fetch_file_content, fetch_url_content


def get_mock_settings():
    return Settings(database_url="postgresql://localhost:5432/test")


def test_fetch_file_content_local(tmp_path):
    settings = get_mock_settings()
    settings.storage_type = "local"
    settings.storage_local_path = str(tmp_path)

    test_file = tmp_path / "test.csv"
    test_file.write_bytes(b"test,content")

    with patch("settler_workhorse.utils.storage.get_settings", return_value=settings):
        content = fetch_file_content("test.csv")
        assert content == b"test,content"


def test_fetch_file_content_local_traversal(tmp_path):
    settings = get_mock_settings()
    settings.storage_type = "local"
    settings.storage_local_path = str(tmp_path)

    with patch("settler_workhorse.utils.storage.get_settings", return_value=settings):
        with pytest.raises(ValueError, match="Path traversal detected"):
            fetch_file_content("../outside.csv")


def test_fetch_file_content_local_not_found(tmp_path):
    settings = get_mock_settings()
    settings.storage_type = "local"
    settings.storage_local_path = str(tmp_path)

    with patch("settler_workhorse.utils.storage.get_settings", return_value=settings):
        with pytest.raises(FileNotFoundError):
            fetch_file_content("missing.csv")


@patch.dict('sys.modules', {'boto3': MagicMock(), 'botocore': MagicMock(), 'botocore.exceptions': MagicMock()})
def test_fetch_file_content_s3():
    import boto3
    settings = get_mock_settings()
    settings.storage_type = "s3"
    settings.storage_s3_bucket = "test-bucket"
    settings.storage_s3_region = "us-east-1"
    settings.storage_s3_access_key = "key"
    settings.storage_s3_secret_key = "secret"

    mock_s3 = MagicMock()
    boto3.client.return_value = mock_s3

    mock_response = {"Body": MagicMock()}
    mock_response["Body"].read.return_value = b"s3,content"
    mock_s3.get_object.return_value = mock_response

    with patch("settler_workhorse.utils.storage.get_settings", return_value=settings):
        content = fetch_file_content("test.csv")
        assert content == b"s3,content"
        mock_s3.get_object.assert_called_once_with(Bucket="test-bucket", Key="test.csv")


@patch.dict('sys.modules', {'boto3': MagicMock(), 'botocore': MagicMock(), 'botocore.exceptions': MagicMock()})
def test_fetch_file_content_r2():
    import boto3
    settings = get_mock_settings()
    settings.storage_type = "r2"
    settings.storage_r2_bucket = "test-bucket-r2"
    settings.storage_r2_account_id = "account-id"
    settings.storage_s3_access_key = "key"
    settings.storage_s3_secret_key = "secret"

    mock_s3 = MagicMock()
    boto3.client.return_value = mock_s3

    mock_response = {"Body": MagicMock()}
    mock_response["Body"].read.return_value = b"r2,content"
    mock_s3.get_object.return_value = mock_response

    with patch("settler_workhorse.utils.storage.get_settings", return_value=settings):
        content = fetch_file_content("test.csv")
        assert content == b"r2,content"
        boto3.client.assert_called_once_with(
            "s3",
            endpoint_url="https://account-id.r2.cloudflarestorage.com",
            region_name="auto",
            aws_access_key_id="key",
            aws_secret_access_key="secret"
        )
        mock_s3.get_object.assert_called_once_with(Bucket="test-bucket-r2", Key="test.csv")


@patch.dict('sys.modules', {'boto3': MagicMock(), 'botocore': MagicMock(), 'botocore.exceptions': MagicMock()})
def test_fetch_file_content_r2_missing_account_id():
    settings = get_mock_settings()
    settings.storage_type = "r2"
    settings.storage_r2_account_id = None

    with patch("settler_workhorse.utils.storage.get_settings", return_value=settings):
        with pytest.raises(ValueError, match="WORKHORSE_STORAGE_R2_ACCOUNT_ID is not configured"):
            fetch_file_content("test.csv")


def test_fetch_file_content_invalid_type():
    settings = get_mock_settings()
    settings.storage_type = "unknown"

    with patch("settler_workhorse.utils.storage.get_settings", return_value=settings):
        with pytest.raises(ValueError, match="Unsupported storage type: unknown"):
            fetch_file_content("test.csv")


@patch("httpx.Client")
def test_fetch_url_content(mock_httpx_client_class):
    mock_client_instance = MagicMock()
    mock_httpx_client_class.return_value.__enter__.return_value = mock_client_instance

    mock_response = MagicMock()
    mock_response.read.return_value = b"url,content"
    mock_client_instance.get.return_value = mock_response

    content = fetch_url_content("https://example.com/test.csv")
    assert content == b"url,content"
    mock_client_instance.get.assert_called_once_with("https://example.com/test.csv", follow_redirects=True)
    mock_response.raise_for_status.assert_called_once()
