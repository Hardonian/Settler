#!/bin/bash
set -e

echo "=== Vercel Install Script ==="
echo "Initial working directory: $(pwd)"
echo "Node version: $(node --version 2>&1 || echo 'node not found')"
echo "npm version: $(npm --version 2>&1 || echo 'npm not found')"

# Find the repository root (where package-lock.json should be)
# Try current directory first, then go up if needed
REPO_ROOT="$(pwd)"
INITIAL_DIR="$(pwd)"

# First, try to find package-lock.json by going up the directory tree
while [ ! -f "$REPO_ROOT/package-lock.json" ] && [ "$REPO_ROOT" != "/" ]; do
  REPO_ROOT="$(dirname "$REPO_ROOT")"
done

# If still not found, try going up from common Vercel build directories
if [ ! -f "$REPO_ROOT/package-lock.json" ]; then
  # Vercel might run from packages/web or similar
  for dir in "../.." "../../.." "../" "."; do
    TEST_DIR="$(cd "$INITIAL_DIR/$dir" 2>/dev/null && pwd || echo "")"
    if [ -n "$TEST_DIR" ] && [ -f "$TEST_DIR/package-lock.json" ]; then
      REPO_ROOT="$TEST_DIR"
      break
    fi
  done
fi

if [ ! -f "$REPO_ROOT/package-lock.json" ]; then
  echo "ERROR: package-lock.json not found in repository!"
  echo "Searched from $INITIAL_DIR up to $REPO_ROOT"
  echo "Listing files in initial directory:"
  ls -la "$INITIAL_DIR" | head -20 || true
  echo "Listing files in potential root:"
  ls -la "$REPO_ROOT" | head -20 || true
  exit 1
fi

# Change to repository root if needed
if [ "$REPO_ROOT" != "$(pwd)" ]; then
  echo "Changing to repository root: $REPO_ROOT (from $INITIAL_DIR)"
  cd "$REPO_ROOT"
fi

echo "✓ package-lock.json found at $(pwd)/package-lock.json"
echo "Final working directory: $(pwd)"

# Get npm major version
NPM_MAJOR=$(npm --version | cut -d. -f1)
echo "npm major version: $NPM_MAJOR"

# Ensure npm version is compatible (npm 7+ for lockfileVersion 3)
if [ "$NPM_MAJOR" -lt 7 ]; then
  echo "WARNING: npm version is $NPM_MAJOR, but lockfileVersion 3 requires npm 7+"
  echo "Attempting to use corepack to ensure correct npm version..."
  corepack enable 2>/dev/null || true
  corepack prepare npm@10.2.4 --activate 2>/dev/null || true
  NPM_MAJOR=$(npm --version | cut -d. -f1)
  echo "npm version after corepack: $(npm --version)"
fi

# Check lockfile version
LOCKFILE_VERSION=$(node -p "require('./package-lock.json').lockfileVersion" 2>/dev/null || echo "unknown")
echo "Lockfile version: $LOCKFILE_VERSION"

# npm 7+ supports lockfileVersion 3
# npm 6 supports lockfileVersion 2
# npm 5 supports lockfileVersion 1
if [ "$LOCKFILE_VERSION" = "3" ] && [ "$NPM_MAJOR" -lt 7 ]; then
  echo "WARNING: lockfileVersion 3 requires npm 7+, but npm $NPM_MAJOR is installed"
  echo "This may cause issues. Consider upgrading npm or regenerating lockfile."
fi

# Run npm ci
echo "Running npm ci..."
npm ci --prefer-offline --no-audit --omit=optional

echo "✓ npm ci completed successfully"
