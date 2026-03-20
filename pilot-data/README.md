# Pilot Data Pack

Curated starter datasets for first-tenant validation:

- `payments.csv`: baseline payment events
- `refunds.csv`: refund flows
- `settlements.csv`: settlement events
- `discrepancy-scenarios.csv`: controlled mismatch scenarios

## Usage

These CSV files can be imported into Settler for testing reconciliation workflows. The data is formatted to match the expected import schema.

### Import via CLI

```bash
# Import payments
pnpm settler import --source pilot-data/payments.csv --type payments

# Import refunds  
pnpm settler import --source pilot-data/refunds.csv --type refunds

# Import settlements
pnpm settler import --source pilot-data/settlements.csv --type settlements

# Import discrepancy scenarios for testing mismatch detection
pnpm settler import --source pilot-data/discrepancy-scenarios.csv --type discrepancies
```

### Using with Test Data

The pilot data complements the pre-generated test data in `test-data/exports/smoke-seed42/`. For comprehensive testing:

1. Run verification with test data: `pnpm verify:test-data`
2. Import pilot data for custom scenarios
3. Compare results between test data and pilot data imports

## Data Format

Each CSV follows the standard Settler import schema:
- Required columns: `id`, `external_id`, `amount`, `currency`, `date`
- Optional columns: `status`, `type`, `description`, `fee_amount`, `net_amount`

## Verification

After importing pilot data, verify integrity:
```bash
pnpm run doctor
```

## Related Documentation

- [Demo Walkthrough](../docs/getting-started/DEMO_WALKTHROUGH.md)
- [Import Documentation](../docs/import-export.md)
- [Test Data](../test-data/TEST_DATA_FOUNDRY.md)
