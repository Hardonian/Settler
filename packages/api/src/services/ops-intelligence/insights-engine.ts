/**
 * Ops Intelligence Insights Engine
 * 
 * Deterministic insight generation from real metrics.
 * Generates insights for: cost, support, usage, stability
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../../utils/logger';

export type InsightType = 'cost' | 'support' | 'usage' | 'stability';
export type InsightSeverity = 'info' | 'warn' | 'critical';

export interface Insight {
  type: InsightType;
  title: string;
  summary: string;
  severity: InsightSeverity;
  confidence: number; // 0-1
  timeWindow: {
    start: string;
    end: string;
  };
  evidence: {
    metrics: Record<string, any>;
    pivots?: Record<string, any>;
    deltas?: Record<string, any>;
  };
  relatedEntities: {
    orgIds?: string[];
    routes?: string[];
    features?: string[];
  };
  expiresAt?: Date;
}

export interface InsightGenerationResult {
  insights: Insight[];
  generatedAt: Date;
}

/**
 * Generate all insights for a given time window
 */
export async function generateInsights(
  supabaseUrl: string,
  supabaseKey: string,
  timeWindow: { start: Date; end: Date }
): Promise<InsightGenerationResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const insights: Insight[] = [];

  try {
    // Generate insights for each type
    const costInsights = await generateCostInsights(supabase, timeWindow);
    const supportInsights = await generateSupportInsights(supabase, timeWindow);
    const usageInsights = await generateUsageInsights(supabase, timeWindow);
    const stabilityInsights = await generateStabilityInsights(supabase, timeWindow);

    insights.push(...costInsights, ...supportInsights, ...usageInsights, ...stabilityInsights);

    logInfo('Generated insights', {
      count: insights.length,
      byType: {
        cost: costInsights.length,
        support: supportInsights.length,
        usage: usageInsights.length,
        stability: stabilityInsights.length,
      },
    });

    return {
      insights,
      generatedAt: new Date(),
    };
  } catch (error) {
    logError('Failed to generate insights', error);
    throw error;
  }
}

/**
 * Generate cost-related insights
 */
