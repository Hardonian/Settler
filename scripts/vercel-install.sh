#!/bin/bash
set -e

echo "=== Vercel Install Script ==="
echo "Initial working directory: $(pwd)"
echo "Node version: $(node --version 2>&1 || echo 'node not found')"

# Find the repository root (where pnpm-lock.yaml should be)
REPO_ROOT="$(pwd)"
INITIAL_DIR="$(pwd)"

while [ ! -f "$REPO_ROOT/pnpm-lock.yaml" ] && [ "$REPO_ROOT" != "/" ]; do
  REPO_ROOT="$(dirname "$REPO_ROOT")"
done

if [ ! -f "$REPO_ROOT/pnpm-lock.yaml" ]; then
  for dir in "../.." "../../.." "../" "."; do
    TEST_DIR="$(cd "$INITIAL_DIR/$dir" 2>/dev/null && pwd || echo "")"
    if [ -n "$TEST_DIR" ] && [ -f "$TEST_DIR/pnpm-lock.yaml" ]; then
      REPO_ROOT="$TEST_DIR"
      break
    fi
  done
fi

if [ ! -f "$REPO_ROOT/pnpm-lock.yaml" ]; then
  echo "ERROR: pnpm-lock.yaml not found in repository!"
  exit 1
fi

if [ "$REPO_ROOT" != "$(pwd)" ]; then
  echo "Changing to repository root: $REPO_ROOT (from $INITIAL_DIR)"
  cd "$REPO_ROOT"
fi

echo "✓ pnpm-lock.yaml found at $(pwd)/pnpm-lock.yaml"

echo "Enabling corepack and preparing pnpm@9.15.0..."
corepack enable
corepack prepare pnpm@9.15.0 --activate

echo "Running pnpm install --frozen-lockfile..."
pnpm install --frozen-lockfile

echo "✓ pnpm install completed successfully"

