"use client";

import { useEffect, useState } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, AlertCircle, BarChart3 } from "lucide-react";

export default function LiquidityDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/dashboards/liquidity");
        const json = await res.json();
        setMetrics(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Liquidity & Working Capital"
        description="FP&A and Treasury view of cash locked in unresolved exceptions and reconciliation delays."
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading liquidity metrics...</p>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <DollarSign className="w-5 h-5" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider">Locked Capital</h3>
                </div>
                <p className="text-4xl font-bold font-mono">
                  ${(metrics?.totalLockedCapital || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Unresolved exceptions across all entities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-green-600 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-green-700">
                    Projected Release (7D)
                  </h3>
                </div>
                <p className="text-4xl font-bold font-mono">
                  ${(metrics?.projectedRelease || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Estimated cash clearance this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-amber-600 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-amber-700">
                    Critical Aging (60+ Days)
                  </h3>
                </div>
                <p className="text-4xl font-bold font-mono">
                  $
                  {(
                    metrics?.agingBuckets.find((b: any) => b.label === "60+ Days")?.value || 0
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  High-risk capital requiring intervention
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                  Capital Aging Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.agingBuckets.map((b: any) => (
                    <div key={b.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{b.label}</span>
                        <span className="font-mono text-muted-foreground">
                          ${b.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${b.label.includes("60+") ? "bg-amber-500" : "bg-primary"}`}
                          style={{ width: `${(b.value / metrics.totalLockedCapital) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  Exposure by Subsidiary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.riskExposureByEntity.map((e: any) => (
                    <div
                      key={e.entity}
                      className="flex justify-between items-center py-2 border-b border-border/50 last:border-0"
                    >
                      <span className="text-sm font-medium">{e.entity}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        ${e.exposure.toLocaleString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
