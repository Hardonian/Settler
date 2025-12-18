/**
 * Ops Jobs Tab
 * 
 * Job queue monitoring
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function OpsJobs() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jobs & Queues</CardTitle>
        <CardDescription>Job queue monitoring and management</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Job queue monitoring coming soon</p>
      </CardContent>
    </Card>
  );
}
