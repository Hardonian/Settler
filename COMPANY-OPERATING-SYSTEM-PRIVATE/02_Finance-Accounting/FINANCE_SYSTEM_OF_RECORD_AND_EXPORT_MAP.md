# Finance System of Record and Export Map

## Source-of-truth hierarchy

1. **Commercial truth**: signed order form / executed contract
2. **Billing truth**: invoice + subscription records in billing platform
3. **Cash truth**: bank settlement records
4. **Accounting truth**: closed books in accounting ledger

## Export/import path

- Contract data -> CRM/RevOps tracker -> billing setup
- Billing invoices/payments -> accounting journal import
- Bank feed -> cash application reconciliation
- Usage exports -> overage invoice validation

## Manual reconciliation points

- Contract term vs billing start date
- Discount entered vs approved discount
- Usage measured vs usage billed
- Deferred revenue schedule vs invoice cadence
