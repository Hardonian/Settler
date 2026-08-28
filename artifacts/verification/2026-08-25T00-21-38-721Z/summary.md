# Release verification summary

- Run ID: 2026-08-25T00-21-38-721Z
- Profile: fast
- Passed: no
- Completed at: 2026-08-25T00:22:14.631Z
- Supply-chain audit state: unknown
- Supply-chain unavailable category: n/a
- Tenant guardrail static status: incomplete
- Tenant runtime coverage status: incomplete

| Stage | Status | Duration (s) | Timeout (s) | Log |
|---|---|---:|---:|---|
| root | passed | 0.7 | 60 | artifacts\verification\2026-08-25T00-21-38-721Z\root.log |
| envContract | passed | 2.5 | 120 | artifacts\verification\2026-08-25T00-21-38-721Z\envContract.log |
| reconciliationCoreDist | passed | 0.7 | 60 | artifacts\verification\2026-08-25T00-21-38-721Z\reconciliationCoreDist.log |
| reconciliationTopology | passed | 0.8 | 60 | artifacts\verification\2026-08-25T00-21-38-721Z\reconciliationTopology.log |
| lint | passed | 1.9 | 720 | artifacts\verification\2026-08-25T00-21-38-721Z\lint.log |
| typecheck | failed | 29.3 | 720 | artifacts\verification\2026-08-25T00-21-38-721Z\typecheck.log |
