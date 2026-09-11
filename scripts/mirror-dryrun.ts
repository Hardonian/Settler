#!/usr/bin/env tsx
/**
 * Mirror Dry-Run Tool
 *
 * Exports allowlisted OSS_PUBLIC files to ./.mirror-out/ for verification and publishing.
 * Generates mirror-manifest.json listing every exported file, byte size, and SHA-256 hash.
 * Synthesizes public root manifests (package.json, pnpm-workspace.yaml, tsconfig.json)
 * so open-source contributors can build and test packages without private monorepo dependencies.
 *
 * Usage:
 *   pnpm mirror:dryrun
 *   pnpm mirror:dryrun --json
 *   pnpm mirror:dryrun --no-verify
 */

import * as fs from "fs/promises";
import * as path from "path";
import { createHash } from "crypto";
import { glob } from "glob";
import { execSync } from "child_process";

const MIRROR_OUT_DIR = "./.mirror-out";

// OSS_PUBLIC allowlist (must match classification spec)
const OSS_ALLOWLIST_PATTERNS = [
  "packages/sdk/**",
  "packages/sdk-python/**",
  "packages/sdk-go/**",
  "packages/sdk-ruby/**",
  "packages/api-client/**",
  "packages/protocol/**",
  "packages/react-settler/**",
  "packages/cli/**",
  "crates/**",
  "docs/public/**",
  "examples/**",
];

// Root files to copy (with transformations)
const ROOT_FILES = [
  { src: "README.public.md", dest: "README.md", required: false },
  { src: "LICENSE", dest: "LICENSE", required: false },
  { src: "CONTRIBUTING.md", dest: "CONTRIBUTING.md", required: false },
  { src: "SECURITY.md", dest: "SECURITY.md", required: false },
  { src: "CODE_OF_CONDUCT.md", dest: "CODE_OF_CONDUCT.md", required: false },
  { src: ".gitignore", dest: ".gitignore", required: false },
  { src: "Cargo.toml", dest: "Cargo.toml", required: false },
  { src: "Cargo.lock", dest: "Cargo.lock", required: false },
];

export interface FileManifest {
  path: string;
  hash: string;
  size: number;
}

export interface MirrorManifest {
  version: string;
  timestamp: string;
  files: FileManifest[];
  totalSize: number;
}

export function matchesPattern(filePath: string, patterns: string[]): boolean {
  const normalizedPath = filePath.replace(/\\/g, "/");
  return patterns.some((pattern) => {
    const placeholder = "___GLOBSTAR___";
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, placeholder)
      .replace(/\*/g, "[^/]*")
      .split(placeholder)
      .join(".*");
    const regex = new RegExp("^" + escaped + "$");
    return regex.test(normalizedPath);
  });
}

async function getAllFiles(rootDir: string = "."): Promise<string[]> {
  const ignorePatterns = [
    "**/node_modules/**",
    "**/.git/**",
    "**/.next/**",
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "**/.turbo/**",
    "**/.vercel/**",
    "**/.mirror-out/**",
    "**/artifacts/**",
    "**/target/**",
  ];

  const allFiles = await glob("**/*", {
    cwd: rootDir,
    ignore: ignorePatterns,
    nodir: true,
  });

  return allFiles.map((f) => path.resolve(rootDir, f));
}

