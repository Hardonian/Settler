#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$(dirname "$SCRIPT_DIR")"

rm -rf "$AGENTS_DIR/pids"

echo "Settler agents stop boundary"
echo
echo "No daemonized local agents are supported from packages/agents."
echo "Any stale PID directory has been removed."

exit 0
