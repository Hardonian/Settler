import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";

const json = '{"a":1,"b":"line-feed"}';

test("ts/cpp canonical hash parity", () => {
  const tsHash = execSync(
    `pnpm --filter @settler/cli exec tsx -e "import { canonicalHash } from '../../packages/hash/canonical_hash.ts'; console.log(canonicalHash(JSON.parse(process.argv[1])));" '${json}'`,
    { encoding: "utf8" }
  ).trim();
  execSync("g++ kernel/hash/canonical_hash.cpp -o /tmp/requiem_canonical_hash -lcrypto");
  const cppHash = execSync(`printf '%s' '${json}' | /tmp/requiem_canonical_hash`, {
    encoding: "utf8",
  }).trim();
  assert.equal(tsHash, cppHash);
});