function calculateFileHash(content: Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

function sanitizePackageJson(rawJson: string): string {
  try {
    const pkg = JSON.parse(rawJson);

    // Sanitize scripts so they do not reference monorepo-internal tools
    if (pkg.scripts) {
      delete pkg.scripts.prebuild;
      delete pkg.scripts.pretest;
      delete pkg.scripts.pretypecheck;
      delete pkg.scripts.prelint;

      for (const [key, val] of Object.entries(pkg.scripts)) {
        if (typeof val === "string") {
          pkg.scripts[key] = val
            .replace(/node\s+\.\.\/\.\.\/scripts\/run-package-tsc-build\.mjs/g, "tsc")
            .replace(/node\s+scripts\/assert-node-version\.mjs\s*&&\s*/g, "");
        }
      }
    }

    // Remove private workspace dependencies not distributed in public mirror
    if (pkg.dependencies && pkg.dependencies["@jobforge/sdk-ts"]) {
      delete pkg.dependencies["@jobforge/sdk-ts"];
    }

    return JSON.stringify(pkg, null, 2) + "\n";
  } catch {
    return rawJson;
  }
}

async function copyFile(src: string, dest: string): Promise<FileManifest> {
  let content = await fs.readFile(src);

  // Sanitize exported package.json files
  if (path.basename(dest) === "package.json") {
    const sanitized = sanitizePackageJson(content.toString("utf-8"));
    content = Buffer.from(sanitized, "utf-8");
  }

  const hash = calculateFileHash(content);

  // Ensure destination directory exists
  await fs.mkdir(path.dirname(dest), { recursive: true });

  // Copy file
  await fs.writeFile(dest, content);

  return {
    path: path.relative(MIRROR_OUT_DIR, dest).replace(/\\/g, "/"),
    hash,
    size: content.length,
  };
}

async function synthesizeRootConfigurations(): Promise<FileManifest[]> {
  const manifests: FileManifest[] = [];

  // 1. Root package.json
  const rootPkg = {
    name: "settler-oss",
    version: "1.0.0",
    private: true,
    description: "Settler Open-Source Core - SDK, CLI, Rust Kernel & WASM Verifier",
    packageManager: "pnpm@10.13.1",
    engines: {
      node: ">=24.0.0 <25.0.0",
      pnpm: ">=10.0.0",
    },
    workspaces: ["packages/*"],
    scripts: {
      build: "pnpm --filter @settler/sdk run build",
      test: "pnpm --filter @settler/sdk run test",
      typecheck: "pnpm --filter @settler/sdk run typecheck",
      "cargo:check": "cargo check --workspace",
      "cargo:test": "cargo test --workspace",
    },
    license: "MIT",
  };
  const pkgContent = Buffer.from(JSON.stringify(rootPkg, null, 2) + "\n", "utf-8");
  const pkgDest = path.join(MIRROR_OUT_DIR, "package.json");
  await fs.writeFile(pkgDest, pkgContent);
  manifests.push({
    path: "package.json",
    hash: calculateFileHash(pkgContent),
    size: pkgContent.length,
  });

  // 2. Root pnpm-workspace.yaml
  const workspaceYaml = [
    "packages:",
    "  - 'packages/*'",
    "  - '!packages/sdk-go'",
    "  - '!packages/sdk-python'",
    "  - '!packages/sdk-ruby'",
    "",
  ].join("\n");
  const wsContent = Buffer.from(workspaceYaml, "utf-8");
  const wsDest = path.join(MIRROR_OUT_DIR, "pnpm-workspace.yaml");
  await fs.writeFile(wsDest, wsContent);
  manifests.push({
    path: "pnpm-workspace.yaml",
    hash: calculateFileHash(wsContent),
    size: wsContent.length,
  });

  // 3. Root tsconfig.json
  const rootTsconfig = {
    compilerOptions: {
      jsx: "react-jsx",
      target: "ES2022",
      lib: ["ES2022"],
      module: "commonjs",
      moduleResolution: "node",
      ignoreDeprecations: "6.0",
      esModuleInterop: true,
      strict: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      strictBindCallApply: true,
      strictPropertyInitialization: true,
      noImplicitThis: true,
      alwaysStrict: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      noUncheckedIndexedAccess: true,
      noImplicitOverride: true,
      exactOptionalPropertyTypes: false,
      noEmitOnError: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      composite: true,
      types: ["node", "jest"],
      paths: {
        "@settler/sdk": ["./packages/sdk/src"],
        "@settler/cli": ["./packages/cli/src"],
        "@settler/protocol": ["./packages/protocol/src"],
        "@settler/react-settler": ["./packages/react-settler/src"],
      },
    },
    exclude: ["node_modules", "dist", "build"],
  };
  const tsContent = Buffer.from(JSON.stringify(rootTsconfig, null, 2) + "\n", "utf-8");
  const tsDest = path.join(MIRROR_OUT_DIR, "tsconfig.json");
  await fs.writeFile(tsDest, tsContent);
  manifests.push({
    path: "tsconfig.json",
    hash: calculateFileHash(tsContent),
    size: tsContent.length,
  });

  return manifests;
}

export async function exportMirror(): Promise<MirrorManifest> {
  console.log("🧹 Cleaning mirror output directory...");
  if (
    await fs
      .access(MIRROR_OUT_DIR)
      .then(() => true)
      .catch(() => false)
  ) {
    await fs.rm(MIRROR_OUT_DIR, { recursive: true });
  }
  await fs.mkdir(MIRROR_OUT_DIR, { recursive: true });

  console.log("📦 Collecting OSS_PUBLIC files...\n");

  const allFiles = await getAllFiles();
  const manifest: FileManifest[] = [];
  let totalSize = 0;

  // Export allowlisted files
  for (const filePath of allFiles) {
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");

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
  console.log("\n📄 Copying root files...");
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

  // Synthesize standalone public root workspace files
  console.log("\n⚙️  Synthesizing public workspace configuration...");
  const synthesizedManifests = await synthesizeRootConfigurations();
  for (const syn of synthesizedManifests) {
    manifest.push(syn);
    totalSize += syn.size;
    console.log(`  ✅ Synthesized ${syn.path}`);
  }

  // Generate manifest
  const mirrorManifest: MirrorManifest = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    files: manifest.sort((a, b) => a.path.localeCompare(b.path)),
    totalSize,
  };

  // Write manifest
  const manifestPath = path.join(MIRROR_OUT_DIR, "mirror-manifest.json");
  await fs.writeFile(manifestPath, JSON.stringify(mirrorManifest, null, 2));

  return mirrorManifest;
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes("--json");
  const skipVerify = args.includes("--no-verify");

  if (!jsonOutput) {
    console.log("🔍 Running mirror dry-run...\n");
  }

  try {
    const manifest = await exportMirror();

    if (jsonOutput) {
      console.log(
        JSON.stringify(
          {
            success: true,
            files: manifest.files.length,
            totalSize: manifest.totalSize,
            totalSizeMb: (manifest.totalSize / 1024 / 1024).toFixed(2),
            timestamp: manifest.timestamp,
            outDir: MIRROR_OUT_DIR,
          },
          null,
          2
        )
      );
      return;
    }

    console.log("\n✅ Mirror dry-run complete!\n");
    console.log(`📊 Summary:`);
    console.log(`  Files exported:   ${manifest.files.length}`);
    console.log(`  Total size:       ${(manifest.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Output directory: ${MIRROR_OUT_DIR}`);
    console.log(`  Manifest:         ${path.join(MIRROR_OUT_DIR, "mirror-manifest.json")}\n`);

    // Run verification
    if (!skipVerify) {
      console.log("🔍 Running mirror verification...\n");
      try {
        execSync(`tsx scripts/mirror-verify.ts --path=${MIRROR_OUT_DIR}`, {
          stdio: "inherit",
          cwd: process.cwd(),
        });
        console.log("\n✅ Mirror verification passed!\n");
      } catch {
        console.error("\n❌ Mirror verification failed!");
        console.error("Review the errors above before publishing.\n");
        process.exit(1);
      }
    }
  } catch (error) {
    console.error("❌ Mirror dry-run error:", error);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}
