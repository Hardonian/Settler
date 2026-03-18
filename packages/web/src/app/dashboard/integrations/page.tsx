"use client";

import React, { useEffect, useState } from "react";
import { IntegrationCard } from "@/components/billing/IntegrationCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { asExtendedClient } from "@/lib/supabase/types";
import { getAllConnectorMetadata } from "@settler/adapters/drivers";

interface Integration {
  id: string;
  integration_id: string;
  name: string;
  description: string;
  is_standard: boolean;
  is_purchased: boolean;
  is_connected: boolean;
  status:
    | "active"
    | "inactive"
    | "error"
    | "pending"
    | "needs_attention"
    | "connected"
    | "not_connected";
  last_sync?: string;
  category?: string;
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [filteredIntegrations, setFilteredIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);

  useEffect(() => {
    void fetchIntegrations();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = integrations.filter(
        (integration) =>
          integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          integration.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredIntegrations(filtered);
    } else {
      setFilteredIntegrations(integrations);
    }
  }, [searchQuery, integrations]);

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // Get current user and tenant
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get user's tenants
      const typedSupabase = asExtendedClient(supabase);
      const { data: memberships } = await typedSupabase
        .from("app_private.memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);

      const tenantId = memberships?.[0]?.tenant_id;
      if (!tenantId) {
        setIsLoading(false);
        return;
      }

      setCurrentTenantId(tenantId);

      // Get all available connectors
      const allConnectors = getAllConnectorMetadata();

      // Get connected connectors from database
      const { data: connectedConnectors } = await typedSupabase
        .from("connectors")
        .select("id, provider_id, status, last_sync_at, last_successful_sync_at")
        .eq("tenant_id", tenantId)
        .limit(1000);

      const connectedMap = new Map(
        (connectedConnectors || []).map((c) => {
          const providerId = typeof c.provider_id === "string" ? c.provider_id : "";
          return [providerId, c];
        })
      );

      // Build integration list
      const integrationList: Integration[] = allConnectors.map((metadata) => {
        const connected = connectedMap.get(metadata.id);
        const connectedStatus =
          connected && typeof connected.status === "string" ? connected.status : null;
        const isConnected = connectedStatus === "connected";

        return {
          id: (connected && typeof connected.id === "string" ? connected.id : null) || metadata.id,
          integration_id: metadata.id,
          name: metadata.displayName,
          description: metadata.description,
          is_standard: ["plaid", "truelayer", "freshbooks", "wave"].includes(metadata.id),
          is_purchased: true, // TODO: Check subscription
          is_connected: isConnected || false,
          status: (connectedStatus as Integration["status"]) || "not_connected",
          last_sync:
            connected && typeof connected.last_successful_sync_at === "string"
              ? connected.last_successful_sync_at
              : undefined,
          category: metadata.category,
        };
      });

      // Add existing integrations (Stripe, PayPal, etc.) that aren't in the registry
      const existingIntegrations: Integration[] = [
        {
          id: "stripe",
          integration_id: "stripe",
          name: "Stripe",
          description:
            "Automatically match Stripe payments with Shopify orders, PayPal transactions, or bank deposits.",
          is_standard: true,
          is_purchased: true,
          is_connected: false,
          status: "not_connected",
        },
        {
          id: "shopify",
          integration_id: "shopify",
          name: "Shopify",
          description: "Match Shopify orders with payment processors and accounting systems.",
          is_standard: true,
          is_purchased: true,
          is_connected: false,
          status: "not_connected",
        },
        {
          id: "paypal",
          integration_id: "paypal",
          name: "PayPal",
          description:
            "Reconcile PayPal transactions with e-commerce platforms and accounting systems.",
          is_standard: true,
          is_purchased: true,
          is_connected: false,
          status: "not_connected",
        },
      ];

      setIntegrations([...integrationList, ...existingIntegrations]);
      setFilteredIntegrations([...integrationList, ...existingIntegrations]);
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (_id: string, integrationId: string) => {
    if (!currentTenantId) return;

    try {
      setIsProcessing(true);

      const response = await fetch(`/api/connectors/connect/${integrationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: currentTenantId,
          redirectUri: `${window.location.origin}/api/connectors/callback/${integrationId}`,
        }),
      });

      const data = await response.json();
      if (!response.ok || data?.success === false) {
        alert(`Connection failed: ${data?.error || data?.message || "Unknown error"}`);
        return;
      }

      if (data.authUrl) {
        // Redirect to OAuth flow
        window.location.href = data.authUrl;
      } else {
        // API key flow - redirect to configuration page
        router.push(`/dashboard/integrations/${integrationId}`);
      }
    } catch (error) {
      console.error("Connection failed:", error);
      alert("Failed to connect. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnect = async (_id: string, integrationId: string) => {
    if (!currentTenantId) return;

    if (!confirm("Are you sure you want to disconnect this integration?")) {
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch(`/api/connectors/disconnect/${integrationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: currentTenantId,
        }),
      });

      if (response.ok) {
        alert("Integration disconnected successfully");
        await fetchIntegrations();
      } else {
        const error = await response.json();
        alert(`Disconnect failed: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Disconnection failed:", error);
      alert("Failed to disconnect. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfigure = (id: string) => {
    router.push(`/dashboard/integrations/${id}`);
  };

  const handleSync = async (integrationId: string) => {
    if (!currentTenantId) return;

    try {
      setIsProcessing(true);
      const response = await fetch(`/api/connectors/sync/${integrationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: currentTenantId,
        }),
      });

