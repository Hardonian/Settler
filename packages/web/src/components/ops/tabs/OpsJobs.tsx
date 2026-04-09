/**
 * Ops Jobs Tab
 *
 * Job queue monitoring
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OpsJobs() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reconciliation Runs</CardTitle>
        <CardDescription>Reconciliation run monitoring and management</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Reconciliation runs are available in the Console under Runs.
        </p>
      </CardContent>
    </Card>
  );
}
