/**
 * Experiments Management Page
 *
 * List, create, and manage A/B tests.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, BarChart3, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Experiment {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "running" | "paused" | "completed";
  primaryMetric: string;
  targetPage: {
    id: string;
    slug: string;
    seoTitle: string | null;
  };
  variants: Array<{
    id: string;
    key: string;
    label: string;
  }>;
  _count: {
    metricEvents: number;
  };
}

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadExperiments();
  }, []);

  async function loadExperiments() {
    try {
      const response = await fetch("/api/console/site/experiments");
      if (!response.ok) throw new Error("Failed to load experiments");
      const data = await response.json();
      setExperiments(data.experiments || []);
    } catch (err) {
      console.error("Error loading experiments:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartExperiment(id: string) {
    try {
      const response = await fetch(`/api/console/site/experiments/${id}/start`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to start experiment");
      await loadExperiments();
    } catch (err) {
      console.error("Error starting experiment:", err);
      alert("Failed to start experiment");
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "running":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "paused":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "completed":
        return "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading experiments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            A/B Tests & Experiments
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create and manage experiments to optimize your site performance.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Experiment
        </Button>
      </div>

      {experiments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No experiments yet. Create your first A/B test to get started.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Experiment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {experiments.map((experiment) => (
            <Card key={experiment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{experiment.name}</CardTitle>
                      <Badge className={getStatusColor(experiment.status)}>
                        {experiment.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Testing: {experiment.targetPage.seoTitle || experiment.targetPage.slug}
                    </CardDescription>
                    <div className="mt-2 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span>{experiment.variants.length} variants</span>
                      <span>{experiment._count.metricEvents} events</span>
                      <span>Metric: {experiment.primaryMetric}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {experiment.status === "draft" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartExperiment(experiment.id)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/console/site/experiments/${experiment.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Experiment</DialogTitle>
            <DialogDescription>
              Create a new A/B test experiment. You'll configure variants after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                Feature Unavailable
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Experiment creation is currently unavailable. This feature is being prepared for
                release. For now, you can manage experiments via the API or contact support for
                assistance.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
