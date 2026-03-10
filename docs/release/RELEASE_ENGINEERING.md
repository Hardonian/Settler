# Release Engineering System

## Goals

This release pipeline is optimized for deterministic, solo-operator shipping:

- lockfile-enforced installs
- deterministic package version propagation
- reproducible artifact generation
- checksum and manifest validation
- OSS/private package boundary enforcement

## Release primitives

- `pnpm run version:bump <semver>`: updates root and workspace package versions in one operation.
- `pnpm run build:clean`: clean checkout style build (`clean:all`, frozen-lockfile install, build).
- `pnpm run release:artifacts`: creates versioned distributable tarballs under `artifacts/release/npm`.
- `pnpm run verify:release:artifacts`: verifies generated checksums and manifest coherence.
- `pnpm run release:dry-run`: runs release verification profile + packaging + artifact verification.

## Workflow

GitHub Actions workflow: `.github/workflows/release-engineering.yml`

Pipeline gates:

1. dependency install (`pnpm install --frozen-lockfile`)
2. lint
3. typecheck
4. tests (`test:ci:verify`)
5. build verification (`build:all`)
6. release verification (`verify:release`)
7. packaging (`release:artifacts`)
8. artifact validation (`verify:release:artifacts`)

Any failure blocks release publication.

## Artifact outputs

Generated in `artifacts/release/`:

- `npm/*.tgz` publishable package tarballs
- `checksums.sha256` deterministic checksums
- `manifest.json` release metadata (commit, lockfile hash, version)
- `sbom-metadata.json` dependency provenance metadata

## OSS vs enterprise boundary

Policy file: `release/packaging-policy.json`.

`release:artifacts` enforces that OSS-packaged workspace modules do **not** depend on private workspace packages. Enterprise overlays are modeled as optional private-registry/provider-injection attachments and are intentionally excluded from OSS artifacts.

## Rollback

1. identify prior stable tag (`git tag --sort=-v:refname | head`)
2. redeploy prior release assets from GitHub Releases
3. re-run `pnpm run verify:release:artifacts` against downloaded artifacts before promotion
4. capture incident note in release log

## Operator audit checklist

- Confirm tag matches `package.json` version.
- Confirm manifest `lockfileSha256` exists.
- Confirm checksum verification passes.
- Confirm no OSS/private boundary violations.
- Confirm release workflow artifacts are retained.
