import {
  getOidcProviderConfig,
  getOidcProviderStatus,
  listConfiguredOidcProviders,
} from '@/lib/auth/enterprise-oidc';

describe('enterprise OIDC contract', () => {
  it('returns degraded status when required env is missing', () => {
    const status = getOidcProviderStatus('okta', {});
    expect(status.state).toBe('degraded');
    expect(status.missing).toEqual(
      expect.arrayContaining([
        'SSO_OIDC_OKTA_ISSUER',
        'SSO_OIDC_OKTA_CLIENT_ID',
        'SSO_OIDC_OKTA_CLIENT_SECRET',
      ])
    );
  });

  it('returns provider config only when all required values are present', () => {
    const env = {
      SSO_OIDC_OKTA_ISSUER: 'https://example.okta.com/oauth2/default',
      SSO_OIDC_OKTA_CLIENT_ID: 'client-id',
      SSO_OIDC_OKTA_CLIENT_SECRET: 'client-secret',
      SSO_OIDC_OKTA_AUDIENCE: 'api://default',
    };

    const config = getOidcProviderConfig('okta', env);
    expect(config).toMatchObject({
      provider: 'okta',
      issuer: env.SSO_OIDC_OKTA_ISSUER,
      clientId: env.SSO_OIDC_OKTA_CLIENT_ID,
      clientSecret: env.SSO_OIDC_OKTA_CLIENT_SECRET,
      audience: env.SSO_OIDC_OKTA_AUDIENCE,
    });
  });

  it('lists only fully configured providers', () => {
    const env = {
      SSO_OIDC_OKTA_ISSUER: 'https://example.okta.com/oauth2/default',
      SSO_OIDC_OKTA_CLIENT_ID: 'okta-client-id',
      SSO_OIDC_OKTA_CLIENT_SECRET: 'okta-secret',
      SSO_OIDC_ENTRA_ISSUER: 'https://login.microsoftonline.com/tenant/v2.0',
      SSO_OIDC_ENTRA_CLIENT_ID: 'entra-client-id',
    };

    const providers = listConfiguredOidcProviders(env);
    expect(providers).toHaveLength(1);
    expect(providers[0]?.provider).toBe('okta');
  });
});
