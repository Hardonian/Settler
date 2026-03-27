import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UiLink } from "@/components/ui/link";
import { cn } from "@/lib/utils";
import {
  MarketingHeroReveal,
  MarketingSectionFade,
  MarketingSlideUp,
  MarketingStaggeredFeatureGrid,
} from "@/components/site/marketing-motion-wrappers";

export function PublicPageShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("px-4 py-20 sm:py-24 sm:px-6 lg:px-8", className)}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <Section className="border-b border-border/50 bg-muted/10 pt-24 pb-16 sm:pt-28 sm:pb-20">
      <MarketingHeroReveal>
        {eyebrow ? (
          <Badge variant="outline" className="mb-5 text-xs tracking-widest uppercase font-semibold">
            {eyebrow}
          </Badge>
        ) : null}
        <h1 className="max-w-4xl text-fluid-3xl font-bold tracking-tight text-foreground sm:text-fluid-4xl md:text-fluid-5xl leading-[1.12]">
          {title}
        </h1>
        <p className="mt-6 max-w-3xl text-fluid-base sm:text-fluid-lg leading-relaxed text-muted-foreground">
          {description}
        </p>
        {actions ? (
          <div className="mt-9 flex flex-wrap gap-3 sm:gap-4">{actions}</div>
        ) : null}
      </MarketingHeroReveal>
    </Section>
  );
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <MarketingSectionFade>
      <div className="mb-10 max-w-3xl">
        <h2 className="text-fluid-2xl font-semibold tracking-tight text-foreground md:text-fluid-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 text-fluid-sm sm:text-fluid-base text-muted-foreground leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
    </MarketingSectionFade>
  );
}

export function FeatureGrid({ children }: { children: ReactNode }) {
  return <MarketingStaggeredFeatureGrid>{children}</MarketingStaggeredFeatureGrid>;
}

export function FeatureCard({
  title,
  description,
  bullets,
}: {
  title: string;
  description: string;
  bullets?: string[];
}) {
  return (
    <Card className="h-full border-border/60 shadow-sm transition-colors duration-200 hover:border-primary/35 hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-fluid-lg">{title}</CardTitle>
        <CardDescription className="text-fluid-sm leading-relaxed">{description}</CardDescription>
      </CardHeader>
      {bullets?.length ? (
        <CardContent>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            {bullets.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function CTASection({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <Section className="border-t border-border/60 bg-card py-16 sm:py-20">
      <MarketingSlideUp>
        <h2 className="text-fluid-2xl font-semibold tracking-tight text-foreground md:text-fluid-3xl">
          {title}
        </h2>
        <p className="mt-4 max-w-2xl text-fluid-sm sm:text-fluid-base text-muted-foreground leading-relaxed">
          {description}
        </p>
        <div className="mt-9 flex flex-wrap gap-3 sm:gap-4">
          <Button asChild>
            <UiLink href={primaryHref}>{primaryLabel}</UiLink>
          </Button>
          {secondaryHref && secondaryLabel ? (
            <Button variant="outline" asChild>
              <UiLink href={secondaryHref}>{secondaryLabel}</UiLink>
            </Button>
          ) : null}
        </div>
      </MarketingSlideUp>
    </Section>
  );
}
