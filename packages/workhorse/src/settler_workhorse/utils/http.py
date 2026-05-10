"""HTTP utilities."""

import httpx


def download_from_url(url: str, timeout: int = 30) -> bytes:
    """Download content from a URL.

    Security check: Ensure URL scheme is https to prevent SSRF vulnerabilities
    with internal protocols (e.g., file://, ftp://).

    Args:
        url: URL to download from
        timeout: Request timeout in seconds

    Returns:
        Downloaded content as bytes
    """
    if not url.lower().startswith("https://"):
        raise ValueError("Invalid URL scheme. Only https is supported for security reasons.")

    with httpx.Client(timeout=timeout) as client:
        response = client.get(url)
        response.raise_for_status()
        return response.content
