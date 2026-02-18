# Settler Hostile Red-Team Simulation

## Method
Tabletop adversarial simulation across requested attack paths. Objective: validate detection + containment assumptions and identify high-impact gaps.

## Scenario 1: Cross-tenant query attempt
### Attack
- Malicious tenant attempts to query records by injecting a foreign `tenant_id` and probing weakly scoped endpoints.

### Expected defense
- RLS policies deny row visibility.
- Middleware and permission checks prevent cross-tenant reads.

### Simulated outcome
- **Contained in baseline path** where RLS is active and tenant helper policies apply.

### Weaknesses observed
- Service-role or misconfigured privileged functions can bypass tenant constraints.
- Operational scripts with broad DB access represent a potential insider or key-compromise blast radius.

## Scenario 2: Audit rewrite attempt
### Attack
- Attacker tries `UPDATE`/`DELETE` on audit rows and then replays plausible replacement entries.

### Expected defense
- Tamper-evident signature/hash verification should fail.

### Simulated outcome
- **Tamper likely detectable**, but immutability is not yet uniformly guaranteed without strict append-only access controls.

### Weaknesses observed
- Without hard append-only DB permissions + WORM snapshoting, determined privileged actors may alter evidence then attempt concealment.

## Scenario 3: Export tampering
### Attack
- MITM/operator modifies CSV/JSON export values before delivery to auditor.

### Expected defense
- Consumer validates manifest hashes/signatures.

### Simulated outcome
- **Partially mitigated** via manifest/hash conventions.

### Weaknesses observed
- If customer workflows do not verify signatures/hashes, tampered exports can appear legitimate.

## Scenario 4: Replay corruption
### Attack
- Duplicate/reordered events are injected to corrupt reconciliation state and inflate usage/billing.

### Expected defense
- Idempotency key enforcement and replay detection.

### Simulated outcome
- **Resistant where idempotency is enforced**.

### Weaknesses observed
- Inconsistent idempotency enforcement across every ingestion path can leave edge cases for replay-induced drift.

## Scenario 5: Injection into AI advisory layer
### Attack
- Prompt injection attempts to override safety guidance and produce authoritative financial recommendations.

### Expected defense
- Advisory layer separated from deterministic postings, with non-authoritative policy guardrails.

### Simulated outcome
- **Policy-level separation exists conceptually**, but technical/contractual enforcement should be strengthened.

### Weaknesses observed
- Missing universal provenance tags and insufficiently explicit user-facing liability language can increase legal/operational exposure.

## Consolidated Findings
- **High:** Privileged path abuse (service-role / operational script misuse).
- **High:** Audit immutability overclaim risk without append-only enforcement proof.
- **Medium-High:** Export integrity depends on consumer verification behavior.
- **Medium:** AI advisory boundary needs stronger technical and legal guardrails.

## Recommended Countermeasures
1. Enforce append-only audit permissions + external notarization checkpoints.
2. Add privileged operation approval workflow + session recording for break-glass actions.
3. Make signed-export verification mandatory in enterprise workflows.
4. Require AI advisory provenance/disclaimer metadata and prohibit autonomous ledger mutations from AI outputs.
5. Add recurring red-team validation into release governance.
