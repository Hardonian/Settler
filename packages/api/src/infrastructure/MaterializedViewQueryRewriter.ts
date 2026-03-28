/**
 * Materialized View Query Rewriter
 *
 * Automatically rewrites analytical queries to use materialized views
 * when available and appropriate for the tenant.
 */

import { logInfo } from "../utils/logger";
import {
  COMMON_VIEW_TEMPLATES,
  MaterializedViewDefinition,
} from "./MaterializedViewConfig";
import { getTenantConfig, getMaterializedViewName, getViewStatus } from "./MaterializedViewManager";

interface QueryAnalysis {
  /** Original query */
  originalQuery: string;
  /** Detected source tables */
  sourceTables: string[];
  /** Detected aggregation types */
  aggregations: string[];
  /** Detected time range/granularity */
  timeGranularity?: string;
  /** Matched view templates */
  matchingViews: MaterializedViewDefinition[];
  /** Whether the query can be rewritten */
  canRewrite: boolean;
  /** Reason if cannot rewrite */
  reason?: string;
}

interface RewriteResult {
  /** Whether rewrite was applied */
  rewritten: boolean;
  /** The rewritten query */
  query: string;
  /** The materialized view used */
  viewName?: string;
  /** Estimated performance improvement */
  estimatedSpeedup?: number;
  /** Notes about the rewrite */
  notes: string[];
}

