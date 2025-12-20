/**
 * Ops Errors Tab
 * 
 * Error monitoring and triage
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function OpsErrors() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Errors</CardTitle>
        <CardDescription>Error monitoring and triage</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Error monitoring is available in the Console under Activity Feed.
        </p>
      </CardContent>
    </Card>
  );
}
