/**
 * Ops Webhooks Tab
 * 
 * Webhook monitoring
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function OpsWebhooks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhooks</CardTitle>
        <CardDescription>Webhook delivery monitoring</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Webhook monitoring coming soon</p>
      </CardContent>
    </Card>
  );
}
