/**
 * Admin Settings Page
 *
 * Feature flags and plan-tier gates management.
 * Read-only for demo; real for internal use.
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Shield, Flag, Zap } from "lucide-react";

export default function AdminSettingsPage() {
  // Feature flags (would be fetched from API in real implementation)
  const featureFlags = [
    {
      key: "ai_assist_enabled",
      name: "AI Assist",
      description: "Enable AI-assisted detection and recommendations",
      enabled: true,
    },
    {
      key: "auto_match_enabled",
      name: "Auto Match",
      description: "Automatically match transactions using deterministic rules",
      enabled: true,
    },
    {
      key: "export_enabled",
      name: "Export",
      description: "Enable audit pack exports",
      enabled: true,
    },
    {
      key: "receipt_matching_enabled",
      name: "Receipt Matching",
      description: "Enable receipt matching functionality",
      enabled: true,
    },
    {
      key: "anomaly_detection_enabled",
      name: "Anomaly Detection",
      description: "Enable anomaly detection for transactions",
      enabled: false,
    },
  ];

  return (
    <div className="p-8 space-y-6 bg-muted/10 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Feature flags and plan-tier gates</p>
      </div>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5" />
            <CardTitle>Feature Flags</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {featureFlags.map((flag) => (
              <div
                key={flag.key}
                className="flex items-start justify-between p-4 border border-border/40 dark:border-border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{flag.name}</span>
                    {flag.enabled && (
                      <Badge variant="success" size="sm">
                        Enabled
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                  <code className="text-xs text-muted-foreground/60 dark:text-muted-foreground mt-1 block">
                    {flag.key}
                  </code>
                </div>
                <Switch checked={flag.enabled} disabled />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plan Tier Gates */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle>Plan Tier Gates</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-border/40 dark:border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">Base Plan</span>
                <Badge variant="outline">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Core reconciliation features, deterministic matching
              </p>
            </div>
            <div className="p-4 border border-border/40 dark:border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">Pro Plan</span>
                <Badge variant="outline">Available</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                AI assist, advanced matching, priority support
              </p>
            </div>
            <div className="p-4 border border-border/40 dark:border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">Enterprise Plan</span>
                <Badge variant="outline">Available</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Custom integrations, dedicated support, SLA guarantees
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Assist Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <CardTitle>AI Assist Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              AI Assist is an optional layer that provides suggestions and explanations. All
              recommendations are clearly labeled and include:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Deterministic baseline recommendation</li>
              <li>Explanation trace (what signals led to suggestion)</li>
              <li>Safe fallback if AI unavailable</li>
            </ul>
            <p className="mt-4">
              <strong>Important:</strong> AI never auto-resolves without explicit user confirmation
              and audit trail entry.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
