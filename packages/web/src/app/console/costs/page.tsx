/**
 * Cost Visibility Dashboard Page
 * 
 * Shows cost breakdown and infrastructure costs per billing account.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface CostBreakdown {
  billingAccountId: string;
  period: {
    start: string;
    end: string;
  };
  services: {
    api: {
      requests: number;
      cost: number;
    };
    reconciliation: {
      jobs: number;
      cost: number;
    };
    receiptParsing: {
      receipts: number;
      cost: number;
    };
    storage: {
      gb: number;
      cost: number;
    };
  };
  total: number;
  estimatedMonthly: number;
}

export default function CostsPage() {
  const [costs, setCosts] = useState<CostBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCosts() {
      try {
        const response = await fetch('/api/console/costs');
        if (!response.ok) {
          throw new Error('Failed to fetch costs');
        }
        const data = await response.json();
        setCosts(data);
      } catch {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchCosts();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !costs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Error Loading Costs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 dark:text-slate-400">
            {error || 'Failed to load cost data'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Cost Visibility
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Infrastructure costs and usage breakdown
        </p>
      </div>

      {/* Total Cost */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Current Period Cost
          </CardTitle>
          <CardDescription>
            {new Date(costs.period.start).toLocaleDateString()} - {new Date(costs.period.end).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-4">{formatCurrency(costs.total)}</div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <TrendingUp className="h-4 w-4" />
            Estimated monthly: {formatCurrency(costs.estimatedMonthly)}
          </div>
        </CardContent>
      </Card>

      {/* Service Breakdown */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <CardDescription>{formatNumber(costs.services.api.requests)} requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(costs.services.api.cost)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Reconciliations</CardTitle>
            <CardDescription>{formatNumber(costs.services.reconciliation.jobs)} jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(costs.services.reconciliation.cost)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Receipt Parsing</CardTitle>
            <CardDescription>{formatNumber(costs.services.receiptParsing.receipts)} receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(costs.services.receiptParsing.cost)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <CardDescription>{formatNumber(costs.services.storage.gb)} GB</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(costs.services.storage.cost)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
