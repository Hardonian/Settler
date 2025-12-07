/**
 * API Change Detection Service
 * Detects when routes change and flags documentation updates needed
 */

import * as fs from "fs/promises";
import { logInfo, logError } from "../../utils/logger";
import { generateRouteDocs, RouteDoc } from "./doc-generator";

export interface APIChange {
  type: "added" | "modified" | "removed";
  route: string;
  method: string;
  changes: string[];
  docsNeeded: boolean;
  file?: string;
}

export interface ChangeReport {
  detectedAt: Date;
  changes: APIChange[];
  totalAdded: number;
  totalModified: number;
  totalRemoved: number;
  documentationNeeded: number;
}

/**
 * Detect API changes by comparing current routes with last known state
 * This is a simplified version - in production, you'd store last state in DB/file
 */
export async function detectAPIChanges(lastKnownRoutes?: RouteDoc[]): Promise<ChangeReport> {
  try {
    const currentRoutes = await generateRouteDocs();
    const lastRoutes = lastKnownRoutes || [];

    const changes: APIChange[] = [];

    // Create maps for easy lookup
    const currentMap = new Map<string, RouteDoc>();
    for (const route of currentRoutes.routes) {
      const key = `${route.method}:${route.path}`;
      currentMap.set(key, route);
    }

    const lastMap = new Map<string, RouteDoc>();
    for (const route of lastRoutes) {
      const key = `${route.method}:${route.path}`;
      lastMap.set(key, route);
    }

    // Find added routes
    for (const [key, route] of currentMap.entries()) {
      if (!route) continue;
      if (!lastMap.has(key)) {
        changes.push({
          type: "added",
          route: route.path,
          method: route.method,
          changes: ["New route added"],
          docsNeeded: !route.description,
          file: route.file,
        });
      } else {
        // Check for modifications
        const lastRoute = lastMap.get(key);
        if (!lastRoute) continue;
        const modifications: string[] = [];

        if (route.description !== lastRoute.description) {
          modifications.push("Description changed");
        }
        if (route.auth !== lastRoute.auth) {
          modifications.push(`Auth requirement changed: ${lastRoute.auth} → ${route.auth}`);
        }
        if (
          JSON.stringify(route.permissions?.sort()) !==
          JSON.stringify(lastRoute.permissions?.sort())
        ) {
          modifications.push("Permissions changed");
        }
        if (route.file !== lastRoute.file) {
          modifications.push(`File moved: ${lastRoute.file} → ${route.file}`);
        }

        if (modifications.length > 0) {
          changes.push({
            type: "modified",
            route: route.path,
            method: route.method,
            changes: modifications,
            docsNeeded: modifications.some((m) => m.includes("Description")) || !route.description,
            file: route.file,
          });
        }
      }
    }

    // Find removed routes
    for (const [key, route] of lastMap.entries()) {
      if (!currentMap.has(key)) {
        if (!route) continue;
        changes.push({
          type: "removed",
          route: route.path,
          method: route.method,
          changes: ["Route removed"],
          docsNeeded: true,
          file: route.file,
        });
      }
    }

    const totalAdded = changes.filter((c) => c.type === "added").length;
    const totalModified = changes.filter((c) => c.type === "modified").length;
    const totalRemoved = changes.filter((c) => c.type === "removed").length;
    const documentationNeeded = changes.filter((c) => c.docsNeeded).length;

    return {
      detectedAt: new Date(),
      changes,
      totalAdded,
      totalModified,
      totalRemoved,
      documentationNeeded,
    };
  } catch (error) {
    logError("Failed to detect API changes", error);
    return {
      detectedAt: new Date(),
      changes: [],
      totalAdded: 0,
      totalModified: 0,
      totalRemoved: 0,
      documentationNeeded: 0,
    };
  }
}

/**
 * Generate a summary report of API changes
 */
export async function generateChangeReport(report: ChangeReport): Promise<string> {
  const lines: string[] = [];

  lines.push("# API Change Detection Report");
  lines.push("");
  lines.push(`**Detected At:** ${report.detectedAt.toISOString()}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- **Added:** ${report.totalAdded}`);
  lines.push(`- **Modified:** ${report.totalModified}`);
  lines.push(`- **Removed:** ${report.totalRemoved}`);
  lines.push(`- **Documentation Needed:** ${report.documentationNeeded}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  if (report.changes.length === 0) {
    lines.push("No changes detected.");
    return lines.join("\n");
  }

  // Group by type
  const byType: Record<string, APIChange[]> = {
    added: [],
    modified: [],
    removed: [],
  };

  for (const change of report.changes) {
    if (change && change.type) {
      const typeKey = change.type;
      if (byType[typeKey]) {
        byType[typeKey]!.push(change);
      }
    }
  }

  for (const type of ["added", "modified", "removed"]) {
    const changes = byType[type];
    if (!changes || changes.length === 0) continue;

    lines.push(`## ${type.toUpperCase()} Routes`);
    lines.push("");

    for (const change of changes) {
      if (!change) continue;
      lines.push(`### ${change.method} ${change.route}`);
      lines.push("");

      if (change.file) {
        lines.push(`**File:** \`${change.file}\``);
        lines.push("");
      }

      lines.push("**Changes:**");
      for (const changeDesc of change.changes) {
        lines.push(`- ${changeDesc}`);
      }
      lines.push("");

      if (change.docsNeeded) {
        lines.push("⚠️ **Documentation update needed**");
        lines.push("");
      }

      lines.push("---");
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Save change report to file
 */
export async function saveChangeReport(outputPath: string, report: ChangeReport): Promise<void> {
  try {
    const markdown = await generateChangeReport(report);
    await fs.writeFile(outputPath, markdown, "utf-8");
    logInfo("API change report saved", {
      outputPath,
      totalChanges: report.changes.length,
    });
  } catch (error) {
    logError("Failed to save change report", error);
    throw error;
  }
}
