/**
 * AI Analysis API Route
 * 
 * Handles AI-powered analysis requests with token management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { getPrimaryTenant } from '@/lib/supabase/tenant-helpers';
import { z } from 'zod';
import { checkTokenUsage, consumeTokens } from '@/lib/server/settler/ai-tokens';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const RunAnalysisSchema = z.object({
  type: z.enum(['reconciliation', 'change_detection', 'anomaly', 'prediction']),
  input: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const authContext = await requireAuth(request);
    
    // Get tenant ID
    const tenantId = await getPrimaryTenant();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 400 }
      );
    }
    
    // Parse and validate body
    const body = await request.json();
    const { type, input } = RunAnalysisSchema.parse(body);
    
    // Check token usage
    const tokenCheck = await checkTokenUsage(tenantId);
    if (!tokenCheck.hasTokens) {
      return NextResponse.json(
        { error: 'No tokens available', exhausted: true },
        { status: 402 } // Payment Required
      );
    }
    
    // Run AI analysis (mock for now - integrate with actual AI service)
    const analysis = await runAIAnalysis(type, input);
    
    // Consume tokens
    await consumeTokens(tenantId, analysis.tokensUsed);
    
    return NextResponse.json({ analysis }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('[AI Analysis API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to run analysis' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Authenticate
    const authContext = await requireAuth({} as NextRequest);
    
    // Get tenant ID
    const tenantId = await getPrimaryTenant();
    if (!tenantId) {
      return NextResponse.json({ analyses: [] }, { status: 200 });
    }
    
    // List analyses (mock for now)
    const analyses = await listAnalyses(tenantId);
    
    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('[AI Analysis API] Error:', error);
    return NextResponse.json({ analyses: [] }, { status: 200 });
  }
}

// Mock AI analysis function - replace with actual AI service
async function runAIAnalysis(
  type: string,
  input?: string
): Promise<{
  id: string;
  type: string;
  input: string;
  result: {
    summary: string;
    insights: string[];
    recommendations: string[];
    confidence: number;
  };
  tokensUsed: number;
  createdAt: Date;
}> {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  const mockResults: Record<string, any> = {
    reconciliation: {
      summary: 'Reconciliation analysis shows 3 high-risk items requiring immediate attention.',
      insights: [
        'Delta patterns suggest systematic timing differences',
        'Confidence scores indicate reliable source data',
        'Risk distribution is concentrated in Q4 transactions',
      ],
      recommendations: [
        'Review reconciliation rules for Q4 transactions',
        'Consider adjusting timing windows for better matching',
        'Investigate source adapter reliability scores',
      ],
      confidence: 0.85,
    },
    change_detection: {
      summary: 'Change detection analysis identified 5 meaningful patterns.',
      insights: [
        'Most changes occur during business hours',
        'Currency deltas show consistent patterns',
        'Source reliability varies by adapter type',
      ],
      recommendations: [
        'Focus monitoring during peak hours',
        'Implement adaptive thresholds based on patterns',
        'Review source adapter configurations',
      ],
      confidence: 0.78,
    },
    anomaly: {
      summary: 'Anomaly detection found 2 unusual patterns requiring investigation.',
      insights: [
        'Unusual spike in reconciliation deltas',
        'Pattern deviation from historical norms',
        'Potential data quality issue detected',
      ],
      recommendations: [
        'Investigate source data quality',
        'Review recent system changes',
        'Consider increasing monitoring frequency',
      ],
      confidence: 0.72,
    },
    prediction: {
      summary: 'Predictive analysis forecasts potential issues in next 30 days.',
      insights: [
        'Trend suggests increasing reconciliation complexity',
        'Risk scores likely to increase',
        'Token usage may exceed current limits',
      ],
      recommendations: [
        'Consider upgrading plan for more tokens',
        'Implement proactive monitoring',
        'Review and optimize reconciliation rules',
      ],
      confidence: 0.68,
    },
  };
  
  const result = mockResults[type] || mockResults.reconciliation;
  
  return {
    id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    input: input || 'Default analysis input',
    result,
    tokensUsed: 10, // Base token cost per analysis
    createdAt: new Date(),
  };
}

async function listAnalyses(tenantId: string) {
  // Mock - replace with actual database query
  return [];
}