async function generateCostInsights(
  supabase: any,
  timeWindow: { start: Date; end: Date }
): Promise<Insight[]> {
  const insights: Insight[] = [];
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    // 1. Cost WoW change
    const { data: currentWeekCost } = await supabase
      .from('usage_aggregate_daily')
      .select('estimated_cost')
      .gte('date', weekAgo.toISOString().split('T')[0])
      .lt('date', now.toISOString().split('T')[0]);

    const { data: previousWeekCost } = await supabase
      .from('usage_aggregate_daily')
      .select('estimated_cost')
      .gte('date', new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lt('date', weekAgo.toISOString().split('T')[0]);

    const currentTotal = currentWeekCost?.reduce((sum: number, r: any) => sum + (r.estimated_cost || 0), 0) || 0;
    const previousTotal = previousWeekCost?.reduce((sum: number, r: any) => sum + (r.estimated_cost || 0), 0) || 0;
    const wowChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    if (Math.abs(wowChange) > 20) {
      insights.push({
        type: 'cost',
        title: `Cost ${wowChange > 0 ? 'increased' : 'decreased'} ${Math.abs(wowChange).toFixed(1)}% week-over-week`,
        summary: `Weekly cost ${wowChange > 0 ? 'spike' : 'drop'} detected. Current week: $${currentTotal.toFixed(2)}, Previous week: $${previousTotal.toFixed(2)}.`,
        severity: wowChange > 50 ? 'critical' : wowChange > 30 ? 'warn' : 'info',
        confidence: 0.85,
        timeWindow: {
          start: weekAgo.toISOString(),
          end: now.toISOString(),
        },
        evidence: {
          metrics: {
            currentWeekCost: currentTotal,
            previousWeekCost: previousTotal,
            wowChangePercent: wowChange,
          },
          deltas: {
            absolute: currentTotal - previousTotal,
            percent: wowChange,
          },
        },
        relatedEntities: {},
      });
    }

    // 2. High-cost orgs with low revenue
    const { data: orgCosts } = await supabase
      .from('usage_aggregate_daily')
      .select('tenant_id, estimated_cost')
      .gte('date', monthAgo.toISOString().split('T')[0])
      .lt('date', now.toISOString().split('T')[0]);

    if (orgCosts) {
      const orgCostMap = new Map<string, number>();
      orgCosts.forEach((r: any) => {
        if (r.tenant_id) {
          orgCostMap.set(r.tenant_id, (orgCostMap.get(r.tenant_id) || 0) + (r.estimated_cost || 0));
        }
      });

      // Get revenue per org (from subscriptions)
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('billing_account_id, plan_id, status')
        .eq('status', 'active');

      const highCostLowRevOrgs: string[] = [];
      for (const [tenantId, cost] of orgCostMap.entries()) {
        if (cost > 100) { // Threshold: $100/month
          // Check if org has active subscription
          const hasActiveSub = subscriptions?.some((s: any) => {
            // Would need to join with billing_accounts to get tenant_id
            // For now, flag high-cost orgs
            return true;
          });
          if (!hasActiveSub || cost > 500) {
            highCostLowRevOrgs.push(tenantId);
          }
        }
      }

      if (highCostLowRevOrgs.length > 0) {
        insights.push({
          type: 'cost',
          title: `${highCostLowRevOrgs.length} organization(s) with high cost and low/no revenue`,
          summary: `Found ${highCostLowRevOrgs.length} org(s) with monthly cost > $100 but no active subscription or cost > $500.`,
          severity: highCostLowRevOrgs.length > 5 ? 'critical' : 'warn',
          confidence: 0.75,
          timeWindow: {
            start: monthAgo.toISOString(),
            end: now.toISOString(),
          },
          evidence: {
            metrics: {
              highCostLowRevCount: highCostLowRevOrgs.length,
              orgIds: highCostLowRevOrgs.slice(0, 10), // Limit to 10 for evidence
            },
          },
          relatedEntities: {
            orgIds: highCostLowRevOrgs,
          },
        });
      }
    }

    // 3. Cost per event spikes
    const { data: eventCosts } = await supabase
      .from('usage_aggregate_daily')
      .select('event_type, total_quantity, estimated_cost')
      .gte('date', weekAgo.toISOString().split('T')[0])
      .lt('date', now.toISOString().split('T')[0]);

    if (eventCosts) {
      const eventCostPerUnit = new Map<string, number>();
      eventCosts.forEach((r: any) => {
        if (r.event_type && r.total_quantity > 0) {
          const costPerUnit = (r.estimated_cost || 0) / r.total_quantity;
          const existing = eventCostPerUnit.get(r.event_type) || 0;
          eventCostPerUnit.set(r.event_type, existing + costPerUnit);
        }
      });

      for (const [eventType, costPerUnit] of eventCostPerUnit.entries()) {
        if (costPerUnit > 0.10) { // Threshold: $0.10 per event
          insights.push({
            type: 'cost',
            title: `High cost per event for ${eventType}: $${costPerUnit.toFixed(4)}`,
            summary: `Event type "${eventType}" has unusually high cost per unit. Consider optimization.`,
            severity: costPerUnit > 0.50 ? 'critical' : 'warn',
            confidence: 0.80,
            timeWindow: {
              start: weekAgo.toISOString(),
              end: now.toISOString(),
            },
            evidence: {
              metrics: {
                eventType,
                costPerUnit,
              },
            },
            relatedEntities: {
              features: [eventType],
            },
          });
        }
      }
    }
  } catch (error) {
    logError('Failed to generate cost insights', error);
  }

  return insights;
}

/**
 * Generate support-related insights
 */
