#!/bin/bash
# Delete or stub speculative features that don't drive revenue
# This script implements Phase 5: Kill-Features-Until-Profitable

set -e

API_DIR="packages/web/src/app/api"
BACKUP_DIR="archive/deleted-features-$(date +%Y%m%d)"

echo "🗑️  Deleting speculative features..."
echo "Backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Features to DELETE (not core value)
DELETE_ROUTES=(
  "investor"
  "marketing"
  "sales"
  "ai/chatbot"
  "analytics"
  "experiments"
  "console/site"
  "console/ops-briefings"
  "console/ops-insights"
  "console/ops-recommendations"
  "admin"
  "playground"
)

# Features to STUB (gate behind payment or reduce)
STUB_ROUTES=(
  "console/ai-analysis"
  "console/ai-tokens"
  "console/analytics"
  "console/feature-flags"
  "console/insights"
  "console/meaningful-changes"
  "console/performance"
  "console/reality"
  "console/support"
)

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "DELETING ROUTES (Not Core Value)"
echo "═══════════════════════════════════════════════════════════"
echo ""

for route in "${DELETE_ROUTES[@]}"; do
  route_path="$API_DIR/$route"
  if [ -d "$route_path" ]; then
    echo "❌ Deleting: $route_path"
    mkdir -p "$BACKUP_DIR/$(dirname $route)"
    mv "$route_path" "$BACKUP_DIR/$route" 2>/dev/null || rm -rf "$route_path"
  else
    echo "⚠️  Not found: $route_path"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "STUBBING ROUTES (Gate Behind Payment)"
echo "═══════════════════════════════════════════════════════════"
echo ""

for route in "${STUB_ROUTES[@]}"; do
  route_path="$API_DIR/$route"
  if [ -d "$route_path" ]; then
    echo "🔒 Stubbing: $route_path"
    # Create stub that returns "Feature requires payment"
    find "$route_path" -name "route.ts" -type f | while read file; do
      # Backup original
      cp "$file" "$file.backup"
      # Create stub
      cat > "$file" << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { requireActiveSubscription } from '@/lib/security/billing-enforcement';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const subscriptionCheck = await requireActiveSubscription(request);
  if (!subscriptionCheck.allowed) {
    return subscriptionCheck.error || NextResponse.json(
      { error: 'Subscription Required', message: 'This feature requires an active subscription' },
      { status: 403 }
    );
  }
  return NextResponse.json({ message: 'Feature temporarily unavailable' }, { status: 503 });
}

export async function POST(request: NextRequest) {
  const subscriptionCheck = await requireActiveSubscription(request);
  if (!subscriptionCheck.allowed) {
    return subscriptionCheck.error || NextResponse.json(
      { error: 'Subscription Required', message: 'This feature requires an active subscription' },
      { status: 403 }
    );
  }
  return NextResponse.json({ message: 'Feature temporarily unavailable' }, { status: 503 });
}
EOF
    done
  else
    echo "⚠️  Not found: $route_path"
  fi
done

echo ""
echo "✅ Feature deletion/stubbing complete"
echo "📦 Backups saved to: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "1. Review deleted routes"
echo "2. Test that core reconciliation features still work"
echo "3. Update API documentation"
echo "4. Remove references to deleted routes from frontend"
