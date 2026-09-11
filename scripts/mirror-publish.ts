#!/usr/bin/env tsx
/**
 * Mirror Publish Tool (#96)
 *
 * Publishes allowlisted OSS_PUBLIC export from ./.mirror-out to the public mirror repository.
 * Strictly verifies 100% classification compliance, denylist absence, and secret clearance
 * before performing any staging or pushing operations.
 * Supports automated tag synchronization, live push, dry-run staging, and JSON reporting.
 *
 * Usage:
 *   pnpm mirror:publish                  # Dry-run publish (stage and verify without pushing)
 *   pnpm mirror:publish --publish        # Execute push to configured target remote or URL
 *   pnpm mirror:publish --target=<url>   # Push to explicit repository URL
 *   pnpm mirror:publish --branch=main    # Target branch (defaults to main)
 *   pnpm mirror:publish --sync-tags      # Sync release tags (default: true)
 *   pnpm mirror:publish --tag=v1.0.0     # Explicit release tag
 *   pnpm mirror:publish --json           # Machine-readable JSON summary
 */

import { execSync } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";

const MIRROR_OUT_DIR = path.resolve(process.cwd(), "./.mirror-out");
const DEFAULT_REPO = "Hardonian/settler-oss";
const DEFAULT_BRANCH = "main";
const DEFAULT_REMOTE = "public";

interface PublishOptions {
  publish: boolean;
  remoteName: string;
  targetRepo: string;
  targetUrl?: string;
  branch: string;
  force: boolean;
  autoDryrun: boolean;
  syncTags: boolean;
  explicitTag?: string;
  jsonOutput: boolean;
}

function parseArgs(): PublishOptions {
  const args = process.argv.slice(2);

  const publish = args.includes("--publish");
  const force = !args.includes("--no-force");
  const autoDryrun = !args.includes("--no-auto-dryrun");
  const syncTags = !args.includes("--no-tags");
  const jsonOutput = args.includes("--json");

  const remoteArg = args.find((a) => a.startsWith("--remote="));
  const remoteName = remoteArg
    ? remoteArg.split("=")[1]
    : process.env.PUBLIC_MIRROR_REMOTE || DEFAULT_REMOTE;

  const repoArg = args.find((a) => a.startsWith("--repo="));
  const targetRepo = repoArg
    ? repoArg.split("=")[1]
    : process.env.PUBLIC_MIRROR_REPO || DEFAULT_REPO;

  const urlArg = args.find((a) => a.startsWith("--target=") || a.startsWith("--target-url="));
  const targetUrl = urlArg
    ? urlArg.split("=")[1]
    : process.env.PUBLIC_MIRROR_URL || process.env.PUBLIC_MIRROR_REPO_URL;

  const branchArg = args.find((a) => a.startsWith("--branch="));
  const branch = branchArg
    ? branchArg.split("=")[1]
    : process.env.PUBLIC_MIRROR_BRANCH || DEFAULT_BRANCH;

  const tagArg = args.find((a) => a.startsWith("--tag="));
  const explicitTag = tagArg ? tagArg.split("=")[1] : undefined;

  return {
    publish,
    remoteName,
    targetRepo,
    targetUrl,
    branch,
    force,
    autoDryrun,
    syncTags,
    explicitTag,
    jsonOutput,
  };
}

async function hasDryRunExport(): Promise<boolean> {
  try {
    const manifestPath = path.join(MIRROR_OUT_DIR, "mirror-manifest.json");
    await fs.access(manifestPath);
    const content = await fs.readFile(manifestPath, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.files) && parsed.files.length > 0;
  } catch {
    return false;
  }
}

function runCommand(command: string, cwd: string = process.cwd(), maskSecret?: string): string {
  try {
    const output = execSync(command, {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
      },
    });
    return output.trim();
  } catch (err: any) {
    let message = err.message || String(err);
    if (maskSecret && maskSecret.length > 4) {
      message = message.split(maskSecret).join("***MASKED_SECRET***");
    }
    const stderr = err.stderr ? err.stderr.toString() : "";
    const sanitizedStderr =
      maskSecret && maskSecret.length > 4
        ? stderr.split(maskSecret).join("***MASKED_SECRET***")
        : stderr;
    throw new Error(`Command failed: ${command}\n${sanitizedStderr || message}`);
  }
}

