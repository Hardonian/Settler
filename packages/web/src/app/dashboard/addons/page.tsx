"use client";

import React, { useEffect, useState } from "react";
import { AddOnCard } from "@/components/billing/AddOnCard";
import { AddOnPurchaseModal } from "@/components/billing/AddOnPurchaseModal";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Package } from "lucide-react";

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

      // API failed — show empty state (no fake add-ons)
      setAddOns([]);
      setFilteredAddOns([]);
    } catch (error) {
      console.error("Failed to fetch add-ons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (id: string): Promise<void> => {
    try {
      setIsProcessing(true);
      const response = await fetch("/api/billing/addon/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add_on_id: id }),
      });
      if (!response.ok) {
        throw new Error("Purchase failed");
      }
      // Refresh add-ons to reflect real state
      await fetchAddOns();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Purchase failed:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch("/api/billing/addon/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add_on_id: id }),
      });
      if (!response.ok) {
        throw new Error("Cancel failed");
      }
      // Refresh add-ons to reflect real state
      await fetchAddOns();
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
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Add-Ons Marketplace
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Enhance your Settler experience with premium integrations
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
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
              await handleCancel(addOn.id);
            }}
            isLoading={isProcessing}
          />
        ))}
      </div>

      {filteredAddOns.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-12 h-12 text-slate-400 mb-4" />
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
            {searchQuery ? "No add-ons match your search" : "No add-ons available yet"}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            {searchQuery
              ? "Try a different search term."
              : "Add-ons will appear here once the marketplace is configured."}
          </p>
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
