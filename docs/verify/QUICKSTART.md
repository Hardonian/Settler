# Verification Quickstart

Settler verification runs locally to surface discrepancies between evidence bundle files and the manifest.

## Browser verification

1. Navigate to `/verify` in the Settler console.
2. Upload `manifest.json` and the referenced files from the evidence bundle.
3. Run verification. If the wasm verifier is unavailable, the UI will show a fallback message.

## CLI verification

```
settler-verify --bundle path/to/evidence --out verification-report.json
```

The CLI verifies hashes listed in `manifest.json` and writes a verification report. Non-zero exit codes indicate mismatches.
