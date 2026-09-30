import assert from "node:assert/strict";
import test from "node:test";

import { buildSessionPoolerUrl } from "../prisma-migrate-via-supabase-pooler.mjs";

const projectRef = "abcdefghijklmnopqrst";
const poolerMetadata =
  "postgresql://postgres.abcdefghijklmnopqrst@aws-0-ca-central-1.pooler.supabase.com:5432/postgres";

function credentialFixture(host = `db.${projectRef}.supabase.co`) {
  const url = new URL("postgresql://localhost/postgres");
  url.username = "postgres";
  url.password = "fixture-password";
  url.hostname = host;
  url.port = "5432";
  return url.toString();
}

test("derives a session-pooler URL without changing the credential", () => {
  const result = new URL(
    buildSessionPoolerUrl({
      credentialSource: credentialFixture(),
      poolerMetadata,
      projectRef,
    })
  );

  assert.equal(result.hostname, "aws-0-ca-central-1.pooler.supabase.com");
  assert.equal(result.port, "5432");
  assert.equal(decodeURIComponent(result.password), "fixture-password");
  assert.equal(result.searchParams.get("sslmode"), "require");
  assert.equal(result.searchParams.get("sslaccept"), "accept_invalid_certs");
});

test("rejects a credential source from another project", () => {
  assert.throws(
    () =>
      buildSessionPoolerUrl({
        credentialSource: credentialFixture("db.evil.supabase.co"),
        poolerMetadata,
        projectRef,
      }),
    /linked Supabase project/
  );
});

test("rejects transaction-pooler metadata", () => {
  assert.throws(
    () =>
      buildSessionPoolerUrl({
        credentialSource: credentialFixture(),
        poolerMetadata: poolerMetadata.replace(":5432/", ":6543/"),
        projectRef,
      }),
    /session-pooler URL/
  );
});
