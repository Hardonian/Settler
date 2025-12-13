#!/usr/bin/env tsx
/**
 * Auto-Run Migrations and Scripts
 * 
 * This script detects new migrations and scripts, runs them, and archives completed ones.
 * It maintains a log of what has been executed to avoid re-running completed items.
 * 
 * Usage:
 *   tsx scripts/auto-run-migrations.ts [--dry-run] [--check-only]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { execSync } from 'child_process';

interface ExecutionLog {
  prisma_migrations: Array<{
    path: string;
    archived_at: string;
    archive_path: string;
    pr_number?: string;
    executed_at: string;
  }>;
  supabase_migrations: Array<{
    path: string;
    archived_at: string;
    archive_path: string;
    pr_number?: string;
    executed_at: string;
  }>;
  scripts: Array<{
    path: string;
    archived_at: string;
    archive_path: string;
    pr_number?: string;
    executed_at: string;
  }>;
  last_updated: string;
}

const EXECUTION_LOG_PATH = '.migration-execution-log.json';
const ARCHIVE_BASE = 'archive';
const PRISMA_MIGRATIONS_DIR = 'prisma/migrations';
const SUPABASE_MIGRATIONS_DIR = 'supabase/migrations';
const SCRIPTS_DIR = 'scripts';

// Scripts to exclude from auto-execution
const EXCLUDED_SCRIPTS = [
  'migration-guardian',
  'validate-',
  'check-',
  'verify-',
  'monitor-',
  'maintainer-',
  'test-',
  'setup-',
  'backup-',
  'cleanup-',
];

function loadExecutionLog(): ExecutionLog {
  if (existsSync(EXECUTION_LOG_PATH)) {
    try {
      return JSON.parse(readFileSync(EXECUTION_LOG_PATH, 'utf-8'));
    } catch (error) {
      console.warn('⚠️  Failed to parse execution log, creating new one');
    }
  }
  
  return {
    prisma_migrations: [],
    supabase_migrations: [],
    scripts: [],
    last_updated: new Date().toISOString(),
  };
}

function saveExecutionLog(log: ExecutionLog): void {
  log.last_updated = new Date().toISOString();
  writeFileSync(EXECUTION_LOG_PATH, JSON.stringify(log, null, 2));
}

function hasBeenExecuted(log: ExecutionLog, path: string, type: 'prisma' | 'supabase' | 'script'): boolean {
  const list = type === 'prisma' 
    ? log.prisma_migrations 
    : type === 'supabase' 
    ? log.supabase_migrations 
    : log.scripts;
  
  return list.some(item => item.path === path);
}

function detectPrismaMigrations(log: ExecutionLog): string[] {
  if (!existsSync(PRISMA_MIGRATIONS_DIR)) {
    return [];
  }

  const migrations: string[] = [];
  const dirs = readdirSync(PRISMA_MIGRATIONS_DIR, { withFileTypes: true });

  for (const dir of dirs) {
    if (dir.isDirectory()) {
      const migrationFile = join(PRISMA_MIGRATIONS_DIR, dir.name, 'migration.sql');
      if (existsSync(migrationFile) && !hasBeenExecuted(log, migrationFile, 'prisma')) {
        migrations.push(migrationFile);
      }
    }
  }

  return migrations.sort();
}

function detectSupabaseMigrations(log: ExecutionLog): string[] {
  if (!existsSync(SUPABASE_MIGRATIONS_DIR)) {
    return [];
  }

  const migrations: string[] = [];
  const files = readdirSync(SUPABASE_MIGRATIONS_DIR);

  for (const file of files) {
    if (file.endsWith('.sql') && !file.includes('rollback')) {
      const migrationPath = join(SUPABASE_MIGRATIONS_DIR, file);
      if (!hasBeenExecuted(log, migrationPath, 'supabase')) {
        migrations.push(migrationPath);
      }
    }
  }

  return migrations.sort();
}

function detectScripts(log: ExecutionLog): string[] {
  if (!existsSync(SCRIPTS_DIR)) {
    return [];
  }

  const scripts: string[] = [];
  const files = readdirSync(SCRIPTS_DIR);

  for (const file of files) {
    const ext = extname(file);
    if (['.ts', '.js', '.sh'].includes(ext)) {
      // Skip excluded scripts
      if (EXCLUDED_SCRIPTS.some(excluded => file.includes(excluded))) {
        continue;
      }

      const scriptPath = join(SCRIPTS_DIR, file);
      if (!hasBeenExecuted(log, scriptPath, 'script')) {
        scripts.push(scriptPath);
      }
    }
  }

  return scripts.sort();
}

function archiveFile(sourcePath: string, archiveSubDir: string, timestamp: string): string {
  const archiveDir = join(ARCHIVE_BASE, archiveSubDir);
  if (!existsSync(archiveDir)) {
    mkdirSync(archiveDir, { recursive: true });
  }

  const fileName = basename(sourcePath);
  const ext = extname(fileName);
  const nameWithoutExt = basename(fileName, ext);
  const archiveFileName = `${nameWithoutExt}_${timestamp}${ext}`;
  const archivePath = join(archiveDir, archiveFileName);

  // For Prisma migrations, copy the entire directory
  if (sourcePath.includes('prisma/migrations')) {
    const sourceDir = dirname(sourcePath);
    const dirName = basename(sourceDir);
    const archiveDirPath = join(archiveDir, `${dirName}_${timestamp}`);
    execSync(`cp -r "${sourceDir}" "${archiveDirPath}"`, { stdio: 'inherit' });
    return archiveDirPath;
  }

  copyFileSync(sourcePath, archivePath);
  return archivePath;
}

function runPrismaMigrations(migrations: string[], dryRun: boolean): void {
  if (migrations.length === 0) return;

  console.log(`\n🔄 Running ${migrations.length} Prisma migration(s)...`);
  migrations.forEach(m => console.log(`  - ${m}`));

  if (dryRun) {
    console.log('  [DRY RUN] Would execute: npm run prisma:migrate');
    return;
  }

  try {
    execSync('npm run prisma:migrate', { stdio: 'inherit', env: process.env });
    console.log('✅ Prisma migrations completed');
  } catch (error) {
    console.error('❌ Prisma migrations failed');
    throw error;
  }
}

function runSupabaseMigrations(migrations: string[], dryRun: boolean): void {
  if (migrations.length === 0) return;

  console.log(`\n🔄 Running ${migrations.length} Supabase migration(s)...`);
  migrations.forEach(m => console.log(`  - ${m}`));

  if (dryRun) {
    console.log('  [DRY RUN] Would execute: npm run db:migrate:auto');
    return;
  }

  try {
    execSync('npm run db:migrate:auto', { stdio: 'inherit', env: process.env });
    console.log('✅ Supabase migrations completed');
  } catch (error) {
    console.error('❌ Supabase migrations failed');
    throw error;
  }
}

function runScript(scriptPath: string, dryRun: boolean): void {
  const ext = extname(scriptPath);

  if (dryRun) {
    console.log(`  [DRY RUN] Would execute: ${scriptPath}`);
    return;
  }

  try {
    if (ext === '.ts') {
      execSync(`npx tsx "${scriptPath}"`, { stdio: 'inherit', env: process.env });
    } else if (ext === '.js') {
      execSync(`node "${scriptPath}"`, { stdio: 'inherit', env: process.env });
    } else if (ext === '.sh') {
      execSync(`bash "${scriptPath}"`, { stdio: 'inherit', env: process.env });
    }
    console.log(`✅ Completed: ${scriptPath}`);
  } catch (error) {
    console.error(`❌ Script ${scriptPath} failed`);
    throw error;
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const checkOnly = args.includes('--check-only');

  console.log('🔍 Auto-Run Migrations and Scripts');
  console.log('=====================================\n');

  const log = loadExecutionLog();
  console.log(`📋 Loaded execution log (${log.prisma_migrations.length} Prisma, ${log.supabase_migrations.length} Supabase, ${log.scripts.length} scripts)`);

  // Detect new items
  const prismaMigrations = detectPrismaMigrations(log);
  const supabaseMigrations = detectSupabaseMigrations(log);
  const scripts = detectScripts(log);

  console.log(`\n📊 Detection Results:`);
  console.log(`  - Prisma migrations: ${prismaMigrations.length}`);
  console.log(`  - Supabase migrations: ${supabaseMigrations.length}`);
  console.log(`  - Scripts: ${scripts.length}`);

  if (prismaMigrations.length === 0 && supabaseMigrations.length === 0 && scripts.length === 0) {
    console.log('\n✅ No new migrations or scripts to run');
    return;
  }

  if (checkOnly) {
    console.log('\n📋 Check-only mode - not executing anything');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  try {
    // Run Prisma migrations
    runPrismaMigrations(prismaMigrations, dryRun);

    // Run Supabase migrations
    runSupabaseMigrations(supabaseMigrations, dryRun);

    // Run scripts
    if (scripts.length > 0) {
      console.log(`\n🔄 Running ${scripts.length} script(s)...`);
      scripts.forEach(script => {
        console.log(`\n📜 Running: ${script}`);
        runScript(script, dryRun);
      });
    }

    // Archive and update log
    if (!dryRun) {
      console.log('\n📦 Archiving completed items...');

      prismaMigrations.forEach(migration => {
        const archivePath = archiveFile(migration, 'completed-migrations/prisma', timestamp);
        log.prisma_migrations.push({
          path: migration,
          archived_at: timestamp,
          archive_path: archivePath,
          executed_at: new Date().toISOString(),
        });
        console.log(`  ✅ Archived: ${migration} -> ${archivePath}`);
      });

      supabaseMigrations.forEach(migration => {
        const archivePath = archiveFile(migration, 'completed-migrations/supabase', timestamp);
        log.supabase_migrations.push({
          path: migration,
          archived_at: timestamp,
          archive_path: archivePath,
          executed_at: new Date().toISOString(),
        });
        console.log(`  ✅ Archived: ${migration} -> ${archivePath}`);
      });

      scripts.forEach(script => {
        const archivePath = archiveFile(script, 'completed-scripts', timestamp);
        log.scripts.push({
          path: script,
          archived_at: timestamp,
          archive_path: archivePath,
          executed_at: new Date().toISOString(),
        });
        console.log(`  ✅ Archived: ${script} -> ${archivePath}`);
      });

      saveExecutionLog(log);
      console.log('\n✅ Execution log updated');
    }

    console.log('\n✅ All migrations and scripts processed successfully!');
  } catch (error) {
    console.error('\n❌ Execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { detectPrismaMigrations, detectSupabaseMigrations, detectScripts, loadExecutionLog };
