# Proof Engine

`settler prove` creates a proofpack receipt under `proofpacks/<execution_id>/proofpack.json` and updates `proofpacks/latest/proofpack.json`.

Engine outputs:

- deterministic score
- replay equivalence boolean
- final state hash
- tool-call hashes
- CAS references
- signature over canonicalized proof payload

Verification path:

1. canonical hash all fields
2. recompute signature
3. recompute workflow hash from trace state hashes
4. emit PASS/FAIL outcome
