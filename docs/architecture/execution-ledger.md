# Execution Ledger Architecture

The execution ledger is an append-only receipt store for deterministic run history.

## Entry schema

Each execution writes `ledger/<execution_id>.json` with:

- `execution_id`
- `tenant_id`
- `trace_id`
- `timestamp`
- `execution_hash`
- `previous_execution_hash`
- `policy_version`
- `input_hash`
- `output_hash`
- `status`
- `duration`
- `initiator` (`CLI` | `API` | `worker`)
- `tool_calls`

## Integrity model

Chain hash formula:

`execution_hash = BLAKE3(previous_execution_hash + canonical_execution_receipt)`

Current implementation uses a deterministic BLAKE3-compatible digest path in TypeScript runtime (`blake2s256` fallback) so chain generation stays deterministic across CLI and web runtime even when native BLAKE3 is unavailable.

## Storage and lookup

- Canonical local path: `ledger/*.json`
- Append-only file-per-execution
- Read path supports tenant scoping and pagination (`offset`, `limit`)
- Explorer caches parsed ledger reads via server memoization to avoid repeated full scans in a single request graph
