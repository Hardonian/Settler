"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, FileText, Flag, CheckCircle2, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'reconcile' | 'receipt' | 'flag';
  status: 'success' | 'processing' | 'failed';
  title: string;
  timestamp: Date;
  meta: string;
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Simulate live incoming events
  useEffect(() => {
    // Initial data
    setActivities([
      {
        id: '1',
        type: 'reconcile',
        status: 'success',
        title: 'Stripe Payout #9921',
        timestamp: new Date(Date.now() - 1000 * 60 * 2),
        meta: 'Matched 142 txns'
      },
      {
        id: '2',
        type: 'receipt',
        status: 'success',
        title: 'Uber Receipt',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        meta: '$24.50 USD'
      },
      {
        id: '3',
        type: 'flag',
        status: 'success',
        title: 'Flag Eval: new-dashboard',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        meta: 'Variant: enabled'
      }
    ]);

    const interval = setInterval(() => {
      const types: ('reconcile' | 'receipt' | 'flag')[] = ['reconcile', 'receipt', 'flag'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const newActivity: ActivityItem = {
        id: Date.now().toString(),
        type,
        status: Math.random() > 0.1 ? 'success' : 'processing',
        title: type === 'reconcile' ? `Daily Sync ${Math.floor(Math.random() * 1000)}` : 
               type === 'receipt' ? `Receipt Upload ${Math.floor(Math.random() * 1000)}` :
               `Flag Check: beta-feature`,
        timestamp: new Date(),
        meta: type === 'reconcile' ? 'Processing...' : 'Analyzed'
      };

      setActivities(prev => [newActivity, ...prev].slice(0, 5));
    }, 5000); // New event every 5s

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
        <div className="space-y-4">
          {activities.map((item) => (
            <div key={item.id} className="flex items-start gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0 animate-in slide-in-from-left-2 fade-in duration-300">
              <div className={`mt-1 p-1.5 rounded-full ${
                item.type === 'reconcile' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                item.type === 'receipt' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                'bg-purple-100 text-purple-600 dark:bg-purple-900/30'
              }`}>
                {item.type === 'reconcile' && <RefreshCw className="w-3 h-3" />}
                {item.type === 'receipt' && <FileText className="w-3 h-3" />}
                {item.type === 'flag' && <Flag className="w-3 h-3" />}
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
      </CardContent>
    </Card>
  );
}
