"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CohortData {
  cohort: string; // e.g., "2026-01"
  users: number;
  retention: {
    week1: number;
    week2: number;
    week4: number;
    week8: number;
    week12: number;
  };
}

export function RetentionCohortDashboard() {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCohortData();
  }, []);

  const fetchCohortData = async () => {
    try {
      const response = await fetch("/api/analytics/retention-cohorts");
      if (response.ok) {
        const data = await response.json();
        setCohorts(data.cohorts || []);
      }
    } catch (error) {
      console.error("Failed to fetch cohort data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retention Cohorts</CardTitle>
        <CardDescription>User retention by signup cohort</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left p-3 font-semibold text-slate-900 dark:text-white">Cohort</th>
                  <th className="text-center p-3 font-semibold text-slate-900 dark:text-white">Users</th>
                  <th className="text-center p-3 font-semibold text-slate-900 dark:text-white">Week 1</th>
                  <th className="text-center p-3 font-semibold text-slate-900 dark:text-white">Week 2</th>
                  <th className="text-center p-3 font-semibold text-slate-900 dark:text-white">Week 4</th>
                  <th className="text-center p-3 font-semibold text-slate-900 dark:text-white">Week 8</th>
                  <th className="text-center p-3 font-semibold text-slate-900 dark:text-white">Week 12</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort) => (
                  <tr
                    key={cohort.cohort}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{cohort.cohort}</td>
                    <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                      {cohort.users}
                    </td>
                    <td className="p-3 text-center">
                      <div
                        className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                          cohort.retention.week1 >= 50
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : cohort.retention.week1 >= 30
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {cohort.retention.week1}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div
                        className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                          cohort.retention.week2 >= 40
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : cohort.retention.week2 >= 20
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {cohort.retention.week2}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div
                        className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                          cohort.retention.week4 >= 30
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : cohort.retention.week4 >= 15
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {cohort.retention.week4}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div
                        className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                          cohort.retention.week8 >= 25
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : cohort.retention.week8 >= 10
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {cohort.retention.week8}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div
                        className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                          cohort.retention.week12 >= 20
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : cohort.retention.week12 >= 10
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {cohort.retention.week12}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
