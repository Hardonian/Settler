"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, FileText, Flag, CheckCircle2, Clock, Key, CreditCard, BarChart3 } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'reconcile' | 'receipt' | 'flag' | 'api_key' | 'usage' | 'billing' | 'site' | 'experiment';
  status: 'success' | 'processing' | 'failed';
  title: string;
  timestamp: Date;
  meta: string;
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/console/activities');
      if (res.ok) {
        const data = await res.json();
        const mappedActivities: ActivityItem[] = (data.activities || []).map((activity: any) => ({
          id: activity.id,
          type: activity.activity_type,
          status: activity.status,
          title: activity.title,
          timestamp: new Date(activity.created_at),
          meta: activity.metadata?.meta || activity.metadata?.description || '',
        }));
        setActivities(mappedActivities);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchActivities();

    // Poll for new activities every 10 seconds
    const interval = setInterval(fetchActivities, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          Live Activity
        </CardTitle>
        <Badge variant="outline" className="animate-pulse text-green-600 border-green-600">
          ● Live
        </Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((item) => (
            <div key={item.id} className="flex items-start gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0 animate-in slide-in-from-left-2 fade-in duration-300">
              <div className={`mt-1 p-1.5 rounded-full ${
                item.type === 'reconcile' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                item.type === 'receipt' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                item.type === 'flag' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' :
                item.type === 'api_key' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
                item.type === 'usage' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30' :
                item.type === 'billing' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30' :
                'bg-slate-100 text-slate-600 dark:bg-slate-900/30'
              }`}>
                {item.type === 'reconcile' && <RefreshCw className="w-3 h-3" />}
                {item.type === 'receipt' && <FileText className="w-3 h-3" />}
                {item.type === 'flag' && <Flag className="w-3 h-3" />}
                {item.type === 'api_key' && <Key className="w-3 h-3" />}
                {item.type === 'usage' && <BarChart3 className="w-3 h-3" />}
                {item.type === 'billing' && <CreditCard className="w-3 h-3" />}
                {(item.type === 'site' || item.type === 'experiment') && <FileText className="w-3 h-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{item.meta}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div>
                {item.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                )}
              </div>
            </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
