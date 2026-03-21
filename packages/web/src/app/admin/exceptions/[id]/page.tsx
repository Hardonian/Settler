/**
 * Exception Detail Page
 *
 * Detailed view of a single exception with AI assist recommendations.
 */

"use client";

import { useAdminExceptions } from "@/lib/admin/hooks/use-admin-metrics";
import { AIAssistCard, AIRecommendation } from "@/components/admin/ai-assist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ExceptionDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const { data: exceptionsData } = useAdminExceptions({ limit: 1000 });
  const exception = exceptionsData?.items?.find((ex: { id: string }) => ex.id === id);

  // AI recommendations require the AI analysis pipeline to be configured.
  // When available, these would come from /api/ai/data-insights.
  const aiRecommendation: AIRecommendation | null = null;

  if (!exception) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Exception not found</p>
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
    <div className="p-8 space-y-6 bg-muted/10 min-h-screen">
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
            <h1 className="text-3xl font-bold text-foreground">Exception Details</h1>
            <p className="text-muted-foreground mt-1">{exception.reason}</p>
          </div>
        </div>
        <Badge
          className={
            exception.severity === "critical"
              ? "bg-red-100 text-red-800"
              : exception.severity === "warn"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-blue-100 text-blue-800"
          }
        >
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
              <span className="text-muted-foreground">Source:</span>
              <span className="ml-2 font-medium text-foreground">{exception.source}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className="ml-2 font-medium text-foreground">{exception.status}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <span className="ml-2 font-medium text-foreground">
                {new Date(exception.createdAt).toLocaleString()}
              </span>
            </div>
            {exception.ruleId && (
              <div>
                <span className="text-muted-foreground">Rule ID:</span>
                <span className="ml-2 font-mono text-xs text-foreground">{exception.ruleId}</span>
              </div>
            )}
          </div>

          {exception.evidence && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Evidence</h3>
              <pre className="text-xs bg-muted/40 p-3 rounded overflow-auto">
                {JSON.stringify(exception.evidence, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
