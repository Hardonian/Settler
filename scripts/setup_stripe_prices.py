#!/usr/bin/env python3
"""
Stripe Price Setup Script for Settler

Creates live Stripe products and prices for Settler's Growth and Scale tiers.
Outputs the price IDs to add to environment variables.

Settler Pricing (from docs/pricing.md):
- Free: $0, 100 txns/mo
- Starter: $29/mo, 1,000 txns/mo
- Growth: $99/mo, 10,000 txns/mo
- Enterprise: Custom (typically $500-$10,000+/mo)

Web tier uses: Growth ($9/mo for 100K), Scale ($99/mo for 1M)
API tier uses: Starter ($29), Growth ($99)

We'll create both sets for flexibility.

Usage:
  export STRIPE_SECRET_KEY=sk_live_...  python3 scripts/setup_stripe_prices.py
"""

import os
import sys
import json
import subprocess
import time

def run_stripe_cli(args, secret_key=None):
    """Run stripe CLI command."""
    env = os.environ.copy()
    if secret_key:
        env['STRIPE_SECRET_KEY'] = secret_key
    
    result = subprocess.run(
        ['stripe'] + args,
        capture_output=True,
        text=True,
        env=env
    )
    if result.returncode != 0:
        print(f"ERROR: stripe {' '.join(args)}")
        print(result.stderr)
        return None
    return result.stdout

def create_product(name, description, secret_key=None, metadata=None):
    """Create a Stripe product."""
    args = [
        'products', 'create',
        '--name', name,
        '--description', description,
    ]
    if metadata:
        for k, v in metadata.items():
            args.extend(['--metadata[{}]'.format(k), v])
    
    output = run_stripe_cli(args, secret_key)
    if output:
        try:
            return json.loads(output.strip().split('\n')[-1])
        except:
            pass
    return None

def create_price(product_id, amount_cents, currency, interval, nickname, secret_key=None, metadata=None):
    """Create a Stripe price."""
    args = [
        'prices', 'create',
        '--product', product_id,
        '--unit-amount', str(amount_cents),
        '--currency', currency,
        '--recurring[interval]', interval,
        '--nickname', nickname,
    ]
    if metadata:
        for k, v in metadata.items():
            args.extend(['--metadata[{}]'.format(k), v])
    
    output = run_stripe_cli(args, secret_key)
    if output:
        try:
            return json.loads(output.strip().split('\n')[-1])
        except:
            pass
    return None

def create_webhook_endpoint(url, secret_key=None):
    """Create a webhook endpoint."""
    output = run_stripe_cli([
        'webhook_endpoints', 'create',
        '--url', url,
        '--enabled-events[]', 'customer.subscription.created',
        '--enabled-events[]', 'customer.subscription.updated',
        '--enabled-events[]', 'customer.subscription.deleted',
        '--enabled-events[]', 'checkout.session.completed',
        '--enabled-events[]', 'invoice.paid',
        '--enabled-events[]', 'invoice.payment_failed',
        '--description', 'Settler production webhook',
    ], secret_key)
    
    if output:
        try:
            return json.loads(output.strip().split('\n')[-1])
        except:
            pass
    return None

