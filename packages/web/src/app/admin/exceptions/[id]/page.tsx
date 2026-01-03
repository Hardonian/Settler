/**
 * Exception Detail Page
 * 
 * Detailed view of a single exception with AI assist recommendations.
 */

'use client';

import { use } from 'react';
import { useAdminExceptions } from '@/lib/admin/hooks/use-admin-metrics';
import { AIAssistCard, AIRecommendation } from '@/components/admin/ai-assist';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function ExceptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const { data: exceptionsData } = useAdminExceptions({ limit: 1000 });
  const exception = exceptionsData?.items?.find(ex => ex.id === id);

  // Mock AI recommendation (would come from API in real implementation)
  const aiRecommendation: AIRecommendation | null = exception ? {
    type: 'mismatch',
    confidence: 0.85,
    explanation: 'Amount mismatch detected between source and target transactions. The difference suggests a potential fee or tax adjustment.',
    signals: [
      { name: 'Amount Difference', value: '$5.00', weight: 0.9 },
      { name: 'Date Proximity', value: '1 day', weight: 0.7 },
      { name: 'Source Pattern', value: 'Stripe', weight: 0.6 },
    ],
    deterministicBaseline: 'Match rejected due to amount mismatch. Manual review required.',
    aiEnhancement: 'Likely a processing fee. Consider matching with fee adjustment.',
    suggestedAction: 'Create adjustment entry for $5.00 fee and match transactions.',
  } : null;

  if (!exception) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">Exception not found</p>
          <Link href="/admin/exceptions">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Exceptions
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/exceptions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Exception Details
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {exception.reason}
            </p>
          </div>
        </div>
        <Badge className={
          exception.severity === 'critical' ? 'bg-red-100 text-red-800' :
          exception.severity === 'warn' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }>
          {exception.severity}
        </Badge>
      </div>

      {/* AI Assist Recommendation */}
      {aiRecommendation && (
        <AIAssistCard
          recommendation={aiRecommendation}
          enabled={true}
          onAccept={() => {
            // AI recommendation accepted - would trigger action
            // Implementation depends on specific use case
          }}
          onReject={() => {
            // AI recommendation rejected - using baseline
            // Implementation depends on specific use case
          }}
        />
      )}

      {/* Exception Details */}
      <Card>
        <CardHeader>
          <CardTitle>Exception Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Source:</span>
              <span className="ml-2 font-medium text-slate-900 dark:text-white">{exception.source}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Status:</span>
              <span className="ml-2 font-medium text-slate-900 dark:text-white">{exception.status}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Created:</span>
              <span className="ml-2 font-medium text-slate-900 dark:text-white">
                {new Date(exception.createdAt).toLocaleString()}
              </span>
            </div>
            {exception.ruleId && (
              <div>
                <span className="text-slate-500 dark:text-slate-400">Rule ID:</span>
                <span className="ml-2 font-mono text-xs text-slate-900 dark:text-white">
                  {exception.ruleId}
                </span>
              </div>
            )}
          </div>

          {exception.evidence && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Evidence
              </h3>
              <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded overflow-auto">
                {JSON.stringify(exception.evidence, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
