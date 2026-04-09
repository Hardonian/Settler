/**
 * DOM Reality Report Generator
 *
 * Generates comprehensive HTML and markdown reports from DOM reality inspection results.
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";
import { config } from "dotenv";
import type { DOMRealityReport, DOMIssue, DOMMetrics } from "./dom-reality-types";

// Load environment variables from .env files
const envFiles = [
  resolve(__dirname, "..", ".env.local"),
  resolve(__dirname, "..", ".env.development"),
  resolve(__dirname, "..", ".env"),
  resolve(__dirname, "..", "packages/web/.env.local"),
  resolve(__dirname, "..", "packages/web/.env.development"),
  resolve(__dirname, "..", "packages/web/.env"),
];

envFiles.forEach((file) => {
  if (existsSync(file)) {
    config({ path: file, override: false });
  }
});

/**
 * Generate markdown report
 */
function generateMarkdownReport(reports: DOMRealityReport[]): string {
  const criticalIssues = reports.flatMap((r) => r.issues.filter((i) => i.severity === "critical"));
  const warnings = reports.flatMap((r) => r.issues.filter((i) => i.severity === "warning"));

  let markdown = `# DOM Reality Report\n\n`;
  markdown += `Generated: ${new Date().toISOString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total Routes Inspected**: ${reports.length}\n`;
  markdown += `- **Critical Issues**: ${criticalIssues.length}\n`;
  markdown += `- **Warnings**: ${warnings.length}\n`;
  markdown += `- **Routes with Issues**: ${new Set(reports.filter((r) => r.issues.length > 0).map((r) => r.route)).size}\n\n`;

  // Group issues by route
  const issuesByRoute = new Map<string, DOMIssue[]>();
  reports.forEach((report) => {
    if (!issuesByRoute.has(report.route)) {
      issuesByRoute.set(report.route, []);
    }
    issuesByRoute.get(report.route)!.push(...report.issues);
  });

  markdown += `## Issues by Route\n\n`;

  for (const [route, issues] of issuesByRoute.entries()) {
    if (issues.length === 0) continue;

    markdown += `### ${route}\n\n`;

    const critical = issues.filter((i) => i.severity === "critical");
    const warning = issues.filter((i) => i.severity === "warning");

    if (critical.length > 0) {
      markdown += `**Critical Issues (${critical.length}):**\n\n`;
      critical.forEach((issue) => {
        markdown += `- **${issue.type}**: ${issue.description}\n`;
        if (issue.selector) markdown += `  - Selector: \`${issue.selector}\`\n`;
        if (issue.rootCause) markdown += `  - Root Cause: ${issue.rootCause}\n`;
        if (issue.fix) markdown += `  - Fix: ${issue.fix}\n`;
        markdown += `\n`;
      });
    }

    if (warning.length > 0) {
      markdown += `**Warnings (${warning.length}):**\n\n`;
      warning.forEach((issue) => {
        markdown += `- **${issue.type}**: ${issue.description}\n`;
        if (issue.selector) markdown += `  - Selector: \`${issue.selector}\`\n`;
        markdown += `\n`;
      });
    }

    markdown += `\n`;
  }

  // Metrics summary
  markdown += `## Metrics Summary\n\n`;
  markdown += `| Route | SSR Nodes | Hydrated Nodes | Final Nodes | Visible | Invisible | CLS Score |\n`;
  markdown += `|-------|-----------|---------------|-------------|---------|-----------|-----------|\n`;

  reports.forEach((report) => {
    markdown += `| ${report.route} | ${report.metrics.ssrNodeCount} | ${report.metrics.hydratedNodeCount} | ${report.metrics.finalNodeCount} | ${report.metrics.visibleNodeCount} | ${report.metrics.invisibleNodeCount} | ${report.metrics.cumulativeLayoutShift?.toFixed(3) || "N/A"} |\n`;
  });

  return markdown;
}

/**
 * Generate HTML report
 */