def main():
    secret_key = os.getenv('STRIPE_SECRET_KEY')
    
    if not secret_key:
        print("ERROR: STRIPE_SECRET_KEY environment variable not set")
        sys.exit(1)
    
    if not secret_key.startswith('sk_live_'):
        print("WARNING: Using test key (sk_test_). For production, use sk_live_ key.")
    
    print("=" * 60)
    print("Settler Stripe Price Setup")
    print("=" * 60)
    
    # Metadata for all Settler products
    base_metadata = {'settler': 'true'}
    
    results = {}
    
    # ---- API Tier Products (from docs/pricing.md) ----
    print("\n[1/8] Creating API Starter product ($29/mo)...")
    api_starter_product = create_product(
        "Settler Starter",
        "Small businesses, startups, side projects. 1,000 txns/mo included, $0.01/txn overage. Priority support, API access, Developer console.",
        secret_key, base_metadata
    )
    if not api_starter_product:
        print("Failed to create API Starter product")
        sys.exit(1)
    api_starter_product_id = api_starter_product['id']
    print(f"  ✓ Product: {api_starter_product_id}")
    
    print("\n[2/8] Creating API Starter price ($29/mo = 2900¢)...")
    api_starter_price = create_price(
        api_starter_product_id, 2900, 'usd', 'month', 'Starter Monthly',
        secret_key, base_metadata
    )
    if not api_starter_price:
        print("Failed to create API Starter price")
        sys.exit(1)
    api_starter_price_id = api_starter_price['id']
    results['API_STARTER_PRICE'] = api_starter_price_id
    print(f"  ✓ Price: {api_starter_price_id}")
    
    print("\n[3/8] Creating API Growth product ($99/mo)...")
    api_growth_product = create_product(
        "Settler Growth",
        "Growing businesses, established fintechs. 10,000 txns/mo included, $0.01/txn overage. Advanced analytics, custom integrations, SLA guarantee.",
        secret_key, base_metadata
    )
    if not api_growth_product:
        print("Failed to create API Growth product")
        sys.exit(1)
    api_growth_product_id = api_growth_product['id']
    print(f"  ✓ Product: {api_growth_product_id}")
    
    print("\n[4/8] Creating API Growth price ($99/mo = 9900¢)...")
    api_growth_price = create_price(
        api_growth_product_id, 9900, 'usd', 'month', 'Growth Monthly',
        secret_key, base_metadata
    )
    if not api_growth_price:
        print("Failed to create API Growth price")
        sys.exit(1)
    api_growth_price_id = api_growth_price['id']
    results['API_GROWTH_PRICE'] = api_growth_price_id
    print(f"  ✓ Price: {api_growth_price_id}")
    
    # ---- Web Tier Products (from planConfig.ts) ----
    print("\n[5/8] Creating Web Growth product ($9/mo for 100K reconciliations)...")
    web_growth_product = create_product(
        "Settler Growth (Web)",
        "For growing businesses. 100,000 reconciliations/mo included, $0.01/reconciliation overage.",
        secret_key, {**base_metadata, 'tier': 'web-growth'}
    )
    if not web_growth_product:
        print("Failed to create Web Growth product")
        sys.exit(1)
    web_growth_product_id = web_growth_product['id']
    print(f"  ✓ Product: {web_growth_product_id}")
    
    print("\n[6/8] Creating Web Growth price ($9/mo = 900¢)...")
    web_growth_price = create_price(
        web_growth_product_id, 900, 'usd', 'month', 'Web Growth Monthly',
        secret_key, {**base_metadata, 'tier': 'web-growth'}
    )
    if not web_growth_price:
        print("Failed to create Web Growth price")
        sys.exit(1)
    web_growth_price_id = web_growth_price['id']
    results['WEB_GROWTH_PRICE'] = web_growth_price_id
    print(f"  ✓ Price: {web_growth_price_id}")
    
    print("\n[7/8] Creating Web Scale product ($99/mo for 1M reconciliations)...")
    web_scale_product = create_product(
        "Settler Scale (Web)",
        "For high-volume operations. 1,000,000 reconciliations/mo included, $0.01/reconciliation overage.",
        secret_key, {**base_metadata, 'tier': 'web-scale'}
    )
    if not web_scale_product:
        print("Failed to create Web Scale product")
        sys.exit(1)
    web_scale_product_id = web_scale_product['id']
    print(f"  ✓ Product: {web_scale_product_id}")
    
    print("\n[8/8] Creating Web Scale price ($99/mo = 9900¢)...")
    web_scale_price = create_price(
        web_scale_product_id, 9900, 'usd', 'month', 'Web Scale Monthly',
        secret_key, {**base_metadata, 'tier': 'web-scale'}
    )
    if not web_scale_price:
        print("Failed to create Web Scale price")
        sys.exit(1)
    web_scale_price_id = web_scale_price['id']
    results['WEB_SCALE_PRICE'] = web_scale_price_id
    print(f"  ✓ Price: {web_scale_price_id}")
    
    # Optional: Create webhook endpoint
    print("\n[Optional] Webhook endpoint...")
    webhook_url = input("Enter production webhook URL (e.g., https://api.settler.dev/api/stripe/webhook) or press Enter to skip: ").strip()
    webhook_secret = None
    if webhook_url:
        wh = create_webhook_endpoint(webhook_url, secret_key)
        if wh:
            webhook_secret = wh.get('secret')
            print(f"  ✓ Webhook created: {wh['id']}")
            print(f"  ✓ Webhook secret: {webhook_secret}")
    
    # Summary
    print("\n" + "=" * 60)
    print("SETUP COMPLETE - ADD TO YOUR ENVIRONMENT")
    print("=" * 60)
    
    print(f"""
# Backend API (packages/api) - .env.local
STRIPE_PRICE_ID_STARTER={api_starter_price_id}
STRIPE_PRICE_ID_GROWTH={api_growth_price_id}
STRIPE_SECRET_KEY={secret_key}
STRIPE_WEBHOOK_SECRET={webhook_secret or 'whsec_xxx (from Stripe dashboard)'}
TG_INTERNAL_WEBHOOK_SECRET=*** rand -hex 32)

# Frontend Web (packages/web) - Vercel Environment Variables
STRIPE_PRICE_ID_GROWTH={web_growth_price_id}
STRIPE_PRICE_ID_SCALE={web_scale_price_id}
STRIPE_SECRET_KEY={secret_key}
STRIPE_WEBHOOK_SECRET={webhook_secret or 'whsec_xxx'}
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Note: Web tier uses Growth ($9) and Scale ($99) prices
# API tier uses Starter ($29) and Growth ($99) prices
# Enterprise is custom - no price ID needed
""")
    
    # Save to file for reference
    with open('stripe_price_ids.txt', 'w') as f:
        f.write(f"""Settler Stripe Price IDs
Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}

API Tier (packages/api):
  Starter Product: {api_starter_product_id}
  Starter Price: {api_starter_price_id} ($29/mo)
  Growth Product: {api_growth_product_id}
  Growth Price: {api_growth_price_id} ($99/mo)

Web Tier (packages/web):
  Growth Product: {web_growth_product_id}
  Growth Price: {web_growth_price_id} ($9/mo, 100K recon/mo)
  Scale Product: {web_scale_product_id}
  Scale Price: {web_scale_price_id} ($99/mo, 1M recon/mo)

Webhook Secret: {webhook_secret or 'N/A'}
""")
    
    print("\n✓ Saved to stripe_price_ids.txt")

if __name__ == '__main__':
    main()