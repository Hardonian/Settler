#!/bin/bash
# Setup Vercel Turbo Remote Caching
# This script helps configure Turbo remote caching for Vercel deployments

set -e

echo "🚀 Setting up Turbo Remote Caching for Vercel"
echo "=============================================="
echo ""

# Check if we're in a Vercel environment
if [ -n "$VERCEL" ]; then
    echo "✅ Running in Vercel environment"
else
    echo "ℹ️  Running locally (not in Vercel)"
fi

echo ""
echo "📋 To enable Turbo remote caching in Vercel:"
echo ""
echo "1. Get your Turbo token:"
echo "   - Go to https://vercel.com/teams/[your-team]/settings/tokens"
echo "   - Or visit: https://turbo.build/repo/docs/core-concepts/remote-caching"
echo ""
echo "2. Add environment variables in Vercel:"
echo "   - TURBO_TOKEN: Your Turbo authentication token"
echo "   - TURBO_TEAM: Your Vercel team ID or Turbo team slug"
echo ""
echo "3. These can be added at:"
echo "   - Project Settings → Environment Variables"
echo "   - Or via Vercel CLI: vercel env add TURBO_TOKEN"
echo ""
echo "4. After adding, rebuild your project"
echo ""

# Check if variables are already set
if [ -n "$TURBO_TOKEN" ] && [ -n "$TURBO_TEAM" ]; then
    echo "✅ Turbo cache variables are set!"
    echo "   TURBO_TEAM: $TURBO_TEAM"
    echo "   TURBO_TOKEN: ${TURBO_TOKEN:0:10}..."
    echo ""
    echo "🔍 Testing Turbo cache connection..."
    npx turbo login --sso-team "$TURBO_TEAM" 2>/dev/null || echo "⚠️  Could not verify connection (this is normal if not logged in)"
else
    echo "⚠️  Turbo cache variables not set"
    echo ""
    echo "💡 Benefits of enabling Turbo cache:"
    echo "   - 50-90% faster builds when cache hits"
    echo "   - Shared cache across team members"
    echo "   - Reduced build costs"
    echo ""
    echo "📚 Documentation:"
    echo "   https://turbo.build/repo/docs/core-concepts/remote-caching"
fi

echo ""
echo "✅ Setup instructions complete!"
echo ""
echo "Next steps:"
echo "1. Add TURBO_TOKEN and TURBO_TEAM to Vercel environment variables"
echo "2. Rebuild your project"
echo "3. Check build logs for cache hit rates"
