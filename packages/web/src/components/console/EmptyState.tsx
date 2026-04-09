/**
 * Empty State Component
 *
 * Consistent empty state UI across console pages.
 * Supports multiple states: default, first-run, setup-required, no-demo-data.
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BrandMessages } from "@/lib/brand/messaging";
import { Rocket, BookOpen, Sparkles } from "lucide-react";

type EmptyStateType =
  | "apiKeys"
  | "receipts"
  | "featureFlags"
  | "webhooks"
  | "insights"
  | "alerts"
  | "usage"
  | "runs";

type EmptyStateVariant = "default" | "firstRun" | "setupRequired" | "noDemoData";

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  variant?: EmptyStateVariant;
  icon?: React.ReactNode;
}

export function EmptyState({
  type,
  title,
  description,
  action,
  secondaryAction,
  variant = "default",
  icon,
}: EmptyStateProps) {
  const messages = BrandMessages.empty;
  const baseMessagesByType: Partial<Record<EmptyStateType, string>> = {
    apiKeys: messages.apiKeys,
    receipts: messages.receipts,
    featureFlags: messages.featureFlags,
    webhooks: messages.webhooks,
    insights: messages.insights,
    alerts: messages.alerts,
    usage: messages.usage,
  };
  const setupRequiredMessagesByType: Partial<Record<EmptyStateType, string>> = {
    runs: messages.setupRequired?.runs,
    apiKeys: messages.setupRequired?.apiKeys,
    webhooks: messages.setupRequired?.webhooks,
    receipts: messages.setupRequired?.receipts,
  };

  // Get appropriate message based on variant
  let defaultTitle = title;
  let defaultDescription = description;

  if (!title || !description) {
    // For runs, we have more specific messages
    if (type === "runs" && messages.noData?.runs) {
      const runMessages = messages.noData.runs;
      switch (variant) {
        case "firstRun":
          defaultTitle = defaultTitle || "No runs yet";
          defaultDescription = defaultDescription || runMessages.noSeed;
          break;
        case "setupRequired":
          defaultTitle = defaultTitle || "Setup required";
          defaultDescription = defaultDescription || runMessages.noSetup;
          break;
        default:
          defaultTitle = defaultTitle || "No runs yet";
          defaultDescription = defaultDescription || runMessages.default;
      }
    } else if (messages.noData?.[type as keyof typeof messages.noData]) {
      // For other types with noData
      const typeMessages = messages.noData[type as keyof typeof messages.noData];
      if (typeMessages) {
        switch (variant) {
          case "firstRun":
            defaultTitle = defaultTitle || `No ${type} yet`;
            defaultDescription = defaultDescription || typeMessages.noSeed || typeMessages.default;
            break;
          case "setupRequired":
            defaultTitle = defaultTitle || "Setup required";
            defaultDescription =
              defaultDescription ||
              setupRequiredMessagesByType[type] ||
              typeMessages.noSetup ||
              typeMessages.default;
            break;
          default:
            defaultTitle = defaultTitle || `No ${type} yet`;
            defaultDescription = defaultDescription || typeMessages.default;
        }
      } else {
        // Fallback to basic empty messages
        defaultTitle = defaultTitle || `No ${type} yet`;
        defaultDescription =
          defaultDescription ||
          baseMessagesByType[type] ||
          "Get started by creating your first item.";
      }
    } else {
      defaultTitle = defaultTitle || `No ${type} yet`;
      defaultDescription =
        defaultDescription ||
        baseMessagesByType[type] ||
        "Get started by creating your first item.";
    }
  }

  // Show helpful hint for first-run scenarios
  const showDemoHint = variant === "firstRun" || (variant === "default" && type === "runs");

  return (
    <Card>
      <CardContent className="py-12 text-center">
        {icon && <div className="mb-4 flex justify-center">{icon}</div>}
        <h3 className="text-lg font-semibold mb-2">{defaultTitle}</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">{defaultDescription}</p>

        {showDemoHint && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg inline-flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-blue-700 dark:text-blue-300">
              Running locally? Try{" "}
              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs">
                pnpm demo:seed
              </code>{" "}
              to load sample data
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {action && (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          )}
          {secondaryAction && (
            <Button asChild variant="outline">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          )}

          {/* Show contextual help link based on variant */}
          {variant === "setupRequired" && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/console/onboarding">
                <Rocket className="h-3 w-3 mr-1" />
                Start Setup
              </Link>
            </Button>
          )}

          {variant === "firstRun" && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/docs/getting-started">
                <BookOpen className="h-3 w-3 mr-1" />
                Read Guide
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
