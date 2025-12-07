"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle, Clock, Download, RefreshCw } from "lucide-react";
import Link from "next/link";

interface JobDetail {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  source: {
    adapter: string;
    config: Record<string, unknown>;
  };
  target: {
    adapter: string;
    config: Record<string, unknown>;
  };
  matchedCount: number;
  unmatchedCount: number;
  conflictsCount: number;
  accuracy: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  summary: {
    total: number;
    matched: number;
    unmatched: number;
    conflicts: number;
  };
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      fetchJobDetail();
    }
  }, [jobId]);

  const fetchJobDetail = async () => {
    try {
      setIsLoading(true);
      // In production, fetch from API: `/api/jobs/${jobId}`
      const mockJob: JobDetail = {
        id: jobId,
        name: "Shopify-Stripe Monthly Reconciliation",
        status: "completed",
        source: {
          adapter: "shopify",
          config: {
            shop: "example.myshopify.com",
          },
        },
        target: {
          adapter: "stripe",
          config: {},
        },
        matchedCount: 145,
        unmatchedCount: 3,
        conflictsCount: 2,
        accuracy: 97.9,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
        summary: {
          total: 150,
          matched: 145,
          unmatched: 3,
          conflicts: 2,
        },
      };
      setJob(mockJob);
    } catch (error) {
      console.error("Failed to fetch job:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: JobDetail["status"]) => {
    const variants = {
      completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      running: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return variants[status];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400 mb-4">Job not found</p>
                <Button asChild>
                  <Link href="/dashboard/jobs">Back to Jobs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                {job.name}
              </h1>
              <Badge className={getStatusBadge(job.status)}>{job.status}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Created {new Date(job.createdAt).toLocaleDateString()}
              </span>
              {job.completedAt && (
                <span>
                  Completed {new Date(job.completedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="font-medium">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            {job.status === "completed" && (
              <Button variant="outline" size="sm" className="font-medium">
                <RefreshCw className="mr-2 h-4 w-4" />
                Rerun Job
              </Button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs md:text-sm">Total Transactions</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">{job.summary.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs md:text-sm">Matched</CardDescription>
              <CardTitle className="text-2xl md:text-3xl text-green-600 dark:text-green-400">
                {job.summary.matched}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs md:text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{job.accuracy}% accuracy</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs md:text-sm">Unmatched</CardDescription>
              <CardTitle className="text-2xl md:text-3xl text-amber-600 dark:text-amber-400">
                {job.summary.unmatched}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs md:text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>Requires review</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs md:text-sm">Conflicts</CardDescription>
              <CardTitle className="text-2xl md:text-3xl text-red-600 dark:text-red-400">
                {job.summary.conflicts}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs md:text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>Needs resolution</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Source Configuration</CardTitle>
              <CardDescription>Source adapter and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Adapter:</span>
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400 capitalize">
                    {job.source.adapter}
                  </span>
                </div>
                {Object.entries(job.source.config).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {key.replace(/_/g, " ")}:
                    </span>
                    <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target Configuration</CardTitle>
              <CardDescription>Target adapter and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Adapter:</span>
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400 capitalize">
                    {job.target.adapter}
                  </span>
                </div>
                {Object.entries(job.target.config).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {key.replace(/_/g, " ")}:
                    </span>
                    <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {job.error && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <CardHeader>
              <CardTitle className="text-red-900 dark:text-red-300">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800 dark:text-red-200">{job.error}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
