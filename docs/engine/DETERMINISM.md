# Determinism in Settler Engine

Settler Engine is designed to be deterministic in local and CI contexts. This means that identical inputs and configuration produce identical outputs, enabling stable diffing and audit-safe evidence bundles.

## Deterministic inputs

The engine output is deterministic when all of the following are unchanged:

- Input files and their content
- `ruleset.json`
- `mapping.json` (if provided)
- `timezone` in `engine_input.json`
- `rounding_mode` in `engine_input.json`

## Stable ordering

Deterministic ordering rules:

- Normalized records are sorted by: `record_type`, `id`, `source_file`, `source_row`
- Variances are sorted by: `type`, `transaction_id`, `settlement_id`
- Evidence manifest input/output entries are sorted by `path`

## Rounding

`rounding_mode` is required. Supported modes:

- `bankers` (half-even)
- `half-up`

Amounts are converted to integer cents using the configured rounding mode before reconciliation logic runs.

## Timezone rules

- Dates are parsed using the provided IANA timezone.
- All output dates are normalized to UTC.

## Bounds

Determinism applies to engine outputs, not to external systems or any downstream interpretation of variances. The engine surfaces discrepancies; it does not certify correctness or compliance.

