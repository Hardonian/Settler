/**
 * Usage Insights Feedback Loop
 * 
 * Analyzes usage patterns and automatically surfaces insights to improve:
 * - Messaging (highlight popular features)
 * - UI (emphasize frequently used actions)
 * - Docs (prioritize commonly accessed content)
 * 
 * This runs automatically without manual intervention.
 */

import { prisma } from '@/shared/db/prismaClient';

export interface UsageInsight {
  type: 'feature_popularity' | 'common_error' | 'dropoff_point' | 'success_pattern';
  insight: string;
  recommendation: string;
  confidence: number;
  lastUpdated: Date;
}

/**
 * Analyze usage patterns and generate insights
 * This runs periodically (e.g., daily) to update messaging/UI
 */
export async function generateUsageInsights(): Promise<UsageInsight[]> {
  const insights: UsageInsight[] = [];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    // Analyze API usage by service
    const serviceUsage = await prisma.$queryRaw<Array<{
      service: string;
      count: bigint;
    }>>`
      SELECT 
        service,
        COUNT(*) as count
      FROM usage_events
      WHERE created_at >= ${sevenDaysAgo}
      GROUP BY service
      ORDER BY count DESC
      LIMIT 10
    `;

    // Find most popular service
    if (serviceUsage.length > 0) {
      const topService = serviceUsage[0];
      insights.push({
        type: 'feature_popularity',
        insight: `${topService.service} is the most used service (${Number(topService.count)} calls in last 7 days)`,
        recommendation: `Highlight ${topService.service} in homepage messaging and quick-start guides`,
        confidence: 0.9,
        lastUpdated: new Date(),
      });
    }

    // Analyze error patterns
    const errorPatterns = await prisma.$queryRaw<Array<{
      error_type: string;
      count: bigint;
      path: string;
    }>>`
      SELECT 
        error_type,
        COUNT(*) as count,
        path
      FROM error_logs
      WHERE created_at >= ${sevenDaysAgo}
      GROUP BY error_type, path
      ORDER BY count DESC
      LIMIT 5
    `;

    // Surface common errors
    errorPatterns.forEach((pattern) => {
      if (Number(pattern.count) > 10) {
        insights.push({
          type: 'common_error',
          insight: `Error "${pattern.error_type}" occurs frequently on ${pattern.path} (${Number(pattern.count)} times)`,
          recommendation: `Add troubleshooting guidance for ${pattern.error_type} in docs and improve error messaging on ${pattern.path}`,
          confidence: 0.85,
          lastUpdated: new Date(),
        });
      }
    });

    // Analyze conversion funnel dropoffs
    const conversionEvents = await prisma.$queryRaw<Array<{
      event: string;
      count: bigint;
    }>>`
      SELECT 
        action as event,
        COUNT(*) as count
      FROM activity_log
      WHERE resource_type = 'conversion'
        AND created_at >= ${sevenDaysAgo}
      GROUP BY action
      ORDER BY 
        CASE action
          WHEN 'page_view' THEN 1
          WHEN 'playground_visit' THEN 2
          WHEN 'signup_start' THEN 3
          WHEN 'signup_complete' THEN 4
          WHEN 'api_key_created' THEN 5
          WHEN 'first_api_call' THEN 6
          ELSE 99
        END
    `;

    // Find dropoff points
    const eventCounts = new Map(conversionEvents.map(e => [e.event, Number(e.count)]));
    const pageViews = eventCounts.get('page_view') || 0;
    const playgroundVisits = eventCounts.get('playground_visit') || 0;
    const signups = eventCounts.get('signup_complete') || 0;
    const apiKeys = eventCounts.get('api_key_created') || 0;

    if (pageViews > 0 && playgroundVisits / pageViews < 0.1) {
      insights.push({
        type: 'dropoff_point',
        insight: `Low playground visit rate (${((playgroundVisits / pageViews) * 100).toFixed(1)}% of page views)`,
        recommendation: 'Make playground CTA more prominent on homepage and improve playground onboarding',
        confidence: 0.8,
        lastUpdated: new Date(),
      });
    }

    if (signups > 0 && apiKeys / signups < 0.3) {
      insights.push({
        type: 'dropoff_point',
        insight: `Low API key creation rate after signup (${((apiKeys / signups) * 100).toFixed(1)}% of signups)`,
        recommendation: 'Improve post-signup onboarding to guide users to create their first API key',
        confidence: 0.85,
        lastUpdated: new Date(),
      });
    }

    // Store insights for later retrieval
    await storeInsights(insights);

    return insights;
  } catch (error) {
    console.error('[Usage Insights] Error generating insights:', error);
    return [];
  }
}

/**
 * Store insights in database for retrieval by UI
 */
async function storeInsights(insights: UsageInsight[]): Promise<void> {
  try {
    // Store in a dedicated table or activity_log
    // For now, we'll log them - in production, store in insights table
    for (const insight of insights) {
      await prisma.$executeRaw`
        INSERT INTO activity_log (
          user_id,
          action,
          resource_type,
          metadata,
          created_at
        ) VALUES (
          NULL,
          'usage_insight_generated',
          'insight',
          ${JSON.stringify(insight)}::jsonb,
          ${new Date()}
        )
      `;
    }
  } catch (error) {
    console.error('[Usage Insights] Error storing insights:', error);
  }
}

/**
 * Get latest insights for display in UI
 */
export async function getLatestInsights(limit: number = 5): Promise<UsageInsight[]> {
  try {
    const results = await prisma.$queryRaw<Array<{
      metadata: unknown;
      created_at: Date;
    }>>`
      SELECT 
        metadata,
        created_at
      FROM activity_log
      WHERE action = 'usage_insight_generated'
        AND resource_type = 'insight'
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return results
      .map(r => {
        try {
          const insight = r.metadata as UsageInsight;
          // Ensure all required fields are present
          if (insight && typeof insight === 'object' && 'type' in insight && 'insight' in insight && 'recommendation' in insight && 'confidence' in insight) {
            return insight;
          }
          return null;
        } catch {
          return null;
        }
      })
      .filter((insight): insight is UsageInsight => insight !== null);
  } catch (error) {
    console.error('[Usage Insights] Error fetching insights:', error);
    return [];
  }
}