const AGGREGATION_PATTERNS = [
  /COUNT\s*\(/gi,
  /SUM\s*\(/gi,
  /AVG\s*\(/gi,
  /MIN\s*\(/gi,
  /MAX\s*\(/gi,
  /GROUP\s+BY/gi,
];
const TIME_PATTERNS = [
  /DATE_TRUNC\s*\(\s*'hour'/gi,
  /DATE_TRUNC\s*\(\s*'day'/gi,
  /DATE_TRUNC\s*\(\s*'week'/gi,
  /DATE_TRUNC\s*\(\s*'month'/gi,
  /INTERVAL\s+['"]?\d+\s+hour/gi,
  /INTERVAL\s+['"]?\d+\s+day/gi,
  /\>\s*NOW\s*\(\s*\)\s*-\s*INTERVAL/gi,
];

/**
 * Analyze a query to determine if it can be rewritten to use a materialized view
 */
export function analyzeQuery(query: string): QueryAnalysis {
  const normalizedQuery = query.replace(/\s+/g, " ").trim();

  // Detect source tables
  const sourceTables: string[] = [];
  let match;
  const tableRegex = /FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
  while ((match = tableRegex.exec(normalizedQuery)) !== null) {
    sourceTables.push(match[1]!.toLowerCase());
  }

  // Detect aggregations
  const aggregations: string[] = [];
  for (const pattern of AGGREGATION_PATTERNS) {
    const aggMatches = normalizedQuery.match(pattern);
    if (aggMatches) {
      aggregations.push(...aggMatches.map((m) => m.split("(")[0]!.trim().toLowerCase()));
    }
  }

  // Detect time granularity
  let timeGranularity: string | undefined;
  for (const pattern of TIME_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      if (pattern.toString().includes("hour")) timeGranularity = "hour";
      else if (pattern.toString().includes("day")) timeGranularity = "day";
      else if (pattern.toString().includes("week")) timeGranularity = "week";
      else if (pattern.toString().includes("month")) timeGranularity = "month";
      break;
    }
  }

  // Find matching view templates
  const matchingViews: MaterializedViewDefinition[] = [];

  for (const viewTemplate of COMMON_VIEW_TEMPLATES) {
    // Check if query sources from view's source tables
    const sourceMatch = viewTemplate.sourceTables.some((t) =>
      sourceTables.includes(t.toLowerCase())
    );

    if (!sourceMatch) continue;

    // Check if query uses similar aggregations
    const hasAggregation = viewTemplate.columns.some((c) => c.aggregation);
    if (hasAggregation && aggregations.length === 0) continue;

    // Check if time granularity matches
    if (viewTemplate.timeBucket && timeGranularity) {
      // Allow matching if view's bucket is >= query's bucket
      const bucketOrder = ["minute", "hour", "day", "week", "month", "quarter", "year"];
      const viewBucketIdx = bucketOrder.indexOf(viewTemplate.timeBucket.bucket);
      const queryBucketIdx = bucketOrder.indexOf(timeGranularity);

      // View bucket should be coarser (larger) than or equal to query bucket
      if (viewBucketIdx < queryBucketIdx && viewBucketIdx !== -1) {
        continue; // View is too granular
      }
    }

    matchingViews.push(viewTemplate);
  }

  const canRewrite =
    matchingViews.length > 0 &&
    matchingViews.some((v) => v.sourceTables.every((t) => sourceTables.includes(t.toLowerCase())));

  return {
    originalQuery: query,
    sourceTables,
    aggregations,
    timeGranularity,
    matchingViews,
    canRewrite,
    reason: canRewrite ? undefined : "No matching materialized view found",
  };
}

/**
 * Rewrite a query to use a materialized view
 */
export async function rewriteQuery(
  tenantId: string,
  query: string,
  options: {
    allowStale?: boolean;
    forceRefresh?: boolean;
  } = {}
): Promise<RewriteResult> {
  const { allowStale = false, forceRefresh: _forceRefresh = false } = options;
  void _forceRefresh;

  // Get tenant configuration
  const tenantConfig = getTenantConfig(tenantId);
  if (!tenantConfig || !tenantConfig.enabled) {
    return {
      rewritten: false,
      query,
      notes: ["Materialized views not enabled for tenant"],
    };
  }

  if (!tenantConfig.settings.enableQueryRewriting) {
    return {
      rewritten: false,
      query,
      notes: ["Query rewriting disabled in tenant settings"],
    };
  }

  // Analyze the query
  const analysis = analyzeQuery(query);

  if (!analysis.canRewrite) {
    return {
      rewritten: false,
      query,
      notes: [analysis.reason || "Query cannot be rewritten"],
    };
  }

  // Find the best matching view that's configured for this tenant
  const tenantViewIds = tenantConfig.views.filter((v) => v.active).map((v) => v.viewId);

  const bestView = analysis.matchingViews.find((v) => tenantViewIds.includes(v.id));

  if (!bestView) {
    return {
      rewritten: false,
      query,
      notes: ["No matching materialized view configured for tenant"],
    };
  }

  // Check view freshness
  const viewStatus = await getViewStatus(tenantId, bestView.id);

  if (!viewStatus.exists) {
    return {
      rewritten: false,
      query,
      notes: ["Materialized view does not exist"],
    };
  }

  // Check staleness
  if (viewStatus.staleness === "stale" && !allowStale) {
    if (!tenantConfig.settings.allowStaleData) {
      return {
        rewritten: false,
        query,
        notes: ["Materialized view is stale and staleness not allowed"],
      };
    }

    // Check if staleness is within acceptable threshold
    if (viewStatus.lastRefreshedAt) {
      const stalenessMinutes = (Date.now() - viewStatus.lastRefreshedAt.getTime()) / 60000;
      if (stalenessMinutes > tenantConfig.settings.maxAcceptableStalenessMinutes) {
        return {
          rewritten: false,
          query,
          notes: [
            `Staleness (${Math.round(stalenessMinutes)}min) exceeds maximum (${tenantConfig.settings.maxAcceptableStalenessMinutes}min)`,
          ],
        };
      }
    }
  }

  // Generate the rewritten query
  const viewName = getMaterializedViewName(tenantId, bestView.id);
  const rewrittenQuery = generateRewrittenQuery(query, bestView, viewName, analysis);

  // Estimate speedup (conservative estimate)
  const estimatedSpeedup = estimateSpeedup(analysis, viewStatus);

  logInfo("Query rewritten to use materialized view", {
    tenantId,
    originalQuery: query.substring(0, 100),
    viewName,
    estimatedSpeedup,
  });

  return {
    rewritten: true,
    query: rewrittenQuery,
    viewName,
    estimatedSpeedup,
    notes: [
      `Using materialized view: ${viewName}`,
      `Estimated speedup: ${estimatedSpeedup}x`,
      `View status: ${viewStatus.staleness}`,
    ],
  };
}

/**
 * Generate the rewritten query using the materialized view
 */
function generateRewrittenQuery(
  originalQuery: string,
  viewDef: MaterializedViewDefinition,
  viewName: string,
  _analysis: QueryAnalysis
): string {
  const normalized = originalQuery.replace(/\s+/g, " ").trim();

  // Extract time filter if present
  const timeFilterMatch = normalized.match(/WHERE\s+(.*?)(?:\s+GROUP|\s+ORDER|\s+LIMIT|$)/i);
  const timeFilter = timeFilterMatch ? timeFilterMatch[1] : "";

  // Build the rewritten query
  let rewritten = `SELECT * FROM ${viewName}`;

  // Apply time filter if present and view has time column
  if (timeFilter && viewDef.timeBucket) {
    rewritten += ` WHERE ${timeFilter}`;
  }

  // Add GROUP BY if present in original
  const groupByMatch = normalized.match(/GROUP\s+BY\s+(.*?)(?:\s+ORDER|\s+LIMIT|$)/i);
  if (groupByMatch) {
    rewritten += ` GROUP BY ${groupByMatch[1]}`;
  }

  // Add ORDER BY if present
  const orderByMatch = normalized.match(/ORDER\s+BY\s+(.*?)(?:\s+LIMIT|$)/i);
  if (orderByMatch) {
    rewritten += ` ORDER BY ${orderByMatch[1]}`;
  }

  // Add LIMIT if present
  const limitMatch = normalized.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) {
    rewritten += ` LIMIT ${limitMatch[1]}`;
  }

  return rewritten;
}

/**
 * Estimate the speedup from using a materialized view
 */
function estimateSpeedup(analysis: QueryAnalysis, viewStatus: { rowCount: number }): number {
  // Base speedup for avoiding full table scans
  let speedup = 5;

  // Increase for aggregations
  if (analysis.aggregations.length > 0) {
    speedup *= 2;
  }

  // Increase for time range queries
  if (analysis.timeGranularity) {
    speedup *= 1.5;
  }

  // Adjust based on view size (larger source tables = more benefit)
  if (viewStatus.rowCount > 100000) {
    speedup *= 2;
  }

  return Math.round(speedup * 10) / 10;
}

/**
 * Batch rewrite multiple queries
 */
export async function rewriteQueries(
  tenantId: string,
  queries: string[],
  options?: { allowStale?: boolean }
): Promise<RewriteResult[]> {
  return Promise.all(queries.map((query) => rewriteQuery(tenantId, query, options)));
}

/**
 * Check if a query pattern matches any of the tenant's materialized views
 */
export function queryMatchesView(
  tenantId: string,
  query: string
): { matches: boolean; viewIds: string[] } {
  const tenantConfig = getTenantConfig(tenantId);
  if (!tenantConfig || !tenantConfig.enabled) {
    return { matches: false, viewIds: [] };
  }

  const analysis = analyzeQuery(query);
  const activeViewIds = tenantConfig.views.filter((v) => v.active).map((v) => v.viewId);

  const matchingIds = analysis.matchingViews
    .filter((v) => activeViewIds.includes(v.id))
    .map((v) => v.id);

  return {
    matches: matchingIds.length > 0,
    viewIds: matchingIds,
  };
}

/**
 * Get the optimal materialized view for a query
 */
export function getOptimalViewForQuery(
  tenantId: string,
  query: string
): MaterializedViewDefinition | null {
  const tenantConfig = getTenantConfig(tenantId);
  if (!tenantConfig || !tenantConfig.enabled) {
    return null;
  }

  const analysis = analyzeQuery(query);
  const activeViewIds = tenantConfig.views.filter((v) => v.active).map((v) => v.viewId);

  return analysis.matchingViews.find((v) => activeViewIds.includes(v.id)) ?? null;
}

/**
 * Explain why a query cannot be rewritten (for debugging)
 */
export function explainRewriteFailure(
  tenantId: string,
  query: string
): { reason: string; suggestions: string[] } {
  const tenantConfig = getTenantConfig(tenantId);

  if (!tenantConfig) {
    return {
      reason: "Tenant not found",
      suggestions: ["Initialize tenant materialized view configuration"],
    };
  }

  if (!tenantConfig.enabled) {
    return {
      reason: "Materialized views not enabled for tenant",
      suggestions: ["Enable materialized views for this tenant"],
    };
  }

  if (!tenantConfig.settings.enableQueryRewriting) {
    return {
      reason: "Query rewriting disabled in tenant settings",
      suggestions: ["Enable query rewriting in tenant settings"],
    };
  }

  const analysis = analyzeQuery(query);

  if (!analysis.canRewrite) {
    return {
      reason: analysis.reason || "No matching view",
      suggestions: [
        "Consider creating a materialized view for this query pattern",
        "Use time bucketing (hour, day, week) for time-series queries",
        "Add aggregations (COUNT, SUM, AVG) to enable view matching",
      ],
    };
  }

  const activeViewIds = tenantConfig.views.filter((v) => v.active).map((v) => v.viewId);
  const matchingActive = analysis.matchingViews.filter((v) => activeViewIds.includes(v.id));

  if (matchingActive.length === 0) {
    return {
      reason: "No matching active materialized view configured",
      suggestions: analysis.matchingViews.map((v) => `Configure materialized view: ${v.id}`),
    };
  }

  return {
    reason: "Unknown",
    suggestions: ["Check view freshness and staleness settings"],
  };
}
