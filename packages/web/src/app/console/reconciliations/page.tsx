import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    title: "Bulk Export Reports",
    description: "Export reconciliation evidence for downstream audit and compliance workflows.",
    href: "/exports",
  },
];

export default function ReconciliationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reconciliations</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Enterprise reconciliation operations surfaced from kernel and API capabilities.
        </p>
      </div>

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
