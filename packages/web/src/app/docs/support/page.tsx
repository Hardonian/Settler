import { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PublicPageShell, Section, SectionHeader } from "@/components/site/primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LifeBuoy, Clock, ShieldCheck, ArrowRight, MessageSquare, Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "Support & SLA Documentation | Settler",
  description:
    "Enterprise support channels, SLA response times, diagnostic telemetry intake, and escalation policies.",
};

export default function DocsSupportPage() {
  const tiers = [
    {
      level: "P0 — Critical Production Impact",
      response: "< 15 minutes (24/7/365)",
      description:
        "Complete failure of deterministic matching pipeline, ledger commit halted, or unhandled cross-tenant security breach.",
      channel: "Emergency Pager & Dedicated Slack Connect",
    },
    {
      level: "P1 — High Operational Degradation",
      response: "< 1 hour (24/7)",
      description:
        "Connector sync delay (> 5 mins), abnormal variance spike in auto-reconciliation, or third-party webhook drop.",
      channel: "Dedicated Slack Connect & Support Portal",
    },
    {
      level: "P2 — Standard Technical Guidance",
      response: "< 4 business hours",
      description:
        "Custom rule configuration questions, schema discovery tuning, or new connector integration support.",
      channel: "Support Portal & Email Intake",
    },
  ];

  return (
    <PublicPageShell>
      <Navigation />

      <main id="main-content" className="pt-20">
        <section className="px-4 sm:px-6 lg:px-8 pt-12 pb-16 max-w-5xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-4 border-primary/30 text-primary uppercase text-xs font-bold tracking-widest"
          >
            Developer &amp; Enterprise Support
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
            Support Intake &amp; SLA Guide
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about our response SLAs, incident escalation procedures, and
            how to submit diagnostic bundles.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg" className="font-bold">
              <Link href="/support">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Open Support Ticket
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/docs/api">API Reference</Link>
            </Button>
          </div>
        </section>

        {/* SLA Tiers */}
        <Section className="border-t border-border/40 py-16 bg-muted/10">
          <div className="max-w-5xl mx-auto space-y-6">
            <SectionHeader
              title="Enterprise SLA Commitments"
              description="Guaranteed initial response times based on incident severity for Scale and Enterprise contracts."
            />
            <div className="grid gap-4 mt-8">
              {tiers.map((t) => (
                <Card key={t.level} className="border-border/60 bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg font-bold">{t.level}</CardTitle>
                      <Badge variant="secondary" className="font-mono text-xs text-primary">
                        {t.response}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      {t.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground pt-0">
                    <span className="font-semibold text-foreground">Intake Channel:</span>{" "}
                    {t.channel}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Section>

        {/* Diagnostic Telemetry Guide */}
        <Section className="border-t border-border/40 py-16">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Submitting Diagnostic Telemetry
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When reporting issues with specific reconciliation runs, include the trace ID or
              export the diagnostic bundle directly from the CLI or console:
            </p>
            <div className="rounded-xl border border-border bg-slate-950 p-4 font-mono text-xs text-slate-200">
              <div className="flex items-center gap-2 pb-2 text-slate-400 border-b border-slate-800">
                <Terminal className="h-4 w-4" />
                <span>settler CLI diagnostic export</span>
              </div>
              <pre className="mt-3 text-emerald-400">
                $ settler run:inspect --run-id=RUN-8492 --export-evidence=evidence.json
              </pre>
              <p className="mt-2 text-slate-400">
                # Extracts the cryptographic proofpack and execution log without exposing raw PII.
              </p>
            </div>
          </div>
        </Section>
      </main>

      <Footer />
    </PublicPageShell>
  );
}
