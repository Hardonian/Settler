import {
  EnterpriseSSONormalizer,
  OidcIdTokenClaims,
  SamlAttributes,
  SSOValidationConfig,
} from "../sso-normalizer";
import { UserRole } from "../../../domain/entities/User";

describe("Enterprise SSO SAML 2.0 / OIDC Session Normalizer (#89)", () => {
  const tenantId = "tenant_enterprise_cloud";
  const config: SSOValidationConfig = {
    expectedAudience: "stlr_client_prod_id",
    expectedIssuer: "https://auth.enterprise.okta.com/oauth2/default",
    signingSecret: "enterprise_audit_super_secret_hmac_key_256",
    domainTenantMap: {
      "enterprise.com": tenantId,
    },
  };

  const nowSec = Math.floor(Date.now() / 1000);

  it("normalizes a valid OIDC ID token with admin role assignment", () => {
    const claims: OidcIdTokenClaims = {
      iss: config.expectedIssuer,
      sub: "okta_sub_user_4491",
      aud: config.expectedAudience,
      exp: nowSec + 3600, // 1 hour valid
      iat: nowSec - 60,
      email: "finance.lead@enterprise.com",
      name: "Jordan Belfort",
      groups: ["Corporate-Finance", "Settler-Admins"],
      tenant_id: tenantId,
    };

    const session = EnterpriseSSONormalizer.normalizeOidcToken(
      tenantId,
      claims,
      { alg: "RS256" },
      config,
      "okta"
    );

    expect(session.tenantId).toBe(tenantId);
    expect(session.email).toBe("finance.lead@enterprise.com");
    expect(session.role).toBe(UserRole.ADMIN);
    expect(session.permissions.length).toBeGreaterThan(5);
    expect(session.sessionToken).toContain("stlr_");
    expect(session.merkleLeafHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects insecure algorithm 'none' tokens", () => {
    const claims: OidcIdTokenClaims = {
      iss: config.expectedIssuer,
      sub: "hacker_sub",
      aud: config.expectedAudience,
      exp: nowSec + 3600,
      iat: nowSec - 60,
      email: "attacker@enterprise.com",
    };

    expect(() => {
      EnterpriseSSONormalizer.normalizeOidcToken(
        tenantId,
        claims,
        { alg: "none" }, // Insecure
        config,
        "okta"
      );
    }).toThrow(/Algorithm 'none' is strictly rejected/);
  });

  it("rejects expired assertions", () => {
    const claims: OidcIdTokenClaims = {
      iss: config.expectedIssuer,
      sub: "user_expired",
      aud: config.expectedAudience,
      exp: nowSec - 500, // Expired
      iat: nowSec - 4000,
      email: "user@enterprise.com",
    };

    expect(() => {
      EnterpriseSSONormalizer.normalizeOidcToken(
        tenantId,
        claims,
        { alg: "RS256" },
        config,
        "okta"
      );
    }).toThrow(/SSO assertion expired/);
  });

  it("strictly prevents cross-tenant hijacking attempts", () => {
    const claims: OidcIdTokenClaims = {
      iss: config.expectedIssuer,
      sub: "user_other",
      aud: config.expectedAudience,
      exp: nowSec + 3600,
      iat: nowSec,
      email: "victim@target.com",
      tenant_id: "tenant_target_victim", // Claims to belong to target tenant
    };

    expect(() => {
      EnterpriseSSONormalizer.normalizeOidcToken(
        "tenant_attacker_host", // Caller session requested attacker tenant
        claims,
        { alg: "RS256" },
        config,
        "okta"
      );
    }).toThrow(/Tenant mismatch/);
  });

  it("normalizes Azure AD SAML 2.0 assertions", () => {
    const samlConfig: SSOValidationConfig = {
      expectedAudience: "https://api.settler.io/saml/metadata",
      expectedIssuer: "https://sts.windows.net/azure-tenant-id/",
      signingSecret: "saml_secret_key_123",
      domainTenantMap: {
        "enterprise.com": tenantId,
      },
    };

    const attributes: SamlAttributes = {
      nameId: "azure_obj_id_9921",
      email: "analyst@enterprise.com",
      name: "Alex Rivera",
      issuer: samlConfig.expectedIssuer,
      audience: samlConfig.expectedAudience,
      groups: ["Settler-Developers"],
    };

    const session = EnterpriseSSONormalizer.normalizeSamlAttributes(
      tenantId,
      attributes,
      samlConfig,
      "azure_ad"
    );

    expect(session.tenantId).toBe(tenantId);
    expect(session.role).toBe(UserRole.DEVELOPER);
    expect(session.idpProvider).toBe("azure_ad");
    expect(session.merkleLeafHash).toMatch(/^[0-9a-f]{64}$/);
  });
});
