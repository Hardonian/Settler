/**
 * Ops Usage Tab
 *
 * Usage metrics and analytics
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OpsUsage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
        <CardDescription>Usage metrics and analytics</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Usage analytics are available in the Console under Usage & Analytics.
        </p>
      </CardContent>
    </Card>
  );
}
