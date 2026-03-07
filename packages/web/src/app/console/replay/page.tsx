import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SAMPLE_EXECUTIONS = ["exec_alpha_001", "exec_policy_002", "exec_connector_003"];

export default function ReplayLabIndexPage() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Replay Lab</CardTitle>
          <CardDescription>
            Open an execution replay with timeline, step inspector, and state diff.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {SAMPLE_EXECUTIONS.map((executionId) => (
            <div key={executionId} className="flex items-center justify-between rounded border p-3">
              <code>{executionId}</code>
              <Button asChild size="sm" variant="outline">
                <Link href={`/console/replay/${executionId}`}>Open replay</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
