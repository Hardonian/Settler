"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";

interface AddOnPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  addOn: {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    usagePrice?: number;
    usageUnit?: string;
    features?: string[];
  } | null;
  onPurchase: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function AddOnPurchaseModal({
  isOpen,
  onClose,
  addOn,
  onPurchase,
  isLoading = false,
}: AddOnPurchaseModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!addOn) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      await onPurchase(addOn.id);
      onClose();
    } catch (error: unknown) {
      console.error("Purchase failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Purchase {addOn.name}</DialogTitle>
          <DialogDescription>{addOn.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(addOn.basePrice)}
              <span className="text-sm font-normal text-gray-500">/month</span>
            </p>
            {addOn.usagePrice && addOn.usageUnit && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                + {formatCurrency(addOn.usagePrice)} per {addOn.usageUnit}
              </p>
            )}
          </div>
          {addOn.features && addOn.features.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Features included:</h4>
              <ul className="space-y-2">
                {addOn.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This add-on will be added to your subscription and billed monthly. You can cancel
              anytime.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing || isLoading}>
            Cancel
          </Button>
          <Button onClick={handlePurchase} disabled={isProcessing || isLoading}>
            {isProcessing || isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Purchase Add-On"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
