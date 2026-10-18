# ADR 0010: Relational Adjudication Memory and Merkle ProofPacks

## Status

Accepted

## Context

In early versions of the Settler reconciliation operating system, human and automated exception adjudications were appended directly to an unstructured JSON column (`metadata.adjudicationHistory`) on the `Discrepancy` / `Exception` record. While convenient for rapid prototyping, this unstructured storage pattern introduced severe systemic risks:

1. **Loss of Immutability and Audit Integrity**: Unstructured JSON payloads lacked schema enforcement, cryptographic hashing, and causal lineage. Auditors could not verify whether an adjudication was modified post-facto.
2. **Cross-Tenant State Bleed & Query Inefficiency**: Querying historical adjudication patterns across transactions required full-table JSON table scans, bypassing indexes and making multi-tenant isolation verification error-prone.
3. **Absence of Cryptographic Non-Repudiation**: Regulatory and institutional audit standards (SOC 1/2 Type II, SOX Section 404) require tamper-evident proofs that reconciliation adjudications were committed at a verifiable point in time within an immutable accumulator.

## Decision

We formally deprecate untyped `metadata.adjudicationHistory` JSON in favor of a normalized, relationally isolated, and cryptographically verified adjudication memory architecture:

1. **Normalized `ExceptionAdjudicationMemory` Entity**:
   - Every adjudication event (resolution reason, override rule, operator signature, adjusted variance, policy tokens) is stored as a first-class relational record.
   - Every record explicitly enforces `tenantId` with strict foreign key constraints and Row-Level Security (RLS).
   - Invariant: Every query on `ExceptionAdjudicationMemory` must enforce `WHERE tenantId = :tenantId`.

2. **Sparse Merkle Tree (SMT) ProofPackage Manifests**:
   - All reconciliation results, matched pairs, exceptions, and adjudication events are indexed into a deterministic 256-bit Sparse Merkle Tree (`crates/settler-kernel` and `@settler/proofs`).
   - Every adjudication leaf is canonicalized using RFC 8785 JSON Canonicalization Scheme (JCS) and hashed with domain separation (`0x00 || hash(leaf)`).
   - Internal tree nodes are hashed with `0x01 || left_child || right_child` to guarantee collision resistance and second-preimage attack defense.
   - The final output is an immutable `ProofPackage` containing:
     - The Merkle root hash anchoring all transactions and adjudications.
     - Cryptographic inclusion proofs for reconciled records.
     - Cryptographic non-inclusion proofs terminating at the canonical empty-leaf hash for uncommitted transactions.
     - Browser-side, zero-dependency WASM verification via `crates/settler-verify-wasm`.

## Consequences

### Positive
- **Tamper-Evident Audit Trails**: External regulators and institutional clients can verify any past adjudication independently without trusting the Settler API or database.
- **Relational Integrity**: Complete SQL indexing, strict typing, and tenant partitioning for exception resolution history.
- **Offline Verifiability**: Auditors can verify `ProofPackage` artifacts 100% offline using `settler-verify-wasm` or CLI tooling.

### Negative / Trade-offs
- Storage footprint increases moderately due to storing both relational adjudication rows and Merkle node proofs.
- Modifying or re-adjudicating an exception requires generating a new Merkle epoch root rather than an in-place SQL update.
