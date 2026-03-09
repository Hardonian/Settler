# Advanced QA Automation

Settler QA automation combines API and UI verification suites with route, link, tenant, and policy checks.

## Required coverage

- API route testing
- execution engine testing
- policy enforcement testing
- tenant isolation checks
- proof verification tests
- replay tests

## Integrated commands

- `pnpm run test:ci:verify`
- `pnpm run qa:all`
- `pnpm run verify:tenant`
- `pnpm run verify:policy`
- `pnpm run validate:failure-injection`

QA results should be surfaced in dashboard observability as machine-readable pass/fail evidence.
