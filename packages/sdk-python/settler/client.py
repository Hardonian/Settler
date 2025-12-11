class AdaptersClient:
    """Client for adapter operations"""
    
    def __init__(self, client: SettlerClient):
        self._client = client
    
    def list(self) -> List[Dict[str, Any]]:
        """List available adapters"""
        response = self._client._request("GET", "/api/v1/adapters")
        return response.get("data", [])
    
    def get(self, adapter_name: str) -> Dict[str, Any]:
        """Get adapter details"""
        response = self._client._request("GET", f"/api/v1/adapters/{adapter_name}")
        return response.get("data", {})


class ReceiptsClient:
    """Client for receipt operations"""

    def __init__(self, client: SettlerClient):
        self._client = client

    def parse(self, file_url: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Parse a receipt from a URL
        
        Args:
            file_url: URL of the receipt image or PDF
            options: Optional parsing options
        """
        data = {"url": file_url}
        if options:
            data["options"] = options
        response = self._client._request("POST", "/api/v1/receipts/parse", data=data)
        return response.get("data", {})

    def get(self, receipt_id: str) -> Dict[str, Any]:
        """Get parsed receipt details"""
        response = self._client._request("GET", f"/api/v1/receipts/{receipt_id}")
        return response.get("data", {})


class FlagsClient:
    """Client for feature flag operations"""

    def __init__(self, client: SettlerClient):
        self._client = client

    def evaluate(self, flag_key: str, context: Dict[str, Any], default_value: Any = None) -> Dict[str, Any]:
        """
        Evaluate a feature flag
        
        Args:
            flag_key: The key of the flag to evaluate
            context: User/Environment context for evaluation rules
            default_value: Value to return if evaluation fails
        """
        data = {
            "flagKey": flag_key,
            "context": context,
            "defaultValue": default_value
        }
        try:
            response = self._client._request("POST", "/api/v1/feature-flags/evaluate", data=data)
            return response.get("data", {})
        except Exception:
            if default_value is not None:
                return {
                    "flagKey": flag_key,
                    "value": default_value,
                    "reason": "error_fallback"
                }
            raise


class ConvertClient:
    """Client for conversion operations"""

    def __init__(self, client: SettlerClient):
        self._client = client

    def unit(self, value: float, from_unit: str, to_unit: str) -> Dict[str, Any]:
        """Convert units"""
        data = {"value": value, "from": from_unit, "to": to_unit}
        response = self._client._request("POST", "/api/v1/convert/unit", data=data)
        return response.get("data", {})

    def currency(self, amount: float, from_currency: str, to_currency: str, date: Optional[str] = None) -> Dict[str, Any]:
        """Convert currency"""
        data = {"amount": amount, "from": from_currency, "to": to_currency}
        if date:
            data["date"] = date
        response = self._client._request("POST", "/api/v1/convert/currency", data=data)
        return response.get("data", {})
