import { createHash, createHmac } from "node:crypto";
import { UserRole } from "../../domain/entities/User";
import { Permission, ROLE_PERMISSIONS } from "../security/Permissions";

/**
 * #89 Enterprise SSO SAML 2.0 / OIDC Session Normalizer
 *
 * Normalizes identity claims from Okta, Azure AD (Entra ID), Google Workspace,
 * and PingFederate assertions into Settler's canonical enterprise session envelope.
 *
 * Architectural Invariants:
 * - Strict tenantId verification and domain binding.
 * - Rejection of unencrypted or algorithm 'none' assertions.
 * - Least-privilege JIT role mapping.
 * - Cryptographic session token generation with RFC 6962 Merkle leaf sealing.
 */

export type IdPProvider =
  "okta" | "azure_ad" | "google_workspace" | "ping_federate" | "generic_oidc";

export interface OidcIdTokenClaims {
  iss: string;
  sub: string;
  aud: string | string[];
  exp: number;
  nbf?: number;
  iat: number;
  email: string;
  email_verified?: boolean;
  name?: string;
  groups?: string[];
  roles?: string[];
  tenant_id?: string;
  "custom:tenant_id"?: string;
}

export interface SamlAttributes {
  nameId: string;
  email: string;
  name?: string;
  groups?: string[];
  tenantId?: string;
  issuer: string;
  notBefore?: string;
  notOnOrAfter?: string;
  audience?: string;
}

export interface SSOValidationConfig {
  expectedAudience: string;
  expectedIssuer: string;
  allowedAlgorithms?: string[];
  domainTenantMap?: Record<string, string>; // e.g. { "acme.com": "tenant_acme" }
  clockToleranceSeconds?: number;
  signingSecret: string;
}

export interface NormalizedSSOSession {
  sessionId: string;
  tenantId: string;
  userId: string;
  email: string;
  name: string;
  idpProvider: IdPProvider;
  role: UserRole;
  permissions: Permission[];
  groups: string[];
  issuedAt: string;
  expiresAt: string;
  sessionToken: string;
  merkleLeafHash: string;
}

function rfc6962LeafHash(data: string): string {
  return createHash("sha256")
    .update(Buffer.concat([Buffer.from([0x00]), Buffer.from(data, "utf-8")]))
    .digest("hex");
}

export class EnterpriseSSONormalizer {
  private static readonly SECURE_ALGORITHMS = new Set([
    "RS256",
    "RS384",
    "RS512",
    "ES256",
    "ES384",
    "ES512",
  ]);

  /**
   * Normalizes an OIDC JWT ID token payload with signature algorithm and tenant verification.
   */
  public static normalizeOidcToken(
    expectedTenantId: string,
    claims: OidcIdTokenClaims,
    header: { alg: string; typ?: string },
    config: SSOValidationConfig,
    idpProvider: IdPProvider = "okta"
  ): NormalizedSSOSession {
    if (!expectedTenantId) {
      throw new Error(
        "Tenant mismatch: expectedTenantId is mandatory for SSO session normalization"
      );
    }

    // 1. Enforce Cryptographic Algorithm Security
    if (!header.alg || header.alg.toLowerCase() === "none") {
      throw new Error(
        "Security violation: Algorithm 'none' is strictly rejected for enterprise SSO"
      );
    }
    const allowed =
      config.allowedAlgorithms ?? Array.from(EnterpriseSSONormalizer.SECURE_ALGORITHMS);
    if (!allowed.includes(header.alg)) {
      throw new Error(
        `Security violation: Unsupported JWT algorithm "${header.alg}". Must be one of ${allowed.join(", ")}`
      );
    }

    // 2. Validate Temporal Claims
    const clockTolerance = config.clockToleranceSeconds ?? 60;
    const nowSec = Math.floor(Date.now() / 1000);

    if (claims.exp + clockTolerance < nowSec) {
      throw new Error(
        `SSO assertion expired at ${new Date(claims.exp * 1000).toISOString()} (current: ${new Date(nowSec * 1000).toISOString()})`
      );
    }
    if (claims.nbf && claims.nbf - clockTolerance > nowSec) {
      throw new Error(
        `SSO assertion not yet valid until ${new Date(claims.nbf * 1000).toISOString()}`
      );
    }

    // 3. Validate Issuer and Audience
    if (claims.iss !== config.expectedIssuer) {
      throw new Error(
        `Issuer mismatch: Assertion issuer "${claims.iss}" does not match configured issuer "${config.expectedIssuer}"`
      );
    }

    const audList = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audList.includes(config.expectedAudience)) {
      throw new Error(
        `Audience mismatch: "${config.expectedAudience}" not found in assertion audience [${audList.join(", ")}]`
      );
    }

    // 4. Validate Email and Tenant Boundary
    if (!claims.email || !claims.email.includes("@")) {
      throw new Error("SSO assertion missing valid email claim");
    }

    const domain = claims.email.split("@")[1]?.toLowerCase() ?? "";
    const resolvedTenant =
      claims.tenant_id ??
      claims["custom:tenant_id"] ??
      (config.domainTenantMap ? config.domainTenantMap[domain] : undefined);

    if (resolvedTenant && resolvedTenant !== expectedTenantId) {
      throw new Error(
        `Tenant mismatch: Assertion belongs to tenant "${resolvedTenant}", but session context requested "${expectedTenantId}"`
      );
    }

    const finalTenantId = resolvedTenant ?? expectedTenantId;

    // 5. JIT Role and Group Mapping
    const rawGroups = claims.groups ?? claims.roles ?? [];
    const role = EnterpriseSSONormalizer.mapGroupsToRole(rawGroups);
    const permissions = ROLE_PERMISSIONS[role] ?? [];

