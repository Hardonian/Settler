#!/bin/bash
# Setup Stripe Prices Script
# 
# This script helps you create Stripe products and prices for Settler.dev billing.
# Run this script to create monthly and annual prices for Pro and Scale plans.
#
# Prerequisites:
# - Stripe CLI installed (stripe --version)
# - Stripe account logged in (stripe login)
# - Stripe API key set (STRIPE_SECRET_KEY)

set -e

echo "🚀 Settler.dev Stripe Price Setup"
echo "=================================="
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Please install it first:"
    echo "   macOS: brew install stripe/stripe-cli/stripe"
    echo "   Linux/Windows: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Check if STRIPE_SECRET_KEY is set
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "⚠️  STRIPE_SECRET_KEY not set. Using Stripe CLI default."
    echo "   Make sure you've run: stripe login"
    echo ""
fi

echo "This script will create:"
echo "  - Pro Plan: Monthly ($99/month) and Annual ($990/year)"
echo "  - Scale Plan: Monthly ($499/month) and Annual ($4990/year)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "📦 Creating Stripe Products and Prices..."
echo ""

# Create Pro Plan Product
echo "Creating Pro Plan product..."
PRO_PRODUCT=$(stripe products create \
    --name="Settler Pro" \
    --description="For growing businesses with higher usage needs" \
    --metadata[planCode]=pro \
    --format=json | jq -r '.id')

echo "✅ Pro Product ID: $PRO_PRODUCT"

# Create Pro Monthly Price
echo "Creating Pro Monthly price..."
PRO_MONTHLY=$(stripe prices create \
    --product="$PRO_PRODUCT" \
    --unit-amount=9900 \
    --currency=usd \
    --recurring[interval]=month \
    --metadata[planCode]=pro \
    --metadata[billingCycle]=monthly \
    --format=json | jq -r '.id')

echo "✅ Pro Monthly Price ID: $PRO_MONTHLY"

# Create Pro Annual Price
echo "Creating Pro Annual price..."
PRO_ANNUAL=$(stripe prices create \
    --product="$PRO_PRODUCT" \
    --unit-amount=99000 \
    --currency=usd \
    --recurring[interval]=year \
    --metadata[planCode]=pro \
    --metadata[billingCycle]=annual \
    --format=json | jq -r '.id')

echo "✅ Pro Annual Price ID: $PRO_ANNUAL"

# Create Scale Plan Product
echo "Creating Scale Plan product..."
SCALE_PRODUCT=$(stripe products create \
    --name="Settler Scale" \
    --description="For large organizations with high-volume needs" \
    --metadata[planCode]=scale \
    --format=json | jq -r '.id')

echo "✅ Scale Product ID: $SCALE_PRODUCT"

# Create Scale Monthly Price
echo "Creating Scale Monthly price..."
SCALE_MONTHLY=$(stripe prices create \
    --product="$SCALE_PRODUCT" \
    --unit-amount=49900 \
    --currency=usd \
    --recurring[interval]=month \
    --metadata[planCode]=scale \
    --metadata[billingCycle]=monthly \
    --format=json | jq -r '.id')

echo "✅ Scale Monthly Price ID: $SCALE_MONTHLY"

# Create Scale Annual Price
echo "Creating Scale Annual price..."
SCALE_ANNUAL=$(stripe prices create \
    --product="$SCALE_PRODUCT" \
    --unit-amount=499000 \
    --currency=usd \
    --recurring[interval]=year \
    --metadata[planCode]=scale \
    --metadata[billingCycle]=annual \
    --format=json | jq -r '.id')

echo "✅ Scale Annual Price ID: $SCALE_ANNUAL"

echo ""
echo "✨ Setup Complete!"
echo ""
echo "Add these to your .env file:"
echo "=============================="
echo ""
echo "# Stripe Price IDs"
echo "STRIPE_PRICE_ID_PRO_MONTHLY=$PRO_MONTHLY"
echo "STRIPE_PRICE_ID_PRO_ANNUAL=$PRO_ANNUAL"
echo "STRIPE_PRICE_ID_SCALE_MONTHLY=$SCALE_MONTHLY"
echo "STRIPE_PRICE_ID_SCALE_ANNUAL=$SCALE_ANNUAL"
echo ""
echo "For Vercel/Production, add these as environment variables:"
echo "  - STRIPE_PRICE_ID_PRO_MONTHLY"
echo "  - STRIPE_PRICE_ID_PRO_ANNUAL"
echo "  - STRIPE_PRICE_ID_SCALE_MONTHLY"
echo "  - STRIPE_PRICE_ID_SCALE_ANNUAL"
echo ""
