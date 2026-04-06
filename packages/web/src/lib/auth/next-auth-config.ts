/**
 * Legacy placeholder retained for import compatibility.
 *
 * Settler does not ship NextAuth in this workspace. Enterprise SSO posture is OIDC env-contract driven
 * and validated by `scripts/verify-enterprise-identity.mjs`.
 */

export interface NextAuthDisabledConfig {
  enabled: false;
  reason: string;
  verificationPath: readonly string[];
}

export const authOptions: NextAuthDisabledConfig = {
  enabled: false,
  reason: 'next_auth_not_installed_use_oidc_env_contract',
  verificationPath: ['pnpm run verify:enterprise-identity'],
};
