#!/usr/bin/env tsx
/**
 * Phase 0: Internal Link Extractor
 * 
 * Scans codebase for internal links:
 * - <Link href="..."> components
 * - router.push("...") calls
 * - Markdown internal links
 * - Config arrays with href/slug properties
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { writeFile } from 'fs/promises';

interface LinkInfo {
  href: string;
  source: string;
  line: number;
  type: 'link' | 'router' | 'markdown' | 'config';
}

const WEB_SRC = join(process.cwd(), 'packages/web/src');
const OUTPUT_DIR = join(process.cwd(), 'qa');

// Patterns to match internal links
const LINK_PATTERNS = [
  // Next.js Link components: <Link href="/path">
  /<Link\s+[^>]*href=["']([^"']+)["']/g,
  // router.push("/path")
  /router\.push\(["']([^"']+)["']\)/g,
  // useRouter().push("/path")
  /useRouter\(\)\.push\(["']([^"']+)["']\)/g,
  // href="/path" in JSX
  /href=["']([^"']+)["']/g,
];

// Markdown link pattern: [text](/path)
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

// Internal link check (starts with / or relative, not http/https/mailto)
function isInternalLink(href: string): boolean {
  if (!href) return false;
  if (href.startsWith('http://') || href.startsWith('https://')) return false;
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  if (href.startsWith('#') || href.startsWith('?')) return false; // Anchors/query params
  if (href.startsWith('//')) return false; // Protocol-relative URLs
  
  return href.startsWith('/') || !href.includes(':');
}

async function extractLinksFromFile(filePath: string): Promise<LinkInfo[]> {
  const links: LinkInfo[] = [];
  
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const ext = extname(filePath);
    
    // Extract from TS/TSX/JS/JSX files
    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      lines.forEach((line, index) => {
        // Check Link components
        const linkMatches = line.matchAll(/<Link\s+[^>]*href=["']([^"']+)["']/g);
        for (const match of linkMatches) {
          const href = match[1];
          if (isInternalLink(href)) {
            links.push({
              href,
              source: filePath,
              line: index + 1,
              type: 'link',
            });
          }
        }
        
        // Check router.push
        const routerMatches = line.matchAll(/router\.push\(["']([^"']+)["']\)/g);
        for (const match of routerMatches) {
          const href = match[1];
          if (isInternalLink(href)) {
            links.push({
              href,
              source: filePath,
              line: index + 1,
              type: 'router',
            });
          }
        }
        
        // Check useRouter().push
        const useRouterMatches = line.matchAll(/useRouter\(\)\.push\(["']([^"']+)["']\)/g);
        for (const match of useRouterMatches) {
          const href = match[1];
          if (isInternalLink(href)) {
            links.push({
              href,
              source: filePath,
              line: index + 1,
              type: 'router',
            });
          }
        }
        
        // Check config arrays (common pattern: { href: "/path" })
        const configMatches = line.matchAll(/href:\s*["']([^"']+)["']/g);
        for (const match of configMatches) {
          const href = match[1];
          if (isInternalLink(href)) {
            links.push({
              href,
              source: filePath,
              line: index + 1,
              type: 'config',
            });
          }
        }
      });
    }
    
    // Extract from Markdown files
    if (['.md', '.mdx'].includes(ext)) {
      lines.forEach((line, index) => {
        const markdownMatches = line.matchAll(MARKDOWN_LINK_PATTERN);
        for (const match of markdownMatches) {
          const href = match[2];
          if (isInternalLink(href)) {
            links.push({
              href,
              source: filePath,
              line: index + 1,
              type: 'markdown',
            });
          }
        }
      });
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  
  return links;
}

async function scanDirectory(dir: string): Promise<LinkInfo[]> {
  const links: LinkInfo[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      // Skip node_modules, .git, etc.
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }
      
      if (entry.isDirectory()) {
        const subLinks = await scanDirectory(fullPath);
        links.push(...subLinks);
      } else if (entry.isFile()) {
        const ext = extname(entry.name);
        if (['.ts', '.tsx', '.js', '.jsx', '.md', '.mdx'].includes(ext)) {
          const fileLinks = await extractLinksFromFile(fullPath);
          links.push(...fileLinks);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error);
  }
  
  return links;
}

function normalizeHref(href: string): string {
  // Remove query params and hash for comparison
  let normalized = href.split('?')[0].split('#')[0];
  
  // Ensure leading slash
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  
  // Remove trailing slash for consistency (except root)
  if (normalized !== '/' && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}

async function generateLinkRegistry() {
  console.log('🔍 Scanning codebase for internal links...');
  
  const allLinks = await scanDirectory(WEB_SRC);
  
  // Normalize and deduplicate
  const normalizedLinks = allLinks.map(link => ({
    ...link,
    normalizedHref: normalizeHref(link.href),
  }));
  
  // Group by normalized href
  const linksByHref = new Map<string, LinkInfo[]>();
  normalizedLinks.forEach(link => {
    const existing = linksByHref.get(link.normalizedHref) || [];
    existing.push(link);
    linksByHref.set(link.normalizedHref, existing);
  });
  
  // Generate unique hrefs list
  const uniqueHrefs = Array.from(linksByHref.keys()).sort();
  
  console.log(`✅ Found ${allLinks.length} internal link references`);
  console.log(`   - ${uniqueHrefs.length} unique paths`);
  
  // Generate JSON output
  const jsonOutput = {
    generatedAt: new Date().toISOString(),
    totalLinks: allLinks.length,
    uniquePaths: uniqueHrefs.length,
    links: normalizedLinks,
    paths: uniqueHrefs,
    linksByPath: Object.fromEntries(linksByHref),
  };
  
  await writeFile(
    join(OUTPUT_DIR, 'link-registry.json'),
    JSON.stringify(jsonOutput, null, 2)
  );
  
  console.log(`✅ Link registry written to qa/link-registry.json`);
}

generateLinkRegistry().catch(console.error);
