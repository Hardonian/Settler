/**
 * Use Case Landing Page
 * High-intent landing pages for specific use cases
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import {
  CTASection,
  PageHero,
  PublicPageShell,
  Section,
  SectionHeader,
} from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UiLink } from "@/components/ui/link";
import { getUseCaseBySlug, useCases } from "@/content/useCases";

export async function generateStaticParams() {
  return useCases.map((useCase) => ({ slug: useCase.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);

  if (!useCase) {
    return {
      title: "Use Case Not Found",
    };
  }

  return {
    title: `${useCase.title} | Settler`,
    description: useCase.description,
    openGraph: {
      title: `${useCase.title} | Settler`,
      description: useCase.description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${useCase.title} | Settler`,
      description: useCase.description,
    },
  };
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);

  if (!useCase) {
    notFound();
  }

  return (
    <PublicPageShell>
      <Navigation />
      <main id="main-content" className="pt-16">
        <PageHero
          eyebrow="Use case"
          title={useCase.title}
          description={useCase.hero}
          actions={
            <>
              <Button asChild size="lg">
                <TrackedLink
                  href="/signup"
                  eventName="onboarding_started"
                  eventPayload={{
                    location: "use_case",
                    ctaLabel: useCase.cta,
                    destination: "/signup",
                  }}
                >
                  {useCase.cta}
                </TrackedLink>
              </Button>
              <Button asChild size="lg" variant="outline">
                <TrackedLink
                  href="/docs/getting-started"
                  eventName="docs_cta_clicked"
                  eventPayload={{
                    location: "use_case",
                    ctaLabel: "View Documentation",
                    destination: "/docs/getting-started",
                  }}
                >
                  View Documentation
                </TrackedLink>
              </Button>
            </>
          }
        />

        <Section>
          <SectionHeader
            title="What you get"
            description="Capabilities mapped to deterministic reconciliation operations and evidence production."
          />
          <div className="grid gap-6 md:grid-cols-2">
            {useCase.features.map((feature) => (
              <Card key={feature} className="border-border/70">
                <CardHeader>
                  <CardTitle className="flex items-start gap-2 break-words text-foreground">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <span className="break-words">{feature}</span>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Section>

        <Section className="border-t border-border/70 bg-muted/20">
          <SectionHeader title="Why Settler" />
          <div className="grid gap-6 md:grid-cols-3">
            {useCase.benefits.map((benefit) => {
              const IconComponent = benefit.icon;
              return (
                <Card key={benefit.title} className="h-full border-border/70">
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <CardTitle className="break-words text-foreground">{benefit.title}</CardTitle>
                    <CardDescription className="break-words text-muted-foreground">
                      {benefit.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </Section>

        <CTASection
          title="Ready to validate this workflow?"
          description="Start with onboarding, run the first reconciliation, and verify evidence in replay before production rollout."
          primaryHref="/signup"
          primaryLabel="Start setup"
          secondaryHref="/docs/getting-started"
          secondaryLabel="View documentation"
        />

        <Section className="pt-8">
          <UiLink
            href="/use-cases"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to all use cases <ArrowRight className="h-4 w-4" />
          </UiLink>
        </Section>
      </main>
      <Footer />
    </PublicPageShell>
  );
}
