#!/bin/bash
set -e

echo "=== Vercel Install Script ==="
echo "Working directory: $(pwd)"
echo "Node version: $(node --version 2>&1 || echo 'node not found')"
echo "npm version: $(npm --version 2>&1 || echo 'npm not found')"

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

# Verify package-lock.json exists
if [ ! -f "package-lock.json" ]; then
  echo "ERROR: package-lock.json not found in $(pwd)!"
  echo "Listing files in current directory:"
  ls -la | head -20
  exit 1
fi

echo "✓ package-lock.json found"

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
