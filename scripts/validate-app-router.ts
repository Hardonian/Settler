#!/usr/bin/env tsx
/**
 * App Router validity scanner
 * - Ensures required exports exist for page/layout/error/loading/not-found/route files.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const APP_ROOTS = ['packages/web/app', 'packages/web/src/app'];
const ROUTE_EXTENSIONS = ['ts', 'tsx'];
const VALID_ROUTE_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

interface RouteIssue {
  file: string;
  message: string;
}

function getChangedFiles(): string[] {
  const output = execSync('git diff --cached --name-only', {
    encoding: 'utf-8',
  });

  return output
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);
}

function hasDefaultExport(content: string): boolean {
  return /export\s+default\s+/u.test(content);
}

function hasRouteMethodExport(content: string): boolean {
  return VALID_ROUTE_METHODS.some((method: string) => {
    const functionPattern = new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\b`, 'u');
    const constPattern = new RegExp(`export\\s+const\\s+${method}\\s*=`, 'u');
    return functionPattern.test(content) || constPattern.test(content);
  });
}

function isRouteFile(filePath: string): boolean {
  return filePath.endsWith('route.ts') || filePath.endsWith('route.tsx');
}

function scanFile(filePath: string): RouteIssue[] {
  const issues: RouteIssue[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');

  if (isRouteFile(filePath)) {
    if (hasDefaultExport(content)) {
      issues.push({
        file: filePath,
        message: 'Route handlers must not use default exports.',
      });
    }

    if (!hasRouteMethodExport(content)) {
      issues.push({
        file: filePath,
        message: 'Route handlers must export at least one HTTP method.',
      });
    }

    return issues;
  }

  const requiresDefaultExport = [
    'page.ts',
    'page.tsx',
    'layout.ts',
    'layout.tsx',
    'error.ts',
    'error.tsx',
    'loading.ts',
    'loading.tsx',
    'not-found.ts',
    'not-found.tsx',
  ].some((name: string) => filePath.endsWith(name));

  if (requiresDefaultExport && !hasDefaultExport(content)) {
    issues.push({
      file: filePath,
      message: 'File must export a default component.',
    });
  }

  return issues;
}

async function collectRouteFiles(changedOnly: boolean): Promise<string[]> {
  if (changedOnly) {
    const changedFiles = getChangedFiles();
    return changedFiles.filter((filePath: string) =>
      APP_ROOTS.some((root: string) => filePath.startsWith(`${root}/`))
    );
  }

  const globs = APP_ROOTS.flatMap((root: string) =>
    ROUTE_EXTENSIONS.map((ext: string) => `${root}/**/*.${ext}`)
  );

  const files = await glob(globs, {
    cwd: process.cwd(),
    absolute: true,
    nodir: true,
  });

  return files;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const changedOnly = args.includes('--changed');
  const files = await collectRouteFiles(changedOnly);
  const issues: RouteIssue[] = [];

  for (const file of files) {
    const resolvedPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(resolvedPath)) {
      continue;
    }

    if (
      !resolvedPath.endsWith('page.ts') &&
      !resolvedPath.endsWith('page.tsx') &&
      !resolvedPath.endsWith('layout.ts') &&
      !resolvedPath.endsWith('layout.tsx') &&
      !resolvedPath.endsWith('error.ts') &&
      !resolvedPath.endsWith('error.tsx') &&
      !resolvedPath.endsWith('loading.ts') &&
      !resolvedPath.endsWith('loading.tsx') &&
      !resolvedPath.endsWith('not-found.ts') &&
      !resolvedPath.endsWith('not-found.tsx') &&
      !resolvedPath.endsWith('route.ts') &&
      !resolvedPath.endsWith('route.tsx')
    ) {
      continue;
    }

    issues.push(...scanFile(resolvedPath));
  }

  if (issues.length > 0) {
    console.error('❌ App Router validity check failed:');
    for (const issue of issues) {
      const relativePath = path.relative(process.cwd(), issue.file);
      console.error(`  • ${relativePath}: ${issue.message}`);
    }
    process.exit(1);
  }

  console.log('✅ App Router exports are valid.');
}

main().catch((error: unknown) => {
  console.error('❌ App Router validity check failed unexpectedly:', error);
  process.exit(1);
});
