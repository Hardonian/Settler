/**
 * Error Alerts Panel
 * 
 * Displays active error alerts with severity indicators.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle, AlertCircle, Info } from 'lucide-react';
import { format } from 'date-fns';

interface ErrorAlert {
  id: string;
  type: 'error_rate' | 'error_spike' | 'service_down' | 'limit_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, unknown>;
  timestamp: Date;
  resolved: boolean;
}

export function ErrorAlertsPanel() {
  const [alerts, setAlerts] = useState<ErrorAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/console/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      } else {
        // Handle non-200 responses gracefully
        console.error('Failed to fetch alerts:', res.status);
        setAlerts([]); // Show empty state
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setAlerts([]); // Show empty state on error
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAlerts();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Alerts</CardTitle>
          <CardDescription>Active error alerts and warnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No active alerts</p>
            <p className="text-sm mt-1">All systems operating normally</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-red-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  return (
    <ConsoleErrorBoundary>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                Error Alerts
              </CardTitle>
              <CardDescription>
                {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              aria-label="Refresh alerts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${
                alert.severity === 'critical'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : alert.severity === 'high'
                  ? 'border-red-400 bg-red-50/50 dark:bg-red-900/10'
                  : alert.severity === 'medium'
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/10'
                  : 'border-blue-400 bg-blue-50 dark:bg-blue-900/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{alert.message}</p>
                      {getSeverityBadge(alert.severity)}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {format(new Date(alert.timestamp), 'PPp')}
                    </p>
                    {alert.details && Object.keys(alert.details).length > 0 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-slate-600 dark:text-slate-400">
                          View details
                        </summary>
                        <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-auto">
                          {JSON.stringify(alert.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    </ConsoleErrorBoundary>
  );
}
