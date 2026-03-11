# Settler

Settler is a deterministic reconciliation and operations platform for teams that need reproducible runs, replayable outcomes, and operator-visible evidence.

## What this repository contains

- `packages/api` — API/control plane and route surfaces.
- `packages/web` — operator console (Run Explorer, replay/proof/operator workflows).
- `packages/cli` — deterministic foundry, replay, and scenario tooling.
- `scripts` — verification, bootstrap, simulation, and operational automation.
- `docs` — canonical documentation hub.

## Quick start

```bash
pnpm install
pnpm demo:settler
pnpm dev:stack
```

For first-time setup and troubleshooting, start with `docs/getting-started/README.md`.

## Core verification commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

Use `pnpm demo:settler` to run a deterministic end-to-end demo pipeline.

## Documentation map

- Documentation hub: `docs/README.md`
- Architecture: `docs/architecture/`
- Operations/runbooks: `docs/operations/`
- Security and privacy: `docs/security/`
- API and references: `docs/reference/`, `docs/api/`
- Governance + inventory artifacts: `docs/_meta/`
- Historical docs archive: `docs/archive/`

## Contributing

See `CONTRIBUTING.md` for contribution workflow and quality gates.

## Security

See `SECURITY.md` for vulnerability reporting instructions and security policy scope.

## License

See `LICENSE` for repository licensing terms and `docs/LICENSING_OVERVIEW.md` for component-level licensing details.
