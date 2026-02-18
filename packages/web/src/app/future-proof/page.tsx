import Image from "next/image";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const panels = [
  {
    title: "Reconciliation Lab",
    description: "Safe demo flows for deterministic reconciliation without secrets.",
    image: "/assets/future-proof/reconciliation-lab.svg",
    action: "settler lab (via capsule/flow artifacts)",
  },
  {
    title: "Flow Explorer",
    description: "Visual ingest → normalize → match → settle → export flow with audit overlays.",
    image: "/assets/future-proof/flow-explorer.svg",
    action: "settler flow export <runId> --format json|svg",
  },
  {
    title: "Rules & Adapters Marketplace",
    description: "OSS-first Git-style registry for adapters/rules with provenance and license metadata.",
    image: "/assets/future-proof/marketplace.svg",
    action: "settler adapters|rules search|install|verify",
  },
  {
    title: "Deterministic Time Capsule",
    description: "Portable verification capsule with hash-linked audit chain and stable integrity roots.",
    image: "/assets/future-proof/time-capsule.svg",
    action: "settler capsule create|verify|replay",
  },
  {
    title: "Audit Arena",
    description: "Compare deterministic strategies safely with reproducible scoreboards.",
    image: "/assets/future-proof/audit-arena.svg",
    action: "settler arena run <scenario>",
  },
  {
    title: "Operator Mode",
    description: "Local-first operator telemetry summary for tenant/run/audit health.",
    image: "/assets/future-proof/operator-mode.svg",
    action: "settler operator",
  },
  {
    title: "Settler Explain",
    description: "Human-readable explanation of what matched, what missed, and what proof verifies.",
    image: "/assets/future-proof/settler-explain.svg",
    action: "settler explain <runId>",
  },
  {
    title: "Governance Templates",
    description: "Scaffold governed adapter/rule templates with deterministic replay checks.",
    image: "/assets/future-proof/governance-templates.svg",
    action: "settler init adapter|rule --governed",
  },
  {
    title: "Proof Mode",
    description: "Audit root + integrity root verification for runs and capsules.",
    image: "/assets/future-proof/proof-mode.svg",
    action: "settler proof verify <runId|capsule>",
  },
  {
    title: "Tenant Lineage Map",
    description: "Tenant-scoped data topology from source touch points to export outputs.",
    image: "/assets/future-proof/lineage-map.svg",
    action: "settler lineage export --tenant <id>",
  },
  {
    title: "Support Bot",
    description: "Offline-first deterministic KB retrieval with redaction-safe responses.",
    image: "/assets/future-proof/support-bot.svg",
    action: "settler support ask \"<question>\"",
  },
  {
    title: "Gamification",
    description: "XP, streaks, and badges that unlock cosmetic-only profile enhancements.",
    image: "/assets/future-proof/gamification.svg",
    action: "settler profile",
  },
] as const;

export default function FutureProofPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 space-y-4">
            <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
              Future-Proof Milestone
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Settler Future-Proof Suite
            </h1>
            <p className="max-w-3xl text-base text-muted-foreground">
              Unified web view of deterministic capabilities shipped in CLI and docs: event model,
              proof/capsule verification, marketplace governance, operator telemetry, and safe
              support/gamification layers.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {panels.map((panel) => (
              <Card key={panel.title} className="overflow-hidden border-border/80 bg-card/80">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={panel.image}
                    alt={`${panel.title} abstract infographic`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                </div>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg">{panel.title}</CardTitle>
                  <CardDescription>{panel.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <code className="block rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                    {panel.action}
                  </code>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-sm text-muted-foreground">
            Need implementation details? Visit <Link className="underline" href="/docs/cli">CLI docs</Link> and <Link className="underline" href="/support">Support</Link>.
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
