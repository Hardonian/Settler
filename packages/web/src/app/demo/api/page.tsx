"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Copy, Check } from "lucide-react";
import Link from "next/link";
import type { FeatureFlags, PlanTier } from "../lib/data/types";
import { loadTransactions } from "../lib/data/loader";
import { matchTransactions, DEFAULT_MATCHING_RULES } from "../lib/matching/engine";

export default function ApiPlaygroundPage() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
    auto_match_enabled: true,
    receipt_matching_enabled: true,
    ai_assist_enabled: false,
    export_enabled: true,
    webhooks_enabled: false, // Always off in demo
  });

  const [planTier, setPlanTier] = useState<PlanTier>("pro");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("reconcile");
  const [copied, setCopied] = useState(false);

  const transactions = useMemo(() => loadTransactions(), []);

  const toggleFlag = (flag: keyof FeatureFlags) => {
    if (flag === "webhooks_enabled") return; // Always disabled
    setFeatureFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
  };

  const simulateApiResponse = (endpoint: string) => {
    // Use deterministic timestamp for reproducibility
    const deterministicTimestamp = "2024-01-20T12:00:00Z";
    const baseResponse = {
      success: true,
      timestamp: deterministicTimestamp,
      request_id: `demo_req_${endpoint}_${deterministicTimestamp.replace(/[^0-9]/g, "")}`,
    };

    switch (endpoint) {
      case "reconcile": {
        const sources = transactions.filter((t: any) => t.source === "stripe" || t.source === "shopify");
        const targets = transactions.filter(
          (t) => t.source === "quickbooks" || t.source === "bank_payout"
        );

        if (!featureFlags.auto_match_enabled) {
          return {
            ...baseResponse,
            message: "Auto-matching is disabled",
            matches: [],
            unmatched_count: sources.length + targets.length,
            requires_manual_review: true,
          };
        }

        const matches = matchTransactions(sources, targets, DEFAULT_MATCHING_RULES);
        const matchedCount = matches.length;
        const unmatchedCount = sources.length + targets.length - matchedCount * 2;

        return {
          ...baseResponse,
          matches: matches.slice(0, planTier === "free" ? 5 : planTier === "pro" ? 20 : matches.length),
          total_matches: matches.length,
          matched_count: matchedCount,
          unmatched_count: unmatchedCount,
          confidence_breakdown: {
            exact: matches.filter((m: any) => m.confidence === "exact").length,
            high: matches.filter((m: any) => m.confidence === "high").length,
            medium: matches.filter((m: any) => m.confidence === "medium").length,
            low: matches.filter((m: any) => m.confidence === "low").length,
          },
          audit_trail_id: `audit_${endpoint}_${deterministicTimestamp.replace(/[^0-9]/g, "")}`,
          ...(planTier === "enterprise" && {
            detailed_evidence: matches.map((m) => ({
              match_id: m.id,
              evidence: m.evidence,
              deterministic_hash: m.deterministic_hash,
            })),
          }),
        };
      }

      case "receipts": {
        if (!featureFlags.receipt_matching_enabled) {
          return {
            ...baseResponse,
            message: "Receipt matching is disabled",
            receipts_processed: 0,
            matches_found: 0,
          };
        }

        return {
          ...baseResponse,
          receipts_processed: 8,
          matches_found: 5,
          unmatched_receipts: 3,
          ...(planTier === "enterprise" && {
            extraction_confidence: 0.95,
            processing_time_ms: 234,
          }),
        };
      }

      case "audit": {
        if (!featureFlags.export_enabled) {
          return {
            ...baseResponse,
            message: "Export is disabled",
            export_available: false,
          };
        }

        return {
          ...baseResponse,
          export_available: true,
          format: planTier === "free" ? "json" : planTier === "pro" ? "csv" : "json,csv,xlsx",
          record_count: transactions.length,
          ...(planTier === "enterprise" && {
            includes_hashes: true,
            includes_evidence: true,
            compliance_ready: true,
          }),
        };
      }

      case "flags": {
        return {
          ...baseResponse,
          effective_flags: featureFlags,
          plan_tier: planTier,
          ...(planTier === "enterprise" && {
            custom_rules_enabled: true,
            advanced_matching: true,
          }),
        };
      }

      default:
        return baseResponse;
    }
  };

  const response = useMemo(
    () => simulateApiResponse(selectedEndpoint),
    [selectedEndpoint, featureFlags, planTier, transactions]
  );

  const getRequestExample = (endpoint: string) => {
    switch (endpoint) {
      case "reconcile":
        return `POST /api/v1/reconcile/run
Content-Type: application/json

{
  "source": { "adapter": "stripe" },
  "target": { "adapter": "quickbooks" },
  "rules": {
    "matching": [
      { "field": "amount", "tolerance": 0.01 }
    ]
  }
}`;

      case "receipts":
        return `POST /api/v1/receipts/ingest
Content-Type: multipart/form-data

{
  "file": "<receipt_image>",
  "vendor_name": "AWS",
  "amount": 129.99
}`;

      case "audit":
        return `GET /api/v1/audit/export?format=csv&start_date=2024-01-01`;

      case "flags":
        return `GET /api/v1/flags/effective`;

      default:
        return "";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50 to-indigo-50 dark:from-background dark:via-card dark:to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/demo">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Demo
            </Button>
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <Badge variant="outline">Demo Mode</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              API Playground
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Explore the API with feature flags and plan tiers. See how responses change based on
            configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Plan Tier */}
            <Card elevation="default">
              <CardHeader>
                <CardTitle>Plan Tier</CardTitle>
                <CardDescription>Select your plan tier to see feature differences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(["free", "pro", "enterprise"] as PlanTier[]).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setPlanTier(tier)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      planTier === tier
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "hover:border-border/60 dark:hover:border-border"
                    }`}
                  >
                    <div className="font-semibold capitalize text-foreground">
                      {tier}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {tier === "free" && "Basic features, limited records"}
                      {tier === "pro" && "Full features, standard limits"}
                      {tier === "enterprise" && "Advanced features, unlimited"}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Feature Flags */}
            <Card elevation="default">
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>Toggle features to see API behavior changes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(featureFlags).map(([flag, enabled]) => (
                  <div key={flag} className="flex items-center justify-between">
                    <Label htmlFor={flag} className="cursor-pointer flex-1">
                      <div className="font-medium text-foreground">
                        {flag.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </div>
                      {flag === "webhooks_enabled" && (
                        <div className="text-xs text-muted-foreground">
                          Always disabled in demo
                        </div>
                      )}
                    </Label>
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => toggleFlag(flag as keyof FeatureFlags)}
                      disabled={flag === "webhooks_enabled"}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* API Playground */}
          <div className="lg:col-span-2 space-y-6">
            {/* Endpoint Selection */}
            <Card elevation="default">
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
                <CardDescription>Select an endpoint to test.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="reconcile">Reconcile</TabsTrigger>
                    <TabsTrigger value="receipts">Receipts</TabsTrigger>
                    <TabsTrigger value="audit">Audit</TabsTrigger>
                    <TabsTrigger value="flags">Flags</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* Request Example */}
            <Card elevation="default">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Request Example</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(getRequestExample(selectedEndpoint))}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-card text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
                  <pre>{getRequestExample(selectedEndpoint)}</pre>
                </div>
              </CardContent>
            </Card>

            {/* Response */}
            <Card elevation="default">
              <CardHeader>
                <CardTitle>Response</CardTitle>
                <CardDescription>
                  Response based on current feature flags and plan tier.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-card text-green-400 p-4 rounded font-mono text-xs overflow-x-auto max-h-96">
                  <pre>{JSON.stringify(response, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>

            {/* Feature Impact Notice */}
            {(planTier === "free" ||
              !featureFlags.auto_match_enabled ||
              !featureFlags.receipt_matching_enabled ||
              !featureFlags.export_enabled) && (
              <Card elevation="sm" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">
                    <strong>Notice:</strong> Some features are limited or disabled based on your
                    current plan tier and feature flags. Upgrade to Pro or Enterprise, or enable
                    feature flags to see full functionality.
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Trust Notice */}
        <Card elevation="sm" className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              <strong>Read-only simulation.</strong> This playground simulates API responses based
              on deterministic demo data. No actual API calls are made, and no data is written to
              the database.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
