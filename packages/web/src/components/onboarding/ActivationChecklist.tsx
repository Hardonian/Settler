"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  required: boolean;
}

interface ActivationChecklistProps {
  userId?: string;
  onItemComplete?: (itemId: string) => void;
  onAllComplete?: () => void;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    id: "profile_complete",
    label: "Complete your profile",
    description: "Add your name and company information",
    action: { label: "Complete Profile", href: "/dashboard/user" },
    required: false,
  },
  {
    id: "first_integration",
    label: "Connect your first integration",
    description: "Set up at least one platform adapter",
    action: { label: "Connect Integration", href: "/dashboard/integrations" },
    required: true,
  },
  {
    id: "first_job",
    label: "Create your first reconciliation job",
    description: "Set up a job to match transactions",
    action: { label: "Create Job", href: "/playground" },
    required: true,
  },
  {
    id: "first_successful_run",
    label: "Run your first successful reconciliation",
    description: "Complete a reconciliation with matched results",
    action: { label: "Run Job", href: "/dashboard" },
    required: true,
  },
  {
    id: "explore_cookbooks",
    label: "Explore cookbooks",
    description: "Check out ready-to-use workflows",
    action: { label: "Browse Cookbooks", href: "/cookbooks" },
    required: false,
  },
];

export function ActivationChecklist({ userId, onItemComplete, onAllComplete }: ActivationChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecklistStatus();
  }, [userId]);

  const fetchChecklistStatus = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/user/checklist?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const completed = new Set(data.completedItems || []);
        setCompletedItems(completed);
      }
    } catch (error) {
      console.error("Failed to fetch checklist status:", error);
    } finally {
      setLoading(false);
    }
  };

  const markItemComplete = async (itemId: string) => {
    if (!userId) return;

    try {
      const response = await fetch("/api/user/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, itemId }),
      });

      if (response.ok) {
        setCompletedItems((prev) => new Set([...prev, itemId]));
        onItemComplete?.(itemId);

        // Check if all required items are complete
        const requiredItems = items.filter((item) => item.required);
        const allRequiredComplete = requiredItems.every((item) =>
          [...completedItems, itemId].includes(item.id)
        );

        if (allRequiredComplete) {
          onAllComplete?.();
        }
      }
    } catch (error) {
      console.error("Failed to mark item complete:", error);
    }
  };

  const completedCount = completedItems.size;
  const totalCount = items.length;
  const requiredCount = items.filter((item) => item.required).length;
  const completedRequiredCount = items.filter(
    (item) => item.required && completedItems.has(item.id)
  ).length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const requiredProgress = requiredCount > 0 ? (completedRequiredCount / requiredCount) * 100 : 0;
  const allRequiredComplete = requiredCount === completedRequiredCount;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activation Checklist</CardTitle>
          <CardDescription>Getting started with Settler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(allRequiredComplete && "border-green-500")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activation Checklist</CardTitle>
            <CardDescription>
              {allRequiredComplete
                ? "🎉 All required steps complete!"
                : `Complete ${requiredCount - completedRequiredCount} more required step${requiredCount - completedRequiredCount === 1 ? "" : "s"} to activate`}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {completedCount}/{totalCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">completed</div>
          </div>
        </div>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const isCompleted = completedItems.has(item.id);
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                  isCompleted
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                )}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className={cn(
                        "font-medium",
                        isCompleted
                          ? "text-green-900 dark:text-green-300 line-through"
                          : "text-slate-900 dark:text-white"
                      )}
                    >
                      {item.label}
                    </h4>
                    {item.required && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{item.description}</p>
                  )}
                  {!isCompleted && item.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => {
                        if (item.action) {
                          window.location.href = item.action.href;
                        }
                      }}
                    >
                      {item.action.label}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {allRequiredComplete && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
              🎉 Congratulations! You're all set up.
            </p>
            <p className="text-xs text-green-800 dark:text-green-400">
              You've completed all required activation steps. Start reconciling your transactions now!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
