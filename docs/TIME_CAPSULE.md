# Time Capsule

Commands:

- `settler capsule create <runId|path> --output capsule.json`
- `settler capsule verify <file>`
- `settler capsule replay <file>`

Capsules include input/output hashes, audit hash chain, schema version, tenant reference hash, environment fingerprint, and integrity root for deterministic replay verification.
