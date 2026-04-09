#!/usr/bin/env tsx
/**
 * Phase 0: Dead Link Checker
 *
 * Compares link registry with route registry to find dead links.
 * Fails build if any internal link points to nonexistent route.
 */

import { readFile } from "fs/promises";
import { join } from "path";

interface DeadLink {
  href: string;
  normalizedHref: string;
  sources: Array<{ file: string; line: number; type: string }>;
  reason: string;
}

interface RouteMatcher {
  path: string;
  regex: RegExp;
}

const OUTPUT_DIR = join(process.cwd(), "qa");

function toMatcher(routePath: string): RouteMatcher {
  const pattern = routePath.replace(/\[\.\.\.([^\]]+)\]/g, ".+").replace(/\[([^\]]+)\]/g, "[^/]+");

  return {
    path: routePath,
    regex: new RegExp(`^${pattern}$`),
  };
}

function isDynamicRoute(routePath: string): boolean {
  return routePath.includes("[") && routePath.includes("]");
}

async function checkDeadLinks() {
  console.log("🔍 Checking for dead links...");

  const routeRegistryContent = await readFile(join(OUTPUT_DIR, "route-registry.json"), "utf-8");
  const linkRegistryContent = await readFile(join(OUTPUT_DIR, "link-registry.json"), "utf-8");

  const routeRegistry = JSON.parse(routeRegistryContent);
  const linkRegistry = JSON.parse(linkRegistryContent);

  const pageRoutes = routeRegistry.routes.filter((r: any) => r.type === "page");
  const staticRoutes = new Set<string>(
    pageRoutes.map((r: any) => String(r.path)).filter((path: string) => !isDynamicRoute(path))
  );
  const dynamicMatchers = pageRoutes
    .map((r: any) => String(r.path))
    .filter((path: string) => isDynamicRoute(path))
    .map((path: string) => toMatcher(path));

  const deadLinks: DeadLink[] = [];

  for (const href of linkRegistry.paths) {
    const normalizedHref = href.split("?")[0].split("#")[0];

    if (normalizedHref === "/") {
      continue;
    }

    if (staticRoutes.has(normalizedHref)) {
      continue;
    }

    const matchedDynamic = dynamicMatchers.some((matcher) => matcher.regex.test(normalizedHref));

    if (!matchedDynamic) {
      const linkSources = linkRegistry.linksByPath[href] || [];
      deadLinks.push({
        href,
        normalizedHref,
        sources: linkSources.map((l: any) => ({
          file: l.source,
          line: l.line,
          type: l.type,
        })),
        reason: "Route not found",
      });
    }
  }

  if (deadLinks.length > 0) {
    console.error(`\n❌ Found ${deadLinks.length} dead link(s):\n`);

    deadLinks.forEach((deadLink) => {
      console.error(`  ${deadLink.href}`);
      console.error(`    Normalized: ${deadLink.normalizedHref}`);
      console.error(`    Reason: ${deadLink.reason}`);
      console.error(`    Found in:`);
      deadLink.sources.forEach((source) => {
        console.error(`      - ${source.file}:${source.line} (${source.type})`);
      });
      console.error("");
    });

    console.error("💡 Fix dead links by:");
    console.error("   1. Creating the missing route/page");
    console.error("   2. Adding a redirect in next.config.js");
    console.error("   3. Removing the dead link\n");

    process.exit(1);
  } else {
    console.log("✅ No dead links found!");
  }
}

checkDeadLinks().catch((error) => {
  console.error("Error checking dead links:", error);
  process.exit(1);
});
