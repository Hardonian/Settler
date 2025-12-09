#!/bin/bash
# Verify Build Setup
# Comprehensive check of all build configurations

set -e

echo "🔍 Verifying Build Setup"
echo "========================"
echo ""

ERRORS=0
WARNINGS=0

# Check Node.js version
echo "📦 Node.js Version:"
NODE_VERSION=$(node -v)
echo "   $NODE_VERSION"
if [[ "$NODE_VERSION" =~ ^v2[4-9]\. ]]; then
    echo "   ✅ Compatible"
else
    echo "   ⚠️  Should be >= 24.0.0"
    ((WARNINGS++))
fi
echo ""

# Check npm version
echo "📦 npm Version:"
NPM_VERSION=$(npm -v)
echo "   $NPM_VERSION"
if [[ $(echo "$NPM_VERSION >= 10.0.0" | bc -l 2>/dev/null || echo "1") == "1" ]]; then
    echo "   ✅ Compatible"
else
    echo "   ⚠️  Should be >= 10.0.0"
    ((WARNINGS++))
fi
echo ""

# Check TypeScript
echo "📘 TypeScript:"
if command -v tsc &> /dev/null; then
    TS_VERSION=$(tsc --version)
    echo "   $TS_VERSION ✅"
else
    echo "   ❌ Not found"
    ((ERRORS++))
fi
echo ""

# Check Turbo
echo "⚡ Turbo:"
if command -v turbo &> /dev/null || npx turbo --version &> /dev/null; then
    TURBO_VERSION=$(npx turbo --version 2>/dev/null || echo "installed")
    echo "   $TURBO_VERSION ✅"
else
    echo "   ⚠️  Not globally installed (will use npx)"
    ((WARNINGS++))
fi
echo ""

# Check web package
echo "🌐 Web Package:"
if [ -f "packages/web/package.json" ]; then
    echo "   ✅ package.json found"
    
    if [ -f "packages/web/tsconfig.json" ]; then
        echo "   ✅ tsconfig.json found"
        
        # Check for incremental compilation
        if grep -q '"incremental": true' packages/web/tsconfig.json; then
            echo "   ✅ Incremental compilation enabled"
        else
            echo "   ⚠️  Incremental compilation not enabled"
            ((WARNINGS++))
        fi
    else
        echo "   ❌ tsconfig.json not found"
        ((ERRORS++))
    fi
    
    if [ -f "packages/web/next.config.js" ]; then
        echo "   ✅ next.config.js found"
    else
        echo "   ❌ next.config.js not found"
        ((ERRORS++))
    fi
else
    echo "   ❌ package.json not found"
    ((ERRORS++))
fi
echo ""

# Check build optimizer script
echo "🔧 Build Scripts:"
if [ -f "scripts/vercel-build-optimizer.js" ]; then
    echo "   ✅ vercel-build-optimizer.js found"
    if [ -x "scripts/vercel-build-optimizer.js" ]; then
        echo "   ✅ Executable"
    else
        echo "   ⚠️  Not executable (fixing...)"
        chmod +x scripts/vercel-build-optimizer.js
    fi
else
    echo "   ❌ vercel-build-optimizer.js not found"
    ((ERRORS++))
fi
echo ""

# Check Turbo config
echo "⚙️  Turbo Configuration:"
if [ -f "turbo.json" ]; then
    echo "   ✅ turbo.json found"
    
    # Check for build caching
    if grep -q '"cache": true' turbo.json; then
        echo "   ✅ Build caching enabled"
    else
        echo "   ⚠️  Build caching not explicitly enabled"
        ((WARNINGS++))
    fi
else
    echo "   ❌ turbo.json not found"
    ((ERRORS++))
fi
echo ""

# Check Vercel config
echo "🚀 Vercel Configuration:"
if [ -f "vercel.json" ]; then
    echo "   ✅ vercel.json found"
    
    # Check for optimized install command
    if grep -q "npm ci --prefer-offline" vercel.json; then
        echo "   ✅ Optimized install command"
    else
        echo "   ⚠️  Install command not optimized"
        ((WARNINGS++))
    fi
else
    echo "   ⚠️  vercel.json not found (optional)"
    ((WARNINGS++))
fi
echo ""

# Check workspace dependencies
echo "📚 Workspace Dependencies:"
WORKSPACE_PKGS=("api" "sdk" "types" "protocol" "react-settler")
MISSING=0
for pkg in "${WORKSPACE_PKGS[@]}"; do
    if [ -d "packages/$pkg" ]; then
        echo "   ✅ @settler/$pkg"
    else
        echo "   ❌ @settler/$pkg not found"
        ((MISSING++))
    fi
done
if [ $MISSING -gt 0 ]; then
    ((ERRORS++))
fi
echo ""

# Summary
echo "================================"
echo "📊 Summary:"
echo "   Errors: $ERRORS"
echo "   Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed! Build setup is optimal."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Setup is functional but has some warnings."
    echo "   Review warnings above for optimization opportunities."
    exit 0
else
    echo "❌ Setup has errors that need to be fixed."
    echo "   Please resolve the errors above before building."
    exit 1
fi
