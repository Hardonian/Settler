/**
 * Playground Overview Page
 * 
 * Shows all available playground tools.
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FileText, RefreshCw, Flag, Calculator, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackPlaygroundVisit } from '@/lib/analytics/conversion';

const playgrounds = [
  {
    title: 'CLI Playground',
    description: 'Interactive API testing with code editor, request builder, and response viewer.',
    href: '/console/playground/cli',
    icon: Terminal,
    color: 'text-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    featured: true
  },
  {
    title: 'Reconciliation',
    description: 'Test transaction matching rules and conflict resolution.',
    href: '/console/playground/reconcile',
    icon: RefreshCw,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/20'
  },
  {
    title: 'Receipts Parsing',
    description: 'Upload receipts and extract structured data using AI.',
    href: '/console/playground/receipts',
    icon: FileText,
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900/20'
  },
  {
    title: 'Feature Flags',
    description: 'Evaluate flags and experiment with user contexts.',
    href: '/console/playground/flags',
    icon: Flag,
    color: 'text-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/20'
  },
  {
    title: 'Conversion',
    description: 'Convert units, currencies, and format financial numbers.',
    href: '/console/playground/convert',
    icon: Calculator,
    color: 'text-indigo-500',
    bg: 'bg-indigo-100 dark:bg-indigo-900/20'
  }
];

export default function PlaygroundOverview() {
  // Track playground visit
  useEffect(() => {
    trackPlaygroundVisit().catch(() => {
      // Don't block if tracking fails
    });
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Developer Playground</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Interactive tools to explore and test the Settler API capabilities.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {playgrounds.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className={cn(
              "h-full hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200 dark:border-slate-800",
              item.featured && "border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-900/10"
            )}>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-lg ${item.bg}`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{item.title}</CardTitle>
                    {item.featured && (
                      <Badge variant="default" className="bg-purple-600 text-white">
                        New
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4 text-base">
                  {item.description}
                </CardDescription>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  Try it now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
