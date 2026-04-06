#!/usr/bin/env node

const providers = [
  { key: 'okta', prefix: 'SSO_OIDC_OKTA' },
  { key: 'entra', prefix: 'SSO_OIDC_ENTRA' },
  { key: 'google_workspace', prefix: 'SSO_OIDC_GOOGLE' },
];

const required = ['ISSUER', 'CLIENT_ID', 'CLIENT_SECRET'];
const results = providers.map(({ key, prefix }) => {
  const missing = required
    .map((suffix) => `${prefix}_${suffix}`)
    .filter((name) => !(process.env[name] || '').trim());

  return {
    provider: key,
    state: missing.length === 0 ? 'configured' : 'degraded',
    missing,
  };
});

const configuredCount = results.filter((item) => item.state === 'configured').length;

console.log('Enterprise OIDC runtime verification');
for (const result of results) {
  if (result.state === 'configured') {
    console.log(`✅ ${result.provider}: configured`);
  } else {
    console.log(`⚠️ ${result.provider}: degraded (missing ${result.missing.join(', ')})`);
  }
}

if (configuredCount === 0) {
  console.log('⚠️ No IdP is fully configured. SSO claims must remain config-gated.');
} else {
  console.log(`✅ ${configuredCount} IdP provider(s) configured.`);
}

if ((process.env.SETTLER_REQUIRE_OIDC_GA || '').toLowerCase() === 'true' && configuredCount < 3) {
  console.error('❌ SETTLER_REQUIRE_OIDC_GA=true requires Okta, Entra, and Google Workspace to be configured.');
  process.exit(1);
}
