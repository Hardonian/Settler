#!/bin/bash
# Vercel Deployment Script with Build Cache Clearing
# 
# Usage: ./scripts/vercel-deploy.sh [environment]
# Example: ./scripts/vercel-deploy.sh production

set -e

ENVIRONMENT=${1:-production}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Vercel Deployment Script${NC}"
echo "================================"
echo ""
echo "Environment: $ENVIRONMENT"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel. Please login:${NC}"
    vercel login
fi

echo -e "${GREEN}✅ Vercel CLI ready${NC}"
echo ""

# Check environment variables
echo "Checking environment variables..."
if vercel env ls | grep -q "DATABASE_URL"; then
    echo -e "${GREEN}✅ DATABASE_URL is set${NC}"
else
    echo -e "${RED}❌ DATABASE_URL not found in Vercel${NC}"
    echo ""
    echo "Please add DATABASE_URL to Vercel:"
    echo "1. Go to Vercel Dashboard → Project → Settings → Environment Variables"
    echo "2. Add DATABASE_URL with your connection string"
    echo "3. Set for Production, Preview, and Development"
    echo ""
    read -p "Press Enter after adding DATABASE_URL to continue..."
fi

echo ""
echo -e "${YELLOW}📦 Preparing deployment...${NC}"

# Clear build cache by using --force flag
echo -e "${YELLOW}🗑️  Clearing build cache...${NC}"

# Deploy with cleared cache
if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${GREEN}🚀 Deploying to production...${NC}"
    vercel --prod --force
else
    echo -e "${GREEN}🚀 Deploying to preview...${NC}"
    vercel --force
fi

echo ""
echo -e "${GREEN}✅ Deployment initiated!${NC}"
echo ""
echo "Next steps:"
echo "1. Check deployment status in Vercel Dashboard"
echo "2. Verify health endpoint: https://your-domain.com/api/health/console"
echo "3. Test console routes: https://your-domain.com/api/console/api-keys"
echo "4. Check build logs for any errors"
echo ""
