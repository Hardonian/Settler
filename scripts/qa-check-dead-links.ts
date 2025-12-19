#!/usr/bin/env tsx
/**
 * Link Integrity Scanner - Check Dead Links
 * 
 * Validates that all internal links reference existing routes
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

interface LinkReference {
  file: string;
  line: number;
  type: string;
  target: string;
}

interface LinkRegistry {
  links: LinkReference[];
  routes: string[];
  summary: any;
}

// Known valid routes (from Next.js app directory structure)
const validRoutes = new Set<string>();

async function collectRoutes() {
  const workspaceRoot = process.cwd();
  const webSrc = join(workspaceRoot, 'packages', 'web', 'src', 'app');

  // Collect all route files
  const routeFiles = await glob('**/page.{ts,tsx}', {
    cwd: webSrc,
  });

  routeFiles.forEach((file) => {
    // Convert file path to route
    const route = '/' + file.replace(/\/page\.(ts|tsx)$/, '').replace(/\/index$/, '');
    validRoutes.add(route);
    validRoutes.add('/'); // Root route
  });

  // Add known public routes
  validRoutes.add('/console');
  validRoutes.add('/playground');
  validRoutes.add('/signup');
  validRoutes.add('/docs');
  validRoutes.add('/pricing');
  validRoutes.add('/cookbook');
  validRoutes.add('/runbooks');
  validRoutes.add('/schematics');
}

function checkLink(target: string): { valid: boolean; reason?: string } {
  // External links are valid
  if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('//')) {
    return { valid: true };
  }

  // Hash links are valid
  if (target.startsWith('#')) {
    return { valid: true };
  }

  // Remove query params and hash
  const cleanTarget = target.split('?')[0].split('#')[0];

  // Check if route exists
  if (validRoutes.has(cleanTarget)) {
    return { valid: true };
  }

  // Check if it's a dynamic route pattern
  const dynamicPattern = cleanTarget.replace(/\[.*?\]/g, '[id]');
  if (validRoutes.has(dynamicPattern)) {
    return { valid: true };
  }

  return { valid: false, reason: 'Route not found' };
}

async function main() {
  await collectRoutes();

  const registryPath = join(process.cwd(), 'qa', 'link-registry.json');
  if (!existsSync(registryPath)) {
    console.error('❌ link-registry.json not found. Run qa:links first.');
    process.exit(1);
  }

  const registry: LinkRegistry = JSON.parse(readFileSync(registryPath, 'utf-8'));

  const deadLinks: Array<LinkReference & { reason: string }> = [];

  registry.links.forEach((link) => {
    const result = checkLink(link.target);
    if (!result.valid) {
      deadLinks.push({
        ...link,
        reason: result.reason || 'Unknown',
      });
    }
  });

  if (deadLinks.length > 0) {
    console.error(`\n❌ Found ${deadLinks.length} dead links:\n`);
    deadLinks.forEach((link) => {
      console.error(`  ${link.file}:${link.line} - ${link.type} -> ${link.target} (${link.reason})`);
    });
    process.exit(1);
  } else {
    console.log(`\n✅ All ${registry.links.length} links are valid`);
  }
}

main().catch(console.error);
