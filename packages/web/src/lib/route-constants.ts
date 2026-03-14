/**
 * Route Constants
 *
 * Centralized route definitions for consistency across the application.
 * This prevents route inconsistencies and makes refactoring easier.
 */

export const ROUTES = {
  // Marketing
  HOME: "/",
  PRICING: "/pricing",
  ENTERPRISE: "/enterprise",
  HOW_IT_WORKS: "/architecture",
  WHY_SETTLER: "/why",
  VISION: "/platform",
  SECURITY: "/security-and-audit",
  STATUS: "/status",
  COMMUNITY: "/community",
  SUPPORT: "/support",
  COOKBOOKS: "/cookbook",

  // Documentation
  DOCS: "/docs",
  DOCS_QUICKSTART: "/docs/quickstart",
  DOCS_SDK: "/docs/sdk",
  DOCS_API: "/docs/api",
  DOCS_CLI: "/docs/cli",
  DOCS_EXAMPLES: "/docs/examples",

  // Product Pages
  RECEIPTS: "/receipts",
  FEATURE_FLAGS: "/feature-flags",

  // Console & Playground
  CONSOLE: "/console",
  CONSOLE_PLAYGROUND: "/console/playground",
  CONSOLE_RECEIPTS: "/console/receipts",
  CONSOLE_USAGE: "/console/usage",
  CONSOLE_COSTS: "/console/costs",
  CONSOLE_API_KEYS: "/console/api-keys",
  CONSOLE_FEATURE_FLAGS: "/console/feature-flags",

  // Dashboard
  DASHBOARD: "/dashboard",
  DASHBOARD_BILLING: "/dashboard/billing",
  DASHBOARD_INTEGRATIONS: "/dashboard/integrations",

  // Legal
  LEGAL: "/legal",
  LEGAL_TERMS: "/legal/terms",
  LEGAL_PRIVACY: "/legal/privacy",
  LEGAL_DPA: "/legal/dpa",
  LEGAL_SUBPROCESSORS: "/legal/subprocessors",
  LEGAL_LICENSE: "/legal/license",

  // Auth
  SIGNUP: "/signup",

  // Legacy (deprecated - use CONSOLE_PLAYGROUND instead)
  /** @deprecated Use CONSOLE_PLAYGROUND */
  PLAYGROUND: "/playground",
} as const;

/**
 * Type-safe route helper
 */
export type Route = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * Check if a route exists in our route constants
 */
export function isValidRoute(route: string): route is Route {
  return Object.values(ROUTES).includes(route as Route);
}

/**
 * Get route with fallback
 */
export function getRoute(key: keyof typeof ROUTES, fallback: string = "/"): string {
  return ROUTES[key] || fallback;
}
