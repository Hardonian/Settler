"use client";

import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Quota {
  endpoint: string;
  limit: number;
  used: number;
  resetAt: string;
}

export function APIQuotaManager() {
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchQuotas();
  }, []);

  const fetchQuotas = async () => {
    try {
      const response = await fetch("/api/quota");
      if (response.ok) {
        const data = await response.json();
        setQuotas(data.quotas || []);
      }
    } catch (error) {
      console.error("Failed to fetch quotas:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          API Quota Management
        </CardTitle>
        <CardDescription>Monitor and manage API usage limits</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">Loading...</div>
        ) : (
          <div className="space-y-4">
            {quotas.map((quota) => {
              const percentage = (quota.used / quota.limit) * 100;
              const isWarning = percentage > 80;
              const isCritical = percentage > 95;

              return (
                <div
                  key={quota.endpoint}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {quota.endpoint}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Resets: {new Date(quota.resetAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={isCritical ? "destructive" : isWarning ? "default" : "outline"}
                      className={
                        isCritical ? "bg-red-600" : isWarning ? "bg-amber-600" : "bg-green-600"
                      }
                    >
                      {quota.used.toLocaleString()} / {quota.limit.toLocaleString()}
                    </Badge>
                  </div>
                  <Progress value={percentage} className="h-2 mb-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {percentage.toFixed(1)}% used
                    </span>
                    {isWarning && (
                      <Button size="sm" variant="outline">
                        Request Increase
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
