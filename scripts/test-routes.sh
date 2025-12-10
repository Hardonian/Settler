#!/bin/bash
#
# Route Testing Script
# Tests critical routes after deployment to verify fixes are working
#
# Usage:
#   ./scripts/test-routes.sh [base-url]
#
# Example:
#   ./scripts/test-routes.sh https://www.settler.dev

set -e

BASE_URL="${1:-https://www.settler.dev}"
EXIT_CODE=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "🧪 Testing Routes on ${BASE_URL}"
echo "=================================="
echo ""

# Function to test a route
test_route() {
    local route=$1
    local expected_status=$2
    local description=$3
    local url="${BASE_URL}${route}"
    
    echo -n "Testing ${route}... "
    
    # Make request and capture status code and response
    response=$(curl -s -o /tmp/route_response.html -w "%{http_code}" "$url" 2>&1)
    status_code="${response: -3}"
    
    # Check if we got a valid HTTP status code
    if [[ ! "$status_code" =~ ^[0-9]{3}$ ]]; then
        echo -e "${RED}FAILED${NC} - Could not connect"
        echo "   Error: $response"
        EXIT_CODE=1
        return 1
    fi
    
    # Check status code
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ OK${NC} (${status_code})"
        
        # Additional checks for 200 responses
        if [ "$status_code" = "200" ]; then
            # Check for error messages in response
            if grep -qi "500\|Internal Server Error\|Something went wrong" /tmp/route_response.html > /dev/null 2>&1; then
                echo -e "   ${YELLOW}⚠ WARNING: Response contains error indicators${NC}"
            fi
            
            # Check for placeholder content
            if grep -qi "coming soon\|placeholder\|TODO\|FIXME" /tmp/route_response.html > /dev/null 2>&1; then
                echo -e "   ${YELLOW}ℹ INFO: Response contains placeholder content${NC}"
            fi
        fi
        
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected ${expected_status}, got ${status_code})"
        
        # Show error details for failed routes
        if [ "$status_code" = "404" ]; then
            echo "   Route not found - check routing configuration"
        elif [ "$status_code" = "500" ]; then
            echo "   Server error - check logs and environment variables"
            # Extract error message if possible
            error_msg=$(grep -oP '(?<=<title>)[^<]*(?=</title>)' /tmp/route_response.html 2>/dev/null || echo "Unknown error")
            echo "   Error: $error_msg"
        elif [ "$status_code" = "302" ] || [ "$status_code" = "301" ]; then
            redirect_url=$(curl -s -o /dev/null -w "%{redirect_url}" "$url" 2>&1)
            echo "   Redirected to: $redirect_url"
        fi
        
        EXIT_CODE=1
        return 1
    fi
}

# Test critical routes
echo "📄 Testing Critical Routes"
echo "---------------------------"

# Fixed routes (should now work)
test_route "/docs" "200" "Documentation page (FIXED)"
test_route "/console" "302" "Console page (should redirect if not authenticated)" # 302 is OK - redirects to signup

# Routes that should work
test_route "/" "200" "Homepage"
test_route "/pricing" "200" "Pricing page"
test_route "/playground" "200" "Playground"
test_route "/signup" "200" "Signup page"
test_route "/enterprise" "200" "Enterprise page"
test_route "/community" "200" "Community page"
test_route "/support" "200" "Support page"
test_route "/cookbooks" "200" "Cookbooks page"
test_route "/receipts" "200" "Receipts API page"
test_route "/feature-flags" "200" "Feature Flags page"

# Legal pages
echo ""
echo "📜 Testing Legal Pages"
echo "----------------------"
test_route "/legal/terms" "200" "Terms of Service"
test_route "/legal/privacy" "200" "Privacy Policy"
test_route "/legal/license" "200" "License"

# Test navigation links (check they don't 404)
echo ""
echo "🔗 Testing Navigation Links"
echo "---------------------------"
test_route "/docs/quickstart" "200" "Docs quickstart"
test_route "/docs/api" "200" "Docs API reference"

# Test error handling
echo ""
echo "🛡️  Testing Error Handling"
echo "--------------------------"
test_route "/nonexistent-page-12345" "404" "Non-existent page (should 404)"

# Summary
echo ""
echo "=================================="
echo "📊 Test Summary"
echo "=================================="

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All critical routes are working!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Manually test /console with authentication"
    echo "2. Verify all navigation links work"
    echo "3. Check mobile responsiveness"
    echo "4. Monitor error logs for any issues"
else
    echo -e "${RED}❌ Some routes failed!${NC}"
    echo ""
    echo "Please check:"
    echo "1. Environment variables are set correctly"
    echo "2. Routes are deployed correctly"
    echo "3. Check Vercel deployment logs"
    exit $EXIT_CODE
fi

# Cleanup
rm -f /tmp/route_response.html