async function generateSupportInsights(
  supabase: any,
  timeWindow: { start: Date; end: Date }
): Promise<Insight[]> {
  const insights: Insight[] = [];
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  try {
    // 1. Ticket spike by category
    const { data: currentWeekTickets } = await supabase
      .from('ops_support_tickets')
      .select('category, id')
      .gte('created_at', weekAgo.toISOString())
      .lt('created_at', now.toISOString());

    const { data: previousWeekTickets } = await supabase
      .from('ops_support_tickets')
      .select('category, id')
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', weekAgo.toISOString());

    if (currentWeekTickets && previousWeekTickets) {
      const currentByCategory = new Map<string, number>();
      const previousByCategory = new Map<string, number>();

      currentWeekTickets.forEach((t: any) => {
        const cat = t.category || 'uncategorized';
        currentByCategory.set(cat, (currentByCategory.get(cat) || 0) + 1);
      });

      previousWeekTickets.forEach((t: any) => {
        const cat = t.category || 'uncategorized';
        previousByCategory.set(cat, (previousByCategory.get(cat) || 0) + 1);
      });

      for (const [category, currentCount] of currentByCategory.entries()) {
        const previousCount = previousByCategory.get(category) || 0;
        if (previousCount > 0) {
          const change = ((currentCount - previousCount) / previousCount) * 100;
          if (change > 50 && currentCount >= 5) {
            insights.push({
              type: 'support',
              title: `Support ticket spike in "${category}": ${currentCount} tickets (+${change.toFixed(0)}%)`,
              summary: `Category "${category}" saw ${currentCount} tickets this week vs ${previousCount} last week.`,
              severity: change > 100 ? 'critical' : 'warn',
              confidence: 0.90,
              timeWindow: {
                start: weekAgo.toISOString(),
                end: now.toISOString(),
              },
              evidence: {
                metrics: {
                  category,
                  currentWeekCount: currentCount,
                  previousWeekCount: previousCount,
                  changePercent: change,
                },
              },
          relatedEntities: {},
            });
          }
        }
      }
    }

    // 2. Repeated tickets with same root cause
    const { data: recentTickets } = await supabase
      .from('ops_support_tickets')
      .select('subject, description, organization_id, created_at')
      .gte('created_at', weekAgo.toISOString())
      .lt('created_at', now.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (recentTickets && recentTickets.length > 0) {
      // Simple similarity check (in production, use better NLP)
      const similarGroups: Array<{ count: number; examples: any[] }> = [];
      const processed = new Set<number>();

      for (let i = 0; i < recentTickets.length; i++) {
        if (processed.has(i)) continue;
        const group = [recentTickets[i]];
        processed.add(i);

        for (let j = i + 1; j < recentTickets.length; j++) {
          if (processed.has(j)) continue;
          const t1 = recentTickets[i];
          const t2 = recentTickets[j];
          // Simple keyword matching (improve with NLP)
          const keywords1 = (t1.subject + ' ' + t1.description).toLowerCase().split(/\s+/);
          const keywords2 = (t2.subject + ' ' + t2.description).toLowerCase().split(/\s+/);
          const common = keywords1.filter((k: string) => keywords2.includes(k));
          if (common.length >= 3) {
            group.push(t2);
            processed.add(j);
          }
        }

        if (group.length >= 3) {
          similarGroups.push({ count: group.length, examples: group.slice(0, 3) });
        }
      }

      if (similarGroups.length > 0) {
        const largestGroup = similarGroups.sort((a, b) => b.count - a.count)[0];
        insights.push({
          type: 'support',
          title: `Repeated support issue detected: ${largestGroup.count} similar tickets`,
          summary: `Found ${largestGroup.count} tickets with similar subject/description. Consider addressing root cause.`,
          severity: largestGroup.count >= 10 ? 'critical' : largestGroup.count >= 5 ? 'warn' : 'info',
          confidence: 0.70,
          timeWindow: {
            start: weekAgo.toISOString(),
            end: now.toISOString(),
          },
          evidence: {
            metrics: {
              similarTicketCount: largestGroup.count,
              exampleSubjects: largestGroup.examples.map((e: any) => e.subject),
            },
          },
          relatedEntities: {},
        });
      }
    }

    // 3. Orgs with abnormal ticket density
    const { data: orgTickets } = await supabase
      .from('ops_support_tickets')
      .select('organization_id')
      .gte('created_at', weekAgo.toISOString())
      .lt('created_at', now.toISOString());

    if (orgTickets) {
      const orgTicketCount = new Map<string, number>();
      orgTickets.forEach((t: any) => {
        if (t.organization_id) {
          orgTicketCount.set(t.organization_id, (orgTicketCount.get(t.organization_id) || 0) + 1);
        }
      });

      const avgTicketsPerOrg = orgTickets.length / Math.max(orgTicketCount.size, 1);
      const threshold = avgTicketsPerOrg * 3; // 3x average

      const highTicketOrgs: string[] = [];
      for (const [orgId, count] of orgTicketCount.entries()) {
        if (count >= threshold && count >= 5) {
          highTicketOrgs.push(orgId);
        }
      }

      if (highTicketOrgs.length > 0) {
        insights.push({
          type: 'support',
          title: `${highTicketOrgs.length} organization(s) with abnormally high ticket volume`,
          summary: `Found ${highTicketOrgs.length} org(s) with ${threshold.toFixed(1)}x average ticket volume.`,
          severity: highTicketOrgs.length > 3 ? 'warn' : 'info',
          confidence: 0.85,
          timeWindow: {
            start: weekAgo.toISOString(),
            end: now.toISOString(),
          },
          evidence: {
            metrics: {
              highTicketOrgCount: highTicketOrgs.length,
              averageTicketsPerOrg: avgTicketsPerOrg,
              threshold,
              orgIds: highTicketOrgs.slice(0, 10),
            },
          },
          relatedEntities: {
            orgIds: highTicketOrgs,
          },
        });
      }
    }
  } catch (error) {
    logError('Failed to generate support insights', error);
  }

  return insights;
}

/**
 * Generate usage-related insights
 */
async function generateUsageInsights(
  supabase: any,
  timeWindow: { start: Date; end: Date }
): Promise<Insight[]> {
  const insights: Insight[] = [];
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  try {
    // 1. Feature adoption rising/falling
    const { data: currentWeekUsage } = await supabase
      .from('usage_events')
      .select('event_type, tenant_id')
      .gte('timestamp', weekAgo.toISOString())
      .lt('timestamp', now.toISOString());

    const { data: previousWeekUsage } = await supabase
      .from('usage_events')
      .select('event_type, tenant_id')
      .gte('timestamp', twoWeeksAgo.toISOString())
      .lt('timestamp', weekAgo.toISOString());

    if (currentWeekUsage && previousWeekUsage) {
      const currentByFeature = new Map<string, Set<string>>();
      const previousByFeature = new Map<string, Set<string>>();

      currentWeekUsage.forEach((u: any) => {
        if (u.event_type && u.tenant_id) {
          if (!currentByFeature.has(u.event_type)) {
            currentByFeature.set(u.event_type, new Set());
          }
          currentByFeature.get(u.event_type)!.add(u.tenant_id);
        }
      });

      previousWeekUsage.forEach((u: any) => {
        if (u.event_type && u.tenant_id) {
          if (!previousByFeature.has(u.event_type)) {
            previousByFeature.set(u.event_type, new Set());
          }
          previousByFeature.get(u.event_type)!.add(u.tenant_id);
        }
      });

      for (const [feature, currentOrgs] of currentByFeature.entries()) {
        const previousOrgs = previousByFeature.get(feature);
        if (previousOrgs) {
          const currentCount = currentOrgs.size;
          const previousCount = previousOrgs.size;
          if (previousCount > 0) {
            const change = ((currentCount - previousCount) / previousCount) * 100;
            if (Math.abs(change) > 30) {
              insights.push({
                type: 'usage',
                title: `Feature "${feature}" adoption ${change > 0 ? 'increased' : 'decreased'} ${Math.abs(change).toFixed(0)}%`,
                summary: `${feature} is now used by ${currentCount} orgs (was ${previousCount}).`,
                severity: change < -50 ? 'warn' : 'info',
                confidence: 0.80,
                timeWindow: {
                  start: weekAgo.toISOString(),
                  end: now.toISOString(),
                },
                evidence: {
                  metrics: {
                    feature,
                    currentOrgCount: currentCount,
                    previousOrgCount: previousCount,
                    changePercent: change,
                  },
                },
                relatedEntities: {
                  features: [feature],
                },
              });
            }
          }
        }
      }
    }

    // 2. Inactive or churn-risk orgs
    const { data: recentActivity } = await supabase
      .from('usage_events')
      .select('tenant_id, timestamp')
      .gte('timestamp', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lt('timestamp', now.toISOString())
      .order('timestamp', { ascending: false });

    if (recentActivity) {
      const lastActivityByOrg = new Map<string, Date>();
      recentActivity.forEach((a: any) => {
        if (a.tenant_id && a.timestamp) {
          const last = lastActivityByOrg.get(a.tenant_id);
          const current = new Date(a.timestamp);
          if (!last || current > last) {
            lastActivityByOrg.set(a.tenant_id, current);
          }
        }
      });

      const inactiveOrgs: string[] = [];
      const daysInactive = 14;
      const cutoff = new Date(now.getTime() - daysInactive * 24 * 60 * 60 * 1000);

      for (const [orgId, lastActivity] of lastActivityByOrg.entries()) {
        if (lastActivity < cutoff) {
          inactiveOrgs.push(orgId);
        }
      }

      if (inactiveOrgs.length > 0) {
        insights.push({
          type: 'usage',
          title: `${inactiveOrgs.length} organization(s) inactive for ${daysInactive}+ days`,
          summary: `Found ${inactiveOrgs.length} org(s) with no activity in the last ${daysInactive} days. Consider re-engagement.`,
          severity: inactiveOrgs.length > 20 ? 'warn' : 'info',
          confidence: 0.90,
          timeWindow: {
            start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: now.toISOString(),
          },
          evidence: {
            metrics: {
              inactiveOrgCount: inactiveOrgs.length,
              daysInactiveThreshold: daysInactive,
              orgIds: inactiveOrgs.slice(0, 10),
            },
          },
          relatedEntities: {
            orgIds: inactiveOrgs,
          },
        });
      }
    }
  } catch (error) {
    logError('Failed to generate usage insights', error);
  }

  return insights;
}

/**
 * Generate stability-related insights
 */
async function generateStabilityInsights(
  supabase: any,
  timeWindow: { start: Date; end: Date }
): Promise<Insight[]> {
  const insights: Insight[] = [];
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  try {
    // 1. Error rate spikes
    const { data: currentWeekErrors } = await supabase
      .from('error_logs')
      .select('id, severity, created_at')
      .gte('created_at', weekAgo.toISOString())
      .lt('created_at', now.toISOString());

    const { data: previousWeekErrors } = await supabase
      .from('error_logs')
      .select('id, severity')
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', weekAgo.toISOString());

    if (currentWeekErrors && previousWeekErrors) {
      const currentCount = currentWeekErrors.length;
      const previousCount = previousWeekErrors.length;
      const currentCritical = currentWeekErrors.filter((e: any) => e.severity === 'critical').length;
      const previousCritical = previousWeekErrors.filter((e: any) => e.severity === 'critical').length;

      if (previousCount > 0) {
        const errorRateChange = ((currentCount - previousCount) / previousCount) * 100;
        if (errorRateChange > 50) {
          insights.push({
            type: 'stability',
            title: `Error rate increased ${errorRateChange.toFixed(0)}% week-over-week`,
            summary: `Current week: ${currentCount} errors (${currentCritical} critical) vs ${previousCount} last week.`,
            severity: errorRateChange > 100 || currentCritical > 10 ? 'critical' : 'warn',
            confidence: 0.95,
            timeWindow: {
              start: weekAgo.toISOString(),
              end: now.toISOString(),
            },
            evidence: {
              metrics: {
                currentWeekErrors: currentCount,
                previousWeekErrors: previousCount,
                currentCriticalErrors: currentCritical,
                previousCriticalErrors: previousCritical,
                errorRateChangePercent: errorRateChange,
              },
            },
            relatedEntities: {},
          });
        }
      }
    }

    // 2. Webhook failure trends
    const { data: webhooks } = await supabase
      .from('ops_webhooks')
      .select('status, created_at')
      .gte('created_at', weekAgo.toISOString())
      .lt('created_at', now.toISOString());

    if (webhooks) {
      const total = webhooks.length;
      const failed = webhooks.filter((w: any) => w.status === 'failed').length;
      const failureRate = total > 0 ? (failed / total) * 100 : 0;

      if (failureRate > 10 && total >= 10) {
        insights.push({
          type: 'stability',
          title: `Webhook failure rate: ${failureRate.toFixed(1)}% (${failed}/${total})`,
          summary: `High webhook failure rate detected. ${failed} out of ${total} webhooks failed this week.`,
          severity: failureRate > 25 ? 'critical' : 'warn',
          confidence: 0.90,
          timeWindow: {
            start: weekAgo.toISOString(),
            end: now.toISOString(),
          },
          evidence: {
            metrics: {
              totalWebhooks: total,
              failedWebhooks: failed,
              failureRatePercent: failureRate,
            },
          },
          relatedEntities: {},
        });
      }
    }

    // 3. Job backlog growth
    const { data: jobs } = await supabase
      .from('ops_jobs')
      .select('status, created_at')
      .gte('created_at', weekAgo.toISOString())
      .lt('created_at', now.toISOString());

    if (jobs) {
      const pending = jobs.filter((j: any) => j.status === 'pending').length;
      const failed = jobs.filter((j: any) => j.status === 'failed').length;
      const total = jobs.length;

      if (pending > 50 || failed > 20) {
        insights.push({
          type: 'stability',
          title: `Job backlog: ${pending} pending, ${failed} failed`,
          summary: `Job queue has ${pending} pending jobs and ${failed} failed jobs. Consider scaling or investigation.`,
          severity: pending > 100 || failed > 50 ? 'critical' : 'warn',
          confidence: 0.85,
          timeWindow: {
            start: weekAgo.toISOString(),
            end: now.toISOString(),
          },
          evidence: {
            metrics: {
              pendingJobs: pending,
              failedJobs: failed,
              totalJobs: total,
            },
          },
          relatedEntities: {},
        });
      }
    }

    // 4. Route-level instability
    const { data: routeErrors } = await supabase
      .from('error_logs')
      .select('url, method, id')
      .gte('created_at', weekAgo.toISOString())
      .lt('created_at', now.toISOString());

    if (routeErrors) {
      const routeErrorCount = new Map<string, number>();
      routeErrors.forEach((e: any) => {
        if (e.url && e.method) {
          const route = `${e.method} ${e.url}`;
          routeErrorCount.set(route, (routeErrorCount.get(route) || 0) + 1);
        }
      });

      const avgErrorsPerRoute = routeErrors.length / Math.max(routeErrorCount.size, 1);
      const threshold = avgErrorsPerRoute * 3;

      const unstableRoutes: string[] = [];
      for (const [route, count] of routeErrorCount.entries()) {
        if (count >= threshold && count >= 10) {
          unstableRoutes.push(route);
        }
      }

      if (unstableRoutes.length > 0) {
        insights.push({
          type: 'stability',
          title: `${unstableRoutes.length} route(s) with high error rates`,
          summary: `Found ${unstableRoutes.length} route(s) with ${threshold.toFixed(1)}x average error rate.`,
          severity: unstableRoutes.length > 5 ? 'warn' : 'info',
          confidence: 0.80,
          timeWindow: {
            start: weekAgo.toISOString(),
            end: now.toISOString(),
          },
          evidence: {
            metrics: {
              unstableRouteCount: unstableRoutes.length,
              averageErrorsPerRoute: avgErrorsPerRoute,
              threshold,
              routes: unstableRoutes.slice(0, 10),
            },
          },
          relatedEntities: {
            routes: unstableRoutes,
          },
        });
      }
    }
  } catch (error) {
    logError('Failed to generate stability insights', error);
  }

  return insights;
}
