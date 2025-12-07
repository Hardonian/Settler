#!/bin/bash
# Developer Onboarding Automation Package
# Automates setup for new developers

set -e

echo "🚀 Settler Developer Onboarding"
echo "================================"

# Check prerequisites
echo "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "Node.js required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm required"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "git required"; exit 1; }

# Install dependencies
echo "Installing dependencies..."
npm install

# Setup environment
echo "Setting up environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env file. Please update with your credentials."
fi

# Setup database
echo "Setting up database..."
if command -v supabase >/dev/null 2>&1; then
  echo "Starting Supabase..."
  supabase start
else
  echo "Supabase CLI not found. Install from https://supabase.com/docs/guides/cli"
fi

# Run migrations
echo "Running migrations..."
npm run db:migrate || echo "Migration command not found. Run manually."

# Setup Git hooks
echo "Setting up Git hooks..."
npm run prepare || echo "Prepare script not found."

# Run tests
echo "Running tests..."
npm test || echo "Tests failed or not configured."

# Generate documentation
echo "Generating documentation..."
npm run docs || echo "Docs generation not configured."

echo ""
echo "✅ Onboarding complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your credentials"
echo "2. Review README.md"
echo "3. Join #dev channel on Slack"
echo "4. Check out your first issue"
