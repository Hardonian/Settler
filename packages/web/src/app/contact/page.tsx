import { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Mail, Calendar, FileText, MessageSquare } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Section, PageHero } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UiLink } from "@/components/ui/link";
import { VisualGrid } from "@/components/site/infographics";

export const metadata: Metadata = {
  title: "Contact - Settler",
  description:
    "Discuss deterministic reconciliation architecture, enterprise deployment, or schedule a strategic consultation with the Settler team.",
};

const contactChannels = [
  {
    icon: Calendar,
    title: "Strategic consultation",
    description:
      "30-minute session to scope your reconciliation requirements, review your data sources, and identify the right deployment path — cloud, managed ops, or enterprise.",
    cta: "Schedule a session",
    href: "mailto:hello@settler.dev?subject=Strategic%20Consultation%20Request",
    primary: true,
  },
  {
    icon: FileText,
    title: "Managed operations inquiry",
    description:
      "Interested in operator-assisted reconciliation? Tell us about your data sources, volume, and close schedule. We'll send a written scope with deliverables and pricing.",
    cta: "Start the conversation",
    href: "mailto:hello@settler.dev?subject=Managed%20Operations%20Inquiry",
    primary: false,
  },
  {
    icon: Mail,
    title: "General and support",
    description:
      "Questions about the platform, licensing, partnership, or a specific technical issue. We respond within one business day.",
    cta: "Send a message",
    href: "mailto:hello@settler.dev",
    primary: false,
  },
  {
    icon: MessageSquare,
    title: "Developer community",
    description:
      "Join the Settler community on Discord for technical discussions, adapter development, and open-source collaboration.",
    cta: "Join Discord",
    href: "https://discord.gg/settler",
    primary: false,
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <PageHero
        eyebrow="Talk to Our Team"
        title="Discuss Your Reconciliation Architecture"
        description="Whether you are evaluating deterministic reconciliation for the first time or scaling an existing deployment, our team is available to help scope your requirements."
        visual={
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-primary/20 shadow-lg">
            <Image
              src="/strategic_insight_team.png"
              alt="Strategic consultation visualization"
              fill
              className="object-cover"
            />
          </div>
        }
      />

      <Section
        className="py-12 md:py-16"
        aria-label="Contact options"
        containerClassName="max-w-5xl"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {contactChannels.map((channel) => {
            const Icon = channel.icon;
            return (
              <Card
                key={channel.title}
                className={
                  channel.primary ? "border-2 border-primary shadow-lg" : "border border-border"
                }
              >
                <CardContent className="p-6 md:p-8">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-foreground">{channel.title}</h2>
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    {channel.description}
                  </p>
                  <Button asChild variant={channel.primary ? "default" : "outline"}>
                    {channel.href.startsWith("http") ? (
                      <UiLink href={channel.href} external>
                        {channel.cta} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </UiLink>
                    ) : (
                      <UiLink href={channel.href}>
                        {channel.cta} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </UiLink>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section withGrid aria-label="What to expect" containerClassName="max-w-4xl">
        <div className="mb-12 text-center text-foreground">
          <h2 className="mb-4 text-fluid-2xl font-bold tracking-tight">What to Expect</h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Every conversation is structured around your operational context.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Current State Review",
              description:
                "We map your current reconciliation process, failure surfaces, and operational constraints.",
            },
            {
              step: "2",
              title: "Architecture Mapping",
              description:
                "We align Settler capabilities with your data sources, governance needs, and deployment model.",
            },
            {
              step: "3",
              title: "Action Plan",
              description:
                "You get a concrete recommendation for pilot, managed deployment, or enterprise engagement.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="group relative rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {item.step}
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-muted/10">
        <VisualGrid />
      </Section>

      <Section
        className="bg-slate-900 overflow-hidden relative"
        containerClassName="max-w-4xl text-center"
        aria-label="Primary call to action"
      >
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl opacity-50" />

        <div className="relative z-10">
          <h2 className="mb-4 text-fluid-3xl font-bold tracking-tight text-white">
            Ready to Start the Conversation?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-300">
            Start with a strategic consultation and get a deterministic deployment path aligned to
            your operating model.
          </p>
          <Button
            size="lg"
            asChild
            className="bg-white px-8 py-6 text-lg font-semibold text-slate-900 hover:bg-slate-100"
          >
            <UiLink href="mailto:hello@settler.dev?subject=Strategic%20Consultation%20Request">
              Schedule a Session <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </UiLink>
          </Button>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
