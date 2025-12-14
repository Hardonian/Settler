/**
 * Data Insights Panel Component
 * Shows AI-generated insights from user data
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Lightbulb, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Insight {
  summary: string;
  trends: Array<{ label: string; value: string; change?: string }>;
  recommendations: string[];
}

export function DataInsightsPanel({ dataType = "receipts" }: { dataType?: "receipts" | "usage" }) {
  const [insights, setInsights] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/ai/data-insights?type=${dataType}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setInsights(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load insights");
        setLoading(false);
      });
  }, [dataType]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          AI Insights
        </CardTitle>
        <CardDescription>
          Intelligent analysis of your {dataType === "receipts" ? "receipt" : "usage"} data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Summary */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Summary
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {insights.summary}
          </p>
        </div>

        {/* Trends */}
        {insights.trends && insights.trends.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Key Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {insights.trends.map((trend, i) => (
                <div
                  key={i}
                  className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {trend.label}
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {trend.value}
                  </p>
                  {trend.change && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {trend.change}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {insights.recommendations && insights.recommendations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Recommendations
            </h3>
            <ul className="space-y-2">
              {insights.recommendations.map((rec, i) => (
                <li
                  key={i}
                  className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"
                >
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
