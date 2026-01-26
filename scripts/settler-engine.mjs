import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
if (!args.includes('--input')) {
  console.error('Usage: node scripts/settler-engine.mjs --input <engine_input.json>');
  process.exit(1);
}

const platform = process.platform === 'win32' ? 'settler-engine.exe' : 'settler-engine';
const envBinary = process.env.SETTLER_ENGINE_BIN;
const binDir = path.join(repoRoot, 'tools', 'settler-engine', 'bin');
const localBinary = path.join(binDir, platform);
const candidates = [envBinary, localBinary].filter(Boolean);

let binaryPath = candidates.find((candidate) => candidate && existsSync(candidate));

if (!binaryPath) {
  mkdirSync(binDir, { recursive: true });
  const build = spawnSync('go', ['build', '-o', localBinary, './tools/settler-engine'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  if (build.status !== 0) {
    console.error('Failed to build settler-engine binary. Set SETTLER_ENGINE_BIN to a prebuilt binary.');
    process.exit(1);
  }
  binaryPath = localBinary;
}

const run = spawnSync(binaryPath, args, { stdio: 'inherit' });
if (run.status !== 0) {
  process.exit(run.status ?? 1);
}
