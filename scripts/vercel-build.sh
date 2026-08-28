#!/bin/bash
# Vercel build script
# Handles monorepo builds for Vercel deployment

set -e

echo "Starting Vercel build for Settler..."

# Run dependency-aware build for web and all its workspace dependencies
pnpm --filter @settler/web... build

echo "Build completed successfully!"

