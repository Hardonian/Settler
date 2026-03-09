# API Error Guide

## What to collect first

1. HTTP method + route
2. Status code
3. Response body
4. `X-Trace-Id` response header
5. Tenant context used for the request

## Common patterns

- **401/403**: auth or scope failure.
- **404**: route or resource not found; Settler includes trace metadata on not-found responses.
- **429**: rate limiting (global IP or API-key policy).
- **5xx**: server-side failure; correlate with trace ID and logs.

## Tenant isolation failures

If a request is authenticated but returns authorization/visibility errors, verify:

- correct tenant binding
- no cross-tenant identifiers in payload
- expected permissions for that tenant

## Problem+JSON style guidance

Some endpoints may emit structured error documents. Treat them as machine-readable and preserve fields in logs. Do not strip trace identifiers.
