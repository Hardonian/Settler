/**
 * Ops Billing Tab
 * 
 * Billing and subscription management
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function OpsBilling() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>Billing and subscription management</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Billing management coming soon</p>
      </CardContent>
    </Card>
  );
}
