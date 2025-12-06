"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddOnCardProps {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  usagePrice?: number;
  usageUnit?: string;
  isPurchased?: boolean;
  isStandard?: boolean;
  category?: string;
  features?: string[];
  onPurchase?: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function AddOnCard({
  id,
  name,
  description,
  basePrice,
  usagePrice,
  usageUnit,
  isPurchased = false,
  isStandard = false,
  category,
  features = [],
  onPurchase,
  onCancel,
  isLoading = false,
  className,
}: AddOnCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleAction = async () => {
    if (isPurchased && onCancel) {
      await onCancel(id);
    } else if (!isPurchased && onPurchase) {
      await onPurchase(id);
    }
  };

  return (
    <Card
      className={cn(
        "w-full transition-all hover:shadow-lg",
        isPurchased && "ring-2 ring-green-500",
        isStandard && "opacity-75",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            {category && (
              <Badge variant="outline" className="mt-2">
                {category}
              </Badge>
            )}
            {isStandard && (
              <Badge variant="secondary" className="mt-2 ml-2">
                Included
              </Badge>
            )}
            {isPurchased && (
              <Badge variant="default" className="mt-2 ml-2 bg-green-500">
                Active
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(basePrice)}
              <span className="text-sm font-normal text-gray-500">/month</span>
            </p>
            {usagePrice && usageUnit && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                + {formatCurrency(usagePrice)} per {usageUnit}
              </p>
            )}
          </div>
          {features.length > 0 && (
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
      {!isStandard && (
        <CardFooter>
          <Button
            onClick={handleAction}
            disabled={isLoading}
            variant={isPurchased ? "outline" : "default"}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isPurchased ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel Add-On
              </>
            ) : (
              "Purchase Add-On"
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
