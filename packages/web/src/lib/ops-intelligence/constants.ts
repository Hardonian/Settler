/**
 * Ops Intelligence Constants
 *
 * Centralized constants for the Ops Intelligence system
 */

export const INSIGHT_TYPES = ["cost", "support", "usage", "stability"] as const;
export const INSIGHT_SEVERITIES = ["info", "warn", "critical"] as const;
export const INSIGHT_STATUSES = ["active", "resolved", "expired", "dismissed"] as const;
export const RISK_LEVELS = ["low", "med", "high"] as const;
export const ACTION_TYPES = [
  "investigate",
  "upgrade",
  "throttle",
  "outreach",
  "document",
  "fix",
  "monitor",
  "verify",
  "retry",
] as const;

export const RECOMMENDATION_STATUSES = [
  "suggested",
  "accepted",
  "rejected",
  "executed",
  "cancelled",
] as const;

export const VERIFICATION_STATUSES = ["pending", "verified", "failed", "partial"] as const;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 50;
export const DEFAULT_BRIEFING_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Cache TTLs (in milliseconds)
export const CACHE_TTL_INSIGHTS = 5 * 60 * 1000; // 5 minutes
export const CACHE_TTL_BRIEFINGS = 15 * 60 * 1000; // 15 minutes

// API timeouts (in milliseconds)
export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000; // 1 second

// Debounce delays (in milliseconds)
export const DEBOUNCE_DELAY_FILTERS = 300;
export const DEBOUNCE_DELAY_SEARCH = 500;

// Confidence thresholds
export const CONFIDENCE_THRESHOLD_HIGH = 0.8;
export const CONFIDENCE_THRESHOLD_MEDIUM = 0.5;
export const CONFIDENCE_THRESHOLD_LOW = 0.3;

// Cost thresholds
export const COST_SPIKE_THRESHOLD_PERCENT = 20;
export const COST_CRITICAL_THRESHOLD_PERCENT = 50;
export const HIGH_COST_ORG_THRESHOLD = 100; // $100/month

// Support thresholds
export const TICKET_SPIKE_THRESHOLD_PERCENT = 50;
export const TICKET_SPIKE_MIN_COUNT = 5;
export const REPEATED_TICKET_MIN_COUNT = 3;

// Stability thresholds
export const ERROR_RATE_SPIKE_THRESHOLD_PERCENT = 50;
export const WEBHOOK_FAILURE_THRESHOLD_PERCENT = 10;
export const JOB_BACKLOG_WARNING = 50;
export const JOB_BACKLOG_CRITICAL = 100;

// Usage thresholds
export const FEATURE_ADOPTION_CHANGE_THRESHOLD_PERCENT = 30;
export const INACTIVE_ORG_DAYS = 14;
export const CHURN_RISK_DAYS = 30;
