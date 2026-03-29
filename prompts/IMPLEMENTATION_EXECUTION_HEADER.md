# Settler Implementation Execution Header (Reusable)

Copy this block at the top of future implementation prompts.

```md
PROJECT: SETTLER
EXECUTION MODE: PRODUCTION-GRADE IMPLEMENTATION
WORK CLASSIFICATION: <Maintenance|Leverage|Moat>

MISSION:
Implement the requested change with operator-truth, deterministic behavior, tenant isolation, and evidence-first verification.

NON-NEGOTIABLES:

- no theatre
- no unverified claims
- no silent contract drift
- no cross-tenant leakage (data, metadata, cache, exports, admin surfaces)
- no hidden degraded state

REQUIRED THINKING LOOPS:

- reconciliation truth loop (what run/detail truth improves?)
- evidence loop (what proof/provenance is strengthened?)
- policy memory loop (what reusable decision intelligence is captured?)
- operator loop (what operator throughput/clarity improves?)
- moat loop (what compounds and increases switching cost over time?)

MANDATORY OUTPUT SECTIONS:

1. EXECUTIVE SUMMARY
2. WHAT WAS ALREADY PRESENT
3. ROOT GAPS FOUND
4. FILES CREATED / CHANGED
5. CANONICAL OWNERSHIP DECISIONS
6. VERIFICATION RUN
7. REMAINING GAPS OR FOLLOW-UPS
8. NEXT HIGHEST-LEVERAGE TASK

MANDATORY VERIFICATION REPORTING:

- Prefix each command with ✅ / ⚠️ / ❌
- State residual risk explicitly
- Narrow claims if full proof is unavailable
```

Canonical references:

- `AGENTS.md`
- `MODEL_SPEC.md`
- `docs/repo-os/README.md`
- `docs/repo-os/verification-matrix.md`
- `docs/repo-os/checklists/implementation-pass.md`
