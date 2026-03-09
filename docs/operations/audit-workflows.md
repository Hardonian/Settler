# Audit Workflows

## Exporting evidence

Use:

- `settler export-ledger --format json --out ledger.json`
- `settler export-ledger --format csv --out ledger.csv`
- `settler export-ledger --format signed --out ledger-bundle.json`

## Verifying receipts

Run:

`settler verify <execution_id>`

Checks:

1. receipt integrity fields exist
2. hash chain recomputes and matches
3. replay compatibility fields are present (`input_hash`, `output_hash`)

## Audit review flow

1. list target tenant history (`settler history --tenant <id>`)
2. inspect suspicious run (`settler show <execution_id>`)
3. compare baseline versus incident (`settler diff <a> <b>`)
4. verify proof/hash chain (`settler verify <execution_id>`)
5. export signed bundle for external review
