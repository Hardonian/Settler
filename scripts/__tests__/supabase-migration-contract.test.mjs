import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { sha256, validateMigration } from "../supabase-migration-contract.mjs";

function fixture(name, content) {
  const directory = mkdtempSync(path.join(tmpdir(), "settler-migration-contract-"));
  const file = path.join(directory, name);
  writeFileSync(file, content, "utf8");
  return { directory, file };
}

test("accepts atomic SQL and returns deterministic evidence", (t) => {
  const source = "create table if not exists private.example (id uuid primary key);\n";
  const { directory, file } = fixture("20260927010101_create_example.sql", source);
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  const result = validateMigration(file, { catalogFiles: [file] });
  assert.deepEqual(result.errors, []);
  assert.equal(result.checksum, sha256(source));
});

test("rejects transaction ownership and psql command leakage", (t) => {
  const { directory, file } = fixture(
    "20260927010102_bad_transport.sql",
    "begin;\n\\echo unsafe\nselect 1;\ncommit;\n"
  );
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  const result = validateMigration(file, { catalogFiles: [file] });
  assert.ok(result.errors.some((error) => error.includes("transaction control")));
  assert.ok(result.errors.some((error) => error.includes("psql meta-commands")));
});

test("allows transaction keywords inside dollar-quoted function bodies", (t) => {
  const { directory, file } = fixture(
    "20260927010103_create_function.sql",
    "create function private.example() returns void language plpgsql as $$\nbegin\n  return;\nend;\n$$;\n"
  );
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  const result = validateMigration(file, { catalogFiles: [file] });
  assert.deepEqual(result.errors, []);
});

test("rejects duplicate versions and unapproved destructive SQL", (t) => {
  const first = fixture(
    "20260927010104_drop_example.sql",
    "drop table if exists public.example;\n"
  );
  const second = path.join(first.directory, "20260927010104_duplicate.sql");
  writeFileSync(second, "select 1;\n", "utf8");
  t.after(() => rmSync(first.directory, { recursive: true, force: true }));

  const result = validateMigration(first.file, { catalogFiles: [first.file, second] });
  assert.ok(result.errors.some((error) => error.includes("already used")));
  assert.ok(result.errors.some((error) => error.includes("allow-destructive")));
});

test("hardens security definer functions", (t) => {
  const { directory, file } = fixture(
    "20260927010105_unsafe_function.sql",
    "create function private.example() returns void language sql security definer as $$ select 1 $$;\n"
  );
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  const result = validateMigration(file, { catalogFiles: [file] });
  assert.ok(result.errors.some((error) => error.includes("search_path")));
  assert.ok(result.errors.some((error) => error.includes("PUBLIC execution")));
});
