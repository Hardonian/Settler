import Link from "next/link";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SYNTHETIC_EXECUTIONS = [
  "synthetic_exec_alpha",
  "synthetic_policy_trace",
  "synthetic_connector_replay",
];

export default function ReplayLabIndexPage() {
  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Replay Lab"
        description="Synthetic replay samples for UI and workflow validation. This route does not expose tenant production execution history."
      />

      <Card>
        <CardHeader>
          <CardTitle>Available synthetic replays</CardTitle>
          <CardDescription>
            Use these deterministic examples to validate replay layout and disclosure behavior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {SYNTHETIC_EXECUTIONS.map((executionId) => (
            <div
              key={executionId}
              className="flex flex-col gap-3 rounded border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <code className="text-xs sm:text-sm">{executionId}</code>
              <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                <Link href={`/console/replay/${executionId}`}>Open synthetic replay</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
