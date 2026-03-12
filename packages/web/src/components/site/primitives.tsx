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
    <section className={cn("px-4 py-16 sm:px-6 lg:px-8", className)}>
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
    <Section className="border-b border-border/70 bg-muted/20 pt-20">
      {eyebrow ? <Badge className="mb-5">{eyebrow}</Badge> : null}
      <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">
        {title}
      </h1>
      <p className="mt-5 max-w-3xl text-lg text-muted-foreground">{description}</p>
      {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
    </Section>
  );
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8 max-w-3xl">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h2>
      {description ? <p className="mt-3 text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function FeatureGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{children}</div>;
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
    <Card className="h-full border-border/70">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {bullets?.length ? (
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {bullets.map((item) => (
              <li key={item}>• {item}</li>
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
    <Section className="border-t border-border/70 bg-slate-900 py-14 text-white">
      <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 max-w-2xl text-slate-300">{description}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <UiLink href={primaryHref}>{primaryLabel}</UiLink>
        </Button>
        {secondaryHref && secondaryLabel ? (
          <Button variant="outline" asChild>
            <UiLink href={secondaryHref}>{secondaryLabel}</UiLink>
          </Button>
        ) : null}
      </div>
    </Section>
  );
}