      if (response.ok) {
        alert("Sync started successfully");
        await fetchIntegrations();
      } else {
        const error = await response.json();
        alert(`Sync failed: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Failed to start sync. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewLogs = (integrationId: string) => {
    router.push(`/dashboard/integrations/${integrationId}/logs`);
  };

  const handleBackfill = async (integrationId: string) => {
    if (!currentTenantId) return;

    const sinceDate = prompt("Enter start date (YYYY-MM-DD):");
    if (!sinceDate) return;

    try {
      setIsProcessing(true);
      const response = await fetch(`/api/connectors/backfill/${integrationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: currentTenantId,
          since: sinceDate,
        }),
      });

      if (response.ok) {
        alert("Backfill started successfully");
        await fetchIntegrations();
      } else {
        const error = await response.json();
        alert(`Backfill failed: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Backfill failed:", error);
      alert("Failed to start backfill. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Group by category
  const bankFeeds = filteredIntegrations.filter((i: any) => i.category === "bank_feed");
  const accounting = filteredIntegrations.filter((i: any) => i.category === "accounting");
  const subscriptions = filteredIntegrations.filter(
    (i: any) => i.category === "subscription_billing"
  );
  const standard = filteredIntegrations.filter((i: any) => i.is_standard && !i.category);
  const addOns = filteredIntegrations.filter((i) => !i.is_standard && !i.category);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Integrations
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1.5 text-sm md:text-base leading-relaxed max-w-2xl">
            Connect 20+ platforms in minutes. Pre-built adapters for payment processors, e-commerce
            platforms, accounting systems, bank feeds, and more.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/addons")}
          className="font-medium flex-shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Browse Add-Ons
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {bankFeeds.length > 0 && (
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">
            Bank Feeds
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {bankFeeds.map((integration) => (
              <IntegrationCard
                key={integration.id}
                id={integration.integration_id}
                name={integration.name}
                description={integration.description}
                isConnected={integration.is_connected}
                isStandard={integration.is_standard}
                isPurchased={integration.is_purchased}
                status={integration.status}
                lastSync={integration.last_sync ? new Date(integration.last_sync) : undefined}
                onConnect={() => handleConnect(integration.id, integration.integration_id)}
                onDisconnect={() => handleDisconnect(integration.id, integration.integration_id)}
                onConfigure={() => handleConfigure(integration.integration_id)}
                onSync={() => handleSync(integration.integration_id)}
                onViewLogs={() => handleViewLogs(integration.integration_id)}
                onBackfill={() => handleBackfill(integration.integration_id)}
                isLoading={isProcessing}
              />
            ))}
          </div>
        </div>
      )}

      {accounting.length > 0 && (
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">
            Accounting Systems
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {accounting.map((integration) => (
              <IntegrationCard
                key={integration.id}
                id={integration.integration_id}
                name={integration.name}
                description={integration.description}
                isConnected={integration.is_connected}
                isStandard={integration.is_standard}
                isPurchased={integration.is_purchased}
                status={integration.status}
                lastSync={integration.last_sync ? new Date(integration.last_sync) : undefined}
                onConnect={() => handleConnect(integration.id, integration.integration_id)}
                onDisconnect={() => handleDisconnect(integration.id, integration.integration_id)}
                onConfigure={() => handleConfigure(integration.integration_id)}
                onSync={() => handleSync(integration.integration_id)}
                onViewLogs={() => handleViewLogs(integration.integration_id)}
                onBackfill={() => handleBackfill(integration.integration_id)}
                isLoading={isProcessing}
              />
            ))}
          </div>
        </div>
      )}

      {subscriptions.length > 0 && (
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">
            Subscription Billing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {subscriptions.map((integration) => (
              <IntegrationCard
                key={integration.id}
                id={integration.integration_id}
                name={integration.name}
                description={integration.description}
                isConnected={integration.is_connected}
                isStandard={integration.is_standard}
                isPurchased={integration.is_purchased}
                status={integration.status}
                lastSync={integration.last_sync ? new Date(integration.last_sync) : undefined}
                onConnect={() => handleConnect(integration.id, integration.integration_id)}
                onDisconnect={() => handleDisconnect(integration.id, integration.integration_id)}
                onConfigure={() => handleConfigure(integration.integration_id)}
                onSync={() => handleSync(integration.integration_id)}
                onViewLogs={() => handleViewLogs(integration.integration_id)}
                onBackfill={() => handleBackfill(integration.integration_id)}
                isLoading={isProcessing}
              />
            ))}
          </div>
        </div>
      )}

      {standard.length > 0 && (
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">
            Standard Integrations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {standard.map((integration) => (
              <IntegrationCard
                key={integration.id}
                id={integration.integration_id}
                name={integration.name}
                description={integration.description}
                isConnected={integration.is_connected}
                isStandard={integration.is_standard}
                isPurchased={integration.is_purchased}
                status={integration.status}
                lastSync={integration.last_sync ? new Date(integration.last_sync) : undefined}
                onConnect={() => handleConnect(integration.id, integration.integration_id)}
                onDisconnect={() => handleDisconnect(integration.id, integration.integration_id)}
                onConfigure={() => handleConfigure(integration.integration_id)}
                onSync={() => handleSync(integration.integration_id)}
                onViewLogs={() => handleViewLogs(integration.integration_id)}
                onBackfill={() => handleBackfill(integration.integration_id)}
                isLoading={isProcessing}
              />
            ))}
          </div>
        </div>
      )}

      {addOns.length > 0 && (
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">
            Premium Add-Ons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {addOns.map((integration) => (
              <IntegrationCard
                key={integration.id}
                id={integration.integration_id}
                name={integration.name}
                description={integration.description}
                isConnected={integration.is_connected}
                isStandard={integration.is_standard}
                isPurchased={integration.is_purchased}
                status={integration.status}
                lastSync={integration.last_sync ? new Date(integration.last_sync) : undefined}
                onConnect={() => handleConnect(integration.id, integration.integration_id)}
                onDisconnect={() => handleDisconnect(integration.id, integration.integration_id)}
                onConfigure={() => handleConfigure(integration.integration_id)}
                onSync={() => handleSync(integration.integration_id)}
                onViewLogs={() => handleViewLogs(integration.integration_id)}
                onBackfill={() => handleBackfill(integration.integration_id)}
                isLoading={isProcessing}
              />
            ))}
          </div>
        </div>
      )}

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12 md:py-16">
          <p className="text-slate-500 dark:text-slate-400">
            No integrations found matching your search.
          </p>
        </div>
      )}
    </div>
  );
}
