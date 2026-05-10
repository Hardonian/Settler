import httpx
import pytest

from settler_workhorse.utils.http import download_from_url


def test_download_from_url(respx_mock):
    """Test successful download."""
    url = "https://example.com/test.csv"
    content = b"hello,world"
    respx_mock.get(url).respond(200, content=content)

    assert download_from_url(url) == content


def test_download_from_url_error(respx_mock):
    """Test failed download."""
    url = "https://example.com/error"
    respx_mock.get(url).respond(404)

    with pytest.raises(httpx.HTTPStatusError):
        download_from_url(url)


def test_download_from_url_invalid_scheme():
    """Test failed download due to invalid scheme."""
    url = "http://example.com/test.csv"

    with pytest.raises(ValueError, match="Only https is supported"):
        download_from_url(url)
