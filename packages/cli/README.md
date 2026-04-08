# @settler/cli

Settler command-line interface for diagnostics, deterministic demo/replay flows, and control-plane operations.

## Install

```bash
pnpm --filter @settler/cli build
# or from npm when published
npm install -g @settler/cli
```

## Core commands

```bash
settler doctor
settler demo
settler replay --help
settler verify --help
settler failures --help
settler policy --help
settler tenant-check --help
settler bugreport --help
```

## API-oriented commands

`jobs`, `reports`, `webhooks`, `adapters`, `console`, `admin`, `export`, `verify-export`, `mcp`.

## Local development stack helper

```bash
settler dev stack
```

This prints the recommended local service startup commands for web, API, event-log service, and storage.

## Configuration

- `SETTLER_API_KEY`
- `SETTLER_BASE_URL` (defaults to `https://api.settler.io`)

## Package invariants

- Commands should emit machine-parseable output where possible.
- Diagnostics must avoid leaking secrets; use redacted bug reports.
- Local file writes that mutate registries/install state require explicit unsafe acknowledgement flags.

## Status

This package is actively expanded. Commands loaded from `src/commands/future.ts` are **experimental** and not part of Settler's launch-critical CLI contract; avoid using them for production automation unless explicitly version-pinned and validated in your environment.
