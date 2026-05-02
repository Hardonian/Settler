# API Errors

The Settler API uses standard HTTP status codes and returns a typed JSON error envelope.

## Error Codes

- `RATE_LIMITED`: Too many requests. Respect the `Retry-After` header.
- `QUOTA_EXCEEDED`: API or billing quota exceeded. Upgrade your plan.
- `IDEMPOTENCY_CONFLICT`: A request with this idempotency key is already in progress.
- `CAPABILITY_UNAVAILABLE`: Feature not enabled for your plan tier.
- `TENANT_ACCESS_DENIED`: Invalid API key or permission denied.
- `VALIDATION_FAILED`: Invalid request payload. Check the `details` array.
