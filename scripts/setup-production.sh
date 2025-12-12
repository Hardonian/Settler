#!/bin/bash

# Production Environment Setup Script
# Validates environment variables and ensures all required services are configured

set -e

echo "🚀 Settler Production Setup"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in production
if [ "$NODE_ENV" != "production" ]; then
    echo -e "${YELLOW}Warning: NODE_ENV is not set to 'production'${NC}"
fi

# Required environment variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "DATABASE_URL"
)

# Optional but recommended
RECOMMENDED_VARS=(
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "RESEND_API_KEY"
    "NEXT_PUBLIC_SENTRY_DSN"
    "ADMIN_EMAIL"
)

echo "Checking required environment variables..."
MISSING_REQUIRED=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_REQUIRED+=("$var")
        echo -e "${RED}✗${NC} $var (REQUIRED)"
    else
        echo -e "${GREEN}✓${NC} $var"
    fi
done

echo ""
echo "Checking recommended environment variables..."
MISSING_RECOMMENDED=()
for var in "${RECOMMENDED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_RECOMMENDED+=("$var")
        echo -e "${YELLOW}⚠${NC} $var (RECOMMENDED)"
    else
        echo -e "${GREEN}✓${NC} $var"
    fi
done

# Validate Supabase URL format
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    if [[ ! "$NEXT_PUBLIC_SUPABASE_URL" =~ ^https://.*\.supabase\.co$ ]]; then
        echo -e "${RED}✗${NC} NEXT_PUBLIC_SUPABASE_URL format invalid (should be https://*.supabase.co)"
        MISSING_REQUIRED+=("NEXT_PUBLIC_SUPABASE_URL_FORMAT")
    fi
fi

# Validate DATABASE_URL format
if [ -n "$DATABASE_URL" ]; then
    if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
        echo -e "${RED}✗${NC} DATABASE_URL format invalid (should start with postgresql://)"
        MISSING_REQUIRED+=("DATABASE_URL_FORMAT")
    fi
fi

# Check database connectivity
echo ""
echo "Testing database connectivity..."
if [ -n "$DATABASE_URL" ]; then
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
            echo -e "${GREEN}✓${NC} Database connection successful"
        else
            echo -e "${RED}✗${NC} Database connection failed"
            MISSING_REQUIRED+=("DATABASE_CONNECTION")
        fi
    else
        echo -e "${YELLOW}⚠${NC} psql not available, skipping database test"
    fi
fi

# Summary
echo ""
echo "=========================="
if [ ${#MISSING_REQUIRED[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All required variables are set${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}✗ Missing ${#MISSING_REQUIRED[@]} required variable(s)${NC}"
    echo ""
    echo "Missing required variables:"
    for var in "${MISSING_REQUIRED[@]}"; do
        echo "  - $var"
    done
    EXIT_CODE=1
fi

if [ ${#MISSING_RECOMMENDED[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠ Missing ${#MISSING_RECOMMENDED[@]} recommended variable(s)${NC}"
    echo "Missing recommended variables:"
    for var in "${MISSING_RECOMMENDED[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "These are not required but recommended for full functionality:"
    echo "  - Stripe: Required for billing"
    echo "  - Resend: Required for email delivery"
    echo "  - Sentry: Required for error tracking"
    echo "  - Admin Email: Required for critical alerts"
fi

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Production setup validation passed!${NC}"
else
    echo -e "${RED}❌ Production setup validation failed!${NC}"
    echo ""
    echo "Please set the missing environment variables and try again."
fi

exit $EXIT_CODE
