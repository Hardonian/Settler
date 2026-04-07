import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  Play,
  AlertTriangle,
  Shield,
  Download,
  Zap,
  Code,
  Terminal,
  Users,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UiLink } from "@/components/ui/link";

export const metadata: Metadata = {
  title: "Pilot Guide — First 30 Minutes | Settler Docs",
  description:
    "Get to your first reconciliation result in under 30 minutes. This guide covers signup, workspace creation, connecting a data source, running your first reconciliation, and reviewing exceptions.",
};

const pilotSteps = [
  {
    step: "01",
    icon: Zap,
    time: "~3 min",
    title: "Create your account and workspace",
    description:
      "Sign up and create your tenant workspace. Your workspace is the isolated scope for all your runs, exceptions, and proof artifacts.",
    actions: [{ label: "Sign up", href: "/signup", primary: true }],
    checkpoints: [
      "Account created with verified email",
      "Workspace name set (use your company or project name)",
      "You can see the Console dashboard",
    ],
    note: null,
  },
  {
    step: "02",
    icon: Database,
    time: "~5 min",
    title: "Connect a data source or upload a CSV",
    description:
      "The fastest path to your first result is a CSV upload — no credentials required. If you have a Stripe account, connect it directly for a live integration.",
    actions: [
      { label: "Open onboarding", href: "/console/onboarding", primary: true },
      { label: "View integrations", href: "/console/integrations", primary: false },
    ],
    checkpoints: [
      "At least one data source connected or CSV uploaded",
      "Records visible in the ingestion view",
      "No adapter error alerts",
    ],
    note: "CSV upload: Go to Console → Onboarding and select 'Upload sample file'. Use any CSV with columns like date, amount, reference, description.",
  },
  {
    step: "03",
    icon: Play,
    time: "~2 min",
    title: "Trigger your first reconciliation run",
    description:
      "Start a reconciliation run from the Runs page or via the API. Settler will apply your matching rules and surface every record that couldn't be matched.",
    actions: [{ label: "Go to Runs", href: "/console/runs", primary: true }],
    checkpoints: [
      "Run status shows 'Running' then 'Completed'",
      "Result counts appear: matched, unmatched, conflicts",
      "No 'Failed' status — if you see one, check the error detail",
    ],
    note: "A run with 100% match rate on your first try is normal for clean sample data. The interesting cases come from real data.",
  },
  {
    step: "04",
    icon: AlertTriangle,
    time: "~10 min",
    title: "Review your exceptions queue",
    description:
      "Every record that couldn't be matched automatically becomes an exception. Open the exceptions queue to see what the engine flagged, understand why, and make a resolution decision.",
    actions: [{ label: "Open exceptions", href: "/console/exceptions", primary: true }],
    checkpoints: [
      "You can see exceptions with type labels (amount mismatch, missing counterpart, etc.)",
      "Each exception shows source and target record context",
      "You can change an exception status (investigate, resolve, ignore)",
    ],
    note: "If your first run has zero exceptions, try uploading a second CSV with intentional differences (different amounts, missing rows) to see the exception workflow in action.",
  },
  {
    step: "05",
    icon: Shield,
    time: "~5 min",
    title: "Inspect run provenance and download the proofpack",
    description:
      "Open the run detail, go to the Proof & Provenance tab, and download the proofpack artifact. This JSON file is the hash-linked evidence record for the run — the same artifact you would share with an auditor.",
    actions: [{ label: "View runs", href: "/console/runs", primary: true }],
    checkpoints: [
      "Run detail shows proof signal and proof posture",
      "Proof & Provenance tab shows cryptographic breadcrumbs (trace ID, input hash)",
      "Proofpack downloaded as JSON — open it and review the structure",
    ],
    note: "The proofpack contains: run ID, input hashes, result summary, exception counts, recurrence state, and provenance chain. This is the artifact your auditors or compliance team would review.",
  },
  {
    step: "06",
    icon: Download,
    time: "~2 min",
    title: "Export your results",
    description:
      "From the run detail, click 'Export results' to download the full reconciliation output as CSV. This is your portable record of matched and unmatched records.",
    actions: [{ label: "View runs", href: "/console/runs", primary: true }],
    checkpoints: [
      "CSV downloaded with result rows",
      "File includes matched, unmatched, and conflict records",
      "You can open it in Excel or your preferred tool",
    ],
    note: null,
  },
];

