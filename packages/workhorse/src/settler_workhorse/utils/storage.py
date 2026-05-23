"""Storage utility functions."""

from pathlib import Path

from settler_workhorse.config import get_settings


def fetch_file_content(file_path: str) -> bytes:
    """Fetch file content from the configured storage service.

    Args:
        file_path: Path or key of the file to fetch

    Returns:
        File content as bytes
    """
    settings = get_settings()

    if settings.storage_type == "local":
        base_path = Path(settings.storage_local_path).resolve()
        full_path = (base_path / file_path).resolve()

        # Prevent directory traversal
        if not full_path.is_relative_to(base_path):
            raise ValueError("Path traversal detected")

        if not full_path.is_file():
            raise FileNotFoundError(f"File not found: {file_path}")

        return full_path.read_bytes()

    elif settings.storage_type == "s3":
        try:
            import boto3
            import botocore.exceptions
        except ImportError:
            raise RuntimeError("boto3 is required for S3 storage. Install with: pip install boto3")

        s3_client = boto3.client(
            "s3",
            region_name=settings.storage_s3_region,
            aws_access_key_id=settings.storage_s3_access_key,
            aws_secret_access_key=settings.storage_s3_secret_key,
        )
        try:
            response = s3_client.get_object(Bucket=settings.storage_s3_bucket, Key=file_path)
            return response["Body"].read()
        except botocore.exceptions.ClientError as e:
            raise ValueError(f"Failed to fetch file from S3: {e}") from e

    elif settings.storage_type == "r2":
        try:
            import boto3
            import botocore.exceptions
        except ImportError:
            raise RuntimeError("boto3 is required for R2 storage. Install with: pip install boto3")

        if not settings.storage_r2_account_id:
            raise ValueError("WORKHORSE_STORAGE_R2_ACCOUNT_ID is not configured")

        endpoint_url = f"https://{settings.storage_r2_account_id}.r2.cloudflarestorage.com"
        s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            region_name="auto",
            aws_access_key_id=settings.storage_s3_access_key,
            aws_secret_access_key=settings.storage_s3_secret_key,
        )
        try:
            response = s3_client.get_object(Bucket=settings.storage_r2_bucket, Key=file_path)
            return response["Body"].read()
        except botocore.exceptions.ClientError as e:
            raise ValueError(f"Failed to fetch file from R2: {e}") from e

    else:
        raise ValueError(f"Unsupported storage type: {settings.storage_type}")


def fetch_url_content(file_url: str) -> bytes:
    """Fetch file content from a URL.

    Args:
        file_url: URL of the file to fetch

    Returns:
        File content as bytes
    """
    try:
        import httpx
    except ImportError:
        raise RuntimeError("httpx is required for URL downloads. Install with: pip install httpx")

    try:
        with httpx.Client() as client:
            response = client.get(file_url, follow_redirects=True)
            response.raise_for_status()
            return response.read()
    except Exception as e:
        raise ValueError(f"Failed to download file from URL: {e}") from e
