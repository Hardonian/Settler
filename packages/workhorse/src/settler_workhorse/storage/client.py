"""Storage client implementations."""

import os
from abc import ABC, abstractmethod

from settler_workhorse.config import get_settings


class StorageClient(ABC):
    """Abstract base class for storage clients."""

    @abstractmethod
    def download_file(self, file_path: str) -> bytes:
        """Download file content as bytes.

        Args:
            file_path: Path to the file in storage

        Returns:
            File content as bytes
        """
        pass


class LocalStorageClient(StorageClient):
    """Local file system storage client."""

    def __init__(self, base_path: str):
        self.base_path = os.path.abspath(base_path)

    def download_file(self, file_path: str) -> bytes:
        """Download file from local path."""
        # Sanitize and resolve path
        # Check for absolute paths passed by the user
        if os.path.isabs(file_path):
            raise ValueError("Invalid file path: absolute paths not allowed")

        full_path = os.path.abspath(os.path.join(self.base_path, file_path))

        # Security check: ensure path is within base path to prevent path traversal
        if not full_path.startswith(self.base_path + os.sep) and full_path != self.base_path:
            raise ValueError("Invalid file path: path traversal not allowed")

        with open(full_path, "rb") as f:
            return f.read()


def get_storage_client() -> StorageClient:
    """Factory to get the appropriate storage client based on configuration."""
    settings = get_settings()

    if settings.storage_type == "local":
        return LocalStorageClient(settings.storage_local_path)

    raise NotImplementedError(f"Storage type {settings.storage_type} not supported")