const afterFirstRun = [
  {
    title: "Set up a schedule",
    description:
      "Configure your reconciliation to run automatically on a cron schedule. Daily, weekly, or at close.",
    href: "/console/schedules",
    icon: Clock,
  },
  {
    title: "Review your audit trail",
    description:
      "Every operator action — exception resolution, status changes, exports — is logged in the audit trail with a timestamp and actor.",
    href: "/console/audit-trail",
    icon: Shield,
  },
  {
    title: "Connect your second data source",
    description:
      "The real power of reconciliation is matching across two systems. Add your second adapter (bank, accounting system, ERP) to run cross-system matching.",
    href: "/console/integrations",
    icon: Database,
  },
  {
    title: "Explore the API",
    description:
      "Trigger runs, retrieve results, and manage exceptions programmatically. Settler has a full REST API with API key authentication.",
    href: "/console/api-keys",
    icon: Code,
  },
  {
    title: "Invite your team",
    description:
      "Add teammates to your workspace. Multiple operators can review exceptions and access the audit trail within the same tenant scope.",
    href: "/console/settings",
    icon: Users,
  },
  {
    title: "Read the architecture guide",
    description:
      "Understand how Settler's deterministic engine, proof generation, and tenant isolation model work under the hood.",
    href: "/docs/architecture/platform-architecture",
    icon: Terminal,
  },
];

const commonFirstRunIssues = [
  {
    issue: "Run shows 'Failed' status",
    fix: "Open the run detail and check the error message. Common causes: adapter credentials invalid, CSV format not recognized, or a required field is empty. Fix the root cause and re-run.",
  },
  {
    issue: "Zero exceptions but data looks wrong",
    fix: "Check your tolerance settings. If tolerance is very wide (e.g., ±100%), most records will match. Tighten the tolerance or add a field-level rule to surface discrepancies.",
  },
  {
    issue: "Proofpack shows 'posture: unavailable'",
    fix: "This is normal for the first run in a new workspace — there's no prior run to compare against. Run a second reconciliation to see historical comparison signals.",
  },
  {
    issue: "CSV upload shows no records",
    fix: "Ensure the CSV has a header row and that column names include recognizable fields (date, amount, reference, id, description). Settler will map standard column names automatically.",
  },
  {
    issue: "'Setup required' in the Console dashboard",
    fix: "Open Console → Setup Check (or Diagnostics). Each item shows the exact requirement and recovery path. Most are resolved by adding missing environment variables.",
  },
];

export default function PilotGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="mb-12 space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              30-minute pilot guide
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            First value in 30 minutes
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
            This guide walks you through your first reconciliation run end-to-end: account setup,
            data source connection, running the engine, reviewing exceptions, and downloading a
            proofpack artifact. Each step has a time estimate and explicit checkpoints.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Badge variant="outline" className="gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-500" /> No infrastructure to manage
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-500" /> CSV upload — no credentials needed
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-500" /> Full audit trail from run 1
            </Badge>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-6 mb-16">
          {pilotSteps.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.step} className="border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black font-mono text-muted-foreground/50 w-8 shrink-0">
                        {s.step}
                      </span>
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base leading-snug">{s.title}</CardTitle>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs whitespace-nowrap">
                      <Clock className="h-3 w-3 mr-1" />
                      {s.time}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pl-11">
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>

                  {s.note ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20 px-4 py-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                      <strong>Tip:</strong> {s.note}
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Checkpoints
                    </p>
                    <ul className="space-y-1.5">
                      {s.checkpoints.map((c) => (
                        <li key={c} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {s.actions.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {s.actions.map((a) => (
                        <Button
                          key={a.href}
                          asChild
                          size="sm"
                          variant={a.primary ? "default" : "outline"}
                        >
                          <Link href={a.href}>
                            {a.label} <ArrowRight className="ml-1.5 h-3 w-3" />
                          </Link>
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* After first run */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-2">After your first run</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Once you have a completed run and a downloaded proofpack, you have validated the core
            workflow. Here's what to explore next.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {afterFirstRun.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card/40 hover:border-primary/30 hover:bg-card transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Common issues */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-2">Common first-run issues</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Most first-run issues have straightforward fixes. Here are the most common ones.
          </p>
          <div className="space-y-3">
            {commonFirstRunIssues.map((item) => (
              <div key={item.issue} className="rounded-xl border border-border/60 p-4 space-y-1.5">
                <p className="text-sm font-semibold text-foreground">{item.issue}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.fix}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-border/60 bg-muted/10 p-8 text-center space-y-4">
          <h2 className="text-xl font-bold">Need help with your pilot?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
            If you're stuck, have a question about your specific data sources, or want to review
            your reconciliation setup before going live — reach out. We respond within one business
            day.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild>
              <UiLink href="/contact">
                Contact support <ArrowRight className="ml-2 h-4 w-4" />
              </UiLink>
            </Button>
            <Button variant="outline" asChild>
              <UiLink href="/managed">Learn about managed operations</UiLink>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
