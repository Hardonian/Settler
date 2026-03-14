# Proofpacks

Proofpacks are execution receipts used for auditability and replay.

Schema fields:

- execution_id
- input_hash
- policy_hash
- workflow_hash
- tool_call_hashes
- state_hash
- CAS_references
- timestamp
- signature

Commands:

- `settler prove`
- `settler verify proofpacks/latest/proofpack.json`
- `settler replay <execution_id> [--step --trace --explain]`
