export const MARKETING_OPTIONAL_ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
] as const;

export const APP_REQUIRED_ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

function findMissing(keys: readonly string[]): string[] {
  return keys.filter((key) => {
    const value = process.env[key];
    return !value || value.trim().length === 0;
  });
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
