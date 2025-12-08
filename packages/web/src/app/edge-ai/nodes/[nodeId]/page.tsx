"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Loader2, ArrowLeft, Server, Activity, Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface NodeDetail {
  id: string;
  name: string;
  status: "active" | "inactive" | "error";
  region: string;
  latency: number;
  requests: number;
  accuracy: number;
  lastActive: string;
  createdAt: string;
  config: {
    model: string;
    version: string;
    endpoint: string;
  };
}

export default function NodeDetailPage() {
  const params = useParams();
  const nodeId = params?.nodeId as string | undefined;
  const [node, setNode] = useState<NodeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (nodeId) {
      fetchNodeDetail(nodeId);
    }
  }, [nodeId]);

  const fetchNodeDetail = async (id: string) => {
    try {
      setIsLoading(true);
      // In production, fetch from API: `/api/edge-ai/nodes/${id}`
      const mockNode: NodeDetail = {
        id: id,
        name: "US-East Edge Node",
        status: "active",
        region: "us-east-1",
        latency: 8,
        requests: 12500,
        accuracy: 99.7,
        lastActive: new Date().toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        config: {
          model: "settler-reconciliation-v2",
          version: "2.1.0",
          endpoint: `https://edge-${id}.settler.dev`,
        },
      };
      setNode(mockNode);
    } catch (error) {
      console.error("Failed to fetch node:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: NodeDetail["status"]) => {
    const variants = {
      active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      inactive: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
      error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return variants[status];
  };

  if (!nodeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400 mb-4">Invalid node ID</p>
                <Button asChild>
                  <Link href="/edge-ai/nodes">Back to Nodes</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

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

  if (!node) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400 mb-4">Node not found</p>
                <Button asChild>
                  <Link href="/edge-ai/nodes">Back to Nodes</Link>
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
            <Link href="/edge-ai/nodes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Nodes
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Server className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                {node.name}
              </h1>
              <Badge className={getStatusBadge(node.status)}>{node.status}</Badge>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
              Edge AI node for low-latency reconciliation processing
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs md:text-sm">Latency</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">{node.latency}ms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs md:text-sm text-green-600 dark:text-green-400">
                <Zap className="w-4 h-4" />
                <span>Excellent</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs md:text-sm">Total Requests</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">
                {node.requests.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 dark:text-slate-400">
                <Activity className="w-4 h-4" />
                <span>All time</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs md:text-sm">Accuracy</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">{node.accuracy}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs md:text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>High precision</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs md:text-sm">Region</CardDescription>
              <CardTitle className="text-2xl md:text-3xl uppercase">{node.region}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 dark:text-slate-400">
                <Server className="w-4 h-4" />
                <span>Deployed</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Node Configuration</CardTitle>
              <CardDescription>Edge node settings and details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Model:
                  </span>
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                    {node.config.model}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Version:
                  </span>
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                    {node.config.version}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Endpoint:
                  </span>
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400 font-mono">
                    {node.config.endpoint}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Created:
                  </span>
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(node.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Last Active:
                  </span>
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(node.lastActive).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Real-time performance data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
                  <Badge className={getStatusBadge(node.status)}>{node.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Average Latency
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {node.latency}ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Request Accuracy
                  </span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {node.accuracy}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Total Requests</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {node.requests.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" className="font-medium">
            View Logs
          </Button>
          <Button variant="outline" className="font-medium">
            Restart Node
          </Button>
          {node.status === "active" ? (
            <Button variant="outline" className="font-medium text-red-600 dark:text-red-400">
              Deactivate
            </Button>
          ) : (
            <Button className="font-medium">Activate</Button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
