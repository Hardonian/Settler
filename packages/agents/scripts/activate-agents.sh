#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$(dirname "$SCRIPT_DIR")"

echo "Settler agents activation boundary"
echo
echo "Daemonized local agent orchestration is intentionally disabled."
echo "This package currently supports one-shot security verification only."
echo
echo "Run instead:"
echo "  pnpm --filter @settler/agents build"
echo "  pnpm --filter @settler/agents start"
echo
echo "For repo-owned edge-function agent execution, use:"
echo "  pnpm run agents:run <agent-type>"

exit 1
