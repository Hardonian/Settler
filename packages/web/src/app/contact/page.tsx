import { Metadata } from "next";
import { ArrowRight, Mail, Calendar, FileText, MessageSquare } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/marketing/Section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UiLink } from "@/components/ui/link";

export const metadata: Metadata = {
  title: "Contact - Settler",
  description:
    "Discuss deterministic reconciliation architecture, enterprise deployment, or schedule a strategic consultation with the Settler team.",
};

const contactChannels = [
  {
    icon: Calendar,
    title: "Strategic Consultation",
    description:
      "Complimentary 30-minute session to review your reconciliation architecture and identify the optimal deployment approach.",
    cta: "Schedule a Session",
    href: "mailto:sales@settler.dev?subject=Strategic%20Consultation%20Request",
    primary: true,
  },
  {
    icon: FileText,
    title: "Integration Review",
    description:
      "Request a technical review of your integration requirements, adapter needs, and reconciliation workflow design.",
    cta: "Request a Review",
    href: "mailto:engineering@settler.dev?subject=Integration%20Review%20Request",
    primary: false,
  },
  {
    icon: Mail,
    title: "General Inquiries",
    description:
      "Questions about the platform, licensing, or partnership opportunities. We respond within one business day.",
    cta: "Send a Message",
    href: "mailto:support@settler.dev",
    primary: false,
  },
  {
    icon: MessageSquare,
    title: "Developer Community",
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

      <Section className="pt-20 pb-12 md:pb-16" containerClassName="max-w-4xl text-center" aria-labelledby="contact-heading">
        <Badge className="mb-6 px-4 py-2 text-sm font-medium">Talk to Our Team</Badge>
        <h1 id="contact-heading" className="mb-4 text-fluid-4xl font-bold leading-tight tracking-tight text-foreground md:mb-6">
          Discuss Your Reconciliation Architecture
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Whether you are evaluating deterministic reconciliation for the first time or scaling an
          existing deployment, our team is available to help scope your requirements.
        </p>
      </Section>

      <Section className="py-12 md:py-16" aria-label="Contact options" containerClassName="max-w-5xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {contactChannels.map((channel) => {
            const Icon = channel.icon;
            return (
              <Card
                key={channel.title}
                className={channel.primary ? "border-2 border-foreground/80 shadow-lg" : "border border-border"}
              >
                <CardContent className="p-6 md:p-8">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                    <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-foreground">{channel.title}</h2>
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{channel.description}</p>
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

      <Section className="bg-muted/20" aria-label="What to expect" containerClassName="max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-fluid-2xl font-bold tracking-tight text-foreground">What to Expect</h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Every conversation is structured around your operational context.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Current State Review",
              description: "We map your current reconciliation process, failure surfaces, and operational constraints.",
            },
            {
              step: "2",
              title: "Architecture Mapping",
              description: "We align Settler capabilities with your data sources, governance needs, and deployment model.",
            },
            {
              step: "3",
              title: "Action Plan",
              description: "You get a concrete recommendation for pilot, managed deployment, or enterprise engagement.",
            },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border border-border bg-card p-6">
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                {item.step}
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-slate-900 text-white" containerClassName="max-w-4xl text-center" aria-label="Primary call to action">
        <h2 className="mb-4 text-fluid-3xl font-bold tracking-tight">Ready to Start the Conversation?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-slate-300">
          Start with a strategic consultation and get a deterministic deployment path aligned to your
          operating model.
        </p>
        <Button size="lg" asChild className="bg-white px-8 py-6 text-lg font-semibold text-slate-900 hover:bg-slate-100">
          <UiLink href="mailto:sales@settler.dev?subject=Strategic%20Consultation%20Request">
            Schedule a Session <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </UiLink>
        </Button>
      </Section>

      <Footer />
    </div>
  );
}
