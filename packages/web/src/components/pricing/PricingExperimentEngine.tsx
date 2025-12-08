"use client";

import { useState, useEffect } from "react";
import { Beaker } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Experiment {
  id: string;
  name: string;
  variant: string;
  traffic: number;
  conversionRate: number;
  revenue: number;
  status: "active" | "paused" | "completed";
}

export function PricingExperimentEngine() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    try {
      const response = await fetch("/api/pricing/experiments");
      if (response.ok) {
        const data = await response.json();
        setExperiments(data.experiments || []);
      }
    } catch (error) {
      console.error("Failed to fetch experiments:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="w-5 h-5" />
              Pricing Experiments
            </CardTitle>
            <CardDescription>A/B test different pricing strategies</CardDescription>
          </div>
          <Button size="sm">New Experiment</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">Loading...</div>
        ) : (
          <div className="space-y-4">
            {experiments.map((experiment) => (
              <div
                key={experiment.id}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {experiment.name}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {experiment.variant}
                    </p>
                  </div>
                  <Badge
                    variant={
                      experiment.status === "active"
                        ? "default"
                        : experiment.status === "completed"
                          ? "default"
                          : "outline"
                    }
                    className={
                      experiment.status === "active"
                        ? "bg-green-600"
                        : experiment.status === "completed"
                          ? "bg-blue-600"
                          : ""
                    }
                  >
                    {experiment.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Traffic:</span>
                    <span className="ml-2 font-semibold">{experiment.traffic}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Conversion:</span>
                    <span className="ml-2 font-semibold">
                      {experiment.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Revenue:</span>
                    <span className="ml-2 font-semibold">
                      ${experiment.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
