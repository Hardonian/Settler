export const SUPABASE_URL_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"] as const;
export const SUPABASE_ANON_KEY_KEYS = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
] as const;

export const BUILD_REQUIRED_ENV_GROUPS = [
  {
    label: "Supabase URL",
    keys: SUPABASE_URL_KEYS,
  },
  {
    label: "Supabase anon key",
    keys: SUPABASE_ANON_KEY_KEYS,
  },
  {
    label: "Database connection",
    keys: ["DATABASE_URL", "SUPABASE_DATABASE_URL", "DIRECT_URL"] as const,
  },
] as const;

export const RUNTIME_REQUIRED_SERVER_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
  "ENCRYPTION_KEY",
] as const;

export const SERVER_SECRET_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "SUPABASE_DATABASE_URL",
  "DIRECT_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "ENCRYPTION_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "UPSTASH_REDIS_REST_TOKEN",
  "OPENAI_API_KEY",
] as const;

export function hasConfiguredValue(key: string): boolean {
  const value = process.env[key];
  return Boolean(value && value.trim().length > 0);
}

export function isAnyConfigured(keys: readonly string[]): boolean {
  return keys.some((key) => hasConfiguredValue(key));
}
