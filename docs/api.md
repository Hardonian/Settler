# Settler API v1

Base path: `/api/v1`

## Authentication

Use `X-API-Key: rk_...`.

## Idempotency

Mutating endpoints require `Idempotency-Key`.

## Pagination

List responses use:

```json
{ "data": [], "next_cursor": "10", "total": 42 }
```

## Error model

Problem JSON:

```json
{
  "type": "https://api.settler.dev/problems/settler_invalid_input",
  "code": "SETTLER_INVALID_INPUT",
  "title": "Invalid input",
  "status": 400,
  "detail": "...",
  "instance": "/api/v1/runs",
  "request_id": "..."
}
```

## Examples

```bash
curl -X POST http://localhost:3000/api/v1/runs \
  -H "X-API-Key: rk_example" \
  -H "Idempotency-Key: run-1" \
  -H "Content-Type: application/json" \
  -d '{"name":"daily","sourceAdapter":"stripe","targetAdapter":"netsuite","async":true}'
```
