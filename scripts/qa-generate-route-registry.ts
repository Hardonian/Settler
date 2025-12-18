#!/usr/bin/env tsx
/**
 * Phase 0: Route Registry Generator
 * 
 * Scans the Next.js app directory to generate a canonical route registry.
 * Outputs both JSON and TypeScript files for use in link checking.
 */

import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import { writeFile } from 'fs/promises';

interface RouteInfo {
  path: string;
  type: 'page' | 'layout' | 'route' | 'not-found' | 'error' | 'loading' | 'template';
  file: string;
  dynamic?: boolean;
  catchAll?: boolean;
  optional?: boolean;
}

const APP_DIR = join(process.cwd(), 'packages/web/src/app');
const OUTPUT_DIR = join(process.cwd(), 'qa');

async function scanDirectory(dir: string, basePath: string = ''): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(APP_DIR, fullPath);
      
      if (entry.isDirectory()) {
        // Handle dynamic segments
        let segmentPath = entry.name;
        let isDynamic = false;
        let isCatchAll = false;
        let isOptional = false;
        
        if (segmentPath.startsWith('[') && segmentPath.endsWith(']')) {
          isDynamic = true;
          segmentPath = segmentPath.slice(1, -1);
          
          if (segmentPath.startsWith('...')) {
            isCatchAll = true;
            segmentPath = segmentPath.slice(3);
          }
          
          if (segmentPath.startsWith('(') && segmentPath.endsWith(')')) {
            isOptional = true;
            segmentPath = segmentPath.slice(1, -1);
          }
        }
        
        const newBasePath = basePath ? `${basePath}/${segmentPath}` : segmentPath;
        const subRoutes = await scanDirectory(fullPath, newBasePath);
        routes.push(...subRoutes);
      } else if (entry.isFile()) {
        const fileName = entry.name;
        const ext = fileName.split('.').pop();
        
        if (!['tsx', 'ts', 'jsx', 'js'].includes(ext || '')) {
          continue;
        }
        
        let routeType: RouteInfo['type'] = 'page';
        let routePath = basePath;
        
        // Determine route type from filename
        if (fileName === 'page.tsx' || fileName === 'page.ts') {
          routeType = 'page';
        } else if (fileName === 'layout.tsx' || fileName === 'layout.ts') {
          routeType = 'layout';
        } else if (fileName === 'route.ts' || fileName === 'route.tsx') {
          routeType = 'route';
        } else if (fileName === 'not-found.tsx' || fileName === 'not-found.ts') {
          routeType = 'not-found';
        } else if (fileName === 'error.tsx' || fileName === 'error.ts') {
          routeType = 'error';
        } else if (fileName === 'loading.tsx' || fileName === 'loading.ts') {
          routeType = 'loading';
        } else if (fileName === 'template.tsx' || fileName === 'template.ts') {
          routeType = 'template';
        } else {
          // Skip non-route files
          continue;
        }
        
        // Normalize route path
        if (!routePath) {
          routePath = '/';
        } else if (!routePath.startsWith('/')) {
          routePath = `/${routePath}`;
        }
        
        routes.push({
          path: routePath,
          type: routeType,
          file: relativePath,
          dynamic: basePath.includes('['),
          catchAll: basePath.includes('[...'),
          optional: basePath.includes('(') && basePath.includes(')'),
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error);
  }
  
  return routes;
}

async function generateRouteRegistry() {
  console.log('🔍 Scanning app directory for routes...');
  
  const routes = await scanDirectory(APP_DIR);
  
  // Deduplicate and sort
  const uniqueRoutes = Array.from(
    new Map(routes.map(r => [r.path, r])).values()
  ).sort((a, b) => a.path.localeCompare(b.path));
  
  // Generate route list (only pages, not layouts/errors/etc)
  const pageRoutes = uniqueRoutes.filter(r => r.type === 'page');
  
  console.log(`✅ Found ${pageRoutes.length} page routes`);
  
  // Generate JSON output
  const jsonOutput = {
    generatedAt: new Date().toISOString(),
    totalRoutes: uniqueRoutes.length,
    pageRoutes: pageRoutes.length,
    routes: uniqueRoutes,
    pagePaths: pageRoutes.map(r => r.path),
  };
  
  await writeFile(
    join(OUTPUT_DIR, 'route-registry.json'),
    JSON.stringify(jsonOutput, null, 2)
  );
  
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

export const PAGE_ROUTES: string[] = ${JSON.stringify(pageRoutes.map(r => r.path), null, 2)};

export const ALL_ROUTES: string[] = ${JSON.stringify(uniqueRoutes.map(r => r.path), null, 2)};

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
  
  await writeFile(
    join(OUTPUT_DIR, 'route-registry.ts'),
    tsOutput
  );
  
  console.log(`✅ Route registry written to qa/route-registry.json and qa/route-registry.ts`);
  console.log(`   - ${pageRoutes.length} page routes`);
  console.log(`   - ${uniqueRoutes.length} total route files`);
}

generateRouteRegistry().catch(console.error);
