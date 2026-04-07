#!/usr/bin/env node

/**
 * Node version assertion script.
 *
 * Modes:
 *   (default)   Hard-fail if Node major version doesn't match .nvmrc.
 *               Used by prebuild, predev, prelint, pretest, pretypecheck, preverify.
 *
 *   --warn-only Emit a warning but exit 0 so the command continues.
 *               Used by preinstall so that evaluators / contributors on Node 22 can
 *               still run `pnpm install` and explore the codebase.
 *               CI and Vercel pin the correct version via .nvmrc / nodeVersion anyway.
 */

import nodeContract from "./node-version-contract.cjs";

const warnOnly = process.argv.includes("--warn-only");
const { requiredVersion, requiredRange } = nodeContract.formatNodeRequirement();

try {
  nodeContract.assertSupportedNodeVersion("Node/runtime gate");
  console.log(
    `✅ Node runtime OK (${process.version}; required ${requiredVersion}, ${requiredRange})`
  );
} catch (err) {
  if (warnOnly) {
    console.warn(
      `⚠️  Node version warning: ${err.message}\n` +
        `   pnpm install will proceed, but dev/build commands require Node ${requiredVersion}.\n` +
        `   Run: nvm use  (or: fnm use / mise use)  to switch to the correct version.`
    );
    // Exit 0 — install can continue; wrong-version errors will surface at build/dev time.
    process.exit(0);
  }
  console.error(`❌ ${err.message}`);
  process.exit(1);
}
