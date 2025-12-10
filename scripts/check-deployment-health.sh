#!/bin/bash
#
# Deployment Health Check Script
# Comprehensive health check for production deployment
#
# Usage:
#   ./scripts/check-deployment-health.sh [base-url]
#

set -e

BASE_URL="${1:-https://www.settler.dev}"

echo ""
echo "🏥 Deployment Health Check"
echo "=========================="
echo "Base URL: ${BASE_URL}"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

EXIT_CODE=0

# Function to check HTTP status
check_status() {
    local url=$1
    local expected=$2
    local name=$3
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)
    
    if [ "$status" = "$expected" ]; then
        echo -e "${GREEN}✓${NC} $name: $status"
        return 0
    else
        echo -e "${RED}✗${NC} $name: Expected $expected, got $status"
        EXIT_CODE=1
        return 1
    fi
}

# Function to check response time
check_performance() {
    local url=$1
    local name=$2
    local max_time=3000  # 3 seconds in milliseconds
    
    time_total=$(curl -s -o /dev/null -w "%{time_total}" "$url" 2>&1)
    time_ms=$(echo "$time_total * 1000" | bc | cut -d. -f1)
    
    if [ "$time_ms" -lt "$max_time" ]; then
        echo -e "${GREEN}✓${NC} $name: ${time_ms}ms (good)"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $name: ${time_ms}ms (slow)"
        return 0
    fi
}

# Function to check SSL
check_ssl() {
    local domain=$1
    echo -n "Checking SSL certificate... "
    
    if echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | grep -q "Verify return code: 0"; then
        echo -e "${GREEN}✓ Valid${NC}"
        return 0
    else
        echo -e "${RED}✗ Invalid${NC}"
        EXIT_CODE=1
        return 1
    fi
}

# Function to check security headers
check_security_headers() {
    local url=$1
    echo "Checking security headers..."
    
    headers=$(curl -s -I "$url" 2>&1)
    
    local has_hsts=false
    local has_xframe=false
    local has_xcontent=false
    
    if echo "$headers" | grep -qi "strict-transport-security"; then
        has_hsts=true
        echo -e "  ${GREEN}✓${NC} HSTS"
    else
        echo -e "  ${YELLOW}⚠${NC} Missing HSTS"
    fi
    
    if echo "$headers" | grep -qi "x-frame-options"; then
        has_xframe=true
        echo -e "  ${GREEN}✓${NC} X-Frame-Options"
    else
        echo -e "  ${YELLOW}⚠${NC} Missing X-Frame-Options"
    fi
    
    if echo "$headers" | grep -qi "x-content-type-options"; then
        has_xcontent=true
        echo -e "  ${GREEN}✓${NC} X-Content-Type-Options"
    else
        echo -e "  ${YELLOW}⚠${NC} Missing X-Content-Type-Options"
    fi
}

echo "1. SSL Certificate Check"
echo "------------------------"
check_ssl "www.settler.dev"

echo ""
echo "2. Security Headers Check"
echo "-------------------------"
check_security_headers "${BASE_URL}"

echo ""
echo "3. Critical Routes Status Check"
echo "--------------------------------"
check_status "${BASE_URL}/" "200" "Homepage"
check_status "${BASE_URL}/docs" "200" "Documentation (FIXED)"
check_status "${BASE_URL}/console" "302" "Console (should redirect)"
check_status "${BASE_URL}/pricing" "200" "Pricing"
check_status "${BASE_URL}/signup" "200" "Signup"

echo ""
echo "4. Performance Check"
echo "---------------------"
check_performance "${BASE_URL}/" "Homepage"
check_performance "${BASE_URL}/docs" "Documentation"
check_performance "${BASE_URL}/pricing" "Pricing"

echo ""
echo "5. API Health Check"
echo "-------------------"
check_status "${BASE_URL}/api/status/health" "200" "Health endpoint" || true

echo ""
echo "=========================="
echo "📊 Health Check Summary"
echo "=========================="

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
else
    echo -e "${RED}❌ Some checks failed${NC}"
fi

exit $EXIT_CODE
