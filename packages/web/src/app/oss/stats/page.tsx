/**
 * OSS SDK Statistics Page
 * Shows detailed download and usage statistics
 */

'use client';

import { useEffect, useState } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { TrendingUp, Download, Users, Code, Globe, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { trackSDKStatsView } from '@/lib/analytics/sdk-tracking';

interface SDKStats {
  downloads: {
    total: number;
    weekly: number;
    monthly: number;
    byPackage: Record<string, number>;
    trend: Array<{ date: string; count: number }>;
  };
  playground: {
    totalSessions: number;
    activeUsers: number;
    usageByFeature: Record<string, number>;
    popularIntegrations: Array<{ name: string; count: number }>;
  };
  github: {
    stars: number;
    forks: number;
    contributors: number;
    issues: number;
    prs: number;
  };
  usage: {
    totalProjects: number;
    companies: number;
    countries: number;
    topUseCases: Array<{ useCase: string; count: number }>;
  };
}

export default function OSSStatsPage() {
  const [stats, setStats] = useState<SDKStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackSDKStatsView();
    
    // Fetch stats
    fetch('/api/oss/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch stats:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">Failed to load statistics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">OSS SDK Statistics</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Real-time usage and download statistics for the Settler SDK
          </p>
        </div>

        {/* Download Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-500" />
                Total Downloads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.downloads.total.toLocaleString()}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                {stats.downloads.weekly.toLocaleString()} this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.playground.activeUsers.toLocaleString()}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                {stats.playground.totalSessions.toLocaleString()} sessions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-500" />
                GitHub Stars
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.github.stars.toLocaleString()}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                {stats.github.forks} forks
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Usage by Feature */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Playground Usage by Feature</CardTitle>
            <CardDescription>Most used features in the playground</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.playground.usageByFeature)
                .sort(([, a], [, b]) => b - a)
                .map(([feature, count]) => (
                  <div key={feature}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{feature}</span>
                      <span className="text-slate-600 dark:text-slate-400">{count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(count / Math.max(...Object.values(stats.playground.usageByFeature))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Integrations */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Popular Integrations</CardTitle>
            <CardDescription>Most tested integrations in playground</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {stats.playground.popularIntegrations.map((integration, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="font-medium">{integration.name}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {integration.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Use Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Top Use Cases</CardTitle>
            <CardDescription>How developers are using Settler SDK</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.usage.topUseCases.map((useCase, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span>{useCase.useCase}</span>
                  <Badge variant="secondary">{useCase.count.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
