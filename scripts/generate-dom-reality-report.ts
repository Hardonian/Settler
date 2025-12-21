#!/usr/bin/env tsx
/**
 * Generate Comprehensive DOM Reality Report
 * 
 * Runs DOM reality enforcement tests and generates a comprehensive report
 * with all findings, fixes, and recommendations.
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface DOMRealityReport {
  route: string;
  timestamp: string;
  issues: Array<{
    type: string;
    severity: string;
    element: string;
    description: string;
    rootCause?: string;
  }>;
  metrics: {
    ssrNodeCount: number;
    hydratedNodeCount: number;
    finalNodeCount: number;
    visibleNodeCount: number;
    invisibleNodeCount: number;
    hydrationMismatches: number;
    layoutShifts: number;
    accessibilityViolations: number;
    cumulativeLayoutShift?: number;
  };
}

interface ComprehensiveReport {
  generatedAt: string;
  summary: {
    totalRoutes: number;
    routesWithIssues: number;
    totalIssues: number;
    criticalIssues: number;
    warnings: number;
  };
  routes: Array<{
    route: string;
    status: 'pass' | 'fail' | 'warning';
    issues: number;
    criticalIssues: number;
    metrics: DOMRealityReport['metrics'];
  }>;
  issuesByType: Record<string, number>;
  recommendations: string[];
  fixes: Array<{
    route: string;
    issue: string;
    fix: string;
    status: 'pending' | 'fixed';
  }>;
}

function loadReports(): DOMRealityReport[] {
  const reportsDir = join(process.cwd(), 'test-results', 'dom-reality-reports');
  
  if (!existsSync(reportsDir)) {
    console.log('No reports found. Running tests first...');
    return [];
  }

  const reportFiles = readdirSync(reportsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(reportsDir, f));

  const reports: DOMRealityReport[] = [];
  for (const file of reportFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const report = JSON.parse(content) as DOMRealityReport;
      reports.push(report);
    } catch (error) {
      console.warn(`Failed to parse report ${file}:`, error);
    }
  }

  return reports;
}

function generateComprehensiveReport(reports: DOMRealityReport[]): ComprehensiveReport {
  const issuesByType: Record<string, number> = {};
  const fixes: Array<{ route: string; issue: string; fix: string; status: 'pending' | 'fixed' }> = [];
  let totalIssues = 0;
  let criticalIssues = 0;
  let warnings = 0;
  let routesWithIssues = 0;

  const routeSummaries = reports.map((report) => {
    const routeIssues = report.issues || [];
    const routeCriticalIssues = routeIssues.filter((i) => i.severity === 'critical').length;
    const routeWarnings = routeIssues.filter((i) => i.severity === 'warning').length;

    totalIssues += routeIssues.length;
    criticalIssues += routeCriticalIssues;
    warnings += routeWarnings;

    if (routeIssues.length > 0) {
      routesWithIssues++;
    }

    // Count issues by type
    routeIssues.forEach((issue) => {
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
    });

    // Generate fixes
    routeIssues.forEach((issue) => {
      if (issue.rootCause) {
        fixes.push({
          route: report.route,
          issue: issue.description,
          fix: generateFix(issue),
          status: 'pending',
        });
      }
    });

    const status: 'pass' | 'fail' | 'warning' =
      routeCriticalIssues > 0
        ? 'fail'
        : routeWarnings > 0
        ? 'warning'
        : 'pass';
    
    return {
      route: report.route,
      status,
      issues: routeIssues.length,
      criticalIssues: routeCriticalIssues,
      metrics: report.metrics,
    };
  });

  const recommendations = generateRecommendations(reports, issuesByType);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalRoutes: reports.length,
      routesWithIssues,
      totalIssues,
      criticalIssues,
      warnings,
    },
    routes: routeSummaries,
    issuesByType,
    recommendations,
    fixes,
  };
}

function generateFix(issue: {
  type: string;
  description: string;
  rootCause?: string;
  element?: string;
}): string {
  if (issue.type === 'invisible' && issue.rootCause) {
    if (issue.rootCause.includes('display: none')) {
      return `Remove 'display: none' or conditionally render element. Check if element should be visible.`;
    }
    if (issue.rootCause.includes('opacity: 0')) {
      return `Remove 'opacity: 0' or use conditional rendering. Check if element should be visible.`;
    }
    if (issue.rootCause.includes('zero width') || issue.rootCause.includes('zero height')) {
      return `Fix flex/grid layout causing collapse. Check parent container styles and ensure proper flex/grid configuration.`;
    }
  }

  if (issue.type === 'hydration_mismatch') {
    return `Ensure server and client render same content. Check for conditional rendering based on window/document, use useEffect for client-only content.`;
  }

  if (issue.type === 'layout_shift') {
    return `Add explicit dimensions to images/media, reserve space for dynamic content, avoid inserting content above existing content.`;
  }

  if (issue.type === 'accessibility') {
    if (issue.description.includes('duplicate ID')) {
      return `Remove duplicate IDs. Ensure each ID is unique across the page.`;
    }
    if (issue.description.includes('missing label')) {
      return `Add aria-label, aria-labelledby, or wrap in <label> element.`;
    }
  }

  return `Review element and fix root cause: ${issue.rootCause || issue.description}`;
}

function generateRecommendations(
  reports: DOMRealityReport[],
  issuesByType: Record<string, number>
): string[] {
  const recommendations: string[] = [];

  if (issuesByType['hydration_mismatch'] > 0) {
    recommendations.push(
      `Fix ${issuesByType['hydration_mismatch']} hydration mismatch(es). Ensure SSR and client render identical content.`
    );
  }

  if (issuesByType['invisible'] > 0) {
    recommendations.push(
      `Review ${issuesByType['invisible']} invisible element(s). Ensure all intended content is visible.`
    );
  }

  if (issuesByType['layout_shift'] > 0) {
    recommendations.push(
      `Address ${issuesByType['layout_shift']} layout shift(s). Add explicit dimensions and reserve space for dynamic content.`
    );
  }

  if (issuesByType['accessibility'] > 0) {
    recommendations.push(
      `Fix ${issuesByType['accessibility']} accessibility violation(s). Ensure all interactive elements are properly labeled.`
    );
  }

  // Check for high CLS scores
  const highCLSRoutes = reports.filter(
    (r) => r.metrics.cumulativeLayoutShift && r.metrics.cumulativeLayoutShift > 0.25
  );
  if (highCLSRoutes.length > 0) {
    recommendations.push(
      `${highCLSRoutes.length} route(s) have high Cumulative Layout Shift (>0.25). Optimize for better user experience.`
    );
  }

  // Check for excessive invisible nodes
  const routesWithManyInvisible = reports.filter(
    (r) => r.metrics.invisibleNodeCount > r.metrics.visibleNodeCount * 0.5
  );
  if (routesWithManyInvisible.length > 0) {
    recommendations.push(
      `${routesWithManyInvisible.length} route(s) have excessive invisible nodes (>50% of total). Review and remove unused elements.`
    );
  }

  return recommendations;
}

function generateMarkdownReport(report: ComprehensiveReport): string {
  let md = `# DOM Reality Enforcement Report\n\n`;
  md += `**Generated:** ${new Date(report.generatedAt).toLocaleString()}\n\n`;

  // Summary
  md += `## Summary\n\n`;
  md += `- **Total Routes Tested:** ${report.summary.totalRoutes}\n`;
  md += `- **Routes with Issues:** ${report.summary.routesWithIssues}\n`;
  md += `- **Total Issues:** ${report.summary.totalIssues}\n`;
  md += `- **Critical Issues:** ${report.summary.criticalIssues}\n`;
  md += `- **Warnings:** ${report.summary.warnings}\n\n`;

  // Issues by Type
  md += `## Issues by Type\n\n`;
  const sortedTypes = Object.entries(report.issuesByType).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sortedTypes) {
    md += `- **${type}:** ${count}\n`;
  }
  md += `\n`;

  // Route Status
  md += `## Route Status\n\n`;
  md += `| Route | Status | Issues | Critical | Visible Nodes | Invisible Nodes | CLS |\n`;
  md += `|-------|--------|--------|----------|---------------|-----------------|-----|\n`;
  for (const route of report.routes) {
    const statusEmoji = route.status === 'pass' ? '✅' : route.status === 'fail' ? '❌' : '⚠️';
    md += `| ${route.route} | ${statusEmoji} ${route.status} | ${route.issues} | ${route.criticalIssues} | ${route.metrics.visibleNodeCount} | ${route.metrics.invisibleNodeCount} | ${route.metrics.cumulativeLayoutShift?.toFixed(3) || 'N/A'} |\n`;
  }
  md += `\n`;

  // Recommendations
  md += `## Recommendations\n\n`;
  if (report.recommendations.length === 0) {
    md += `✅ No issues found. All routes render correctly!\n\n`;
  } else {
    for (const rec of report.recommendations) {
      md += `- ${rec}\n`;
    }
    md += `\n`;
  }

  // Fixes
  if (report.fixes.length > 0) {
    md += `## Suggested Fixes\n\n`;
    for (const fix of report.fixes.slice(0, 20)) {
      md += `### ${fix.route}\n\n`;
      md += `**Issue:** ${fix.issue}\n\n`;
      md += `**Fix:** ${fix.fix}\n\n`;
      md += `---\n\n`;
    }
    if (report.fixes.length > 20) {
      md += `*... and ${report.fixes.length - 20} more fixes*\n\n`;
    }
  }

  return md;
}

async function main() {
  console.log('🔍 Generating DOM Reality Report...\n');

  // Run tests if reports don't exist
  const reportsDir = join(process.cwd(), 'test-results', 'dom-reality-reports');
  if (!existsSync(reportsDir) || readdirSync(reportsDir).length === 0) {
    console.log('Running DOM reality tests...');
    try {
      execSync('npx playwright test tests/e2e/dom-reality-enforcement.spec.ts', {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    } catch (error) {
      console.warn('Tests failed, but continuing with available reports...');
    }
  }

  // Load reports
  const reports = loadReports();
  if (reports.length === 0) {
    console.error('No reports found. Please run tests first.');
    process.exit(1);
  }

  console.log(`Loaded ${reports.length} report(s)\n`);

  // Generate comprehensive report
  const comprehensiveReport = generateComprehensiveReport(reports);

  // Save JSON report
  const outputDir = join(process.cwd(), 'test-results');
  mkdirSync(outputDir, { recursive: true });
  const jsonPath = join(outputDir, 'dom-reality-report.json');
  writeFileSync(jsonPath, JSON.stringify(comprehensiveReport, null, 2));
  console.log(`✅ JSON report saved to: ${jsonPath}`);

  // Generate and save Markdown report
  const mdReport = generateMarkdownReport(comprehensiveReport);
  const mdPath = join(outputDir, 'dom-reality-report.md');
  writeFileSync(mdPath, mdReport);
  console.log(`✅ Markdown report saved to: ${mdPath}`);

  // Print summary
  console.log('\n📊 Summary:');
  console.log(`  Routes tested: ${comprehensiveReport.summary.totalRoutes}`);
  console.log(`  Routes with issues: ${comprehensiveReport.summary.routesWithIssues}`);
  console.log(`  Critical issues: ${comprehensiveReport.summary.criticalIssues}`);
  console.log(`  Warnings: ${comprehensiveReport.summary.warnings}`);

  if (comprehensiveReport.summary.criticalIssues > 0) {
    console.log('\n❌ Critical issues found. Review the report for details.');
    process.exit(1);
  } else {
    console.log('\n✅ No critical issues found!');
  }
}

main().catch((error) => {
  console.error('Error generating report:', error);
  process.exit(1);
});