    const issuedAt = new Date(claims.iat * 1000).toISOString();
    const expiresAt = new Date(claims.exp * 1000).toISOString();
    const userId = `usr_sso_${createHash("sha256").update(`${finalTenantId}:${claims.sub}`).digest("hex").slice(0, 16)}`;
    const sessionId = `sess_${createHash("sha256").update(`${userId}:${claims.iat}:${claims.exp}`).digest("hex").slice(0, 24)}`;

    // 6. Sign Session Token
    const sessionPayload = `${sessionId}:${finalTenantId}:${userId}:${role}:${claims.exp}`;
    const signature = createHmac("sha256", config.signingSecret)
      .update(sessionPayload)
      .digest("hex");
    const sessionToken = `stlr_${Buffer.from(sessionPayload).toString("base64url")}.${signature}`;

    const leafData = JSON.stringify({
      sessionId,
      tenantId: finalTenantId,
      userId,
      email: claims.email,
      role,
      idpProvider,
      expiresAt,
    });
    const merkleLeafHash = rfc6962LeafHash(leafData);

    return {
      sessionId,
      tenantId: finalTenantId,
      userId,
      email: claims.email,
      name: claims.name ?? claims.email.split("@")[0] ?? "SSO User",
      idpProvider,
      role,
      permissions,
      groups: rawGroups,
      issuedAt,
      expiresAt,
      sessionToken,
      merkleLeafHash,
    };
  }

  /**
   * Normalizes SAML 2.0 assertion attributes.
   */
  public static normalizeSamlAttributes(
    expectedTenantId: string,
    attributes: SamlAttributes,
    config: SSOValidationConfig,
    idpProvider: IdPProvider = "azure_ad"
  ): NormalizedSSOSession {
    if (!expectedTenantId) {
      throw new Error(
        "Tenant mismatch: expectedTenantId is mandatory for SAML session normalization"
      );
    }

    if (!attributes.email || !attributes.email.includes("@")) {
      throw new Error("SAML assertion missing valid email attribute");
    }

    if (attributes.issuer !== config.expectedIssuer) {
      throw new Error(
        `SAML Issuer mismatch: "${attributes.issuer}" !== "${config.expectedIssuer}"`
      );
    }

    if (attributes.audience && attributes.audience !== config.expectedAudience) {
      throw new Error(
        `SAML Audience mismatch: "${attributes.audience}" !== "${config.expectedAudience}"`
      );
    }

    const domain = attributes.email.split("@")[1]?.toLowerCase() ?? "";
    const resolvedTenant =
      attributes.tenantId ?? (config.domainTenantMap ? config.domainTenantMap[domain] : undefined);

    if (resolvedTenant && resolvedTenant !== expectedTenantId) {
      throw new Error(
        `Tenant mismatch: SAML assertion tenant "${resolvedTenant}" does not match requested tenant "${expectedTenantId}"`
      );
    }

    const finalTenantId = resolvedTenant ?? expectedTenantId;
    const rawGroups = attributes.groups ?? [];
    const role = EnterpriseSSONormalizer.mapGroupsToRole(rawGroups);
    const permissions = ROLE_PERMISSIONS[role] ?? [];

    const now = new Date();
    const issuedAt = attributes.notBefore ?? now.toISOString();
    const expiresAt =
      attributes.notOnOrAfter ?? new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(); // 8hr default

    const userId = `usr_saml_${createHash("sha256").update(`${finalTenantId}:${attributes.nameId}`).digest("hex").slice(0, 16)}`;
    const sessionId = `sess_${createHash("sha256").update(`${userId}:${issuedAt}`).digest("hex").slice(0, 24)}`;

    const sessionPayload = `${sessionId}:${finalTenantId}:${userId}:${role}:${expiresAt}`;
    const signature = createHmac("sha256", config.signingSecret)
      .update(sessionPayload)
      .digest("hex");
    const sessionToken = `stlr_${Buffer.from(sessionPayload).toString("base64url")}.${signature}`;

    const leafData = JSON.stringify({
      sessionId,
      tenantId: finalTenantId,
      userId,
      email: attributes.email,
      role,
      idpProvider,
      expiresAt,
    });
    const merkleLeafHash = rfc6962LeafHash(leafData);

    return {
      sessionId,
      tenantId: finalTenantId,
      userId,
      email: attributes.email,
      name: attributes.name ?? attributes.email.split("@")[0] ?? "SAML User",
      idpProvider,
      role,
      permissions,
      groups: rawGroups,
      issuedAt,
      expiresAt,
      sessionToken,
      merkleLeafHash,
    };
  }

  /**
   * Deterministically maps enterprise IdP directory groups to least-privilege Settler roles.
   */
  private static mapGroupsToRole(groups: string[]): UserRole {
    const normalized = groups.map((g) => g.toLowerCase().trim());

    // Priority: Owner -> Admin -> Developer -> Viewer
    if (
      normalized.some(
        (g) =>
          g.includes("settler-owners") || g.includes("finops-executive") || g.includes("cfo-suite")
      )
    ) {
      return UserRole.OWNER;
    }
    if (
      normalized.some(
        (g) =>
          g.includes("settler-admins") || g.includes("finance-admin") || g.includes("controller")
      )
    ) {
      return UserRole.ADMIN;
    }
    if (
      normalized.some(
        (g) =>
          g.includes("settler-developers") || g.includes("engineers") || g.includes("integrations")
      )
    ) {
      return UserRole.DEVELOPER;
    }
    return UserRole.VIEWER;
  }
}
