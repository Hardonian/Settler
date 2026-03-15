import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RouteOperationalNotice } from "@/components/console/RouteOperationalNotice";

const SYNTHETIC_EXECUTIONS = [
  "synthetic_exec_alpha",
  "synthetic_policy_trace",
  "synthetic_connector_replay",
];

export default function ReplayLabIndexPage() {
  return (
    <div className="p-6 space-y-6">
      <RouteOperationalNotice route="/console/replay" />

      <Card>
        <CardHeader>
          <CardTitle>Replay Lab</CardTitle>
          <CardDescription>
            This surface currently exposes synthetic replay examples for UI validation. It does not
            expose tenant production execution history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {SYNTHETIC_EXECUTIONS.map((executionId) => (
            <div key={executionId} className="flex items-center justify-between rounded border p-3">
              <code>{executionId}</code>
              <Button asChild size="sm" variant="outline">
                <Link href={`/console/replay/${executionId}`}>Open synthetic replay</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
