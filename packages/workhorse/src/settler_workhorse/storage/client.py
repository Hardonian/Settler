import os

import httpx

from settler_workhorse.config import get_settings


class StorageClient:
    """Client for interacting with storage services."""

    def __init__(self):
        self.settings = get_settings()
        self.base_path = os.path.abspath(self.settings.storage_local_path)

    def get_file_content(self, file_path: str) -> bytes:
        """Get file content from the configured storage service.

        Args:
            file_path: The path to the file in storage

        Returns:
            The file content as bytes
        """
        if self.settings.storage_type == "local":
            # Prevent directory traversal attacks
            full_path = os.path.abspath(os.path.join(self.base_path, file_path))

            # Ensure the resolved path starts with base_path + os.sep
            # to strictly prevent sibling directory traversal
            if not full_path.startswith(self.base_path + os.sep):
                raise ValueError("Invalid file path: path traversal detected")

            if not os.path.exists(full_path):
                raise FileNotFoundError(f"File not found: {file_path}")

            with open(full_path, "rb") as f:
                return f.read()
        else:
            raise NotImplementedError(f"Storage type {self.settings.storage_type} not implemented")

    def download_url(self, url: str) -> bytes:
        """Download file content from a URL.

        Args:
            url: The URL to download

        Returns:
            The file content as bytes
        """
        with httpx.Client() as client:
            response = client.get(url)
            response.raise_for_status()
            return response.content


_storage_client = None


def get_storage_client() -> StorageClient:
    """Get the storage client singleton."""
    global _storage_client
    if _storage_client is None:
        _storage_client = StorageClient()
    return _storage_client
