# Investor Relations — Private Evidence Room

This directory is the active source of truth for investor, partner, and acquisition diligence.
It is encrypted through the repository's `git-crypt` rules.

## Evidence rule

Only the documents linked below are active. A statement is usable externally only when its row in
`EVIDENCE_REGISTER.md` is marked `verified` and points to inspectable evidence. Targets,
hypotheses, templates, and missing evidence must never be presented as historical results.

## Active packet

1. [Acquisition readiness](ACQUISITION_READINESS.md) — current thesis, gaps, and decision rules.
2. [Evidence register](EVIDENCE_REGISTER.md) — claim-by-claim source of truth.
3. [Diligence index](DILIGENCE_INDEX.md) — actual availability of legal, financial, security,
   product, and team evidence.
4. [Customer proof standard](CUSTOMER_PROOF.md) — requirements for pilots, case studies, and
   references.
5. [Execution plan](EXECUTION_PLAN.md) — sequenced work required to become strategically relevant.

## Archived material

`archive/2026-09-21-superseded/` contains planning documents retired during the evidence audit.
They include scenarios, fictional personas, templates, and unsupported targets. They are retained
for history only and are not diligence evidence or approved collateral.

## Verification

Run:

```bash
pnpm run verify:acquisition-readiness
```

The verifier fails when active materials reintroduce known unsupported claims or omit mandatory
evidence boundaries.
