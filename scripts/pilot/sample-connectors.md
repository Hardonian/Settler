# Pilot Sample Connectors (Reference)

## CSV import

> **Note:** `scripts/pilot/import-workbench.ts` is pending creation. Use `packages/api/src/services/ingestion/csv-importer.ts` for CSV import functionality in the meantime.

## Webhook ingestion

Reference payload:

```json
{
  "eventType": "transaction.created",
  "workspaceId": "ws_pilot",
  "externalId": "evt_1001",
  "amount": 120.25,
  "currency": "USD",
  "occurredAt": "2026-02-01T10:00:00Z"
}
```

Required controls:

- Verify signature before parsing body.
- Enforce timestamp skew window and idempotency key replay protections.
- Persist tenant/workspace identifiers with each event.

## REST ingestion endpoint

`POST /api/v1/ingestion/transactions`

```json
{
  "workspaceId": "ws_pilot",
  "source": "rest",
  "transactions": [
    {
      "externalId": "txn_1001",
      "type": "payment",
      "amountMinor": 12025,
      "currency": "USD",
      "occurredAt": "2026-02-01T10:00:00Z"
    }
  ]
}
```

Required controls:

- Reject cross-tenant workspace IDs.
- Validate payload schema and normalization contract.
- Emit ingestion evidence with run correlation ID.
