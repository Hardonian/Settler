"use client";

import React, { useEffect, useState } from "react";
import { AddOnCard } from "@/components/billing/AddOnCard";
import { AddOnPurchaseModal } from "@/components/billing/AddOnPurchaseModal";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

interface AddOn {
  id: string;
  integration_id: string;
  name: string;
  description: string;
  base_price_monthly: number;
  usage_price_per_unit?: number;
  usage_unit?: string;
  is_standard: boolean;
  is_purchased?: boolean;
  features?: string[];
}

export default function AddOnsMarketplacePage() {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [filteredAddOns, setFilteredAddOns] = useState<AddOn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    void fetchAddOns();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = addOns.filter(
        (addOn) =>
          addOn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          addOn.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAddOns(filtered);
    } else {
      setFilteredAddOns(addOns);
    }
  }, [searchQuery, addOns]);

  const fetchAddOns = async () => {
    try {
      setIsLoading(true);
      // Fetch from API
      try {
        const response = await fetch("/api/billing/addons");
        if (response.ok) {
          const data = await response.json();
          setAddOns(data.addons || []);
          setFilteredAddOns(data.addons || []);
          return;
        }
      } catch (error) {
        console.error("Failed to fetch addons from API:", error);
      }
      
      // Fallback: Empty state if API fails
      const mockAddOns: AddOn[] = [
        {
          id: "1",
          integration_id: "tiktok-shop",
          name: "TikTok Shop + TikTok Ads",
          description: "TikTok Shop order reconciliation and TikTok Ads spend tracking",
          base_price_monthly: 39.95,
          usage_price_per_unit: 0.02,
          usage_unit: "order",
          is_standard: false,
          is_purchased: false,
          features: [
            "TikTok Shop order reconciliation",
            "TikTok Ads spend tracking",
            "Real-time inventory sync",
            "Campaign performance reconciliation",
          ],
        },
        {
          id: "2",
          integration_id: "wix-stores",
          name: "Wix Stores",
          description: "Wix Stores order reconciliation",
          base_price_monthly: 19.95,
          usage_price_per_unit: 0.01,
          usage_unit: "order",
          is_standard: false,
          is_purchased: true,
          features: [
            "Wix Stores order reconciliation",
            "Payment processor sync",
            "Product catalog reconciliation",
          ],
        },
        {
          id: "3",
          integration_id: "ga4-deep-sync",
          name: "Google Analytics GA4 Deep Sync",
          description: "GA4 event data reconciliation with revenue",
          base_price_monthly: 29.95,
          usage_price_per_unit: 0.005,
          usage_unit: "event",
          is_standard: false,
          is_purchased: false,
          features: [
            "GA4 event data reconciliation",
            "E-commerce transaction matching",
            "Attribution modeling",
          ],
        },
        {
          id: "4",
          integration_id: "paypal-payouts",
          name: "PayPal Payouts + Automation",
          description: "PayPal Payouts API reconciliation and automation",
          base_price_monthly: 49.95,
          usage_price_per_unit: 0.03,
          usage_unit: "payout",
          is_standard: false,
          is_purchased: false,
          features: [
            "PayPal Payouts API reconciliation",
            "Automated payout scheduling",
            "Multi-recipient payout reconciliation",
          ],
        },
        {
          id: "5",
          integration_id: "whatsapp-telegram",
          name: "WhatsApp Business + Telegram Messaging",
          description: "WhatsApp Business API and Telegram Bot API integration",
          base_price_monthly: 79.95,
          usage_price_per_unit: 0.001,
          usage_unit: "message",
          is_standard: false,
          is_purchased: false,
          features: [
            "WhatsApp Business API integration",
            "Telegram Bot API integration",
            "Payment link reconciliation",
          ],
        },
      ];
      setAddOns(mockAddOns);
      setFilteredAddOns(mockAddOns);
    } catch (error) {
      console.error("Failed to fetch add-ons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (id: string): Promise<void> => {
    try {
      setIsProcessing(true);
      // In production: await fetch(`/api/billing/addon/purchase`, { method: "POST", body: JSON.stringify({ add_on_id: id }) });
      console.log("Purchasing add-on:", id);
      // Update local state
      setAddOns((prev) =>
        prev.map((addOn) => (addOn.id === id ? { ...addOn, is_purchased: true } : addOn))
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("Purchase failed:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = (id: string) => {
    try {
      setIsProcessing(true);
      // In production: await fetch(`/api/billing/addon/cancel`, { method: "POST", body: JSON.stringify({ add_on_id: id }) });
      console.log("Canceling add-on:", id);
      setAddOns((prev) =>
        prev.map((addOn) => (addOn.id === id ? { ...addOn, is_purchased: false } : addOn))
      );
    } catch (error) {
      console.error("Cancel failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openPurchaseModal = (addOn: AddOn) => {
    setSelectedAddOn(addOn);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Add-Ons Marketplace</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Enhance your Settler experience with premium integrations
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search add-ons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAddOns.map((addOn) => (
          <AddOnCard
            key={addOn.id}
            id={addOn.id}
            name={addOn.name}
            description={addOn.description}
            basePrice={addOn.base_price_monthly}
            usagePrice={addOn.usage_price_per_unit}
            usageUnit={addOn.usage_unit}
            isPurchased={addOn.is_purchased}
            isStandard={addOn.is_standard}
            features={addOn.features}
            onPurchase={async (_id) => {
              openPurchaseModal(addOn);
              await Promise.resolve();
            }}
            onCancel={async () => {
              await Promise.resolve(handleCancel(addOn.id));
            }}
            isLoading={isProcessing}
          />
        ))}
      </div>

      {filteredAddOns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No add-ons found matching your search.</p>
        </div>
      )}

      <AddOnPurchaseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAddOn(null);
        }}
        addOn={
          selectedAddOn
            ? {
                id: selectedAddOn.id,
                name: selectedAddOn.name,
                description: selectedAddOn.description,
                basePrice: selectedAddOn.base_price_monthly,
                usagePrice: selectedAddOn.usage_price_per_unit,
                usageUnit: selectedAddOn.usage_unit,
                features: selectedAddOn.features,
              }
            : null
        }
        onPurchase={handlePurchase}
        isLoading={isProcessing}
      />
    </div>
  );
}
