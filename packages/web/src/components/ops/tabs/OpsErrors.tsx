/**
 * Ops Errors Tab
 * 
 * Error monitoring and triage
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function OpsErrors() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Errors</CardTitle>
        <CardDescription>Error monitoring and triage</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Error monitoring coming soon</p>
      </CardContent>
    </Card>
  );
}