function generateHTMLReport(reports: DOMRealityReport[]): string {
  const criticalIssues = reports.flatMap((r) => r.issues.filter((i) => i.severity === "critical"));
  const warnings = reports.flatMap((r) => r.issues.filter((i) => i.severity === "warning"));

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DOM Reality Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #333;
    }
    .summary-card.critical .value {
      color: #dc2626;
    }
    .summary-card.warning .value {
      color: #f59e0b;
    }
    .route-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .route-section h2 {
      margin-top: 0;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }
    .issue {
      padding: 15px;
      margin: 10px 0;
      border-radius: 6px;
      border-left: 4px solid #e5e7eb;
    }
    .issue.critical {
      background: #fee2e2;
      border-left-color: #dc2626;
    }
    .issue.warning {
      background: #fef3c7;
      border-left-color: #f59e0b;
    }
    .issue-type {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 12px;
      color: #666;
    }
    .issue-description {
      margin: 5px 0;
      color: #333;
    }
    .issue-details {
      margin-top: 10px;
      font-size: 14px;
      color: #666;
    }
    .issue-details code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Courier New', monospace;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    tr:hover {
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>DOM Reality Report</h1>
    <p>Generated: ${new Date().toISOString()}</p>
  </div>
  
  <div class="summary">
    <div class="summary-card">
      <h3>Routes Inspected</h3>
      <div class="value">${reports.length}</div>
    </div>
    <div class="summary-card critical">
      <h3>Critical Issues</h3>
      <div class="value">${criticalIssues.length}</div>
    </div>
    <div class="summary-card warning">
      <h3>Warnings</h3>
      <div class="value">${warnings.length}</div>
    </div>
    <div class="summary-card">
      <h3>Routes with Issues</h3>
      <div class="value">${new Set(reports.filter((r) => r.issues.length > 0).map((r) => r.route)).size}</div>
    </div>
  </div>`;

  // Group issues by route
  const issuesByRoute = new Map<string, DOMIssue[]>();
  reports.forEach((report) => {
    if (!issuesByRoute.has(report.route)) {
      issuesByRoute.set(report.route, []);
    }
    issuesByRoute.get(report.route)!.push(...report.issues);
  });

  for (const [route, issues] of issuesByRoute.entries()) {
    if (issues.length === 0) continue;

    html += `
  <div class="route-section">
    <h2>${route}</h2>`;

    const critical = issues.filter((i) => i.severity === "critical");
    const warning = issues.filter((i) => i.severity === "warning");

    if (critical.length > 0) {
      html += `
    <h3>Critical Issues (${critical.length})</h3>`;
      critical.forEach((issue) => {
        html += `
    <div class="issue critical">
      <div class="issue-type">${issue.type}</div>
      <div class="issue-description">${issue.description}</div>
      <div class="issue-details">
        ${issue.selector ? `<div>Selector: <code>${issue.selector}</code></div>` : ""}
        ${issue.rootCause ? `<div>Root Cause: ${issue.rootCause}</div>` : ""}
        ${issue.fix ? `<div><strong>Fix:</strong> ${issue.fix}</div>` : ""}
      </div>
    </div>`;
      });
    }

    if (warning.length > 0) {
      html += `
    <h3>Warnings (${warning.length})</h3>`;
      warning.forEach((issue) => {
        html += `
    <div class="issue warning">
      <div class="issue-type">${issue.type}</div>
      <div class="issue-description">${issue.description}</div>
      ${issue.selector ? `<div class="issue-details">Selector: <code>${issue.selector}</code></div>` : ""}
    </div>`;
      });
    }

    html += `
  </div>`;
  }

  // Metrics table
  html += `
  <div class="route-section">
    <h2>Metrics Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Route</th>
          <th>SSR Nodes</th>
          <th>Hydrated Nodes</th>
          <th>Final Nodes</th>
          <th>Visible</th>
          <th>Invisible</th>
          <th>CLS Score</th>
        </tr>
      </thead>
      <tbody>`;

  reports.forEach((report) => {
    html += `
        <tr>
          <td>${report.route}</td>
          <td>${report.metrics.ssrNodeCount}</td>
          <td>${report.metrics.hydratedNodeCount}</td>
          <td>${report.metrics.finalNodeCount}</td>
          <td>${report.metrics.visibleNodeCount}</td>
          <td>${report.metrics.invisibleNodeCount}</td>
          <td>${report.metrics.cumulativeLayoutShift?.toFixed(3) || "N/A"}</td>
        </tr>`;
  });

  html += `
      </tbody>
    </table>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Main function
 */
function generateReports(reportsDir: string, outputDir: string): void {
  mkdirSync(outputDir, { recursive: true });

  // Read all report files
  const reportFiles = readdirSync(reportsDir).filter(
    (f) => f.endsWith(".json") && f !== "summary.json"
  );

  const reports: DOMRealityReport[] = [];

  for (const file of reportFiles) {
    try {
      const content = readFileSync(join(reportsDir, file), "utf-8");
      const report = JSON.parse(content) as DOMRealityReport;
      reports.push(report);
    } catch (error) {
      console.warn(`Failed to parse ${file}:`, error);
    }
  }

  if (reports.length === 0) {
    console.log("No reports found to generate summary from.");
    return;
  }

  // Generate markdown report
  const markdown = generateMarkdownReport(reports);
  writeFileSync(join(outputDir, "DOM_REALITY_REPORT.md"), markdown);

  // Generate HTML report
  const html = generateHTMLReport(reports);
  writeFileSync(join(outputDir, "DOM_REALITY_REPORT.html"), html);

  console.log(`✅ Generated reports:`);
  console.log(`   - ${join(outputDir, "DOM_REALITY_REPORT.md")}`);
  console.log(`   - ${join(outputDir, "DOM_REALITY_REPORT.html")}`);
}

// CLI entry point
if (require.main === module) {
  const reportsDir = process.argv[2] || join(process.cwd(), "test-results", "dom-reality-reports");
  const outputDir = process.argv[3] || join(process.cwd(), "test-results", "dom-reality-reports");

  try {
    generateReports(reportsDir, outputDir);
  } catch (error) {
    console.error("Report generation failed:", error);
    process.exit(1);
  }
}

export { generateReports };
