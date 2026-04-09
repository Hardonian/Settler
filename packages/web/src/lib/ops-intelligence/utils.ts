/**
 * Ops Intelligence Utilities
 *
 * Helper functions for the Ops Intelligence system
 */

import {
  INSIGHT_TYPES,
  INSIGHT_SEVERITIES,
  INSIGHT_STATUSES,
  RISK_LEVELS,
  ACTION_TYPES,
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
} from "./constants";

/**
 * Validate insight type
 */
export function isValidInsightType(type: string): type is (typeof INSIGHT_TYPES)[number] {
  return INSIGHT_TYPES.includes(type as any);
}

/**
 * Validate insight severity
 */
export function isValidSeverity(severity: string): severity is (typeof INSIGHT_SEVERITIES)[number] {
  return INSIGHT_SEVERITIES.includes(severity as any);
}

/**
 * Validate insight status
 */
export function isValidStatus(status: string): status is (typeof INSIGHT_STATUSES)[number] {
  return INSIGHT_STATUSES.includes(status as any);
}

/**
 * Validate risk level
 */
export function isValidRiskLevel(riskLevel: string): riskLevel is (typeof RISK_LEVELS)[number] {
  return RISK_LEVELS.includes(riskLevel as any);
}

/**
 * Validate action type
 */
export function isValidActionType(actionType: string): actionType is (typeof ACTION_TYPES)[number] {
  return ACTION_TYPES.includes(actionType as any);
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .trim()
    .slice(0, 1000); // Limit length
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page: number, limit: number): { page: number; limit: number } {
  const validPage = Math.max(1, Math.floor(page) || 1);
  const validLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(limit) || DEFAULT_PAGE_SIZE));
  return { page: validPage, limit: validLimit };
}

/**
 * Format confidence as percentage
 */
export function formatConfidence(confidence: number): string {
  const clamped = Math.max(0, Math.min(1, confidence));
  return `${(clamped * 100).toFixed(0)}%`;
}

/**
 * Get severity color class
 */
export function getSeverityColorClass(severity: string): string {
  switch (severity) {
    case "critical":
      return "text-red-500";
    case "warn":
      return "text-yellow-500";
    case "info":
      return "text-blue-500";
    default:
      return "text-gray-500";
  }
}

/**
 * Get risk level color class
 */
export function getRiskLevelColorClass(riskLevel: string): string {
  switch (riskLevel) {
    case "high":
      return "bg-red-100 text-red-700";
    case "med":
      return "bg-yellow-100 text-yellow-700";
    case "low":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        const backoffDelay = delay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }
  throw lastError || new Error("Retry failed");
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Format date range for display
 */
export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
}
