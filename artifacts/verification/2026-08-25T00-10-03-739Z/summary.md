# Release verification summary

- Run ID: 2026-08-25T00-10-03-739Z
- Profile: fast
- Passed: no
- Completed at: 2026-08-25T00:11:36.565Z
- Supply-chain audit state: unknown
- Supply-chain unavailable category: n/a
- Tenant guardrail static status: incomplete
- Tenant runtime coverage status: incomplete

| Stage | Status | Duration (s) | Timeout (s) | Log |
|---|---|---:|---:|---|
| root | passed | 0.5 | 60 | artifacts\verification\2026-08-25T00-10-03-739Z\root.log |
| envContract | passed | 2.3 | 120 | artifacts\verification\2026-08-25T00-10-03-739Z\envContract.log |
| reconciliationCoreDist | passed | 0.7 | 60 | artifacts\verification\2026-08-25T00-10-03-739Z\reconciliationCoreDist.log |
| reconciliationTopology | passed | 0.9 | 60 | artifacts\verification\2026-08-25T00-10-03-739Z\reconciliationTopology.log |
| lint | passed | 27.4 | 720 | artifacts\verification\2026-08-25T00-10-03-739Z\lint.log |
| typecheck | failed | 61.1 | 720 | artifacts\verification\2026-08-25T00-10-03-739Z\typecheck.log |
