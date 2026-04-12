#!/bin/bash
set -euo pipefail

echo "Settler agents status boundary"
echo
echo "No daemonized local agents are supported from packages/agents."
echo "This package now exposes one-shot verification only."
echo
echo "Supported command:"
echo "  pnpm --filter @settler/agents start"

exit 0
