"""
Settler Python SDK Client

Production-grade Python client for the Settler Reconciliation API.
Supports all API endpoints: transactions, settlements, fees, exports,
currency, webhooks, jobs, and reports.
"""

from __future__ import annotations

import json
import socket
import time
import uuid
from typing import Any, Dict, List, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .exceptions import (
    AuthenticationError,
    NetworkError,
    NotFoundError,
    RateLimitError,
    ServerError,
    SettlerError,
    ValidationError,
)

class SimpleResponse:
    """Minimal response wrapper to mirror requests.Response fields used by the SDK."""

    def __init__(self, status_code: int, content: bytes, headers: Dict[str, str]) -> None:
        self.status_code = status_code
        self.content = content
        self.headers = headers

    @property
    def text(self) -> str:
        return self.content.decode("utf-8", errors="replace")

    def json(self) -> Dict[str, Any]:
        return json.loads(self.text) if self.content else {}


class SettlerClient:
    """Main client for the Settler Reconciliation API.

    Args:
        api_key: API key or JWT token for authentication.
        base_url: Base URL for the API.
        timeout: Request timeout in seconds.
        max_retries: Maximum number of retries for failed requests.

    Example::

        client = SettlerClient(api_key="sk_your_api_key")
        txns = client.transactions.list(provider="stripe", limit=50)
        job = client.jobs.create(provider="stripe", date_range={"start": "...", "end": "..."})
    """

    DEFAULT_BASE_URL = "https://api.settler.io/api/v1"
    DEFAULT_TIMEOUT = 30
    DEFAULT_MAX_RETRIES = 3
    RETRY_STATUS_CODES = (502, 503, 504)

    def __init__(
        self,
        api_key: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout: int = DEFAULT_TIMEOUT,
        max_retries: int = DEFAULT_MAX_RETRIES,
    ) -> None:
        if not api_key:
            raise ValueError("API key is required")

        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._max_retries = max_retries

        # Deduplication cache
        self._dedup_cache: Dict[str, float] = {}
        self._dedup_ttl = 60.0

        # Initialize sub-clients
        self.transactions = TransactionsClient(self)
        self.settlements = SettlementsClient(self)
        self.fees = FeesClient(self)
        self.exports = ExportsClient(self)
        self.currency = CurrencyClient(self)
        self.webhooks = WebhooksClient(self)
        self.jobs = JobsClient(self)
        self.reports = ReportsClient(self)
        self.flags = FlagsClient(self)
        self.receipts = ReceiptsClient(self)
        self.adapters = AdaptersClient(self)
        self.console = ConsoleClient(self)
        self.runs = RunsClient(self)

    def _get_headers(self) -> Dict[str, str]:
        req_id = str(uuid.uuid4())
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "settler-python/1.0.0",
            "Accept-Encoding": "gzip",
            "X-Request-ID": req_id,
        }
        if self._api_key.startswith("rk_") or self._api_key.startswith("sk_"):
            headers["X-API-Key"] = self._api_key
        else:
            headers["Authorization"] = f"Bearer {self._api_key}"
        return headers

    def _request(
        self,
        method: str,
        path: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """Make an HTTP request to the Settler API."""
        url = f"{self._base_url}{path}"

        # Clean up None values from params
        if params:
            params = {k: v for k, v in params.items() if v is not None}
            if params:
                url = f"{url}?{urlencode(params)}"

        payload = None
        headers = self._get_headers()
        
        if method in ("POST", "PUT", "PATCH"):
            headers["Idempotency-Key"] = headers["X-Request-ID"]

        if data is not None:
            payload = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"

        for attempt in range(self._max_retries + 1):
            try:
                request = Request(url=url, method=method, data=payload, headers=headers)
                with urlopen(request, timeout=self._timeout) as response:
                    body = response.read()
                    simple_response = SimpleResponse(
                        status_code=response.status,
                        content=body,
                        headers=dict(response.headers),
                    )
                    return self._handle_response(simple_response)
            except HTTPError as exc:
                body = exc.read()
                simple_response = SimpleResponse(
                    status_code=exc.code,
                    content=body,
                    headers=dict(exc.headers) if exc.headers else {},
                )
                if exc.code in self.RETRY_STATUS_CODES and attempt < self._max_retries:
                    time.sleep(2**attempt)
                    continue
                return self._handle_response(simple_response)
            except (URLError, socket.timeout) as exc:
                if attempt < self._max_retries:
                    time.sleep(2**attempt)
                    continue
                raise NetworkError(f"Request failed: {exc}") from exc

        raise NetworkError("Request failed after retries")

    def _handle_response(self, response: "SimpleResponse") -> Any:
        """Parse the API response and raise appropriate errors."""
        if 200 <= response.status_code < 300:
            if not response.content:
                return None
            content_type = response.headers.get("content-type", "")
            if "application/json" in content_type:
                return response.json()
            return response.text

        # Parse error body
        message = "Unknown error"
        try:
            body = response.json()
            message = body.get("message") or body.get("error") or message
        except (ValueError, KeyError):
            message = response.text or message

        status = response.status_code
        if status == 400:
            raise ValidationError(message, status)
        elif status in (401, 403):
            raise AuthenticationError(message, status)
        elif status == 404:
            raise NotFoundError(message, status)
        elif status == 429:
            raise RateLimitError(message, status)
        elif 500 <= status < 600:
            raise ServerError(message, status)
        else:
            raise SettlerError(message, status)


class TransactionsClient:
    """Client for transaction operations."""

    def __init__(self, client: SettlerClient) -> None:
        self._client = client

    def list(
        self,
        page: Optional[int] = None,
        limit: Optional[int] = None,
        provider: Optional[str] = None,
        status: Optional[str] = None,
        type: Optional[str] = None,
        payment_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List transactions with optional filtering and pagination."""
        params: Dict[str, Any] = {}
        if page is not None:
            params["page"] = page
        if limit is not None:
            params["limit"] = limit
        if provider:
            params["provider"] = provider
        if status:
            params["status"] = status
        if type:
            params["type"] = type
        if payment_id:
            params["paymentId"] = payment_id
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date
        return self._client._request("GET", "/transactions", params=params)

    def get(self, transaction_id: str) -> Dict[str, Any]:
        """Get a transaction by ID."""
        return self._client._request("GET", f"/transactions/{transaction_id}")


class SettlementsClient:
    """Client for settlement operations."""

    def __init__(self, client: SettlerClient) -> None:
        self._client = client

    def list(
        self,
        page: Optional[int] = None,
        limit: Optional[int] = None,
        provider: Optional[str] = None,
        status: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List settlements with optional filtering and pagination."""
        params: Dict[str, Any] = {}
        if page is not None:
            params["page"] = page
        if limit is not None:
            params["limit"] = limit
        if provider:
            params["provider"] = provider
        if status:
            params["status"] = status
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date
        return self._client._request("GET", "/settlements", params=params)

    def get(self, settlement_id: str) -> Dict[str, Any]:
        """Get a settlement by ID."""
        return self._client._request("GET", f"/settlements/{settlement_id}")


class FeesClient:
    """Client for fee visibility and reporting."""

    def __init__(self, client: SettlerClient) -> None:
        self._client = client

    def list(
        self,
        transaction_id: Optional[str] = None,
        settlement_id: Optional[str] = None,
        type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List fees with optional filtering."""
        params: Dict[str, Any] = {}
        if transaction_id:
            params["transactionId"] = transaction_id
        if settlement_id:
            params["settlementId"] = settlement_id
        if type:
            params["type"] = type
        return self._client._request("GET", "/fees", params=params)

    def get_effective_rate(
        self,
        transaction_id: Optional[str] = None,
        provider: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Calculate effective processing rate."""
        params: Dict[str, Any] = {}
        if transaction_id:
            params["transactionId"] = transaction_id
        if provider:
            params["provider"] = provider
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date
        return self._client._request("GET", "/fees/effective-rate", params=params)


class ExportsClient:
    """Client for data export operations."""

    def __init__(self, client: SettlerClient) -> None:
        self._client = client

    def create(
        self,
        job_id: str,
        format: str,
        date_range: Dict[str, str],
        options: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """Create an export of reconciled data.

        Args:
            job_id: The reconciliation job ID.
            format: Export format - "quickbooks", "csv", or "json".
            date_range: Dict with "start" and "end" ISO date strings.
            options: Optional export options.
        """
        data: Dict[str, Any] = {
            "jobId": job_id,
            "format": format,
            "dateRange": date_range,
        }
        if options:
            data["options"] = options
        return self._client._request("POST", "/exports", data=data)


class CurrencyClient:
    """Client for multi-currency and FX operations."""

    def __init__(self, client: SettlerClient) -> None:
        self._client = client

    def convert(
        self,
        value: float,
        from_currency: str,
        to_currency: str,
        date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Convert an amount to a target currency.

        Args:
            value: Amount to convert.
            from_currency: Source currency code (e.g. "USD").
            to_currency: Target currency code (e.g. "EUR").
            date: Optional date for historical rates.
        """
        data: Dict[str, Any] = {
            "amount": {"value": value, "currency": from_currency},
            "toCurrency": to_currency,
        }
        if date:
            data["date"] = date
        return self._client._request("POST", "/currency/convert", data=data)

    def get_fx_rate(
        self,
        from_currency: str,
        to_currency: str,
        date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get the FX rate for a currency pair."""
        params: Dict[str, Any] = {
            "fromCurrency": from_currency,
            "toCurrency": to_currency,
        }
        if date:
            params["date"] = date
        return self._client._request("GET", "/currency/fx-rate", params=params)


class WebhooksClient:
    """Client for webhook operations."""

    def __init__(self, client: SettlerClient) -> None:
        self._client = client

    def receive(
        self,
        adapter: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Send a webhook payload for processing.

        Args:
            adapter: Payment provider adapter ("stripe", "paypal", "square").
            payload: The raw webhook payload from the provider.
        """
        return self._client._request(
            "POST", f"/webhooks/receive/{adapter}", data=payload
        )

    def create(
        self,
        url: str,
        events: Optional[List[str]] = None,
        secret: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a webhook.

        Args:
            url: Destination URL for webhook delivery.
            events: Optional list of event types to subscribe to.
            secret: Optional signing secret for webhook verification.
        """
        data: Dict[str, Any] = {"url": url}
        if events:
            data["events"] = events
        if secret:
            data["secret"] = secret
        return self._client._request("POST", "/webhooks", data=data)

    def list(
        self,
        cursor: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> Dict[str, Any]:
        """List webhooks with optional pagination."""
        params: Dict[str, Any] = {}
        if cursor:
            params["cursor"] = cursor
        if limit is not None:
            params["limit"] = limit
        return self._client._request("GET", "/webhooks", params=params)

    def get(self, webhook_id: str) -> Dict[str, Any]:
        """Get a webhook by ID."""
        return self._client._request("GET", f"/webhooks/{webhook_id}")

    def delete(self, webhook_id: str) -> None:
        """Delete a webhook by ID."""
        self._client._request("DELETE", f"/webhooks/{webhook_id}")


class JobsClient:
    """Client for reconciliation job management."""

    def __init__(self, client: SettlerClient) -> None:
        self._client = client

    def create(
        self,
        provider: str,
        date_range: Dict[str, str],
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a new reconciliation job.

        Args:
            provider: Payment provider ("stripe", "paypal", "square", "bank").
            date_range: Dict with "start" and "end" ISO date strings.
            options: Optional job options (autoReconcile, notifyOnComplete).
        """
        data: Dict[str, Any] = {
            "provider": provider,
            "dateRange": date_range,
        }
        if options:
            data["options"] = options
        return self._client._request("POST", "/jobs", data=data)

    def list(
        self,
        page: Optional[int] = None,
        limit: Optional[int] = None,
        status: Optional[str] = None,
        provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List reconciliation jobs."""
        params: Dict[str, Any] = {}
        if page is not None:
            params["page"] = page
        if limit is not None:
            params["limit"] = limit
        if status:
            params["status"] = status
        if provider:
            params["provider"] = provider
        return self._client._request("GET", "/jobs", params=params)

    def get(self, job_id: str) -> Dict[str, Any]:
        """Get a reconciliation job by ID."""
        return self._client._request("GET", f"/jobs/{job_id}")

    def run(self, job_id: str) -> Dict[str, Any]:
        """Run a reconciliation job."""
        return self._client._request("POST", f"/jobs/{job_id}/run")

    def delete(self, job_id: str) -> None:
        """Delete a reconciliation job."""
        self._client._request("DELETE", f"/jobs/{job_id}")


class ReportsClient:
    """Client for reconciliation reports."""

    def __init__(self, client: SettlerClient) -> None:
        self._client = client

    def get(self, job_id: str) -> Dict[str, Any]:
        """Get a reconciliation report for a job."""
        return self._client._request("GET", f"/reports/{job_id}")

    def get_unmatched(self, job_id: str) -> Dict[str, Any]:
        """Get unmatched transactions for a job."""
        return self._client._request("GET", f"/reports/{job_id}/unmatched")


class FlagsClient:
    """Client for evaluating feature flags."""

    def __init__(self, client: SettlerClient) -> None:
        self._client = client

    def evaluate(
        self,
        flag_key: str,
        context: Optional[Dict[str, Any]] = None,
        default_value: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """Evaluate a feature flag."""
        data: Dict[str, Any] = {
            "flagKey": flag_key,
            "context": context or {},
        }
        if default_value is not None:
            data["defaultValue"] = default_value
        
        try:
            return self._client._request("POST", "/feature-flags/evaluate", data=data)
        except SettlerError:
            if default_value is not None:
                return {
                    "flagKey": flag_key,
                    "value": default_value,
                    "reason": "error_fallback",
                }
            raise


class ReceiptsClient:
    """Client for receipt operations."""

    def __init__(self, client: SettlerClient) -> None:
        self._client = client

    def parse(
        self,
        file: str,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Parse a receipt."""
        data: Dict[str, Any] = {}
        if file.startswith("http"):
            data["url"] = file
        else:
            data["content"] = file
            
        if options:
            data["options"] = options
            
        return self._client._request("POST", "/receipts/parse", data=data)

    def get(self, receipt_id: str) -> Dict[str, Any]:
        """Get a receipt by ID."""
        return self._client._request("GET", f"/receipts/{receipt_id}")


class AdaptersClient:
    """Client for adapter operations."""

    def __init__(self, client: SettlerClient) -> None:
        self._client = client

    def list(
        self,
        cursor: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> Dict[str, Any]:
        """List adapters."""
        params: Dict[str, Any] = {}
        if cursor:
            params["cursor"] = cursor
        if limit is not None:
            params["limit"] = limit
        return self._client._request("GET", "/adapters", params=params)

    def get(self, adapter_id: str) -> Dict[str, Any]:
        """Get an adapter by ID."""
        return self._client._request("GET", f"/adapters/{adapter_id}")


class ConsoleClient:
    """Client for Console operations."""

    def __init__(self, client: SettlerClient) -> None:
        self._client = client

    def list_api_keys(self) -> Dict[str, Any]:
        return self._client._request("GET", "/console/api-keys")

    def create_api_key(self, name: Optional[str] = None, scopes: Optional[List[str]] = None, expires_at: Optional[str] = None) -> Dict[str, Any]:
        data: Dict[str, Any] = {}
        if name: data["name"] = name
        if scopes: data["scopes"] = scopes
        if expires_at: data["expiresAt"] = expires_at
        return self._client._request("POST", "/console/api-keys", data=data)

    def revoke_api_key(self, key_id: str) -> None:
        self._client._request("DELETE", f"/console/api-keys/{key_id}")

    def get_usage(self, days: int = 7) -> Dict[str, Any]:
        return self._client._request("GET", "/console/usage", params={"days": days})

    def list_receipts(self) -> Dict[str, Any]:
        return self._client._request("GET", "/console/receipts")

    def get_receipt(self, receipt_id: str) -> Dict[str, Any]:
        return self._client._request("GET", f"/console/receipts/{receipt_id}")

    def list_feature_flags(self) -> Dict[str, Any]:
        return self._client._request("GET", "/console/feature-flags")

    def get_activities(self) -> Dict[str, Any]:
        return self._client._request("GET", "/console/activities")

    def health(self) -> Dict[str, Any]:
        return self._client._request("GET", "/health/console")


class RunsClient:
    """Client for reconciliation run operations."""

    def __init__(self, client: SettlerClient) -> None:
        self._client = client

    def list(
        self,
        page: Optional[int] = None,
        limit: Optional[int] = None,
        status: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List reconciliation runs."""
        params: Dict[str, Any] = {}
        if page is not None:
            params["page"] = page
        if limit is not None:
            params["limit"] = limit
        if status:
            params["status"] = status
        return self._client._request("GET", "/runs", params=params)

    def get(self, run_id: str) -> Dict[str, Any]:
        """Get a reconciliation run by ID."""
        return self._client._request("GET", f"/runs/{run_id}")

    def create(self, job_id: str) -> Dict[str, Any]:
        """Create a new reconciliation run."""
        return self._client._request("POST", "/runs", data={"jobId": job_id})

    def get_proofpack(self, run_id: str) -> Dict[str, Any]:
        """Get the proofpack for a run."""
        return self._client._request("GET", f"/runs/{run_id}/proofpack")

    def get_delta(self, run_id: str) -> Dict[str, Any]:
        """Get the deltas for a run."""
        return self._client._request("GET", f"/runs/{run_id}/delta")

    def record_adjudication(
        self,
        run_id: str,
        exception_id: str,
        resolution: str,
        resolution_reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Record an adjudication decision."""
        data: Dict[str, Any] = {
            "exceptionId": exception_id,
            "resolution": resolution,
        }
        if resolution_reason:
            data["resolutionReason"] = resolution_reason
        return self._client._request("POST", f"/runs/{run_id}/adjudications", data=data)
