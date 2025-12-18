/**
 * Ops Runbooks Tab
 * 
 * Operational runbooks and procedures
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function OpsRunbooks() {
  const runbooks = [
    {
      title: 'Database Migration',
      content: 'Steps for running database migrations safely...',
    },
    {
      title: 'Deployment Rollback',
      content: 'How to rollback a deployment if issues occur...',
    },
    {
      title: 'Error Investigation',
      content: 'Process for investigating and resolving errors...',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Runbooks</CardTitle>
        <CardDescription>Operational procedures and guides</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {runbooks.map((runbook, index) => (
          <div key={index} className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">{runbook.title}</h3>
            <p className="text-sm text-muted-foreground">{runbook.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
