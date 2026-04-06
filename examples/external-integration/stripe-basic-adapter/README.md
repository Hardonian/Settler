# stripe-basic-adapter integration smoke

This example provides a minimal executable harness for the `stripe-basic-adapter`
entry in `marketplace/adapters/registry.json`.

## Smoke run

```bash
node examples/external-integration/stripe-basic-adapter/smoke.js
```

Expected output contains:

- adapter name
- deterministic fixture payload shape
- success/failure marker for CI hooks
