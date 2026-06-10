import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FreezeToggle from "@/components/FreezeToggle";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { getGovernanceRecoveryHref } from "@/lib/governance/freeze-client";
import { Bell, CreditCard, Key, Lock, Settings2, Shield, ShieldAlert, Webhook } from "lucide-react";

const settingsCards = [
  {
    title: "Governance Controls",
    description: "Review freeze state, unblock write paths, and confirm governance recovery steps.",
    href: getGovernanceRecoveryHref(),
    label: "Open Governance Controls",
    icon: ShieldAlert,
  },
  {
    title: "API Key Management",
    description: "Issue and revoke API keys with scoped access control.",
    href: "/console/api-keys",
    label: "Manage API Keys",
    icon: Key,
  },
  {
    title: "Platform & Site Configuration",
    description: "Control runtime UI configuration, navigation, and feature setup.",
    href: "/console/site/ui-config",
    label: "Open Configuration",
    icon: Settings2,
  },
  {
    title: "Webhooks",
    description: "Configure webhook endpoints to receive real-time event notifications.",
    href: "/console/webhooks",
    label: "Manage Webhooks",
    icon: Webhook,
  },
  {
    title: "Policies & Access Control",
    description: "Manage policy enforcement, feature flags, and tenant-level permissions.",
    href: "/console/policies",
    label: "View Policies",
    icon: Shield,
  },
  {
    title: "Alerts & Notifications",
    description: "Configure alert thresholds, notification channels, and escalation rules.",
    href: "/console/alerts-view",
    label: "View Alerts",
    icon: Bell,
  },
  {
    title: "Billing & Subscription",
    description: "Manage your subscription plan, view invoices, and update payment methods.",
    href: "/console/billing",
    label: "View Billing",
    icon: CreditCard,
  },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const governanceFocused = params.tab === "governance";

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Settings"
        description="Manage tenant-scoped configuration, API access, governance controls, and billing behavior for this workspace."
        breadcrumbs={[{ label: "Console", href: "/console" }, { label: "Settings" }]}
      />

      {governanceFocused ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="info">Governance Focus</Badge>
                <Badge variant="outline">Recovery path active</Badge>
              </div>
              <p className="text-sm font-medium text-foreground">
                Freeze recovery actions land here so operators can confirm why writes are blocked
                and safely unfreeze the workspace when appropriate.
              </p>
              <p className="text-xs text-muted-foreground">
                Reads, diagnostics, and governance controls remain available during freeze.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/console/runs">Review run history</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section id="governance" className="scroll-mt-24 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Governance</Badge>
              <Badge variant="secondary">Operator recovery</Badge>
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Freeze controls and recovery</h2>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Use this section when write paths are intentionally paused. It is the canonical
                recovery surface for blocked reconciliation runs, approval decisions, exception
                actions, and bulk operator workflows.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/console/diagnostics">Open diagnostics</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/console/runs">Open runs</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <FreezeToggle />

          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Recovery checklist</CardTitle>
              </div>
              <CardDescription>
                What operators should do next when a mutation is blocked by freeze.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                <p className="font-medium text-foreground">1. Confirm the reason for freeze</p>
                <p className="mt-1 text-muted-foreground">
                  Check the freeze banner or blocked-action error for the reason and timestamp
                  before changing state.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                <p className="font-medium text-foreground">2. Inspect current operator load</p>
                <p className="mt-1 text-muted-foreground">
                  Review run history, exception backlog, and diagnostics so you understand what
                  would resume after unfreeze.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                <p className="font-medium text-foreground">3. Unfreeze intentionally</p>
                <p className="mt-1 text-muted-foreground">
                  Only unfreeze after the triggering incident, maintenance window, or validation
                  step is complete.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild variant="outline" size="sm">
                  <Link href="/console/exceptions">Open exceptions</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/console/reconciliations">Inspect results</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((card) => (
          <Card key={card.href}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <card.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">{card.title}</CardTitle>
                  <CardDescription className="mt-1">{card.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={card.href}>{card.label}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
