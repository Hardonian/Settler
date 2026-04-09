/**
 * Shopify App Integration
 * React.Settler components optimized for Shopify app embeds
 *
 * ⚠️ Commercial Feature: Requires Settler Commercial subscription
 */
import { FEATURE_FLAGS, useFeatureGate } from "../utils/licensing";

import React from "react";
import { ReconciliationDashboard } from "../components/ReconciliationDashboard";
import { TransactionTable } from "../components/TransactionTable";
import { ExceptionTable } from "../components/ExceptionTable";
import { MetricCard } from "../components/MetricCard";
import type { ReconciliationTransaction, ReconciliationException } from "@settler/protocol";

export interface ShopifyAppProps {
  shop: string;
  apiKey: string;
  transactions?: ReconciliationTransaction[];
  exceptions?: ReconciliationException[];
  onAction?: (action: string, data: unknown) => void;
}

/**
 * Shopify App Wrapper
 * Optimized for Shopify Polaris design system
 */
export function ShopifyApp({
  shop,
  transactions = [],
  exceptions = [],
  onAction,
}: ShopifyAppProps) {
  const { hasAccess, UpgradePrompt } = useFeatureGate(FEATURE_FLAGS.SHOPIFY_INTEGRATION);

  if (!hasAccess) {
    return <UpgradePrompt />;
  }

  return (
    <div
      style={{
        padding: "1rem",
        maxWidth: "100%",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      data-shopify-app
      data-shop={shop}
    >
      <ReconciliationDashboard>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Payment Reconciliation
          </h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Shop: {shop}</p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <MetricCard
            title="Total Transactions"
            value={transactions.length}
            subtitle="This period"
          />
          <MetricCard
            title="Match Rate"
            value={`${Math.round(((transactions.length - exceptions.length) / Math.max(transactions.length, 1)) * 100)}%`}
            subtitle="Successfully matched"
            trend="up"
          />
          <MetricCard
            title="Exceptions"
            value={exceptions.length}
            subtitle="Requiring review"
            trend={exceptions.length > 0 ? "down" : "neutral"}
          />
        </div>

        {transactions.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>
              Transactions
            </h2>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <TransactionTable
                transactions={transactions}
                onSelect={(tx: ReconciliationTransaction) => onAction?.("transaction.selected", tx)}
              />
            </div>
          </div>
        )}

        {exceptions.length > 0 && (
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>
              Exceptions
            </h2>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <ExceptionTable
                exceptions={exceptions}
                onResolve={(exc: ReconciliationException) => onAction?.("exception.resolved", exc)}
              />
            </div>
          </div>
        )}
      </ReconciliationDashboard>
    </div>
  );
}

/**
 * Shopify App Bridge Integration
 * For use with Shopify App Bridge
 */
export function useShopifyAppBridge() {
  const [shop, setShop] = React.useState<string>("");
  const [apiKey, setApiKey] = React.useState<string>("");

  React.useEffect(() => {
    // Extract shop and API key from Shopify App Bridge context
    if (typeof window !== "undefined" && (window as any).ShopifyAppBridge) {
      const appBridge = (window as any).ShopifyAppBridge;
      // Get shop domain from App Bridge
      const shopDomain = appBridge.getShopDomain?.() || "";
      setShop(shopDomain);
    }
  }, []);

  return { shop, apiKey, setApiKey };
}
