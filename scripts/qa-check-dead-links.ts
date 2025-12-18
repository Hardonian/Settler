#!/usr/bin/env tsx
/**
 * Phase 0: Dead Link Checker
 * 
 * Compares link registry with route registry to find dead links.
 * Fails build if any internal link points to nonexistent route.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

interface DeadLink {
  href: string;
  normalizedHref: string;
  sources: Array<{ file: string; line: number; type: string }>;
  reason: string;
}

const OUTPUT_DIR = join(process.cwd(), 'qa');

// Simple pattern matching for dynamic routes
function matchesRoute(path: string, routePath: string, isDynamic: boolean, isCatchAll: boolean): boolean {
  if (!isDynamic && !isCatchAll) {
    return path === routePath;
  }
  
  // Convert route pattern to regex
  let pattern = routePath
    .replace(/\[\.\.\.[^\]]+\]/g, '.*') // Catch-all: [...slug] -> .*
    .replace(/\[([^\]]+)\]/g, '[^/]+'); // Dynamic: [id] -> [^/]+
  
  // Handle optional catch-all
  if (routePath.includes('(') && routePath.includes(')')) {
    const optionalPart = routePath.match(/\(([^)]+)\)/)?.[1];
    if (optionalPart) {
      pattern = pattern.replace(/\([^)]+\)/, `(${optionalPart.replace(/\[\.\.\.[^\]]+\]/g, '.*').replace(/\[([^\]]+)\]/g, '[^/]+')})?`);
    }
  }
  
  const regex = new RegExp(`^${pattern}$`);
  return regex.test(path);
}

async function checkDeadLinks() {
  console.log('🔍 Checking for dead links...');
  
  // Load registries
  const routeRegistryContent = await readFile(join(OUTPUT_DIR, 'route-registry.json'), 'utf-8');
  const linkRegistryContent = await readFile(join(OUTPUT_DIR, 'link-registry.json'), 'utf-8');
  
  const routeRegistry = JSON.parse(routeRegistryContent);
  const linkRegistry = JSON.parse(linkRegistryContent);
  
  const pageRoutes = routeRegistry.routes.filter((r: any) => r.type === 'page');
  const deadLinks: DeadLink[] = [];
  
  // Check each unique path from links
  for (const href of linkRegistry.paths) {
    const normalizedHref = href.split('?')[0].split('#')[0];
    
    // Skip root
    if (normalizedHref === '/') {
      continue;
    }
    
    // Check if it matches any route
    let found = false;
    
    for (const route of pageRoutes) {
      if (matchesRoute(
        normalizedHref,
        route.path,
        route.dynamic || false,
        route.catchAll || false
      )) {
        found = true;
        break;
      }
    }
    
    if (!found) {
      // Check if it's a known redirect target (we'll handle redirects separately)
      // For now, mark as dead
      const linkSources = linkRegistry.linksByPath[href] || [];
      deadLinks.push({
        href,
        normalizedHref,
        sources: linkSources.map((l: any) => ({
          file: l.source,
          line: l.line,
          type: l.type,
        })),
        reason: 'Route not found',
      });
    }
  }
  
  if (deadLinks.length > 0) {
    console.error(`\n❌ Found ${deadLinks.length} dead link(s):\n`);
    
    deadLinks.forEach(deadLink => {
      console.error(`  ${deadLink.href}`);
      console.error(`    Normalized: ${deadLink.normalizedHref}`);
      console.error(`    Reason: ${deadLink.reason}`);
      console.error(`    Found in:`);
      deadLink.sources.forEach(source => {
        console.error(`      - ${source.file}:${source.line} (${source.type})`);
      });
      console.error('');
    });
    
    console.error('💡 Fix dead links by:');
    console.error('   1. Creating the missing route/page');
    console.error('   2. Adding a redirect in next.config.js');
    console.error('   3. Removing the dead link\n');
    
    process.exit(1);
  } else {
    console.log('✅ No dead links found!');
  }
}

checkDeadLinks().catch(error => {
  console.error('Error checking dead links:', error);
  process.exit(1);
});
