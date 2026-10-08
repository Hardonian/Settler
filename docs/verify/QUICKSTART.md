# Verification Quickstart

Settler verification runs locally to surface discrepancies between evidence bundle files and the manifest.

## Browser verification

1. Navigate to `/verify` in the Settler console.
2. Upload `manifest.json`, Merkle bundle, or Sparse Merkle Tree (SMT) `proof.json`.
3. Client-side WASM verification executes locally in browser without server compute.

## CLI verification

```bash
# Manifest bundle verification
settler-verify --bundle path/to/evidence --out verification-report.json

# Sparse Merkle Tree (SMT) inclusion/non-inclusion proof verification
settler-verify --smt path/to/smt_proof.json --out verification-report.json
```

The CLI verifies hashes listed in `manifest.json` or Sparse Merkle Tree (SMT) cryptographic proofs and writes a verification report. Non-zero exit codes indicate mismatches or invalid proofs.
