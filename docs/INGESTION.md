# Ingestion Pipeline Documentation

## Overview

The Settler Ingestion Pipeline is a universal system for importing and normalizing financial transaction data from various sources. It supports CSV uploads, API connectors (Stripe, Shopify), and manual entry, with automatic normalization, validation, and reconciliation capabilities.

## Architecture

### Components

1. **Ingestion Sources**: Connector configurations (CSV, Stripe, Shopify, etc.)
2. **Ingestions**: Individual import runs with metadata and status tracking
3. **Raw Records**: Original data before normalization (optional)
4. **Normalized Transactions**: Standardized transaction format
5. **Reconciliation Runs**: Matching operations between source and target transactions
6. **Reconciliation Matches**: Individual match results with confidence scores
7. **Exports**: Generated CSV/JSON reports

### Data Flow

```
Source → Ingestion → Raw Records → Normalized Transactions → Reconciliation → Matches → Export
```

## CSV Import

### Supported Formats

The CSV importer supports flexible column mapping with auto-detection:

- **Required columns**: `amount`, `date`
- **Optional columns**: `currency`, `description`, `external_id`, `category`, `payment_method`, `reference`

### Column Auto-Detection

The system automatically detects common column names:

- **Amount**: `amount`, `total`, `value`, `sum`, `price`, `cost`
- **Date**: `date`, `time`, `timestamp`, `created`, `transaction_date`
- **Description**: `description`, `desc`, `memo`, `note`, `details`, `narration`, `reference`
- **External ID**: `id`, `transaction_id`, `external_id`, `reference`, `ref`
- **Currency**: `currency`, `curr`, `ccy`
- **Category**: `category`, `cat`, `type`, `class`
- **Payment Method**: `payment_method`, `method`, `payment_type`, `card`

### Example CSV

```csv
Date,Description,Amount,Currency,Transaction ID,Category,Payment Method
2024-01-15,Stripe Payment - Customer #1234,1250.50,USD,txn_abc123,payment,stripe
2024-01-16,Shopify Order #5678,89.99,USD,ord_xyz789,sale,shopify
```

### Manual Column Mapping

If auto-detection fails, you can provide a manual mapping:

```json
{
  "amount": "Total",
  "date": "Transaction Date",
  "description": "Memo",
  "currency": "CCY",
  "externalId": "Ref Number"
}
```

### Import Workbench Preview (Truthful Raw → Mapped → Normalized)

Before running `/upload`, operators can call `/api/v1/ingestion/preview` with the same file/mapping payload.
The preview executes the same parser + mapping + normalization logic and returns:

- `sourceSummary`: filename, size, headers, duplicate header detection, total rows
- `mapping`: provided mapping, auto-detected mapping, effective mapping, missing required mappings
- `normalization`: attempted/normalized/failed row counts, dropped rows, defaulted fields, sample normalized records
- `diagnostics`: structured stage-aware diagnostics (`raw|parse|mapping|normalize|quality_gate`) and severity (`info|warning|blocking`), each with machine-readable remediation hints for blocking codes
- `qualityGates`: lightweight pre-reconciliation gates (required mapping, non-empty import, normalization success ratio, duplicate row ratio, currency distribution)
- `schemaDrift`: drift comparison against last completed ingestion for the same source (when `sourceId` is provided) plus historical drift-trend escalation over the recent window
- `canProceed`: machine-visible go/no-go decision based on blocking diagnostics/gates

Example:

```bash
curl -X POST https://api.settler.dev/api/v1/ingestion/preview \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@transactions.csv" \
  -F "columnMapping={\"amount\":\"Total\",\"date\":\"Transaction Date\"}"
```

`/upload` now returns a preview summary as part of the ingestion response and stores import workbench metadata on the ingestion record (`ingestions.metadata.importWorkbench`) for diagnostics/recovery.

Additional operator endpoints:

- `GET /api/v1/ingestion/workbench/recent`: recent ingestion workbench summaries + deep links for control-plane surfaces.
- `POST /api/v1/ingestion/:ingestionId/retry`: remap-and-retry from stored `raw_records` (`dryRun` defaults to `true`).

The workbench metadata now stores bounded diagnostic samples (`diagnosticsSample`) to speed support/debug triage without unbounded payload growth.

All workbench payloads include a shared runtime-neutral contract reference (`contracts/ingestion/import-workbench.schema.json`, versioned) so API and workhorse outputs can be validated against the same artifact.

### API Usage

#### Upload CSV

```bash
curl -X POST https://api.settler.dev/api/v1/ingestion/upload \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@transactions.csv" \
  -F "columnMapping={\"amount\":\"Total\",\"date\":\"Date\"}"
```

#### Response

```json
{
  "ingestionId": "uuid",
  "sourceId": "uuid",
  "totalRows": 100,
  "normalizedCount": 98,
  "failedCount": 2,
  "columnMapping": {
    "amount": "Amount",
    "date": "Date",
    "description": "Description"
  },
  "traceId": "uuid"
}
```

## Stripe Connector

### Setup

1. Create a Stripe source:

