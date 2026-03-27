#!/usr/bin/env node
/**
 * Ensures `verify:fast` stays release-critical: internal link crawl is opt-in via `verify:fast:with-links`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "verify-release.mjs"), "utf8");

const fastMatch = src.match(/fast:\s*\[([\s\S]*?)\],/);
if (!fastMatch) {
  console.error("Could not parse `fast` profile in scripts/verify-release.mjs");
  process.exit(1);
}
const fastBody = fastMatch[1];
if (fastBody.includes("linkIntegrity")) {
  console.error(
    "`fast` profile must not include `linkIntegrity`; use profile `fast-with-links` or `pnpm verify:internal-links`."
  );
  process.exit(1);
}

const fastWithLinksMatch = src.match(/"fast-with-links":\s*\[([\s\S]*?)\],/);
if (!fastWithLinksMatch) {
  console.error('Could not parse `fast-with-links` profile in scripts/verify-release.mjs');
  process.exit(1);
}
if (!fastWithLinksMatch[1].includes("linkIntegrity")) {
  console.error("`fast-with-links` profile must include `linkIntegrity` after `routes`.");
  process.exit(1);
}

console.log("✅ verify:fast profile contract OK (link integrity is opt-in).");
