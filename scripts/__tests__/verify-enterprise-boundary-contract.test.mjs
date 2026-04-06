import { test } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));

function runScript(rel, env = {}) {
  return spawnSync(process.execPath, [resolve(root, rel)], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

test('verify-scim-posture exits 0 with not_applicable verdict in stdout JSON', () => {
  const r = runScript('scripts/verify-scim-posture.mjs');
  assert.strictEqual(r.status, 0, r.stderr);
  const lines = r.stdout.trim().split('\n');
  const last = lines[lines.length - 1];
  const j = JSON.parse(last);
  assert.strictEqual(j.verdict, 'not_applicable');
});

test('verify-enterprise-identity exits 2 when no OIDC env (degraded)', () => {
  const cleanEnv = {
    SETTLER_REQUIRE_OIDC_GA: '',
    SSO_OIDC_OKTA_ISSUER: '',
    SSO_OIDC_OKTA_CLIENT_ID: '',
    SSO_OIDC_OKTA_CLIENT_SECRET: '',
    SSO_OIDC_ENTRA_ISSUER: '',
    SSO_OIDC_ENTRA_CLIENT_ID: '',
    SSO_OIDC_ENTRA_CLIENT_SECRET: '',
    SSO_OIDC_GOOGLE_ISSUER: '',
    SSO_OIDC_GOOGLE_CLIENT_ID: '',
    SSO_OIDC_GOOGLE_CLIENT_SECRET: '',
  };
  const r = runScript('scripts/verify-enterprise-identity.mjs', cleanEnv);
  assert.strictEqual(r.status, 2, r.stdout + r.stderr);
  const lines = r.stdout.trim().split('\n');
  const last = lines[lines.length - 1];
  const j = JSON.parse(last);
  assert.strictEqual(j.verdict, 'verified_degraded');
});

test('verify-enterprise-identity exits 0 when all three IdP env contracts present', () => {
  const env = {
    SSO_OIDC_OKTA_ISSUER: 'https://example.okta.com/oauth2/default',
    SSO_OIDC_OKTA_CLIENT_ID: 'a',
    SSO_OIDC_OKTA_CLIENT_SECRET: 'b',
    SSO_OIDC_ENTRA_ISSUER: 'https://login.microsoftonline.com/tenant/v2.0',
    SSO_OIDC_ENTRA_CLIENT_ID: 'a',
    SSO_OIDC_ENTRA_CLIENT_SECRET: 'b',
    SSO_OIDC_GOOGLE_ISSUER: 'https://accounts.google.com',
    SSO_OIDC_GOOGLE_CLIENT_ID: 'a',
    SSO_OIDC_GOOGLE_CLIENT_SECRET: 'b',
  };
  const r = runScript('scripts/verify-enterprise-identity.mjs', env);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  const lines = r.stdout.trim().split('\n');
  const last = lines[lines.length - 1];
  const j = JSON.parse(last);
  assert.strictEqual(j.verdict, 'verified_pass');
});
