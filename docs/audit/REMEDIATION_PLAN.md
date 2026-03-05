# REMEDIATION_PLAN

Date: 2026-03-05
Owner: Codex

## Ranked by ROI + risk

1. **Docs consolidation and canonical navigation** (high ROI, low risk)
   - Add canonical entrypoint docs and explicit source-of-truth links.
   - Rewrite claims to verified scope where full verification is not completed in this run.

2. **Audit traceability package** (high ROI, low risk)
   - Add repo truth log, scored audit, remediation checklist, final score report, and fix changelog.

3. **Verification script posture alignment** (medium ROI, low risk)
   - Confirm root scripts already satisfy required verify set (`verify`, `verify:oss`, `verify:routes`, `verify:boundaries`).
   - Document exact commands for repeatability.

4. **Route and boundary no-hard-500 guardrails** (medium ROI, medium risk)
   - Keep route verification and boundary scans as required release gates.
   - Maintain standardized error envelope expectations in tests.

5. **Claim-language hardening** (high ROI, low risk)
   - Downgrade any unproven “always green” claim to “verified in this run scope” language.
