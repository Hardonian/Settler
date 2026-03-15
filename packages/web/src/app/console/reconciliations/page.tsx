import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";

const surfaces = [
  {
    title: "Bulk Reconciliation Audits",
    description: "Run and monitor high-volume reconciliation jobs with drift and variance context.",
    href: "/console/reconciliation-view",
  },
  {
    title: "Cross-Ledger Variance Detection",
    description: "Investigate variance and divergence between expected and observed outcomes.",
    href: "/console/multi-source-reconciliation",
  },
  {
    title: "Audit Evidence",
    description: "Review reconciliation audit logs and export evidence for compliance workflows.",
    href: "/console/audit-trail",
  },
];

export default function ReconciliationsPage() {
  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Reconciliations"
        description="Run tenant-scoped reconciliation workflows, inspect variance, and export evidence without leaving the control plane."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {surfaces.map((item) => (
          <Card key={item.href}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={item.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