async function verifyMirrorExport(): Promise<void> {
  execSync(`tsx scripts/mirror-verify.ts --path=${MIRROR_OUT_DIR}`, {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}

function getMonorepoMetadata(): {
  sha: string;
  shortSha: string;
  branch: string;
  commitTags: string[];
} {
  try {
    const sha = runCommand("git rev-parse HEAD");
    const shortSha = runCommand("git rev-parse --short HEAD");
    const branch = runCommand("git rev-parse --abbrev-ref HEAD");

    let commitTags: string[] = [];
    try {
      const rawTags = runCommand("git tag --points-at HEAD");
      if (rawTags) {
        commitTags = rawTags
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    } catch {
      // Tags might not be available or shallow clone
    }

    return { sha, shortSha, branch, commitTags };
  } catch {
    return {
      sha: process.env.GITHUB_SHA || "unknown",
      shortSha: (process.env.GITHUB_SHA || "unknown").slice(0, 7),
      branch: process.env.GITHUB_REF_NAME || "main",
      commitTags:
        process.env.GITHUB_REF_TYPE === "tag" && process.env.GITHUB_REF_NAME
          ? [process.env.GITHUB_REF_NAME]
          : [],
    };
  }
}

function resolveTargetPushUrl(options: PublishOptions): {
  url: string;
  maskedUrl: string;
  tokenUsed: boolean;
} {
  const token =
    process.env.PUBLIC_MIRROR_TOKEN ||
    process.env.PUBLIC_MIRROR_GIT_TOKEN ||
    process.env.GITHUB_TOKEN;

  let rawUrl = options.targetUrl;

  if (!rawUrl) {
    // Check if named remote exists in parent repo
    try {
      rawUrl = runCommand(`git remote get-url ${options.remoteName}`);
    } catch {
      // Default to GitHub repo URL
      rawUrl = `https://github.com/${options.targetRepo}.git`;
    }
  }

  // Inject token if authenticated HTTPS URL is needed
  if (token && rawUrl.startsWith("https://") && !rawUrl.includes("@")) {
    const authenticatedUrl = rawUrl.replace("https://", `https://x-access-token:${token}@`);
    const maskedUrl = rawUrl.replace("https://", `https://x-access-token:***@`);
    return { url: authenticatedUrl, maskedUrl, tokenUsed: true };
  }

  return { url: rawUrl, maskedUrl: rawUrl, tokenUsed: Boolean(token) };
}

async function prepareGitRepo(
  metadata: { sha: string; shortSha: string; branch: string; commitTags: string[] },
  options: PublishOptions
): Promise<{
  changed: boolean;
  commitSha: string;
  fileCount: number;
  totalSizeMb: string;
  syncedTags: string[];
}> {
  // Read manifest summary
  const manifestPath = path.join(MIRROR_OUT_DIR, "mirror-manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
  const fileCount = manifest.files.length;
  const totalSizeMb = (manifest.totalSize / 1024 / 1024).toFixed(2);

  // Initialize git repo in .mirror-out if not already
  const gitDir = path.join(MIRROR_OUT_DIR, ".git");
  try {
    await fs.access(gitDir);
  } catch {
    if (!options.jsonOutput) {
      console.log("🌱 Initializing clean git repository in .mirror-out...");
    }
    runCommand(`git init -b ${options.branch}`, MIRROR_OUT_DIR);
  }

  // Configure user
  const authorName = process.env.GIT_AUTHOR_NAME || "github-actions[bot]";
  const authorEmail =
    process.env.GIT_AUTHOR_EMAIL || "github-actions[bot]@users.noreply.github.com";
  runCommand(`git config user.name "${authorName}"`, MIRROR_OUT_DIR);
  runCommand(`git config user.email "${authorEmail}"`, MIRROR_OUT_DIR);
  runCommand(`git config init.defaultBranch ${options.branch}`, MIRROR_OUT_DIR);

  // Stage everything
  runCommand("git add -A", MIRROR_OUT_DIR);

  const status = runCommand("git status --porcelain", MIRROR_OUT_DIR);
  const hasChanges = status.length > 0;

  if (hasChanges) {
    const timestamp = new Date().toISOString();
    const commitMsg = [
      `chore(mirror): sync OSS distribution from Hardonian/Settler@${metadata.shortSha}`,
      "",
      `- Monorepo Commit: ${metadata.sha}`,
      `- Monorepo Branch: ${metadata.branch}`,
      `- Exported Artifacts: ${fileCount} files (${totalSizeMb} MB)`,
      `- Allowlist Compliance: 100% verified (0 denied, 0 secrets, 0 proprietary)`,
      `- Synchronized At: ${timestamp}`,
      "",
      `[skip ci]`,
    ].join("\n");

    // Commit
    runCommand(`git commit -m ${JSON.stringify(commitMsg)}`, MIRROR_OUT_DIR);
    if (!options.jsonOutput) {
      console.log(`✅ Staged and committed changes for OSS mirror (from ${metadata.shortSha}).`);
    }
  } else if (!options.jsonOutput) {
    console.log("ℹ️  No local file changes detected against mirror repository head.");
  }

  let commitSha = "uncommitted";
  try {
    commitSha = runCommand("git rev-parse HEAD", MIRROR_OUT_DIR);
  } catch {
    // Handled
  }

  // Synchronize tags
  const syncedTags: string[] = [];
  const tagsToApply = new Set<string>();

  if (options.explicitTag) {
    tagsToApply.add(options.explicitTag);
  }

  if (options.syncTags && metadata.commitTags.length > 0) {
    for (const tag of metadata.commitTags) {
      tagsToApply.add(tag);
    }
  }

  for (const tag of tagsToApply) {
    try {
      runCommand(
        `git tag -f -a "${tag}" -m "Release ${tag} synced from Hardonian/Settler@${metadata.shortSha}"`,
        MIRROR_OUT_DIR
      );
      syncedTags.push(tag);
    } catch (tagErr: any) {
      if (!options.jsonOutput) {
        console.warn(`⚠️  Failed to create tag ${tag} in mirror:`, tagErr.message);
      }
    }
  }

  return {
    changed: hasChanges,
    commitSha,
    fileCount,
    totalSizeMb,
    syncedTags,
  };
}

async function main() {
  const options = parseArgs();

  if (!options.jsonOutput) {
    console.log("==================================================");
    console.log("🚀 Settler OSS Mirror Synchronization Tool (#96)");
    console.log("==================================================\n");
  }

  // Step 1: Ensure dry-run export exists
  let hasExport = await hasDryRunExport();
  if (!hasExport) {
    if (options.autoDryrun) {
      if (!options.jsonOutput) {
        console.log("📦 No mirror export found. Running `pnpm mirror:dryrun`...");
      }
      execSync("tsx scripts/mirror-dryrun.ts", {
        stdio: options.jsonOutput ? "pipe" : "inherit",
        cwd: process.cwd(),
      });
      hasExport = await hasDryRunExport();
      if (!hasExport) {
        throw new Error("Failed to generate mirror export from `pnpm mirror:dryrun`.");
      }
    } else {
      throw new Error("Mirror export not found in ./.mirror-out. Run `pnpm mirror:dryrun` first.");
    }
  }

  // Step 2: Verification gate
  if (!options.jsonOutput) {
    console.log("🔍 Verifying mirror export integrity & classification boundaries...");
  }
  await verifyMirrorExport();
  if (!options.jsonOutput) {
    console.log("✅ Verification gate passed: all exported files are OSS_PUBLIC compliant.\n");
  }

  // Step 3: Git preparation
  const metadata = getMonorepoMetadata();
  const prep = await prepareGitRepo(metadata, options);
  const target = resolveTargetPushUrl(options);

  if (!options.jsonOutput) {
    console.log(`\n📊 Mirror Status:`);
    console.log(`  Source Commit:    ${metadata.shortSha} (${metadata.branch})`);
    console.log(`  Mirror Commit:    ${prep.commitSha.slice(0, 7)}`);
    console.log(`  Exported Files:   ${prep.fileCount}`);
    console.log(`  Exported Size:    ${prep.totalSizeMb} MB`);
    console.log(`  Target Branch:    ${options.branch}`);
    console.log(`  Target Remote:    ${target.maskedUrl}`);
    console.log(
      `  Auth Configured:  ${target.tokenUsed ? "Yes (token active)" : "No (using environment SSH/credentials)"}`
    );
    if (prep.syncedTags.length > 0) {
      console.log(`  Release Tags:     ${prep.syncedTags.join(", ")}`);
    }
    console.log(
      `  Publish Mode:     ${options.publish ? "🚀 LIVE PUBLISH" : "🧪 DRY RUN (no push)"}\n`
    );
  }

  // Step 4: Publish if enabled
  if (options.publish) {
    if (!options.jsonOutput) {
      console.log(`📤 Pushing mirror export to ${target.maskedUrl} (${options.branch})...`);
    }

    const token =
      process.env.PUBLIC_MIRROR_TOKEN ||
      process.env.PUBLIC_MIRROR_GIT_TOKEN ||
      process.env.GITHUB_TOKEN;

    const pushArgs = [options.force ? "--force" : "", `"${target.url}"`, `HEAD:${options.branch}`]
      .filter(Boolean)
      .join(" ");

    try {
      runCommand(`git push ${pushArgs}`, MIRROR_OUT_DIR, token);
      if (!options.jsonOutput) {
        console.log(
          `✨ Successfully published OSS mirror to ${target.maskedUrl}:${options.branch}!`
        );
      }

      // Push release tags if any were created
      if (prep.syncedTags.length > 0) {
        for (const tag of prep.syncedTags) {
          if (!options.jsonOutput) {
            console.log(`🏷️  Pushing tag ${tag} to ${target.maskedUrl}...`);
          }
          runCommand(`git push "${target.url}" "${tag}" --force`, MIRROR_OUT_DIR, token);
        }
        if (!options.jsonOutput) {
          console.log(`✅ All release tags synchronized successfully.`);
        }
      }
    } catch (err: any) {
      console.error("\n❌ Push failed:", err.message);
      process.exit(1);
    }
  } else if (!options.jsonOutput) {
    console.log("💡 Dry run complete. To publish to the public mirror, run:");
    console.log(`   pnpm mirror:publish --publish\n`);
  }

  if (options.jsonOutput) {
    console.log(
      JSON.stringify(
        {
          success: true,
          mode: options.publish ? "LIVE" : "DRY_RUN",
          sourceCommit: metadata.sha,
          mirrorCommit: prep.commitSha,
          files: prep.fileCount,
          totalSizeMb: prep.totalSizeMb,
          targetRepo: options.targetRepo,
          targetBranch: options.branch,
          tags: prep.syncedTags,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );
  }
}

main().catch((err) => {
  console.error("\n❌ Mirror publish failed:", err.message || err);
  process.exit(1);
});
