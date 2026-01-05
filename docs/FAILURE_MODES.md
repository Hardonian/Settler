# Failure Modes & Safe Degradation

## System-Wide Failures

### 1. Source Adapter Outage (e.g., Stripe API Down)
*   **Detection:** API connection/timeout errors during Ingestion.
*   **Impact:** Reconciliation cannot start or completes partially.
*   **Mitigation:**
    *   Exponential backoff retries (up to 3x).
    *   User Alert: "Stripe connection failed. Retrying..."
    *   **Safe State:** Job status `PARTIAL_INGESTION` or `FAILED`. No partial matches committed.

### 2. Schema Drift (Source API Changes)
*   **Detection:** Validation errors in Normalizer layer.
*   **Impact:** Data missing fields or parsing fails.
*   **Mitigation:**
    *   Strict schema validation (Zod) on ingress.
    *   Quarantine malformed records.
    *   **Safe State:** Job completes with `WARNINGS`. Malformed records tagged `SCHEMA_ERROR`.

### 3. Rate Limits
*   **Detection:** HTTP 429 responses.
*   **Impact:** Slow ingestion.
*   **Mitigation:**
    *   Respect `Retry-After` headers.
    *   Adapter-level rate limiters (Token Bucket).

## Data-Level Failures

### 4. Duplicate Webhooks
*   **Detection:** `idempotency_key` check or `event_id` lookup.
*   **Impact:** Double counting.
*   **Mitigation:**
    *   Deduplication layer before Normalizer.
    *   Database constraint on `source_id`.

### 5. Currency Mismatch
*   **Detection:** Source = USD, Target = EUR.
*   **Impact:** Cannot match amounts.
*   **Mitigation:**
    *   Require FX rate snapshot for the transaction date.
    *   If no FX rate: Flag as `CURRENCY_MISMATCH`.

### 6. Rounding Errors
*   **Detection:** $100.00 vs $99.99 (fees or float math).
*   **Impact:** Matches fail.
*   **Mitigation:**
    *   Use integer math (cents) internally.
    *   Configurable "Epsilon" (small difference tolerance) for specific match strategies.

## Error Taxonomy

*   **CRITICAL:** System functionality broken (DB down, Auth fail). -> **Stop & Alert Admin.**
*   **ERROR:** Job cannot complete (API outage). -> **Retry then Fail Job.**
*   **WARN:** Data issue (Single record malformed). -> **Skip Record, Log Finding, Continue.**
*   **INFO:** Operational event (Job started). -> **Audit Log.**
