import base64
import os
from typing import Any

import httpx

from settler_workhorse.config import get_settings


def get_file_content(payload: dict[str, Any]) -> bytes:
    """Get file content from storage based on the provided payload.

    Args:
        payload: Job payload containing file reference

    Returns:
        File content as bytes

    Raises:
        ValueError: If no file content reference is provided or file cannot be retrieved
        NotImplementedError: If the requested storage backend is not implemented
    """
    settings = get_settings()

    file_content_b64 = payload.get("file_content_base64")
    if file_content_b64:
        return base64.b64decode(file_content_b64)

    file_url = payload.get("file_url")
    if file_url:
        try:
            with httpx.Client() as client:
                response = client.get(file_url, follow_redirects=True)
                response.raise_for_status()
                return response.content
        except Exception as e:
            raise ValueError(f"Failed to download file from URL: {e}") from e

    file_path = payload.get("file_path")
    if file_path:
        storage_type = settings.storage_type
        if storage_type == "local":
            base_path = os.path.abspath(settings.storage_local_path)

            # Prevent empty path resolution to root
            if not file_path or file_path.strip() == "/" or ".." in file_path:
                raise ValueError("Invalid file_path")

            # Resolve absolute path and normalize separators
            full_path = os.path.abspath(os.path.join(base_path, file_path.lstrip("/")))

            # Path traversal protection
            if not full_path.startswith(base_path + os.sep) and full_path != base_path:
                raise ValueError("Path traversal detected")

            try:
                with open(full_path, "rb") as f:
                    return f.read()
            except Exception as e:
                raise ValueError(f"Failed to read file from local storage: {e}") from e
        else:
            raise NotImplementedError(f"Storage type '{storage_type}' not implemented")

    raise ValueError(
        "No file content provided (file_path, file_url, or file_content_base64 required)"
    )
