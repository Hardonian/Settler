import pytest
import base64
from uuid import uuid4
from datetime import datetime
from settler_workhorse.models import Job, JobType
from settler_workhorse.handlers.csv_ingestion import handle_csv_ingestion
from unittest.mock import patch, MagicMock

def test_csv_ingestion_with_url():
    job = Job(
        id=uuid4(),
        tenant_id=uuid4(),
        job_type=JobType.CSV_INGESTION,
        payload={
            "file_url": "https://example.com/test.csv",
            "column_mapping": {
                "amount": "amount",
                "date": "date"
            }
        },
        created_at=datetime.utcnow()
    )

    with patch("httpx.get") as mock_get:
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_response.content = b"amount,date\n100,2024-01-01\n200,2024-01-02"
        mock_get.return_value = mock_response

        result = handle_csv_ingestion(job)

        assert result.success is True
        assert result.records_processed == 2
        mock_get.assert_called_once_with("https://example.com/test.csv", timeout=30.0)

def test_csv_ingestion_with_url_failure():
    job = Job(
        id=uuid4(),
        tenant_id=uuid4(),
        job_type=JobType.CSV_INGESTION,
        payload={
            "file_url": "https://example.com/test.csv"
        },
        created_at=datetime.utcnow()
    )

    with patch("httpx.get") as mock_get:
        import httpx
        mock_get.side_effect = httpx.RequestError("Failed to connect")

        result = handle_csv_ingestion(job)

        assert result.success is False
        assert "Failed to connect" in result.error

if __name__ == "__main__":
    pytest.main(["-v", __file__])
