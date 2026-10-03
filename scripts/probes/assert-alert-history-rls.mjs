// scripts/probes/assert-alert-history-rls.mjs
// Live SQL assertion for the alert_history tenant + admin-global scope policy
// (migrations 20261003013025 / 20261003013317). Opens one session against
// DATABASE_URL (session pooler), creates in-transaction fixtures, impersonates
// member/stranger/admin via request.jwt.claims, asserts visibility, rolls back.
// Expected: member=own-tenant rows only, stranger=0, admin=own-tenant+global.
// Live RLS probe for alert_history — persistent session so
// set_config()/SET ROLE persist across statements. Never prints credentials.
import fs from "node:fs";
import { createRequire } from "node:module";
const pg = createRequire("/home/scott/repos/Settler/package.json")("pg");

const envFile = fs.existsSync(new URL("../.env.local", import.meta.url))
  ? fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  : "";
const get = (k) =>
  process.env[k] || (envFile.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();
const url = get("DATABASE_URL");
if (!url) throw new Error("DATABASE_URL missing in .env.local");

const MEMBER = "81eaaa5d-1fb4-4e98-9a0f-005312ca4840"; // owner of Test Tenant
const STRANGER = "00000000-0000-0000-0000-000000000099";
const TEST_TENANT = "74dd7b34-d947-4092-b75f-bea505c16dd2";

const c = new pg.Client({ connectionString: url });
await c.connect();
const out = {};

try {
  // 0. function shape + body
  const fn = await c.query(
    "select pg_get_function_identity_arguments(p.oid) as args, pg_get_function_result(p.oid) as result, p.prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_user_tenant_ids'"
  );
  out.fn = fn.rows[0];

  // 1. fixtures (in-transaction: rollback at end cleans everything)
  await c.query("begin");
  await c.query(
    `insert into alert_history (tenant_id, metric, value, threshold) values ($1,'probe_a',1,1), ($2,'probe_b',1,1), (null,'probe_global',1,1)`,
    [TEST_TENANT, "aa10b8d5-191f-4c70-8c76-9491200ac365"]
  );
  // get_user_tenant_ids() reads billing_accounts + memberships (verified body),
  // NOT tenant_users — fixture must live there.
  await c.query(
    `insert into users (id, tenant_id, email, password_hash, created_at, updated_at)
     values ($1,$2,'probe-rls@example.test','probe-hash',now(),now())
     on conflict (id) do nothing`,
    [MEMBER, TEST_TENANT]
  );
  // memberships.user_id FKs to auth.users (verified by probe errors)
  await c.query(
    `insert into auth.users (id, email) values ($1,'probe-rls@example.test')
     on conflict (id) do nothing`,
    [MEMBER]
  );
  await c.query(
    `insert into memberships (tenant_id, user_id, status, role) values ($1,$2,'active','owner')`,
    [TEST_TENANT, MEMBER]
  );
  await c.query(
    `insert into tenant_memberships (tenant_id, user_id, role, created_at, is_default) values ($1,$2,'owner',now(),false)`,
    [TEST_TENANT, MEMBER]
  );

  // 2. member impersonation
  await c.query("set role authenticated");
  await c.query(`select set_config('request.jwt.claims', $1, true)`, [
    JSON.stringify({ sub: MEMBER, role: "authenticated" }),
  ]);
  const diag = await c.query(
    "select auth.uid() as uid, get_user_tenant_ids() as tids, is_admin() as admin"
  );
  out.member_diag = diag.rows[0];
  const m = await c.query(
    "select count(*)::int as n, coalesce(string_agg(metric,','),'none') as metrics from alert_history"
  );
  out.member_sees = m.rows[0];

  // 3. stranger impersonation
  await c.query(`select set_config('request.jwt.claims', $1, true)`, [
    JSON.stringify({ sub: STRANGER, role: "authenticated" }),
  ]);
  const s = await c.query("select count(*)::int as n from alert_history");
  out.stranger_sees = s.rows[0];

  // 4. admin path: owner row in tenant_memberships + tenant claim
  await c.query(`select set_config('request.jwt.claims', $1, true)`, [
    JSON.stringify({ sub: MEMBER, role: "authenticated", tenant_id: TEST_TENANT }),
  ]);
  const ad = await c.query("select get_token_tenant() as tok_tenant, is_admin() as admin");
  out.admin_diag = ad.rows[0] ?? null;
  const a = await c.query(
    "select count(*)::int as n, coalesce(string_agg(metric,','),'none') as metrics from alert_history"
  );
  out.admin_sees = a.rows[0];

  // 4. reset + cleanup
  await c.query("reset role");
  await c.query("rollback");
  out.fixtures_cleaned = true;
} catch (e) {
  out.error = e.message;
  try {
    await c.query("rollback");
    await c.query("reset role");
  } catch {}
} finally {
  await c.end();
}
console.log(JSON.stringify(out, null, 1));