```bash
curl -X POST https://api.settler.dev/api/v1/ingestion/sources \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Stripe Production",
    "type": "stripe",
    "connectorType": "stripe",
    "config": {
      "apiKey": "sk_live_...",
      "accountId": "acct_..."
    }
  }'
```

2. Sync transactions:

```bash
curl -X POST https://api.settler.dev/api/v1/ingestion/sync \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "uuid",
    "dateRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    }
  }'
```

### Data Fetched

- **Balance Transactions**: All Stripe balance transactions in date range
- **Payouts**: Stripe payouts (arrival dates)

### Normalization

Stripe transactions are normalized to:

- Amount: Converted from cents to dollars
- Currency: Uppercased (e.g., "usd" → "USD")
- Date: Unix timestamp converted to Date
- External ID: Stripe transaction/payout ID
- Metadata: Includes Stripe-specific fields (fee, net, status, etc.)

## Reconciliation

### Matching Algorithm

The reconciliation engine uses a deterministic matching algorithm:

1. **Exact Match**: Same external ID (highest confidence)
2. **Amount Match**: Within tolerance (default: $0.01)
3. **Date Window**: Within window (default: 7 days)
4. **Description Similarity**: Fuzzy string matching (Levenshtein distance)
5. **Confidence Score**: Weighted combination of factors

### Configuration

```json
{
  "dateWindowDays": 7,
  "amountTolerance": 0.01,
  "fuzzyDescriptionThreshold": 0.8,
  "requireExactAmount": false
}
```

### Running Reconciliation

```bash
curl -X POST https://api.settler.dev/api/v1/reconciliation/run \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ingestionId": "uuid",
    "config": {
      "dateWindowDays": 7,
      "amountTolerance": 0.01
    }
  }'
```

### Viewing Matches

```bash
curl https://api.settler.dev/api/v1/reconciliation/runs/{runId}/matches \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Exports

### Supported Formats

- **CSV**: Comma-separated values
- **JSON**: Structured JSON data

### Export Types

- **matched**: Only matched transactions
- **unmatched**: Only unmatched transactions
- **all**: All transactions from an ingestion
- **reconciliation_report**: Full reconciliation report with summary

### Creating an Export

```bash
curl -X POST https://api.settler.dev/api/v1/ingestion/exports \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "csv",
    "format": "matched",
    "reconciliationRunId": "uuid"
  }'
```

### Downloading Export

```bash
curl https://api.settler.dev/api/v1/ingestion/exports/{exportId} \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response includes `signedUrl` for download (valid for 24 hours).

## Job Processing

### Idempotency

All ingestion jobs support idempotency via `Idempotency-Key` header:

```bash
curl -X POST ... \
  -H "Idempotency-Key: unique-key-123"
```

If the same key is used within 24 hours, the system returns the existing result.

### Retry Logic

Jobs automatically retry with exponential backoff:

- **Max Retries**: 3 (configurable)
- **Initial Delay**: 1 second
- **Backoff Multiplier**: 2x
- **Max Delay**: 30 seconds

### Status Tracking

Ingestion statuses:

- `pending`: Created but not started
- `processing`: Currently running
- `completed`: Successfully finished
- `failed`: Failed after retries

## Error Handling

### Validation Errors

CSV validation errors include:

- Missing required columns
- Invalid date formats
- Invalid amounts (non-numeric)
- Missing required fields

### Processing Errors

- Row-level errors are logged but don't stop the entire ingestion
- Failed rows are counted in `failedCount`
- Error messages are stored in `errorMessage` field

### Troubleshooting

1. **Check ingestion status**:

```bash
curl https://api.settler.dev/api/v1/ingestion/{ingestionId} \
  -H "Authorization: Bearer YOUR_API_KEY"
```

2. **Review error messages**: Check `errorMessage` and `errorStack` fields

3. **Check trace ID**: All operations include a `traceId` for debugging

## Best Practices

### CSV Formatting

1. **Use consistent date formats**: ISO 8601 (YYYY-MM-DD) recommended
2. **Include headers**: First row should contain column names
3. **Escape special characters**: Commas, quotes, newlines in CSV values
4. **Use UTF-8 encoding**: For international characters

### Connector Setup

1. **Store credentials securely**: Use encrypted storage (handled automatically)
2. **Test with small date ranges**: Before syncing large datasets
3. **Monitor sync status**: Check `lastSyncAt` and `lastSyncStatus`

### Reconciliation

1. **Start with exact matches**: Use external IDs when available
2. **Adjust date windows**: Based on your transaction patterns
3. **Review low-confidence matches**: Manually verify matches below threshold
4. **Use manual review**: Mark matches as reviewed after verification

### Performance

1. **Batch processing**: Large CSVs are processed in batches
2. **Async exports**: Export generation happens asynchronously
3. **Pagination**: Use limit/offset for large result sets

## Examples

See `/examples/sample-transactions.csv` for a sample CSV file.

## API Reference

Full API documentation available at `/api/v1` endpoint.

## Support

For issues or questions:

- Check trace IDs in error responses
- Review logs with trace ID
- Contact support with trace ID for debugging
