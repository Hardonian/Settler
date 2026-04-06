import { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  ArrowRight,
  Terminal,
  Database,
  CheckCircle2,
  FileText,
  Shield,
  AlertTriangle,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Getting Started — Settler Docs",
  description:
    "Set up your first reconciliation in Settler. This guide covers account creation, workspace setup, connecting data sources, and running your first reconciliation.",
};

const paths = [
  {
    title: "Cloud API (managed)",
    description:
      "Sign up, connect your data sources, and run reconciliation without infrastructure to manage.",
    badge: "Recommended",
    steps: [
      {
        icon: CheckCircle2,
        step: "1",
        title: "Create account and workspace",
        description:
          "Sign up at settler.dev. After signup you will be prompted to create a workspace — this is your tenant scope for all runs, exceptions, and proof artifacts.",
        link: { href: "/signup", label: "Create account" },
      },
      {
        icon: Database,
        step: "2",
        title: "Connect a data source",
        description:
          "Go to Console → Integrations and add your first adapter (Stripe, a database, or a CSV upload). Settler will ingest and normalize records for matching.",
        link: { href: "/console/onboarding", label: "Open onboarding" },
      },
      {
        icon: Play,
        step: "3",
        title: "Trigger a reconciliation run",
        description:
          "Once your data source is connected, trigger a run from the Console → Runs page or via the API. Settler will match records and surface every exception.",
        link: { href: "/console/runs", label: "View runs" },
      },
      {
        icon: AlertTriangle,
        step: "4",
        title: "Review exceptions",
        description:
          "Open Console → Exceptions to see every unmatched or conflicting record. Each exception shows provenance, evidence, and suggested actions.",
        link: { href: "/console/exceptions", label: "View exceptions" },
      },
      {
        icon: Shield,
        step: "5",
        title: "Export proof artifacts",
        description:
          "Each completed run produces a proofpack — a hash-linked evidence artifact you can export for audit, close packs, or compliance review.",
        link: { href: "/console/proof-explorer", label: "Open proof explorer" },
      },
    ],
  },
  {
    title: "Self-hosted (open source)",
    description:
      "Run the Settler engine on your own infrastructure. Full Apache 2.0 OSS — no vendor dependency.",
    badge: "OSS",
    steps: [
      {
        icon: Terminal,
        step: "1",
        title: "Clone and install",
        description:
          "Clone the repository and install dependencies. Settler requires Node.js 20+, pnpm, and a PostgreSQL database.",
        code: "git clone https://github.com/Hardonian/Settler && pnpm install",
      },
      {
        icon: Database,
        step: "2",
        title: "Configure environment",
        description:
          "Copy .env.example to .env and fill in your database URL and Supabase credentials. See SETUP.md for a full variable reference.",
        code: "cp .env.example .env",
      },
      {
        icon: Play,
        step: "3",
        title: "Run database migrations",
        description: "Apply the Prisma schema to your database and start the development server.",
        code: "pnpm prisma migrate deploy && pnpm dev",
      },
      {
        icon: FileText,
        step: "4",
        title: "Read the architecture docs",
        description:
          "Before connecting production data, read the architecture overview to understand tenant isolation, authz, and data flow.",
        link: { href: "/docs/architecture/platform-architecture", label: "Architecture overview" },
      },
    ],
  },
];

const callouts = [
  {
    title: "What Settler is",
    body: "Settler is a reconciliation engine and exception-management system. It matches records across two or more data sources (payment processors, banks, ERPs, CSVs), surfaces every mismatch as a structured exception, and produces hash-linked proof artifacts for each run.",
  },
  {
    title: "What a run produces",
    body: "Each reconciliation run produces: matched records (with tolerance metadata), exceptions (unmatched or conflicting records), a run summary with counts, and a proofpack — a replayable evidence artifact you can export, share, or use for audit review.",
  },
  {
    title: "Tenant isolation",
    body: "Every workspace in Settler is tenant-scoped. Runs, exceptions, evidence, API keys, and exports are isolated to your workspace. Super-admin access is separate and explicitly declared in the role system.",
  },
];

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20">
        {/* Header */}
        <section className="border-b border-border/40 bg-muted/10 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-4 text-xs font-semibold tracking-widest uppercase">
              Documentation
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">Getting started</h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Settler matches financial records across systems, surfaces every mismatch as a
              structured exception, and produces auditable proof for each run. This guide covers
              two paths: managed cloud and self-hosted open source.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button asChild>
                <Link href="/signup">
                  Create account <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/docs/quickstart">5-minute quickstart</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Before you start callouts */}
        <section className="py-12 px-4 border-b border-border/40">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">
              Before you start
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {callouts.map((c) => (
                <Card key={c.title} className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">{c.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Setup paths */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-16">
            {paths.map((path) => (
              <div key={path.title}>
                <div className="flex items-center gap-3 mb-8">
                  <h2 className="text-2xl font-semibold">{path.title}</h2>
                  <Badge variant={path.badge === "Recommended" ? "default" : "secondary"}>
                    {path.badge}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-8">{path.description}</p>

                <div className="space-y-6">
                  {path.steps.map((s) => (
                    <div
                      key={s.step}
                      className="flex gap-5 p-5 rounded-xl border border-border/50 bg-card/40"
                    >
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                        {s.step}
                      </div>
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <s.icon className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold text-sm">{s.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {s.description}
                        </p>
                        {"code" in s && s.code && (
                          <code className="block text-xs bg-muted px-3 py-2 rounded font-mono mt-2">
                            {s.code}
                          </code>
                        )}
                        {"link" in s && s.link && (
                          <Link
                            href={s.link.href}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-1"
                          >
                            {s.link.label} <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Next steps */}
        <section className="py-12 px-4 border-t border-border/40 bg-muted/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">
              Next steps
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { href: "/docs/api", label: "API reference", desc: "Full REST API documentation." },
                { href: "/docs/sdk", label: "SDK guide", desc: "TypeScript/Node.js SDK." },
                { href: "/docs/integrations", label: "Integrations", desc: "Available data source adapters." },
                { href: "/docs/auth", label: "Auth & RBAC", desc: "Roles, scopes, and API keys." },
                { href: "/docs/webhooks", label: "Webhooks", desc: "Real-time event notifications." },
                { href: "/pricing", label: "Pricing", desc: "Cloud, managed ops, and enterprise tiers." },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block p-4 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-muted/20 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
