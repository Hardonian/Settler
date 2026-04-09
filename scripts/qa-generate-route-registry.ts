#!/usr/bin/env tsx
/**
 * Phase 0: Route Registry Generator
 *
 * Scans the Next.js app directory to generate a canonical route registry.
 * Outputs both JSON and TypeScript files for use in link checking.
 */

import { readdir } from "fs/promises";
import { join, relative } from "path";
import { writeFile } from "fs/promises";

interface RouteInfo {
  path: string;
  type: "page" | "layout" | "route" | "not-found" | "error" | "loading" | "template";
  file: string;
  dynamic?: boolean;
  catchAll?: boolean;
  optional?: boolean;
}

interface SegmentMetadata {
  segmentPath: string;
  isDynamic: boolean;
  isCatchAll: boolean;
  isOptional: boolean;
}

const APP_DIR = join(process.cwd(), "packages/web/src/app");
const OUTPUT_DIR = join(process.cwd(), "qa");

function parseSegment(segment: string): SegmentMetadata {
  // Route groups like (marketing) should not affect URL path.
  if (segment.startsWith("(") && segment.endsWith(")")) {
    return {
      segmentPath: "",
      isDynamic: false,
      isCatchAll: false,
      isOptional: false,
    };
  }

  if (!segment.startsWith("[") || !segment.endsWith("]")) {
    return {
      segmentPath: segment,
      isDynamic: false,
      isCatchAll: false,
      isOptional: false,
    };
  }

  const raw = segment.slice(1, -1);

  if (raw.startsWith("...")) {
    return {
      segmentPath: `[...${raw.slice(3)}]`,
      isDynamic: true,
      isCatchAll: true,
      isOptional: false,
    };
  }

  if (raw.startsWith("[...") && raw.endsWith("]")) {
    return {
      segmentPath: `[[...${raw.slice(4, -1)}]]`,
      isDynamic: true,
      isCatchAll: true,
      isOptional: true,
    };
  }

  return {
    segmentPath: `[${raw}]`,
    isDynamic: true,
    isCatchAll: false,
    isOptional: false,
  };
}

async function scanDirectory(
  dir: string,
  basePath: string = "",
  parentMeta: Pick<RouteInfo, "dynamic" | "catchAll" | "optional"> = {}
): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(APP_DIR, fullPath);

      if (entry.isDirectory()) {
        const segmentMeta = parseSegment(entry.name);
        const nextPath = segmentMeta.segmentPath
          ? basePath
            ? `${basePath}/${segmentMeta.segmentPath}`
            : segmentMeta.segmentPath
          : basePath;
        const subRoutes = await scanDirectory(fullPath, nextPath, {
          dynamic: Boolean(parentMeta.dynamic || segmentMeta.isDynamic),
          catchAll: Boolean(parentMeta.catchAll || segmentMeta.isCatchAll),
          optional: Boolean(parentMeta.optional || segmentMeta.isOptional),
        });
        routes.push(...subRoutes);
      } else if (entry.isFile()) {
        const fileName = entry.name;
        const ext = fileName.split(".").pop();

        if (!["tsx", "ts", "jsx", "js"].includes(ext || "")) {
          continue;
        }

        let routeType: RouteInfo["type"] = "page";
        let routePath = basePath;

        // Determine route type from filename
        if (fileName === "page.tsx" || fileName === "page.ts") {
          routeType = "page";
        } else if (fileName === "layout.tsx" || fileName === "layout.ts") {
          routeType = "layout";
        } else if (fileName === "route.ts" || fileName === "route.tsx") {
          routeType = "route";
        } else if (fileName === "not-found.tsx" || fileName === "not-found.ts") {
          routeType = "not-found";
        } else if (fileName === "error.tsx" || fileName === "error.ts") {
          routeType = "error";
        } else if (fileName === "loading.tsx" || fileName === "loading.ts") {
          routeType = "loading";
        } else if (fileName === "template.tsx" || fileName === "template.ts") {
          routeType = "template";
        } else {
          // Skip non-route files
          continue;
        }

        // Normalize route path
        if (!routePath) {
          routePath = "/";
        } else if (!routePath.startsWith("/")) {
          routePath = `/${routePath}`;
        }

        routes.push({
          path: routePath,
          type: routeType,
          file: relativePath,
          dynamic: Boolean(parentMeta.dynamic),
          catchAll: Boolean(parentMeta.catchAll),
          optional: Boolean(parentMeta.optional),
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error);
  }

  return routes;
}

async function generateRouteRegistry() {
  console.log("🔍 Scanning app directory for routes...");

  const routes = await scanDirectory(APP_DIR);

  // Deduplicate and sort
  const uniqueRoutes = Array.from(new Map(routes.map((r) => [r.path, r])).values()).sort((a, b) =>
    a.path.localeCompare(b.path)
  );

  // Generate route list (only pages, not layouts/errors/etc)
  const pageRoutes = uniqueRoutes.filter((r) => r.type === "page");

  console.log(`✅ Found ${pageRoutes.length} page routes`);

  // Generate JSON output
  const jsonOutput = {
    generatedAt: new Date().toISOString(),
    totalRoutes: uniqueRoutes.length,
    pageRoutes: pageRoutes.length,
    routes: uniqueRoutes,
    pagePaths: pageRoutes.map((r) => r.path),
  };

  await writeFile(join(OUTPUT_DIR, "route-registry.json"), JSON.stringify(jsonOutput, null, 2));

  // Generate TypeScript output
  const tsOutput = `/**
 * Route Registry - Auto-generated
 * Generated at: ${new Date().toISOString()}
 * 
 * This file contains all routes discovered in the Next.js app directory.
 * Use this for type-safe route checking and link validation.
 */

export interface RouteInfo {
  path: string;
  type: 'page' | 'layout' | 'route' | 'not-found' | 'error' | 'loading' | 'template';
  file: string;
  dynamic?: boolean;
  catchAll?: boolean;
  optional?: boolean;
}

export const ROUTES: RouteInfo[] = ${JSON.stringify(uniqueRoutes, null, 2)};

export const PAGE_ROUTES: string[] = ${JSON.stringify(
    pageRoutes.map((r) => r.path),
    null,
    2
  )};

export const ALL_ROUTES: string[] = ${JSON.stringify(
    uniqueRoutes.map((r) => r.path),
    null,
    2
  )};

/**
 * Check if a path matches a route (handles dynamic segments)
 */
export function isRoute(path: string): boolean {
  // Exact match
  if (PAGE_ROUTES.includes(path)) {
    return true;
  }
  
  // Check dynamic routes
  for (const route of ROUTES) {
    if (route.type !== 'page') continue;
    
    if (route.dynamic || route.catchAll) {
      // Simple pattern matching for dynamic routes
      const routePattern = route.path
        .replace(/\\[.*?\\]/g, '[^/]+') // Replace [param] with pattern
        .replace(/\\[\\.\\.\\..*?\\]/g, '.*'); // Replace [...param] with catch-all
      
      const regex = new RegExp(\`^\${routePattern}$\`);
      if (regex.test(path)) {
        return true;
      }
    }
  }
  
  return false;
}
`;

  await writeFile(join(OUTPUT_DIR, "route-registry.ts"), tsOutput);

  console.log(`✅ Route registry written to qa/route-registry.json and qa/route-registry.ts`);
  console.log(`   - ${pageRoutes.length} page routes`);
  console.log(`   - ${uniqueRoutes.length} total route files`);
}

generateRouteRegistry().catch(console.error);
