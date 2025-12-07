/**
 * Route Documentation Generator
 * Auto-generates API documentation from route definitions
 */

import * as fs from "fs/promises";
import * as path from "path";
import { logInfo, logError } from "../../utils/logger";

export interface RouteDoc {
  path: string;
  method: string;
  params?: Record<string, string>;
  body?: Record<string, unknown>;
  response?: Record<string, unknown>;
  auth: boolean;
  permissions?: string[];
  description?: string;
  file: string;
  line?: number;
}

export interface DocumentationReport {
  totalRoutes: number;
  documentedRoutes: number;
  undocumentedRoutes: number;
  routes: RouteDoc[];
  generatedAt: Date;
}

/**
 * Generate route documentation from route files
 * This is a basic implementation that parses route files for patterns
 */
export async function generateRouteDocs(): Promise<DocumentationReport> {
  try {
    const routesDir = path.join(__dirname, "../../routes");
    const routes: RouteDoc[] = [];

    // Get all route files
    const routeFiles = await findRouteFiles(routesDir);

    for (const file of routeFiles) {
      try {
        const fileRoutes = await parseRouteFile(file);
        routes.push(...fileRoutes);
      } catch (error) {
        logError(`Failed to parse route file: ${file}`, error);
      }
    }

    // Count documented vs undocumented
    const documentedRoutes = routes.filter((r) => r.description).length;
    const undocumentedRoutes = routes.length - documentedRoutes;

    return {
      totalRoutes: routes.length,
      documentedRoutes,
      undocumentedRoutes,
      routes,
      generatedAt: new Date(),
    };
  } catch (error) {
    logError("Failed to generate route docs", error);
    return {
      totalRoutes: 0,
      documentedRoutes: 0,
      undocumentedRoutes: 0,
      routes: [],
      generatedAt: new Date(),
    };
  }
}

/**
 * Find all route files recursively
 */
async function findRouteFiles(dir: string, files: string[] = []): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await findRouteFiles(fullPath, files);
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }

    return files;
  } catch (error) {
    logError(`Failed to read directory: ${dir}`, error);
    return files;
  }
}

/**
 * Parse a route file to extract route information
 * This is a basic parser that looks for common Express route patterns
 */
async function parseRouteFile(filePath: string): Promise<RouteDoc[]> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const routes: RouteDoc[] = [];

    // Look for router patterns: router.get, router.post, router.put, router.delete, router.patch
    const routePattern = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = routePattern.exec(content)) !== null) {
      if (!match[1] || !match[2]) continue;
      const method = match[1].toUpperCase();
      const routePath = match[2];
      const lineNumber = content.substring(0, match.index).split("\n").length;

      // Try to extract description from JSDoc comment above
      let description: string | undefined;
      const beforeMatch = content.substring(0, match.index);
      const lastComment = beforeMatch.match(/\/\*\*[\s\S]*?\*\//g);
      if (lastComment && lastComment.length > 0) {
        const comment = lastComment[lastComment.length - 1];
        if (comment) {
          const descMatch = comment.match(/\*\s+(.+)/);
          if (descMatch && descMatch[1]) {
            description = descMatch[1].trim();
          }
        }
      }

      // Try to detect auth requirements
      const authPattern = /requireAuth|authMiddleware|AuthRequest/g;
      const hasAuth = authPattern.test(content.substring(0, match.index));

      // Try to detect permissions
      const permissions: string[] = [];
      const permissionPattern = /Permission\.(\w+)/g;
      let permMatch;
      while ((permMatch = permissionPattern.exec(content)) !== null) {
        if (permMatch[1]) {
          permissions.push(permMatch[1]);
        }
      }

      const relativePath = path.relative(path.join(__dirname, "../../"), filePath);
      const routeDoc: RouteDoc = {
        path: routePath,
        method,
        auth: hasAuth,
        file: relativePath,
        line: lineNumber,
      };
      if (description) {
        routeDoc.description = description;
      }
      if (permissions.length > 0) {
        routeDoc.permissions = permissions;
      }
      routes.push(routeDoc);
    }

    return routes;
  } catch (error) {
    logError(`Failed to parse route file: ${filePath}`, error);
    return [];
  }
}

/**
 * Generate markdown documentation from route docs
 */
export async function generateMarkdownDocs(report: DocumentationReport): Promise<string> {
  const outputLines: string[] = [];

  outputLines.push("# Auto-Generated API Route Documentation");
  outputLines.push("");
  outputLines.push(`**Generated:** ${report.generatedAt.toISOString()}`);
  outputLines.push(`**Total Routes:** ${report.totalRoutes}`);
  outputLines.push(`**Documented:** ${report.documentedRoutes}`);
  outputLines.push(`**Undocumented:** ${report.undocumentedRoutes}`);
  outputLines.push("");
  outputLines.push("---");
  outputLines.push("");

  // Group by method
  const byMethod: Record<string, RouteDoc[]> = {};
  for (const route of report.routes) {
    if (!route) continue;
    const method = route.method;
    if (!byMethod[method]) {
      byMethod[method] = [];
    }
    byMethod[method]!.push(route);
  }

  for (const method of ["GET", "POST", "PUT", "DELETE", "PATCH"]) {
    if (!byMethod[method]) continue;

    outputLines.push(`## ${method} Routes`);
    outputLines.push("");

    for (const route of byMethod[method]) {
      if (!route) continue;
      outputLines.push(`### ${route.path}`);
      outputLines.push("");

      if (route.description) {
        outputLines.push(route.description);
        outputLines.push("");
      } else {
        outputLines.push("*No description available.*");
        outputLines.push("");
      }

      outputLines.push(`- **Method:** ${route.method}`);
      outputLines.push(`- **Auth Required:** ${route.auth ? "Yes" : "No"}`);
      if (route.permissions && route.permissions.length > 0) {
        outputLines.push(`- **Permissions:** ${route.permissions.join(", ")}`);
      }
      outputLines.push(`- **File:** \`${route.file}\``);
      if (route.line) {
        outputLines.push(`- **Line:** ${route.line}`);
      }
      outputLines.push("");
    }
  }

  return outputLines.join("\n");
}

/**
 * Save generated documentation to file
 */
export async function saveRouteDocs(
  outputPath: string,
  report: DocumentationReport
): Promise<void> {
  try {
    const markdown = await generateMarkdownDocs(report);
    await fs.writeFile(outputPath, markdown, "utf-8");
    logInfo("Route documentation saved", { outputPath, totalRoutes: report.totalRoutes });
  } catch (error) {
    logError("Failed to save route docs", error);
    throw error;
  }
}
