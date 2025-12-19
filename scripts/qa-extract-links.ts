#!/usr/bin/env tsx
/**
 * Link Integrity Scanner - Extract Links
 * 
 * Scans codebase for internal links (Link components, router.push, markdown hrefs)
 * and generates a registry of all internal routes
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

interface LinkReference {
  file: string;
  line: number;
  type: 'Link' | 'router.push' | 'href' | 'redirect';
  target: string;
}

const linkReferences: LinkReference[] = [];

// Patterns to match
const patterns = {
  Link: /<Link\s+href=["']([^"']+)["']/g,
  routerPush: /router\.push\(["']([^"']+)["']\)/g,
  href: /href=["']([^"']+)["']/g,
  redirect: /redirect\(["']([^"']+)["']\)/g,
};

function scanFile(filePath: string) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Check for Link components
    let match;
    while ((match = patterns.Link.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      linkReferences.push({
        file: filePath,
        line,
        type: 'Link',
        target: match[1],
      });
    }

    // Check for router.push
    while ((match = patterns.routerPush.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      linkReferences.push({
        file: filePath,
        line,
        type: 'router.push',
        target: match[1],
      });
    }

    // Check for redirect
    while ((match = patterns.redirect.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      linkReferences.push({
        file: filePath,
        line,
        type: 'redirect',
        target: match[1],
      });
    }

    // Check for href (but filter external links)
    while ((match = patterns.href.exec(content)) !== null) {
      const target = match[1];
      // Only internal links (start with / or #)
      if (target.startsWith('/') && !target.startsWith('//')) {
        const line = content.substring(0, match.index).split('\n').length;
        linkReferences.push({
          file: filePath,
          line,
          type: 'href',
          target,
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error);
  }
}

async function main() {
  const workspaceRoot = process.cwd();
  
  // Scan TypeScript/TSX/JSX files
  const files = await glob('**/*.{ts,tsx,jsx,md,mdx}', {
    cwd: workspaceRoot,
    ignore: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
    ],
  });

  console.log(`Scanning ${files.length} files...`);

  for (const file of files) {
    const fullPath = join(workspaceRoot, file);
    scanFile(fullPath);
  }

  // Extract unique internal routes
  const internalRoutes = new Set<string>();
  linkReferences.forEach((ref) => {
    const target = ref.target.split('#')[0].split('?')[0]; // Remove hash and query
    if (target.startsWith('/') && !target.startsWith('//')) {
      internalRoutes.add(target);
    }
  });

  // Write results
  const output = {
    links: linkReferences,
    routes: Array.from(internalRoutes).sort(),
    summary: {
      totalLinks: linkReferences.length,
      uniqueRoutes: internalRoutes.size,
      byType: {
        Link: linkReferences.filter((r) => r.type === 'Link').length,
        routerPush: linkReferences.filter((r) => r.type === 'router.push').length,
        href: linkReferences.filter((r) => r.type === 'href').length,
        redirect: linkReferences.filter((r) => r.type === 'redirect').length,
      },
    },
  };

  const outputPath = join(workspaceRoot, 'qa', 'link-registry.json');
  require('fs').writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n✅ Extracted ${linkReferences.length} link references`);
  console.log(`✅ Found ${internalRoutes.size} unique internal routes`);
  console.log(`✅ Results written to ${outputPath}`);
}

main().catch(console.error);
