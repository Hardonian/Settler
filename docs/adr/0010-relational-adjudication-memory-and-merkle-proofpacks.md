# ADR 0010: Relational Adjudication Memory and Merkle Proofpacks

## Status

Accepted

## Context

`metadata.adjudicationHistory` is an untyped, mutable JSON structure. It cannot enforce tenant ownership, event shape, ordering, or referential integrity, and it is unsuitable as the authoritative record of an operator decision. Proofpack hashes also require one canonical byte representation across TypeScript, Rust, CLI, API, and browser verification.

## Decision

- `ExceptionAdjudicationMemory` is the authoritative adjudication history. Every read and write carries `tenantId`; tenant-scoped SQL includes `tenant_id`; RLS remains a second enforcement layer.
- Legacy `metadata.adjudicationHistory` is read-only migration input. New decisions must not be appended there.
- Proof manifests hash RFC 8785/JCS bytes. Hash preimages include an explicit schema/domain identifier and stable, sorted identifiers. Timestamps and generated database IDs are excluded unless the schema explicitly commits them.
- SMT occupied leaves use `SHA-256(0x00 || key || value)`. Empty leaves use the distinct canonical `SHA-256(0x00)`. Internal nodes use `SHA-256(0x01 || left || right)`.
- A proof is finalized only after its evidence and SMT branches have been verified. A root-only artifact remains `draft`/degraded and must not claim verified inclusion or non-inclusion.
- Non-inclusion verification requires `value = none`, a non-inclusion proof kind, exactly 256 siblings, and a path beginning at the canonical empty-leaf hash.

## Consequences

- Adjudications are queryable, tenant-scoped, and independently attributable.
- Existing proof hashes produced by non-canonical serializers may require an explicit legacy verifier; they are not silently reinterpreted as v2 commitments.
- Proof generation costs additional storage and hashing work.
- Application tests, Rust tests, and WASM verification must share canonicalization and proof vectors before a proof format is promoted.

## Verification

- `packages/api/test/adversarial-tenant-isolation.spec.ts`
- `packages/proofs/src/canonical-json.test.ts`
- `crates/settler-kernel/src/smt.rs` tests
- `cargo test --all`
