import Link from "next/link";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const policySurfaces = [
  {
    title: "Policy outcomes",
    description:
      "Track policy enforcement outcomes from the control plane across tenant operations.",
    href: "/console/control-plane",
    cta: "Open outcomes",
  },
  {
    title: "Policy configuration",
    description:
      "Manage feature and runtime policy rules with explicit, reviewable environment context.",
    href: "/console/feature-flags-policy",
    cta: "Open policy rules",
  },
  {
    title: "Auto-Resolution Rules",
    description:
      "Configure deterministic rules to automatically adjudicate common exceptions without operator intervention.",
    href: "/console/policies/auto-resolution",
    cta: "Manage auto-resolution",
  },
];

export default function PoliciesPage() {
  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Policies"
        description="Tenant-scoped governance surfaces for policy configuration and enforcement review."
      />

      <section aria-label="Policy surfaces" className="grid gap-4 md:grid-cols-2">
        {policySurfaces.map((surface) => (
          <Card key={surface.href}>
            <CardHeader>
              <CardTitle>{surface.title}</CardTitle>
              <CardDescription>{surface.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href={surface.href}>{surface.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
