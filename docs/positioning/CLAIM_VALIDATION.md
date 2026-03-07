# Settler — Claim Validation

Every major claim made in user-facing surfaces (README, homepage, docs) is validated below against code or behavior.

## Claim Validation Table

| #   | Claim                                                                             | Where Used             | Verified In Code? | Evidence                                                                                                                                                                              | Resolution                                                                                                                |
| --- | --------------------------------------------------------------------------------- | ---------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | "Every run is repeatable — same inputs and rules always produce the same results" | README, homepage       | Yes               | Engine executes deterministic matching with fingerprinted runs. `packages/api` run execution produces stable output hashes for identical inputs.                                      | Kept — accurate                                                                                                           |
| 2   | "Every mismatch is surfaced — with full context"                                  | README                 | Yes               | Mismatch detection in reconciliation pipeline surfaces all non-matching records with source context, delta amounts, and trace IDs.                                                    | Kept — accurate                                                                                                           |
| 3   | "Every result is provable — evidence packs are generated automatically"           | README                 | Yes               | Evidence bundle generation is part of run execution. Bundles include inputs, rules, outputs, and hashes.                                                                              | Kept — accurate                                                                                                           |
| 4   | "Replayable runs"                                                                 | README, homepage, docs | Yes               | Replay functionality re-executes a run against the same inputs and config. Output is verified by `scripts/verify-proof.ts` and replay checks.                                         | Kept — accurate                                                                                                           |
| 5   | "Evidence generation"                                                             | README, homepage       | Yes               | `evidence.json` is generated per run containing input snapshot, rule config, execution trace, and output fingerprint.                                                                 | Kept — accurate                                                                                                           |
| 6   | "Rules as code"                                                                   | README, homepage       | Yes               | Matching rules are defined in code, stored in the repository, and applied during run execution.                                                                                       | Kept — accurate                                                                                                           |
| 7   | "Deterministic"                                                                   | Docs, architecture     | Partially         | Determinism is scoped to the matching engine — same inputs + same rules = same outputs. External system state (API availability, data freshness) is outside the determinism boundary. | Softened — "deterministic matching" not "deterministic system"                                                            |
| 8   | "Tenant isolation via row-level security"                                         | Docs, security         | Yes               | RLS policies verified in Supabase schema. Tenant isolation tests exist.                                                                                                               | Kept — accurate                                                                                                           |
| 9   | "Cryptographic hashing of inputs and outputs"                                     | Docs                   | Yes               | Content hashing is implemented for evidence bundles using SHA-256 canonical fingerprints and verified provenance chain checks.                                                        | Kept — accurate, described as "tamper-evident" not "immutable"                                                            |
| 10  | "Immutable run records"                                                           | README, docs           | Partially         | Runs are append-only in the database. However, database admin access could modify records.                                                                                            | Softened — "append-only" rather than "immutable" in user-facing copy. SECURITY.md already uses "tamper-evident" language. |
| 11  | "Open source, Apache 2.0"                                                         | README                 | Yes               | LICENSE file contains Apache 2.0 license.                                                                                                                                             | Kept — accurate                                                                                                           |
| 12  | "Self-hosted"                                                                     | README                 | Yes               | Full self-hosting instructions exist. No external service dependency beyond Postgres/Supabase for core functionality.                                                                 | Kept — accurate                                                                                                           |
| 13  | "API and SDK first"                                                               | README                 | Yes               | REST API exists in `packages/api`. SDKs exist for TypeScript, Go, Python, Ruby, Java, C#.                                                                                             | Kept — accurate                                                                                                           |
| 14  | "Policy checks as part of run execution"                                          | Docs                   | Yes               | Policy evaluation runs during reconciliation execution, not as a separate post-processing step.                                                                                       | Kept — accurate                                                                                                           |
| 15  | "Exception workflow with assignment and resolution tracking"                      | README                 | Yes               | Review queue with assignment, status tracking, and audit trail is implemented in the console.                                                                                         | Kept — accurate                                                                                                           |

## Claims Softened or Removed

| Claim                      | Original Language                            | New Language                                 | Reason                                                                                                |
| -------------------------- | -------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| "Control plane"            | "Control plane for provable financial truth" | "Open-source reconciliation engine"          | "Control plane" is infrastructure jargon. "Engine" is clearer.                                        |
| "Provable financial truth" | Used in early hero copy                      | Removed from user-facing surfaces            | Too abstract. Replaced with concrete descriptions of what evidence is produced.                       |
| "Deterministic pipeline"   | Used in technical docs                       | "Deterministic matching"                     | Determinism applies to the matching logic, not the entire system pipeline.                            |
| "Immutable"                | "Immutable run records"                      | "Append-only run records" / "tamper-evident" | Database records are append-only but not physically immutable. "Tamper-evident" is the accurate term. |

## Claims Verified as Accurate

- Replayable reconciliation runs
- Evidence bundle generation per run
- Rules defined and versioned in code
- Mismatch detection with full context
- Tenant isolation via RLS
- Content hashing for evidence integrity
- Self-hosted deployment model
- Apache 2.0 open-source license
- Multi-SDK support (6 languages)
- Exception workflow with review queue
- Policy checks during execution

## Reality hardening references

- Architecture and guarantee boundaries: `docs/architecture/technical-reality-hardening.md`
- Determinism + replay proof verification: `scripts/verify-proof.ts`

- Event backbone durability validated via append-only event log + replay tooling (`runner/eventBackbone.ts`, `scripts/stress-reliability.ts`)
- Connector execution containment validated via runtime sandbox + timeout fencing (`packages/adapters/src/connector-sandbox.ts`)
- CAS integrity lifecycle supported via verify/repair/gc tooling (`scripts/cas-tool.ts`)
