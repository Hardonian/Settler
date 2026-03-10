# Pilot Data Pack

Curated starter datasets for first-tenant validation:

- `payments.csv`: baseline payment events
- `refunds.csv`: refund flows
- `settlements.csv`: settlement events
- `discrepancy-scenarios.csv`: controlled mismatch scenarios

These files are shaped to feed `scripts/pilot/import-workbench.ts` and can be used to validate reconciliation behavior, alerting, and replay.
