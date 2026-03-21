"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Loader2, Search, Plus, CheckCircle2, AlertCircle, Clock, Filter } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logging/logger";

interface Job {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  source: string;
  target: string;
  matchedCount: number;
  unmatchedCount: number;
  accuracy: number;
  createdAt: string;
  completedAt?: string;
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    void fetchJobs();
  }, []);

  useEffect(() => {
    let filtered = jobs;

    if (searchQuery) {
      filtered = filtered.filter(
        (job) =>
          job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.target.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((job: any) => job.status === statusFilter);
    }

    setFilteredJobs(filtered);
  }, [searchQuery, statusFilter, jobs]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);

      // Build query string with filters
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      params.append("limit", "100");
      params.append("offset", "0");

      // Fetch from real API
      const response = await fetch(`/api/v1/recon/jobs?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`);
      }

      const apiData = await response.json();
      const jobsData = apiData.data || [];

      // Transform API response to Job format
      const jobsList: Job[] = jobsData.map(
        (jobData: {
          id: string;
          name: string;
          status: string;
          sourceAdapter: string;
          targetAdapter: string;
          createdAt: string;
          latestResult?: {
            status: string;
            sourceCount: number;
            targetCount: number;
            matchedCount: number;
            unmatchedSourceCount: number;
            unmatchedTargetCount: number;
            completedAt?: string;
          };
        }) => {
          const latestResult = jobData.latestResult;
          const totalTransactions =
            (latestResult?.sourceCount || 0) + (latestResult?.targetCount || 0);
          const accuracy =
            totalTransactions > 0 && latestResult?.matchedCount
              ? (latestResult.matchedCount / totalTransactions) * 100
              : 0;

          return {
            id: jobData.id,
            name: jobData.name,
            status: latestResult?.status || jobData.status || "pending",
            source: jobData.sourceAdapter,
            target: jobData.targetAdapter,
            matchedCount: latestResult?.matchedCount || 0,
            unmatchedCount:
              (latestResult?.unmatchedSourceCount || 0) + (latestResult?.unmatchedTargetCount || 0),
            accuracy: Math.round(accuracy * 10) / 10,
            createdAt: new Date(jobData.createdAt).toISOString(),
            completedAt: latestResult?.completedAt
              ? new Date(latestResult.completedAt).toISOString()
              : undefined,
          };
        }
      );

      setJobs(jobsList);
      setFilteredJobs(jobsList);
    } catch (error) {
      logger.error(
        "Failed to fetch jobs",
        error instanceof Error ? error : new Error(String(error))
      );
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: Job["status"]) => {
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
      <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-indigo-50/30 dark:from-background dark:via-muted/20 dark:to-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-indigo-50/30 dark:from-background dark:via-muted/20 dark:to-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Reconciliation Jobs
            </h1>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              View and manage all your reconciliation jobs
            </p>
          </div>
          <Button asChild className="font-medium">
            <Link href="/console/playground">
              <Plus className="mr-2 h-4 w-4" />
              Create New Job
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="running">Running</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "No jobs found matching your filters"
                    : "No jobs yet"}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button asChild className="mt-4">
                    <Link href="/console/playground">Create Your First Job</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-foreground text-lg">{job.name}</h3>
                        <Badge className={getStatusBadge(job.status)}>{job.status}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1.5">
                          <span className="font-medium">Source:</span> {job.source}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="font-medium">Target:</span> {job.target}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          {job.matchedCount} matched
                        </span>
                        {job.unmatchedCount > 0 && (
                          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                            <AlertCircle className="w-4 h-4" />
                            {job.unmatchedCount} unmatched
                          </span>
                        )}
                        <span className="text-muted-foreground">{job.accuracy}% accuracy</span>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="font-medium flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/dashboard/jobs/${job.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
