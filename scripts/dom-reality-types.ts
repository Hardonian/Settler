/**
 * TypeScript Types for DOM Reality System
 *
 * Shared types used across DOM reality inspection, testing, and reporting.
 */

export interface DOMRealityReport {
  route: string;
  timestamp: string;
  viewport: { width: number; height: number };
  theme?: string;
  ssrHtml: string;
  postHydrationDOM: string;
  finalDOM: string;
  issues: DOMIssue[];
  metrics: DOMMetrics;
  screenshots?: {
    ssr?: string;
    hydrated?: string;
    final?: string;
  };
}

export interface DOMIssue {
  type:
    | "invisible"
    | "hydration_mismatch"
    | "layout_shift"
    | "accessibility"
    | "css_root_cause"
    | "missing_content";
  severity: "critical" | "warning" | "info";
  element: string;
  selector?: string;
  description: string;
  rootCause?: string;
  fix?: string;
  cssSource?: string;
  computedStyles?: Record<string, string>;
}

export interface DOMMetrics {
  ssrNodeCount: number;
  hydratedNodeCount: number;
  finalNodeCount: number;
  visibleNodeCount: number;
  invisibleNodeCount: number;
  hydrationMismatches: number;
  layoutShifts: number;
  accessibilityViolations: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  timeToInteractive?: number;
}

export interface InspectionConfig {
  routes: string[];
  viewports: Array<{ name: string; width: number; height: number }>;
  themes?: string[];
  baseURL: string;
  outputDir: string;
  captureScreenshots?: boolean;
}

export interface ReportSummary {
  timestamp: string;
  totalRoutes: number;
  totalReports: number;
  criticalIssues: number;
  warnings: number;
  routes: Array<{
    route: string;
    criticalIssues: number;
    warnings: number;
    metrics: DOMMetrics;
  }>;
}

export interface ElementAnalysis {
  selector: string;
  tagName: string;
  isVisible: boolean;
  computedStyles: Record<string, string>;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  rootCause?: string;
  cssSource?: string;
}

// Re-export for convenience
export type { DOMRealityReport, DOMIssue, DOMMetrics, InspectionConfig, ReportSummary };
