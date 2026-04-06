# Settler Marketplace (metadata registry)

This directory is currently a metadata-first registry, not a hosted public marketplace service.

## Verified in-repo surfaces

- Adapter metadata manifests (`marketplace/adapters/registry.json`)
- Example integration harnesses (`examples/external-integration/*`)
- Registry verification command: `pnpm run verify:adapters`

## Current boundary

- Registry entries without matching executable examples should be treated as **illustrative**, not production-verified.
- Submission/review APIs are not claimed from this repo snapshot.
