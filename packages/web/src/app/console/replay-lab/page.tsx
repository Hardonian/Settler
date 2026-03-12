import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReplayLabPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Replay Lab</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Deterministic replay explorer and trace review tooling for enterprise incident analysis.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deterministic Replay Explorer</CardTitle>
            <CardDescription>
              Re-run and compare execution traces with deterministic inputs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/console/replay">Open Replay Explorer</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trace Replay Viewer</CardTitle>
            <CardDescription>
              Inspect run-level traces, divergence points, and replay outcomes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/explorer">Open Trace Viewer</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
