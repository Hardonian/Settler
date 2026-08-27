"use client";

import { useEffect, useState } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, TrendingDown, AlertTriangle } from "lucide-react";

type Forecast = {
  id: string;
  date: string;
  predictedDiscrepancyAmount: number;
  confidence: number;
  reason: string;
  affectedAdapters: string[];
};

export default function ForecastingDashboard() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadForecasts() {
      try {
        const res = await fetch("/api/intelligence/forecast");
        const json = await res.json();
        if (json.data && json.data.forecasts) {
          setForecasts(json.data.forecasts);
        }
      } catch (e) {
        console.error("Failed to load forecasts", e);
      } finally {
        setLoading(false);
      }
    }
    loadForecasts();
  }, []);

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Predictive Anomaly Forecasting"
        description="AI-driven statistical projections of upcoming reconciliation discrepancies based on historical ledger patterns."
      />

      <div className="space-y-6 max-w-5xl mt-6">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <BrainCircuit className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm">Forecasting Engine</h3>
              </div>
              <p className="text-2xl font-bold">Active</p>
              <p className="text-xs text-muted-foreground mt-1">
                Analyzing 4.2M historical patterns
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-sm">Predicted Anomalies</h3>
              </div>
              <p className="text-2xl font-bold text-amber-600">{forecasts.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Next 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold text-sm">Value at Risk</h3>
              </div>
              <p className="text-2xl font-bold text-destructive">
                $
                {forecasts
                  .reduce((acc, f) => acc + f.predictedDiscrepancyAmount, 0)
                  .toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Projected variance</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Risk Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading AI forecasts...</div>
            ) : forecasts.length === 0 ? (
              <div className="text-sm text-muted-foreground">No upcoming anomalies predicted.</div>
            ) : (
              <div className="space-y-6">
                {forecasts.map((forecast) => (
                  <div
                    key={forecast.id}
                    className="relative pl-6 pb-6 last:pb-0 border-l-2 border-primary/20"
                  >
                    <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full border-2 border-background bg-primary" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">
                            {new Date(forecast.date).toLocaleDateString()}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-200 bg-amber-50"
                          >
                            ${forecast.predictedDiscrepancyAmount.toLocaleString()} Expected
                            Variance
                          </Badge>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                          {forecast.confidence * 100}% Confidence
                        </span>
                      </div>
                      <p className="text-sm">{forecast.reason}</p>
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-xs text-muted-foreground">
                          Affected integrations:
                        </span>
                        {forecast.affectedAdapters.map((adapter) => (
                          <Badge key={adapter} variant="secondary" className="text-xs uppercase">
                            {adapter}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
