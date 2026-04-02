import { SUPABASE_ANON_KEY_KEYS, SUPABASE_URL_KEYS } from "./keys";
import { formatGroupKeys, resolveEnvGroup } from "./contract";

export const MARKETING_OPTIONAL_ENV_KEYS = [
  SUPABASE_URL_KEYS,
  SUPABASE_ANON_KEY_KEYS,
  ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
] as const;

export const APP_REQUIRED_ENV_KEYS = [SUPABASE_URL_KEYS, SUPABASE_ANON_KEY_KEYS] as const;

function findMissing(keyGroups: readonly (readonly string[])[]): string[] {
  return keyGroups
    .filter((keys) => !resolveEnvGroup(keys).satisfied)
    .map((keys) => formatGroupKeys(keys));
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
