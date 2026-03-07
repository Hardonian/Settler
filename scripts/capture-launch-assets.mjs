#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, statSync, copyFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const repoRoot = process.cwd();
const defaultRunId = new Date().toISOString().replace(/[:.]/g, "-");

function parseArgs(argv) {
  const modeArg = argv.find((value) => value.startsWith("--mode="));
  const runIdArg = argv.find((value) => value.startsWith("--run-id="));
  const baseUrlArg = argv.find((value) => value.startsWith("--base-url="));

  return {
    mode: modeArg ? modeArg.split("=")[1] : "auto",
    runId: runIdArg ? runIdArg.split("=")[1] : defaultRunId,
    baseUrl: baseUrlArg
      ? baseUrlArg.split("=")[1]
      : (process.env.LAUNCH_CAPTURE_BASE_URL ?? "http://127.0.0.1:3000"),
  };
}

function loadRoutes() {
  const configPath = path.join(repoRoot, "launch", "capture-routes.json");
  const parsed = JSON.parse(readFileSync(configPath, "utf8"));
  if (!Array.isArray(parsed.routes) || parsed.routes.length === 0) {
    throw new Error("launch/capture-routes.json must contain a non-empty routes array.");
  }
  return parsed.routes;
}

function loadLaunchAssetManifest() {
  const manifestPath = path.join(repoRoot, "launch", "assets-manifest.json");
  const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(parsed.assets) || parsed.assets.length === 0) {
    throw new Error("launch/assets-manifest.json must contain assets.");
  }
  return parsed.assets;
}

function sanitizeSegment(input) {
  return (
    input
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "root"
  );
}

function checksum(bufferOrText) {
  return createHash("sha256").update(bufferOrText).digest("hex");
}

async function captureWithPlaywright(args, routes, outputDir) {
  const logs = [];
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (error) {
    logs.push(
      `Playwright import failed: ${error instanceof Error ? error.message : String(error)}`
    );
    return { ok: false, logs, artifacts: [], failure: "playwright_import_failed" };
  }

  let browser;
  const artifacts = [];
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-setuid-sandbox",
      ],
    });

    for (const route of routes) {
      const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
      const routePath = route.path;
      const slug = sanitizeSegment(routePath === "/" ? "home" : routePath);
      const url = new URL(routePath, args.baseUrl).toString();

      logs.push(`Capturing screenshot ${url}`);
      await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
      const pngPath = path.join(outputDir, `${slug}.png`);
      await page.screenshot({ path: pngPath, fullPage: true });
      await page.close();

      artifacts.push({
        type: "screenshot",
        route: routePath,
        path: path.relative(repoRoot, pngPath),
      });
    }

    return { ok: true, logs, artifacts, origin: "primary-playwright" };
  } catch (error) {
    logs.push(
      `Playwright capture failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`
    );
    return { ok: false, logs, artifacts, failure: "playwright_capture_failed" };
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}

async function captureFallback(outputDir) {
  const logs = [];
  const artifacts = [];
  const launchAssets = loadLaunchAssetManifest();

  const copiedDir = path.join(outputDir, "launch-manifest-assets");
  mkdirSync(copiedDir, { recursive: true });

  for (const asset of launchAssets) {
    const sourcePath = path.join(repoRoot, asset.path);
    const sourceStats = statSync(sourcePath);
    if (!sourceStats.isFile() || sourceStats.size <= 0) {
      throw new Error(`Fallback source asset missing or empty: ${asset.path}`);
    }

    const fileBuffer = readFileSync(sourcePath);
    const copiedPath = path.join(copiedDir, path.basename(asset.path));
    copyFileSync(sourcePath, copiedPath);

    const metadata = {
      sourcePath: asset.path,
      copiedPath: path.relative(repoRoot, copiedPath),
      bytes: sourceStats.size,
      sha256: checksum(fileBuffer),
      capturedAt: new Date().toISOString(),
    };

    const metadataPath = `${copiedPath}.json`;
    writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf8");

    artifacts.push({ type: "launch-doc", path: path.relative(repoRoot, copiedPath) });
    artifacts.push({ type: "metadata", path: path.relative(repoRoot, metadataPath) });
    logs.push(`Fallback captured ${asset.path}`);
  }

  return { ok: true, logs, artifacts, origin: "fallback-launch-manifest" };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const routes = loadRoutes();

  const outputDir = path.join(repoRoot, "artifacts", "launch", args.runId);
  mkdirSync(outputDir, { recursive: true });

  const diagnostics = [];
  let selectedMode = args.mode;
  let result = { ok: false, logs: [], artifacts: [] };

  if (args.mode === "primary" || args.mode === "auto") {
    selectedMode = "primary";
    result = await captureWithPlaywright(args, routes, outputDir);
    diagnostics.push(...result.logs);
  }

  let primaryFailure = null;
  if ((args.mode === "fallback" || args.mode === "auto") && !result.ok) {
    primaryFailure = result.failure || "primary_capture_failed";
    selectedMode = "fallback";
    const fallbackResult = await captureFallback(outputDir);
    diagnostics.push(`Primary capture failed (${primaryFailure}); fallback capture engaged.`);
    diagnostics.push(...fallbackResult.logs);
    result = fallbackResult;
  }

  const manifest = {
    runId: args.runId,
    mode: selectedMode,
    origin:
      result.origin ||
      (selectedMode === "primary" ? "primary-playwright" : "fallback-launch-manifest"),
    primaryFailure,
    baseUrl: args.baseUrl,
    createdAt: new Date().toISOString(),
    success: result.ok,
    routes,
    artifacts: result.artifacts,
    diagnostics,
  };

  const manifestPath = path.join(outputDir, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  writeFileSync(
    path.join(repoRoot, "artifacts", "launch", "latest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  for (const line of diagnostics) console.log(line);
  console.log(`Launch artifact manifest: ${path.relative(repoRoot, manifestPath)}`);

  if (!result.ok || result.artifacts.length === 0) {
    throw new Error("No launch artifacts were generated.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
