"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, TrendingDown, Users, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ChurnRiskUser {
  userId: string;
  email: string;
  churnRiskScore: number;
  reasons: string[];
  lifecycleStage: string;
  daysSinceLastActivity: number;
  segment: string;
}

export function ChurnPredictionDashboard() {
  const [atRiskUsers, setAtRiskUsers] = useState<ChurnRiskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ChurnRiskUser | null>(null);

  useEffect(() => {
    fetchChurnRiskUsers();
  }, []);

  const fetchChurnRiskUsers = async () => {
    try {
      const response = await fetch("/api/analytics/churn-risk");
      if (response.ok) {
        const data = await response.json();
        setAtRiskUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch churn risk users:", error);
    } finally {
      setLoading(false);
    }
  };

  const highRiskUsers = atRiskUsers.filter((u) => u.churnRiskScore >= 0.7);
  const mediumRiskUsers = atRiskUsers.filter(
    (u) => u.churnRiskScore >= 0.4 && u.churnRiskScore < 0.7
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total At Risk</CardDescription>
            <CardTitle className="text-3xl">{atRiskUsers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Users className="w-4 h-4" />
              <span>Users</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20">
          <CardHeader className="pb-3">
            <CardDescription>High Risk</CardDescription>
            <CardTitle className="text-3xl text-red-600 dark:text-red-400">
              {highRiskUsers.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Immediate action</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
          <CardHeader className="pb-3">
            <CardDescription>Medium Risk</CardDescription>
            <CardTitle className="text-3xl text-amber-600 dark:text-amber-400">
              {mediumRiskUsers.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <TrendingDown className="w-4 h-4" />
              <span>Monitor closely</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Risk Score</CardDescription>
            <CardTitle className="text-3xl">
              {atRiskUsers.length > 0
                ? (atRiskUsers.reduce((sum, u) => sum + u.churnRiskScore, 0) / atRiskUsers.length).toFixed(2)
                : "0.00"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Shield className="w-4 h-4" />
              <span>Risk level</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* At Risk Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users At Risk of Churning</CardTitle>
          <CardDescription>
            Users with churn risk score &gt; 0.4. Take action to retain them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {atRiskUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No users at risk currently. Great job! 🎉
              </div>
            ) : (
              atRiskUsers
                .sort((a, b) => b.churnRiskScore - a.churnRiskScore)
                .map((user) => (
                  <div
                    key={user.userId}
                    className={cn(
                      "p-4 rounded-lg border transition-colors cursor-pointer",
                      user.churnRiskScore >= 0.7
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
                      selectedUser?.userId === user.userId && "ring-2 ring-blue-500"
                    )}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-900 dark:text-white">{user.email}</h4>
                          <Badge
                            variant={user.churnRiskScore >= 0.7 ? "destructive" : "default"}
                            className={cn(
                              user.churnRiskScore >= 0.7 && "bg-red-600 dark:bg-red-700"
                            )}
                          >
                            {user.churnRiskScore >= 0.7 ? "High Risk" : "Medium Risk"}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                            <span>Risk Score: {(user.churnRiskScore * 100).toFixed(0)}%</span>
                            <span>•</span>
                            <span>Stage: {user.lifecycleStage}</span>
                            <span>•</span>
                            <span>Inactive: {user.daysSinceLastActivity} days</span>
                          </div>
                          <Progress value={user.churnRiskScore * 100} className="mt-2 h-2" />
                        </div>
                        {user.reasons.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Risk Factors:
                            </p>
                            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                              {user.reasons.map((reason, index) => (
                                <li key={index} className="flex items-start gap-1">
                                  <span className="text-red-500">•</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/admin/users/${user.userId}?action=retention`;
                        }}
                      >
                        Take Action
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
