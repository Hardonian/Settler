/**
 * Route Validator (degraded helper)
 *
 * This module is intentionally limited to advisory messaging.
 * Canonical route truth is verified by integration checks/scripts,
 * not by runtime Express stack introspection in this helper.
 */

import { Express } from "express";
import { logInfo } from "./logger";

export interface RouteInfo {
  method: string;
  path: string;
  middleware: string[];
  handler: string;
}

export interface RouteValidationResult {
  route: RouteInfo;
  status: "ok" | "warning" | "error";
  message: string;
}

/**
 * Extract route information from Express app
 * Note: This is a simplified version. Full route introspection requires more complex logic.
 */
export function validateRoutes(_app: Express): RouteValidationResult[] {
  const results: RouteValidationResult[] = [];

  // This is a placeholder - full route introspection would require
  // parsing the Express router stack, which is complex.
  // In practice, this would be done via integration tests.

  logInfo(
    "Route validation helper is advisory only; use verify:routes and integration tests for canonical truth"
  );

  return results;
}

/**
 * Check for potentially dead routes (routes that are never called)
 * This is a static analysis helper - actual validation should be done via tests
 */
export function checkDeadRoutes(): {
  potentiallyDead: string[];
  recommendations: string[];
} {
  // This would require static analysis or test coverage analysis
  // For now, return empty results with recommendation to use test coverage
  return {
    potentiallyDead: [],
    recommendations: [
      "Use test coverage reports to identify unused routes",
      "Run integration tests to verify all routes are accessible",
      "Check API documentation to ensure all routes are documented",
    ],
  };
}
