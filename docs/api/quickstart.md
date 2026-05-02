# API Quickstart

Welcome to the Settler API. The Settler API provides enterprise-grade reconciliation infrastructure, allowing you to embed explainable matching, audit-ready evidence, and reusable decision memory into your finance ops.

## Authentication

Use Bearer authentication with your API key:
`Authorization: Bearer <your_api_key>`

## Creating a Run

```bash
curl -X POST https://api.settler.dev/api/v1/runs \
  -H "Authorization: Bearer sk_test_123" \
  -H "Content-Type: application/json" \
  -d '{"templateId": "tmpl_abc123"}'
```

## Getting Exceptions

```bash
curl -X GET https://api.settler.dev/api/v1/runs/run_xyz789/exceptions \
  -H "Authorization: Bearer sk_test_123"
```
