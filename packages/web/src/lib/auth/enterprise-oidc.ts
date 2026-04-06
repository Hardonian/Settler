export type SupportedOidcProvider = "okta" | "entra" | "google_workspace";

export interface OidcProviderConfig {
  provider: SupportedOidcProvider;
  issuer: string;
  clientId: string;
  clientSecret: string;
  audience?: string;
}

export interface OidcProviderStatus {
  provider: SupportedOidcProvider;
  state: "configured" | "degraded";
  missing: string[];
  reason: string;
}

const PROVIDER_ENV_PREFIX: Record<SupportedOidcProvider, string> = {
  okta: "SSO_OIDC_OKTA",
  entra: "SSO_OIDC_ENTRA",
  google_workspace: "SSO_OIDC_GOOGLE",
};

function readEnv(name: string, env: NodeJS.ProcessEnv): string | undefined {
  const value = env[name];
  if (!value) return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function getOidcProviderConfig(
  provider: SupportedOidcProvider,
  env: NodeJS.ProcessEnv = process.env
): OidcProviderConfig | null {
  const prefix = PROVIDER_ENV_PREFIX[provider];
  const issuer = readEnv(`${prefix}_ISSUER`, env);
  const clientId = readEnv(`${prefix}_CLIENT_ID`, env);
  const clientSecret = readEnv(`${prefix}_CLIENT_SECRET`, env);
  const audience = readEnv(`${prefix}_AUDIENCE`, env);

  if (!issuer || !clientId || !clientSecret) return null;

  return {
    provider,
    issuer,
    clientId,
    clientSecret,
    ...(audience ? { audience } : {}),
  };
}

export function getOidcProviderStatus(
  provider: SupportedOidcProvider,
  env: NodeJS.ProcessEnv = process.env
): OidcProviderStatus {
  const prefix = PROVIDER_ENV_PREFIX[provider];
  const required = ["ISSUER", "CLIENT_ID", "CLIENT_SECRET"] as const;
  const missing = required
    .map((suffix) => `${prefix}_${suffix}`)
    .filter((name) => !readEnv(name, env));

  if (missing.length > 0) {
    return {
      provider,
      state: "degraded",
      missing,
      reason: `${provider} OIDC is not fully configured`,
    };
  }

  return {
    provider,
    state: "configured",
    missing: [],
    reason: `${provider} OIDC env contract satisfied`,
  };
}

export function listConfiguredOidcProviders(
  env: NodeJS.ProcessEnv = process.env
): OidcProviderConfig[] {
  return (Object.keys(PROVIDER_ENV_PREFIX) as SupportedOidcProvider[])
    .map((provider) => getOidcProviderConfig(provider, env))
    .filter((provider): provider is OidcProviderConfig => provider !== null);
}
