#!/usr/bin/env tsx
/**
 * Mirror Publish Tool
 *
 * Publishes mirror export to public repository.
 * Requires mirror:dryrun to pass first.
 *
 * Usage:
 *   pnpm mirror:publish
 *   pnpm mirror:publish --remote public
 */

import { execSync } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";

const MIRROR_OUT_DIR = "./.mirror-out";
const DEFAULT_REMOTE = "public";

async function checkDryRun(): Promise<boolean> {
  try {
    await fs.access(path.join(MIRROR_OUT_DIR, "mirror-manifest.json"));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const remote = args.find((arg) => arg.startsWith("--remote="))?.split("=")[1] || DEFAULT_REMOTE;

  console.log("🚀 Publishing mirror to public repository...\n");

  // Check if dry-run was run
  if (!(await checkDryRun())) {
    console.error("❌ Mirror dry-run not found. Run `pnpm mirror:dryrun` first.\n");
    process.exit(1);
  }

  // Verify dry-run passed
  console.log("🔍 Verifying dry-run output...\n");
  try {
    execSync(`tsx scripts/mirror-verify.ts --path=${MIRROR_OUT_DIR}`, {
      stdio: "inherit",
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error("\n❌ Mirror verification failed. Cannot publish.\n");
    process.exit(1);
  }

  // Check if remote exists
  try {
    execSync(`git remote get-url ${remote}`, { stdio: "pipe" });
  } catch (error) {
    console.error(`❌ Git remote '${remote}' not found.`);
    console.error(`   Add it with: git remote add ${remote} <public-repo-url>\n`);
    process.exit(1);
  }

  console.log(`\n📤 Publishing to remote: ${remote}\n`);
  console.log("⚠️  This will push to the public repository.");
  console.log("⚠️  Make sure you have verified the mirror export.\n");

  // For now, just output instructions
  // In production, this would:
  // 1. Create a temporary git repo in .mirror-out
  // 2. Initialize git, add files, commit
  // 3. Push to public remote

  console.log("📝 Manual publish steps:");
  console.log(`   1. cd ${MIRROR_OUT_DIR}`);
  console.log("   2. git init");
  console.log("   3. git add .");
  console.log('   4. git commit -m "chore: sync OSS mirror"');
  console.log(`   5. git remote add ${remote} <public-repo-url>`);
  console.log(`   6. git push ${remote} main --force\n`);

  console.log("💡 For automated publishing, configure GitHub Actions workflow.\n");
}

main().catch((error) => {
  console.error("❌ Publish error:", error);
  process.exit(1);
});
