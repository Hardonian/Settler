import { SUPABASE_ANON_KEY_KEYS, SUPABASE_URL_KEYS } from "./keys";

export const MARKETING_OPTIONAL_ENV_KEYS = [
  SUPABASE_URL_KEYS,
  SUPABASE_ANON_KEY_KEYS,
  ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
] as const;

export const APP_REQUIRED_ENV_KEYS = [SUPABASE_URL_KEYS, SUPABASE_ANON_KEY_KEYS] as const;

type EnvKeyGroup = readonly string[];

function isConfigured(keys: EnvKeyGroup): boolean {
  return keys.some((key) => {
    const value = process.env[key];
    return Boolean(value && value.trim().length > 0);
  });
}

function findMissing(keyGroups: readonly EnvKeyGroup[]): string[] {
  return keyGroups.filter((keys) => !isConfigured(keys)).map((keys) => keys.join(" or "));
}

export function getMarketingEnvStatus(): { ok: boolean; missing: string[] } {
  const missing = findMissing(MARKETING_OPTIONAL_ENV_KEYS);
  return {
    ok: true,
    missing,
  };
}

export function getAppEnvStatus(): { ok: boolean; missing: string[] } {
  const missing = findMissing(APP_REQUIRED_ENV_KEYS);
  return {
    ok: missing.length === 0,
    missing,
  };
}
