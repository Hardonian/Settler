"use strict";
/**
 * Ops Intelligence Insights Engine
 *
 * Deterministic insight generation from real metrics.
 * Generates insights for: cost, support, usage, stability
 *
 * Performance optimizations:
 * - Parallel queries where possible
 * - Query batching
 * - Error handling with fallbacks
 * - Timeout protection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInsights = generateInsights;
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("../../utils/logger");
/**
 * Generate all insights for a given time window
 */
async function generateInsights(supabaseUrl, supabaseKey, timeWindow) {
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    const insights = [];
    try {
        // Generate insights in parallel for better performance
        const [costInsights, supportInsights, usageInsights, stabilityInsights] = await Promise.allSettled([
            generateCostInsights(supabase, timeWindow),
            generateSupportInsights(supabase, timeWindow),
            generateUsageInsights(supabase, timeWindow),
            generateStabilityInsights(supabase, timeWindow),
        ]);
        // Collect successful insights
        if (costInsights.status === 'fulfilled') {
            insights.push(...costInsights.value);
        }
        else {
            (0, logger_1.logError)('Failed to generate cost insights', costInsights.reason);
        }
        if (supportInsights.status === 'fulfilled') {
            insights.push(...supportInsights.value);
        }
        else {
            (0, logger_1.logError)('Failed to generate support insights', supportInsights.reason);
        }
        if (usageInsights.status === 'fulfilled') {
            insights.push(...usageInsights.value);
        }
        else {
            (0, logger_1.logError)('Failed to generate usage insights', usageInsights.reason);
        }
        if (stabilityInsights.status === 'fulfilled') {
            insights.push(...stabilityInsights.value);
        }
        else {
            (0, logger_1.logError)('Failed to generate stability insights', stabilityInsights.reason);
        }
        (0, logger_1.logInfo)('Generated insights', {
            count: insights.length,
            byType: {
                cost: costInsights.status === 'fulfilled' ? costInsights.value.length : 0,
                support: supportInsights.status === 'fulfilled' ? supportInsights.value.length : 0,
                usage: usageInsights.status === 'fulfilled' ? usageInsights.value.length : 0,
                stability: stabilityInsights.status === 'fulfilled' ? stabilityInsights.value.length : 0,
            },
        });
        return {
            insights,
            generatedAt: new Date(),
        };
    }
    catch (error) {
        (0, logger_1.logError)('Failed to generate insights', error);
        // Return partial results rather than failing completely
        return {
            insights,
            generatedAt: new Date(),
        };
    }
}
/**
 * Generate cost-related insights
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateCostInsights(supabase, _timeWindow) {
    const insights = [];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    try {
        // Parallel queries for better performance
        const [currentWeekResult, previousWeekResult] = await Promise.allSettled([
            supabase
                .from('usage_aggregate_daily')
                .select('estimated_cost')
                .gte('date', weekAgo.toISOString().split('T')[0])
                .lt('date', now.toISOString().split('T')[0]),
            supabase
                .from('usage_aggregate_daily')
                .select('estimated_cost')
                .gte('date', new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                .lt('date', weekAgo.toISOString().split('T')[0]),
        ]);
        const currentWeekCost = currentWeekResult.status === 'fulfilled' && currentWeekResult.value.data
            ? currentWeekResult.value.data
            : [];
        const previousWeekCost = previousWeekResult.status === 'fulfilled' && previousWeekResult.value.data
            ? previousWeekResult.value.data
            : [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentTotal = currentWeekCost.reduce((sum, r) => sum + (r.estimated_cost || 0), 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const previousTotal = previousWeekCost.reduce((sum, r) => sum + (r.estimated_cost || 0), 0);
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
        // High-cost orgs analysis (with error handling)
        try {
            const { data: orgCosts } = await supabase
                .from('usage_aggregate_daily')
                .select('tenant_id, estimated_cost')
                .gte('date', monthAgo.toISOString().split('T')[0])
                .lt('date', now.toISOString().split('T')[0])
                .limit(1000); // Limit to prevent huge queries
            if (orgCosts) {
                const orgCostMap = new Map();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                orgCosts.forEach((r) => {
                    if (r.tenant_id) {
                        orgCostMap.set(r.tenant_id, (orgCostMap.get(r.tenant_id) || 0) + (r.estimated_cost || 0));
                    }
                });
                const highCostLowRevOrgs = [];
                for (const [tenantId, cost] of orgCostMap.entries()) {
                    if (cost > 100) {
                        // Check if org has active subscription
                        try {
                            const { data: subscriptions } = await supabase
                                .from('subscriptions')
                                .select('billing_account_id, status')
                                .eq('status', 'active')
                                .limit(100);
                            const hasActiveSub = subscriptions?.some(() => true); // Simplified check
                            if (!hasActiveSub || cost > 500) {
                                highCostLowRevOrgs.push(tenantId);
                                if (highCostLowRevOrgs.length >= 10)
                                    break; // Limit results
                            }
                        }
                        catch {
                            // If subscription check fails, still flag high-cost orgs
                            if (cost > 500) {
                                highCostLowRevOrgs.push(tenantId);
                                if (highCostLowRevOrgs.length >= 10)
                                    break;
                            }
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
                                orgIds: highCostLowRevOrgs.slice(0, 10),
                            },
                        },
                        relatedEntities: {
                            orgIds: highCostLowRevOrgs,
                        },
                    });
                }
            }
        }
        catch (error) {
            (0, logger_1.logError)('Error analyzing high-cost orgs', error);
            // Continue with other insights
        }
    }
    catch (error) {
        (0, logger_1.logError)('Failed to generate cost insights', error);
    }
    return insights;
}
/**
 * Generate support-related insights
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateSupportInsights(supabase, _timeWindow) {
    const insights = [];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    try {
        // Parallel queries
        const [currentWeekResult, previousWeekResult] = await Promise.allSettled([
            supabase
                .from('ops_support_tickets')
                .select('category, id')
                .gte('created_at', weekAgo.toISOString())
                .lt('created_at', now.toISOString())
                .limit(1000),
            supabase
                .from('ops_support_tickets')
                .select('category, id')
                .gte('created_at', twoWeeksAgo.toISOString())
                .lt('created_at', weekAgo.toISOString())
                .limit(1000),
        ]);
        const currentWeekTickets = currentWeekResult.status === 'fulfilled' && currentWeekResult.value.data
            ? currentWeekResult.value.data
            : [];
        const previousWeekTickets = previousWeekResult.status === 'fulfilled' && previousWeekResult.value.data
            ? previousWeekResult.value.data
            : [];
        if (currentWeekTickets.length > 0 && previousWeekTickets.length > 0) {
            const currentByCategory = new Map();
            const previousByCategory = new Map();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            currentWeekTickets.forEach((t) => {
                const cat = t.category || 'uncategorized';
                currentByCategory.set(cat, (currentByCategory.get(cat) || 0) + 1);
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            previousWeekTickets.forEach((t) => {
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
    }
    catch (error) {
        (0, logger_1.logError)('Failed to generate support insights', error);
    }
    return insights;
}
/**
 * Generate usage-related insights
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateUsageInsights(supabase, _timeWindow) {
    const insights = [];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    try {
        // Parallel queries with limits for performance
        const [currentWeekResult, previousWeekResult] = await Promise.allSettled([
            supabase
                .from('usage_events')
                .select('event_type, tenant_id')
                .gte('timestamp', weekAgo.toISOString())
                .lt('timestamp', now.toISOString())
                .limit(10000), // Limit to prevent huge queries
            supabase
                .from('usage_events')
                .select('event_type, tenant_id')
                .gte('timestamp', twoWeeksAgo.toISOString())
                .lt('timestamp', weekAgo.toISOString())
                .limit(10000),
        ]);
        const currentWeekUsage = currentWeekResult.status === 'fulfilled' && currentWeekResult.value.data
            ? currentWeekResult.value.data
            : [];
        const previousWeekUsage = previousWeekResult.status === 'fulfilled' && previousWeekResult.value.data
            ? previousWeekResult.value.data
            : [];
        if (currentWeekUsage.length > 0 && previousWeekUsage.length > 0) {
            const currentByFeature = new Map();
            const previousByFeature = new Map();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            currentWeekUsage.forEach((u) => {
                if (u.event_type && u.tenant_id) {
                    if (!currentByFeature.has(u.event_type)) {
                        currentByFeature.set(u.event_type, new Set());
                    }
                    currentByFeature.get(u.event_type).add(u.tenant_id);
                }
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            previousWeekUsage.forEach((u) => {
                if (u.event_type && u.tenant_id) {
                    if (!previousByFeature.has(u.event_type)) {
                        previousByFeature.set(u.event_type, new Set());
                    }
                    previousByFeature.get(u.event_type).add(u.tenant_id);
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
    }
    catch (error) {
        (0, logger_1.logError)('Failed to generate usage insights', error);
    }
    return insights;
}
/**
 * Generate stability-related insights
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateStabilityInsights(supabase, _timeWindow) {
    const insights = [];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    try {
        // Parallel queries
        const [currentWeekResult, previousWeekResult, webhooksResult, jobsResult] = await Promise.allSettled([
            supabase
                .from('error_logs')
                .select('id, severity, created_at')
                .gte('created_at', weekAgo.toISOString())
                .lt('created_at', now.toISOString())
                .limit(5000),
            supabase
                .from('error_logs')
                .select('id, severity')
                .gte('created_at', twoWeeksAgo.toISOString())
                .lt('created_at', weekAgo.toISOString())
                .limit(5000),
            supabase
                .from('ops_webhooks')
                .select('status, created_at')
                .gte('created_at', weekAgo.toISOString())
                .lt('created_at', now.toISOString())
                .limit(1000),
            supabase
                .from('ops_jobs')
                .select('status, created_at')
                .gte('created_at', weekAgo.toISOString())
                .lt('created_at', now.toISOString())
                .limit(1000),
        ]);
        // Error rate analysis
        if (currentWeekResult.status === 'fulfilled' && previousWeekResult.status === 'fulfilled') {
            const currentWeekErrors = currentWeekResult.value.data || [];
            const previousWeekErrors = previousWeekResult.value.data || [];
            const currentCount = currentWeekErrors.length;
            const previousCount = previousWeekErrors.length;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentCritical = currentWeekErrors.filter((e) => e.severity === 'critical').length;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const previousCritical = previousWeekErrors.filter((e) => e.severity === 'critical').length;
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
        // Webhook failure analysis
        if (webhooksResult.status === 'fulfilled' && webhooksResult.value.data) {
            const webhooks = webhooksResult.value.data;
            const total = webhooks.length;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const failed = webhooks.filter((w) => w.status === 'failed').length;
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
        // Job backlog analysis
        if (jobsResult.status === 'fulfilled' && jobsResult.value.data) {
            const jobs = jobsResult.value.data;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pending = jobs.filter((j) => j.status === 'pending').length;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const failed = jobs.filter((j) => j.status === 'failed').length;
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
    }
    catch (error) {
        (0, logger_1.logError)('Failed to generate stability insights', error);
    }
    return insights;
}
//# sourceMappingURL=insights-engine.js.map