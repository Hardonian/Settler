import Link from "next/link";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const surfaces = [
  {
    title: "Verification runs",
    description: "Execute deterministic verification checks and review route-level failures.",
    href: "/verify",
    cta: "Open verification",
  },
  {
    title: "Audit artifacts",
    description: "Review receipts, proof manifests, and exportable evidence for control reviews.",
    href: "/console/receipts",
    cta: "Open artifacts",
  },
];

export default function AuditsPage() {
  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Audits"
        description="Tenant-scoped evidence and verification workflows for compliance and operator review."
      />

      <section aria-label="Audit surfaces" className="grid gap-4 md:grid-cols-2">
        {surfaces.map((surface) => (
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
