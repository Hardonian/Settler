#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.DEMO_BASE_URL ?? 'http://127.0.0.1:3000';
const outDir = path.resolve('docs/assets');
const statusPath = path.join(outDir, 'demo-assets-status.json');

const targets = [
  { name: 'operator-dashboard', route: '/app' },
  { name: 'run-explorer', route: '/app/runs' },
  { name: 'truth-explorer', route: '/app/proofs' },
  { name: 'replay-verification', route: '/app/replay' },
  { name: 'system-health-metrics', route: '/app/system-health' },
];

await fs.mkdir(outDir, { recursive: true });

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch (error) {
  const status = {
    generatedAt: new Date().toISOString(),
    status: 'degraded',
    baseUrl,
    reason: 'playwright dependency unavailable',
    targets,
    error: error instanceof Error ? error.message : String(error),
  };
  await fs.writeFile(statusPath, JSON.stringify(status, null, 2));
  console.warn(`⚠️ demo:assets degraded. Wrote ${statusPath}`);
  process.exit(0);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1720, height: 980 } });
const captured = [];

try {
  for (const target of targets) {
    const url = `${baseUrl}${target.route}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('main', { timeout: 10000 });
    const output = path.join(outDir, `${target.name}.png`);
    await page.screenshot({ path: output, fullPage: true });
    captured.push(path.relative(process.cwd(), output));
    console.log(`captured ${target.name}: ${url}`);
  }
} finally {
  await browser.close();
}

await fs.writeFile(
  statusPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      status: 'ok',
      baseUrl,
      captured,
    },
    null,
    2
  )
);

console.log(`✅ demo:assets completed. Wrote ${statusPath}`);
