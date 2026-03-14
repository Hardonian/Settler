import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, Settings2, Webhook, Shield, Bell, CreditCard } from "lucide-react";

const settingsCards = [
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

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Configure platform-level settings, API access, governance controls, and tenant
          preferences.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((card) => (
          <Card key={card.href}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2">
                  <card.icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
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
