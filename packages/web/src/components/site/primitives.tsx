import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UiLink } from "@/components/ui/link";
import { cn } from "@/lib/utils";

export function PublicPageShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("px-4 py-20 sm:px-6 lg:px-8", className)}>
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
    <Section className="border-b border-border/50 bg-muted/10 pt-24 pb-16">
      {eyebrow ? (
        <Badge variant="outline" className="mb-6 text-xs tracking-widest uppercase font-semibold">
          {eyebrow}
        </Badge>
      ) : null}
      <h1 className="max-w-4xl text-fluid-4xl font-bold tracking-tight text-foreground md:text-fluid-5xl leading-[1.15]">
        {title}
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">{description}</p>
      {actions ? <div className="mt-10 flex flex-wrap gap-4">{actions}</div> : null}
    </Section>
  );
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-10 max-w-3xl">
      <h2 className="text-fluid-2xl font-semibold tracking-tight text-foreground md:text-fluid-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-muted-foreground leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}

export function FeatureGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{children}</div>;
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
    <Card className="h-full border-border/60 hover:border-border transition-colors duration-200">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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
    <Section className="border-t border-border/50 bg-neutral-10 dark:bg-neutral-10 py-16 text-white">
      <h2 className="text-fluid-2xl font-semibold tracking-tight md:text-fluid-3xl">{title}</h2>
      <p className="mt-4 max-w-2xl text-neutral-200 leading-relaxed">{description}</p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Button asChild>
          <UiLink href={primaryHref}>{primaryLabel}</UiLink>
        </Button>
        {secondaryHref && secondaryLabel ? (
          <Button variant="outline" asChild className="border-neutral-100/20 text-white hover:bg-white/10">
            <UiLink href={secondaryHref}>{secondaryLabel}</UiLink>
          </Button>
        ) : null}
      </div>
    </Section>
  );
}
