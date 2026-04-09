/**
 * Licensing Example
 * Demonstrates OSS vs Commercial feature usage
 */

import React from "react";
import {
  ReconciliationDashboard,
  TransactionTable,
  VirtualizedTable,
  ShopifyApp,
  setLicense,
  useFeatureGate,
  FEATURE_FLAGS,
  UpgradePrompt,
} from "@settler/react-settler";

/**
 * Example 1: OSS Usage (Free)
 * All OSS features work without any license setup
 */
export function OSSExample() {
  const transactions = [
    {
      id: "tx-1",
      provider: "stripe",
      providerTransactionId: "ch_123",
      amount: { value: 100.0, currency: "USD" },
      currency: "USD",
      date: "2024-01-01T00:00:00Z",
      status: "succeeded" as const,
    },
  ];

  // OSS features work without license
  return (
    <ReconciliationDashboard>
      <TransactionTable transactions={transactions} />
    </ReconciliationDashboard>
  );
}

/**
 * Example 2: Commercial Feature with Upgrade Prompt
 * Commercial features show upgrade prompts when not licensed
 */
export function CommercialFeatureExample() {
  const transactions = Array.from({ length: 1000 }, (_, i) => ({
    id: `tx-${i}`,
    provider: "stripe",
    providerTransactionId: `ch_${i}`,
    amount: { value: 100.0, currency: "USD" },
    currency: "USD",
    date: "2024-01-01T00:00:00Z",
    status: "succeeded" as const,
  }));

  // VirtualizedTable is a commercial feature
  // Will show upgrade prompt if not licensed
  return (
    <ReconciliationDashboard>
      <VirtualizedTable transactions={transactions} height={600} />
    </ReconciliationDashboard>
  );
}

/**
 * Example 3: Setting Commercial License
 * Unlock all commercial features
 */
export function CommercialLicenseExample() {
  // Set commercial license (typically done at app startup)
  React.useEffect(() => {
    setLicense({
      tier: "commercial",
      features: new Set([
        FEATURE_FLAGS.CORE_PROTOCOL,
        FEATURE_FLAGS.BASIC_COMPONENTS,
        FEATURE_FLAGS.MCP_INTEGRATION,
        FEATURE_FLAGS.SHOPIFY_INTEGRATION,
        FEATURE_FLAGS.STRIPE_INTEGRATION,
        FEATURE_FLAGS.WEBHOOK_MANAGER,
        FEATURE_FLAGS.VIRTUALIZATION,
        FEATURE_FLAGS.TELEMETRY,
        FEATURE_FLAGS.AUDIT_LOGGING,
      ]),
    });
  }, []);

  // Now all commercial features work!
  return (
    <ReconciliationDashboard>
      <VirtualizedTable transactions={[]} />
      <ShopifyApp shop="myshop.myshopify.com" apiKey="key" />
    </ReconciliationDashboard>
  );
}

/**
 * Example 4: Feature Gating with Custom UI
 */
export function FeatureGateExample() {
  const { hasAccess, UpgradePrompt } = useFeatureGate(FEATURE_FLAGS.SHOPIFY_INTEGRATION);

  if (!hasAccess) {
    return (
      <div>
        <h2>Shopify Integration</h2>
        <UpgradePrompt
          feature={FEATURE_FLAGS.SHOPIFY_INTEGRATION}
          featureName="Shopify Integration"
        />
      </div>
    );
  }

  return <ShopifyApp shop="myshop.myshopify.com" apiKey="your-api-key" transactions={[]} />;
}

/**
 * Example 5: Conditional Rendering Based on License
 */
export function ConditionalFeatureExample() {
  const { hasAccess } = useFeatureGate(FEATURE_FLAGS.VIRTUALIZATION);
  const transactions = [];

  return (
    <ReconciliationDashboard>
      {hasAccess ? (
        <VirtualizedTable transactions={transactions} height={600} />
      ) : (
        <div>
          <TransactionTable transactions={transactions} />
          <UpgradePrompt feature={FEATURE_FLAGS.VIRTUALIZATION} compact />
        </div>
      )}
    </ReconciliationDashboard>
  );
}
