import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Bug, Mail, ShieldAlert } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import {
  FeatureCard,
  FeatureGrid,
  PageHero,
  PublicPageShell,
  Section,
  SectionHeader,
} from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Support | Settler",
  description: "Settler documentation, issue reporting, and commercial support boundaries.",
};

const severities = [
  [
    "P0 — Critical",
    "Confirmed security incident, material data-integrity risk, or complete production outage.",
  ],
  [
    "P1 — High",
    "A production workflow is unavailable or materially incorrect with no practical workaround.",
  ],
  ["P2 — Medium", "A workflow is impaired, but a documented workaround exists."],
  ["P3 — Low", "Documentation, usability, or non-urgent product feedback."],
] as const;

export default function SupportPage() {
  return (
    <PublicPageShell>
      <Navigation />
      <main id="main-content" className="pt-16">
        <PageHero
          eyebrow="Support"
          title="A support path with explicit boundaries"
          description="Use the documentation for product guidance, GitHub for reproducible open-source issues, and email for commercial or security-sensitive questions. Contractual response targets apply only when they are written into an executed agreement."
          actions={
            <>
              <Button asChild size="lg">
                <Link href="/docs">
                  Read documentation <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="mailto:hello@settler.dev">Email support</a>
              </Button>
            </>
          }
          visual={
            <Card className="border-primary/25 bg-card/80 shadow-xl">
              <CardHeader>
                <CardTitle>Before opening a request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Include the affected route or package, observed and expected behavior, and a
                  minimal reproduction.
                </p>
                <p>Remove credentials, personal data, and customer records from attachments.</p>
                <p>For suspected security issues, use email and do not publish exploit details.</p>
              </CardContent>
            </Card>
          }
        />

        <Section>
          <SectionHeader title="Choose the right channel" />
          <FeatureGrid>
            <FeatureCard
              title="Documentation"
              description="Start with setup, API, integration, replay, and pilot guidance."
              bullets={["Quickstart", "API contracts", "Operational guidance"]}
            />
            <FeatureCard
              title="Open-source issues"
              description="Use GitHub for reproducible defects or proposals related to public packages."
              bullets={["Sanitized reproduction", "Version information", "Expected behavior"]}
            />
            <FeatureCard
              title="Commercial and security"
              description="Use email for account, procurement, architecture, or security-sensitive discussions."
              bullets={[
                "No secrets in email",
                "State deployment context",
                "Name the affected workflow",
              ]}
            />
          </FeatureGrid>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <a
                href="https://github.com/Hardonian/Settler/issues"
                target="_blank"
                rel="noreferrer"
              >
                <Bug className="mr-2 h-4 w-4" /> Open-source issues
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="mailto:hello@settler.dev">
                <Mail className="mr-2 h-4 w-4" /> hello@settler.dev
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/security-and-audit">
                <ShieldAlert className="mr-2 h-4 w-4" /> Security posture
              </Link>
            </Button>
          </div>
        </Section>

        <Section className="border-y border-border/50 bg-muted/15">
          <SectionHeader
            title="Incident classification"
            description="These definitions help route a report. Availability, response, and resolution commitments are contract-specific and are not promised by this public page."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {severities.map(([title, description]) => (
              <Card key={title} className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        <Section>
          <SectionHeader title="Evidence and expectations" />
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-primary" /> Public support posture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Documentation and public issue tracking are available without a service
                  commitment.
                </p>
                <p>
                  Commercial support scope is established during evaluation and recorded in the
                  order form or support schedule.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldAlert className="h-5 w-5 text-primary" /> Security boundary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Settler does not claim completed SOC 2, PCI DSS, HIPAA, or GDPR certification.
                </p>
                <p>
                  Security controls and deployment evidence should be verified for the environment
                  under evaluation.
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>
      </main>
      <Footer />
    </PublicPageShell>
  );
}
