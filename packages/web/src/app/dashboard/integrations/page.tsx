"use client";

import React, { useEffect, useState } from "react";
import { IntegrationCard } from "@/components/billing/IntegrationCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Integration {
  id: string;
  integration_id: string;
  name: string;
  description: string;
  is_standard: boolean;
  is_purchased: boolean;
  is_connected: boolean;
  status: "active" | "inactive" | "error" | "pending";
  last_sync?: string;
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [filteredIntegrations, setFilteredIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchIntegrations();
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
      // In production, fetch from API
      // Mock data
      const mockIntegrations: Integration[] = [
        {
          id: "1",
          integration_id: "stripe",
          name: "Stripe",
          description: "Automatically match Stripe payments with Shopify orders, PayPal transactions, or bank deposits. Reconcile charges, refunds, and disputes with 99.7% accuracy. Set up in 5 minutes.",
          is_standard: true,
          is_purchased: true,
          is_connected: true,
          status: "active",
          last_sync: new Date().toISOString(),
        },
        {
          id: "2",
          integration_id: "shopify",
          name: "Shopify",
          description: "Match Shopify orders with payment processors (Stripe, PayPal), shipping providers, and accounting systems (QuickBooks, Xero). Reconcile orders, payments, refunds, and shipping costs automatically.",
          is_standard: true,
          is_purchased: true,
          is_connected: true,
          status: "active",
          last_sync: new Date().toISOString(),
        },
        {
          id: "3",
          integration_id: "paypal",
          name: "PayPal",
          description: "Reconcile PayPal transactions with e-commerce platforms, bank deposits, and accounting systems. Match payments, refunds, and fees automatically with 99.7% accuracy.",
          is_standard: true,
          is_purchased: true,
          is_connected: false,
          status: "inactive",
        },
        {
          id: "4",
          integration_id: "google-pay",
          name: "Google Pay",
          description: "Reconcile Google Pay transactions with payment processors and e-commerce platforms. Match payments, refunds, and fees across your payment ecosystem.",
          is_standard: true,
          is_purchased: true,
          is_connected: false,
          status: "inactive",
        },
        {
          id: "5",
          integration_id: "meta-commerce",
          name: "Meta Commerce + Meta Ads",
          description: "Reconcile Facebook/Instagram Shop orders with payment processors and track Meta Ads spend. Match orders, payments, and ad costs automatically.",
          is_standard: true,
          is_purchased: true,
          is_connected: false,
          status: "inactive",
        },
        {
          id: "6",
          integration_id: "tiktok-shop",
          name: "TikTok Shop + TikTok Ads",
          description: "Reconcile TikTok Shop orders with payment processors and track TikTok Ads spend. Match orders, payments, refunds, and ad costs with 99.7% accuracy.",
          is_standard: false,
          is_purchased: true,
          is_connected: true,
          status: "active",
          last_sync: new Date().toISOString(),
        },
        {
          id: "7",
          integration_id: "wix-stores",
          name: "Wix Stores",
          description: "Reconcile Wix Stores orders with payment processors and accounting systems. Match orders, payments, refunds, and shipping costs automatically.",
          is_standard: false,
          is_purchased: true,
          is_connected: false,
          status: "inactive",
        },
        {
          id: "8",
          integration_id: "ga4-deep-sync",
          name: "Google Analytics GA4 Deep Sync",
          description: "Reconcile GA4 event data with revenue from payment processors. Match e-commerce events, conversions, and revenue data for accurate analytics reconciliation.",
          is_standard: false,
          is_purchased: false,
          is_connected: false,
          status: "inactive",
        },
        {
          id: "9",
          integration_id: "paypal-payouts",
          name: "PayPal Payouts + Automation",
          description: "Reconcile PayPal Payouts API transactions with bank deposits and accounting systems. Automate payout reconciliation and track payouts, fees, and refunds.",
          is_standard: false,
          is_purchased: false,
          is_connected: false,
          status: "inactive",
        },
        {
          id: "10",
          integration_id: "whatsapp-telegram",
          name: "WhatsApp Business + Telegram Messaging",
          description: "Integrate WhatsApp Business API and Telegram Bot API for messaging-based transaction reconciliation. Track orders and payments initiated through messaging platforms.",
          is_standard: false,
          is_purchased: false,
          is_connected: false,
          status: "inactive",
        },
      ];
      setIntegrations(mockIntegrations);
      setFilteredIntegrations(mockIntegrations);
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (id: string) => {
    try {
      setIsProcessing(true);
      // In production: await fetch(`/api/integrations/${id}/connect`, { method: "POST" });
      console.log("Connecting integration:", id);
      setIntegrations((prev) =>
        prev.map((integration) =>
          integration.id === id
            ? { ...integration, is_connected: true, status: "active" as const }
            : integration
        )
      );
    } catch (error) {
      console.error("Connection failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      setIsProcessing(true);
      // In production: await fetch(`/api/integrations/${id}/disconnect`, { method: "POST" });
      console.log("Disconnecting integration:", id);
      setIntegrations((prev) =>
        prev.map((integration) =>
          integration.id === id
            ? { ...integration, is_connected: false, status: "inactive" as const }
            : integration
        )
      );
    } catch (error) {
      console.error("Disconnection failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfigure = (id: string) => {
    router.push(`/dashboard/integrations/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const standardIntegrations = filteredIntegrations.filter((i) => i.is_standard);
  const addOnIntegrations = filteredIntegrations.filter((i) => !i.is_standard);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect 10+ platforms in minutes. Pre-built adapters for payment processors, e-commerce platforms, and accounting systems. Set up in 5 minutes with secure API key storage.
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/addons")}>
          <Plus className="mr-2 h-4 w-4" />
          Browse Add-Ons
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {standardIntegrations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Standard Integrations (Included)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {standardIntegrations.map((integration) => (
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
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onConfigure={handleConfigure}
                isLoading={isProcessing}
              />
            ))}
          </div>
        </div>
      )}

      {addOnIntegrations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Premium Add-Ons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addOnIntegrations.map((integration) => (
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
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onConfigure={handleConfigure}
                isLoading={isProcessing}
              />
            ))}
          </div>
        </div>
      )}

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No integrations found matching your search.</p>
        </div>
      )}
    </div>
  );
}
