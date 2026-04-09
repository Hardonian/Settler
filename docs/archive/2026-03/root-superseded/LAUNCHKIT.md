# Settler OSS Launch Kit

## Install

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/settler/settler/main/scripts/install/install.sh | bash
```

Optional: pin a release tag.

```bash
SETTLER_VERSION=v1.0.0 curl -fsSL https://raw.githubusercontent.com/settler/settler/main/scripts/install/install.sh | bash
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/settler/settler/main/scripts/install/install.ps1 | iex
```

Optional: pin a release tag.

```powershell
$env:SETTLER_VERSION="v1.0.0"; irm https://raw.githubusercontent.com/settler/settler/main/scripts/install/install.ps1 | iex
```

## Checksum verification

Every CLI archive ships with an adjacent `.sha256` asset.

```bash
sha256sum -c settler-<version>-<os>-<arch>.<ext>.sha256
```

```powershell
$expected = (Get-Content settler-<version>-windows-x64.zip.sha256).Split(" ")[0]
$actual = (Get-FileHash settler-<version>-windows-x64.zip -Algorithm SHA256).Hash
$expected -eq $actual
```

## First value in one command

```bash
settler demo
```

Expected outputs:

- isolated demo directory path
- evidence capsule path
- replay verification flag (`verified_replay=true`)

## Core command map

- `settler version` — semver + git SHA + build date
- `settler doctor` — runtime and environment summary
- `settler demo` — deterministic local reconciliation smoke + capsule
- `settler bugreport` — redacted support bundle for issue attachments

## Docs map

- OSS/enterprise boundaries: `docs/OSS_VS_ENTERPRISE.md`
- Contributing and verification: `CONTRIBUTING.md`
- Security disclosure + policy: `SECURITY.md`
- CLI usage: `packages/cli/README.md`

## Security/reporting

- Security policy and disclosure: `SECURITY.md`
- Bug reports: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Attach support bundle from `settler bugreport`

## Release process

1. Push a tag: `vX.Y.Z`
2. `release-cli.yml` builds OS/arch CLI archives, emits SHA256 checksums, and runs install smokes.
3. Assets are attached to the tagged GitHub release.
4. Standard repo quality gates still run via `pnpm verify`, site mode matrix, and security workflows.

## Registry safety model

- `settler adapters search/install` and `settler rules search/install` are **metadata-only** operations.
- Registry manifests are size-limited and strictly validated.
- Installing metadata now requires explicit acknowledgement via `--allow-unsafe` because it writes to local filesystem.
