import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, GitCompareArrows, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import {
  CTASection,
  FeatureCard,
  FeatureGrid,
  PageHero,
  PublicPageShell,
  Section,
  SectionHeader,
} from "@/components/site/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Where Settler Fits | Reconciliation Category Boundaries",
  description:
    "A practical comparison of payment movement, ledger, and reconciliation systems—and the boundaries of Settler's role.",
};

const categories = [
  {
    category: "Payment movement",
    systemOfRecord: "Instructions, transfers, and payment status",
    primaryQuestion: "Did money move through the intended rail?",
    settlerRole: "Consumes payment and settlement records as reconciliation inputs.",
  },
  {
    category: "Ledger and accounting",
    systemOfRecord: "Accounts, journals, balances, and financial reporting",
    primaryQuestion: "How should the organization record the event?",
    settlerRole: "Compares ledger records with external operational evidence.",
  },
  {
    category: "Reconciliation",
    systemOfRecord: "Run policy, match decisions, exceptions, and evidence",
    primaryQuestion: "Do independent records agree, and why?",
    settlerRole: "Executes deterministic matching and preserves reviewable outcomes.",
  },
];

export default function ComparePage() {
  return (
    <PublicPageShell>
      <Navigation />
      <main id="main-content" className="pt-16">
        <PageHero
          eyebrow="Category boundaries"
          title="Settler reconciles systems. It does not replace them."
          description="Payment processors move money. Ledgers record financial state. Settler compares their records, explains discrepancies, and preserves evidence for review. That boundary is the product."
          actions={
            <>
              <Button asChild size="lg">
                <Link href="/docs/pilot">
                  Plan a scoped pilot <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/architecture">Review architecture</Link>
              </Button>
            </>
          }
          visual={
            <Card className="border-primary/25 bg-card/80 shadow-xl">
              <CardHeader>
                <Badge variant="outline" className="w-fit">
                  Neutral control layer
                </Badge>
                <CardTitle className="text-2xl">Source → policy → evidence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <GitCompareArrows className="mt-0.5 h-5 w-5 text-primary" />
                  <p>
                    Normalize independent records without changing their source-of-truth status.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpenCheck className="mt-0.5 h-5 w-5 text-primary" />
                  <p>Apply versioned rules and retain the reason behind each match or exception.</p>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                  <p>
                    Produce evidence that supports verification without claiming audit
                    certification.
                  </p>
                </div>
              </CardContent>
            </Card>
          }
        />

        <Section>
          <SectionHeader
            title="Choose the system for the question"
            description="These categories overlap in data, but they own different decisions. Settler is credible when that ownership remains explicit."
          />
          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-foreground">
                <tr>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Owns</th>
                  <th className="p-4 font-semibold">Core question</th>
                  <th className="p-4 font-semibold">Settler boundary</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((row) => (
                  <tr key={row.category} className="border-b border-border/60 last:border-0">
                    <td className="p-4 font-medium text-foreground">{row.category}</td>
                    <td className="p-4 text-muted-foreground">{row.systemOfRecord}</td>
                    <td className="p-4 text-muted-foreground">{row.primaryQuestion}</td>
                    <td className="p-4 text-muted-foreground">{row.settlerRole}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section className="border-y border-border/50 bg-muted/15">
          <SectionHeader title="Use Settler when" />
          <FeatureGrid>
            <FeatureCard
              title="Records disagree across systems"
              description="A processor, bank, commerce platform, and ledger each show part of the same settlement flow."
              bullets={[
                "Independent source data",
                "Documented matching policy",
                "Named exception owners",
              ]}
            />
            <FeatureCard
              title="The result must be reproducible"
              description="Reviewers need to rerun a defined input population and understand any drift."
              bullets={["Versioned rules", "Stable serialization", "Replay comparison"]}
            />
            <FeatureCard
              title="Evidence must survive handoffs"
              description="Finance, engineering, and audit teams need a shared artifact rather than another spreadsheet export."
              bullets={["Source lineage", "Decision history", "Integrity checks"]}
            />
          </FeatureGrid>
        </Section>

        <Section>
          <SectionHeader
            title="Do not buy Settler as"
            description="A serious evaluation should reject category expansion that the product and evidence do not support."
          />
          <FeatureGrid>
            <FeatureCard
              title="A payment processor"
              description="Settler does not acquire merchants, underwrite payments, or operate card and bank rails."
            />
            <FeatureCard
              title="A general ledger"
              description="Settler does not replace accounting policy, journal ownership, or financial reporting systems."
            />
            <FeatureCard
              title="An audit opinion"
              description="Evidence artifacts support review. They do not replace auditor judgment, certification, or regulatory conclusions."
            />
          </FeatureGrid>
        </Section>

        <CTASection
          title="Evaluate the boundary with your own data"
          description="Choose one payout-to-bank-to-ledger flow, define acceptance criteria, and verify the resulting run and evidence package."
          primaryHref="/docs/pilot"
          primaryLabel="Read the pilot guide"
          secondaryHref="/security-and-audit"
          secondaryLabel="Review security evidence"
        />
      </main>
      <Footer />
    </PublicPageShell>
  );
}
