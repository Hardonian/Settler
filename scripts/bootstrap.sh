#!/usr/bin/env bash
# scripts/bootstrap.sh — universal bootstrap. Safe to re-run.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
echo "== Bootstrapping $(basename "$PWD") =="

# --- stack detection ---
if [ -f pyproject.toml ] || [ -f requirements.txt ] || [ -f setup.py ]; then
  STACK=python
elif [ -f package.json ]; then
  STACK=node
elif [ -f Cargo.toml ]; then
  STACK=rust
elif [ -f go.mod ]; then
  STACK=go
elif [ -f docker-compose.yml ] || [ -f docker-compose.yaml ] || [ -f Dockerfile ]; then
  STACK=docker
else
  STACK=generic
fi
echo "Detected stack: $STACK"

# --- .env ---
if [ -f .env.example ] && [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — EDIT IT with your secrets."
fi

case "$STACK" in
  python)
    python3 -m venv .venv 2>/dev/null || true
    # shellcheck disable=SC1091
    . .venv/bin/activate 2>/dev/null || true
    if [ -f pyproject.toml ]; then
      pip install -q -e ".[dev]" 2>/dev/null || pip install -q -e . 2>/dev/null || pip install -q -r requirements.txt 2>/dev/null || true
    else
      pip install -q -r requirements.txt 2>/dev/null || true
    fi
    ;;
  node)
    npm install 2>/dev/null || pnpm install 2>/dev/null || yarn install 2>/dev/null || true
    ;;
  rust)
    cargo build 2>/dev/null || true
    ;;
  go)
    go mod download 2>/dev/null || true
    ;;
  docker)
    docker compose build 2>/dev/null || true
    ;;
  *)
    echo "No known build system — skipping install."
    ;;
esac

echo "== Bootstrap complete. Next: cp .env.example .env (if not done) then 'just dev' =="
