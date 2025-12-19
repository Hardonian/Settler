#!/usr/bin/env tsx
/**
 * Mirror Dry-Run Tool
 * 
 * Exports allowlisted OSS_PUBLIC files to ./.mirror-out/ for verification.
 * Generates mirror-manifest.json listing every exported file and hash.
 * 
 * Usage:
 *   pnpm mirror:dryrun
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { glob } from 'glob';
import { execSync } from 'child_process';

const MIRROR_OUT_DIR = './.mirror-out';

// OSS_PUBLIC allowlist (must match classification spec)
const OSS_ALLOWLIST_PATTERNS = [
  'packages/sdk/**',
  'packages/sdk-python/**',
  'packages/sdk-go/**',
  'packages/sdk-ruby/**',
  'packages/api-client/**',
  'packages/protocol/**',
  'packages/react-settler/**',
  'packages/cli/**',
  'docs/public/**',
  'examples/**',
];

// Root files to copy (with transformations)
const ROOT_FILES = [
  { src: 'README.public.md', dest: 'README.md', required: false },
  { src: 'LICENSE', dest: 'LICENSE', required: false },
  { src: 'CONTRIBUTING.md', dest: 'CONTRIBUTING.md', required: false },
  { src: 'SECURITY.md', dest: 'SECURITY.md', required: false },
  { src: 'CODE_OF_CONDUCT.md', dest: 'CODE_OF_CONDUCT.md', required: false },
  { src: '.gitignore', dest: '.gitignore', required: false },
];

interface FileManifest {
  path: string;
  hash: string;
  size: number;
}

interface MirrorManifest {
  version: string;
  timestamp: string;
  files: FileManifest[];
  totalSize: number;
}

function matchesPattern(filePath: string, patterns: string[]): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return patterns.some(pattern => {
    const regex = new RegExp('^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
    return regex.test(normalizedPath);
  });
}

async function getAllFiles(rootDir: string = '.'): Promise<string[]> {
  const files: string[] = [];
  
  const ignorePatterns = [
    '**/node_modules/**',
    '**/.git/**',
    '**/.next/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.turbo/**',
    '**/.vercel/**',
    '**/.mirror-out/**',
    '**/artifacts/**',
  ];

  const allFiles = await glob('**/*', {
    cwd: rootDir,
    ignore: ignorePatterns,
    nodir: true,
  });

  return allFiles.map(f => path.resolve(rootDir, f));
}

function calculateFileHash(filePath: string, content: Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

async function copyFile(src: string, dest: string): Promise<FileManifest> {
  const content = await fs.readFile(src);
  const hash = calculateFileHash(src, content);
  const stats = await fs.stat(src);
  
  // Ensure destination directory exists
  await fs.mkdir(path.dirname(dest), { recursive: true });
  
  // Copy file
  await fs.writeFile(dest, content);
  
  return {
    path: path.relative(MIRROR_OUT_DIR, dest).replace(/\\/g, '/'),
    hash,
    size: stats.size,
  };
}

async function exportMirror(): Promise<MirrorManifest> {
  console.log('🧹 Cleaning mirror output directory...');
  if (await fs.access(MIRROR_OUT_DIR).then(() => true).catch(() => false)) {
    await fs.rm(MIRROR_OUT_DIR, { recursive: true });
  }
  await fs.mkdir(MIRROR_OUT_DIR, { recursive: true });
  
  console.log('📦 Collecting OSS_PUBLIC files...\n');
  
  const allFiles = await getAllFiles();
  const manifest: FileManifest[] = [];
  let totalSize = 0;
  
  // Export allowlisted files
  for (const filePath of allFiles) {
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    
    if (matchesPattern(relativePath, OSS_ALLOWLIST_PATTERNS)) {
      const destPath = path.join(MIRROR_OUT_DIR, relativePath);
      const fileManifest = await copyFile(filePath, destPath);
      manifest.push(fileManifest);
      totalSize += fileManifest.size;
      
      if (manifest.length % 50 === 0) {
        process.stdout.write(`\rExported ${manifest.length} files...`);
      }
    }
  }
  
  process.stdout.write(`\rExported ${manifest.length} files...\n`);
  
  // Copy root files (with transformations)
  console.log('\n📄 Copying root files...');
  for (const rootFile of ROOT_FILES) {
    const srcPath = path.join(process.cwd(), rootFile.src);
    const destPath = path.join(MIRROR_OUT_DIR, rootFile.dest);
    
    try {
      await fs.access(srcPath);
      const fileManifest = await copyFile(srcPath, destPath);
      manifest.push(fileManifest);
      totalSize += fileManifest.size;
      console.log(`  ✅ ${rootFile.src} -> ${rootFile.dest}`);
    } catch (error) {
      if (rootFile.required) {
        console.error(`  ❌ Required file missing: ${rootFile.src}`);
        throw error;
      } else {
        console.log(`  ⚠️  Optional file not found: ${rootFile.src}`);
      }
    }
  }
  
  // Generate manifest
  const mirrorManifest: MirrorManifest = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    files: manifest.sort((a, b) => a.path.localeCompare(b.path)),
    totalSize,
  };
  
  // Write manifest
  const manifestPath = path.join(MIRROR_OUT_DIR, 'mirror-manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(mirrorManifest, null, 2));
  
  return mirrorManifest;
}

async function main() {
  console.log('🔍 Running mirror dry-run...\n');
  
  try {
    const manifest = await exportMirror();
    
    console.log('\n✅ Mirror dry-run complete!\n');
    console.log(`📊 Summary:`);
    console.log(`  Files exported: ${manifest.files.length}`);
    console.log(`  Total size: ${(manifest.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Output directory: ${MIRROR_OUT_DIR}`);
    console.log(`  Manifest: ${path.join(MIRROR_OUT_DIR, 'mirror-manifest.json')}\n`);
    
    // Run verification
    console.log('🔍 Running mirror verification...\n');
    try {
      execSync(`tsx scripts/mirror-verify.ts --path=${MIRROR_OUT_DIR}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      console.log('\n✅ Mirror verification passed!\n');
    } catch (error) {
      console.error('\n❌ Mirror verification failed!');
      console.error('Review the errors above before publishing.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Mirror dry-run error:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
