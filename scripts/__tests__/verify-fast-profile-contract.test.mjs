/**
 * Contract: `verify:fast` must not include internal link crawl (see `scripts/assert-verify-fast-profile.mjs`).
 */
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const verifyReleasePath = join(root, "..", "verify-release.mjs");

test("fast profile excludes linkIntegrity; fast-with-links includes it", () => {
  const src = readFileSync(verifyReleasePath, "utf8");
  const fastMatch = src.match(/fast:\s*\[([\s\S]*?)\],/);
  assert.ok(fastMatch, "expected fast profile block");
  assert.ok(!fastMatch[1].includes("linkIntegrity"), "fast must not include linkIntegrity");
  assert.ok(
    fastMatch[1].includes("reconciliationCoreDist"),
    "fast must include reconciliationCoreDist"
  );

  const withLinks = src.match(/"fast-with-links":\s*\[([\s\S]*?)\],/);
  assert.ok(withLinks, "expected fast-with-links profile block");
  assert.ok(withLinks[1].includes("linkIntegrity"), "fast-with-links must include linkIntegrity");
  assert.ok(
    withLinks[1].includes("reconciliationCoreDist"),
    "fast-with-links must include reconciliationCoreDist"
  );
});
