/**
 * AI Assist Components
 *
 * Gated, explainable AI assistance with deterministic fallbacks.
 * Always shows baseline recommendation with optional AI enhancement.
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle, CheckCircle2, Info } from "lucide-react";

export interface AIRecommendation {
  type: "match" | "duplicate" | "mismatch" | "anomaly";
  confidence: number; // 0-1
  explanation: string;
  signals: Array<{ name: string; value: string; weight: number }>;
  deterministicBaseline: string;
  aiEnhancement?: string;
  suggestedAction: string;
}

interface AIAssistProps {
  recommendation: AIRecommendation;
  onAccept?: () => void;
  onReject?: () => void;
  enabled?: boolean;
}

/**
 * AI Assist Card Component
 */
export function AIAssistCard({
  recommendation,
  onAccept,
  onReject,
  enabled = true,
}: AIAssistProps) {
  if (!enabled) {
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Info className="w-4 h-4" />
            <span className="text-sm">
              AI Assist is disabled. Using deterministic baseline only.
            </span>
          </div>
          <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded text-sm">
            <strong>Baseline:</strong> {recommendation.deterministicBaseline}
          </div>
        </CardContent>
      </Card>
    );
  }

  const confidenceColor =
    recommendation.confidence > 0.8
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : recommendation.confidence > 0.5
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-base">AI Assist Recommendation</CardTitle>
            <Badge className={confidenceColor}>
              {(recommendation.confidence * 100).toFixed(0)}% confidence
            </Badge>
          </div>
          <Badge variant="outline" className="text-xs">
            Optional
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Deterministic Baseline (Always Shown) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Deterministic Baseline
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 ml-6">
            {recommendation.deterministicBaseline}
          </p>
        </div>

        {/* AI Enhancement (If Available) */}
        {recommendation.aiEnhancement && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                AI Enhancement
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 ml-6">
              {recommendation.aiEnhancement}
            </p>
          </div>
        )}

        {/* Explanation */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Explanation
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 ml-6">
            {recommendation.explanation}
          </p>
        </div>

        {/* Signals (Expandable) */}
        <details>
          <summary className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer mb-2">
            View Detection Signals
          </summary>
          <div className="mt-2 space-y-2 ml-4">
            {recommendation.signals.map((signal, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">{signal.name}:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-900 dark:text-white">{signal.value}</span>
                  <Badge variant="outline" className="text-xs">
                    {signal.weight.toFixed(2)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </details>

        {/* Suggested Action */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Suggested Action
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 ml-6 mb-4">
            {recommendation.suggestedAction}
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={onAccept}>
              Accept Recommendation
            </Button>
            <Button size="sm" variant="outline" onClick={onReject}>
              Use Baseline Only
            </Button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <strong>Note:</strong> AI recommendations are suggestions only. All actions are logged
            in the audit trail. You can always fall back to the deterministic baseline.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * AI Assist Badge (for inline use)
 */
export function AIAssistBadge({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;

  return (
    <Badge variant="outline" className="text-xs">
      <Sparkles className="w-3 h-3 mr-1" />
      AI Enhanced
    </Badge>
  );
}
