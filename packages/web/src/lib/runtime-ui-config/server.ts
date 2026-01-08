/**
 * Runtime UI Config (Server)
 *
 * Resolves public runtime UI configuration for a tenant, with safe defaults.
 * Intended for:
 * - Public read endpoint (no secrets)
 * - Server Components that want consistent config without extra client roundtrips
 */

import { safeParsePublicRuntimeUiConfig, type PublicRuntimeUiConfig } from "./schema";

export type RuntimeEnvKey = "production" | "preview" | "development";

export function getRuntimeEnvKey(): RuntimeEnvKey {
  // Prefer Vercel's environment signal; do not rely on NODE_ENV for preview.
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "preview";
  return "development";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Merge two config objects shallowly at top-level, deeply for known nested keys.
 * This avoids accidental prototype pollution by requiring plain objects.
 */
function mergeConfig(base: PublicRuntimeUiConfig, patch: unknown): PublicRuntimeUiConfig {
  if (!isPlainObject(patch)) return base;

  const next: PublicRuntimeUiConfig = {
    ...base,
    tokens: { ...base.tokens },
    copy: { ...base.copy, announcement: { ...base.copy.announcement } },
    features: { ...base.features },
  };

  if (isPlainObject(patch.tokens)) {
    Object.assign(next.tokens, patch.tokens);
  }
  if (isPlainObject(patch.copy)) {
    if (isPlainObject(patch.copy.announcement)) {
      Object.assign(next.copy.announcement, patch.copy.announcement);
    }
  }
  if (isPlainObject(patch.features)) {
    Object.assign(next.features, patch.features);
  }

  // Re-validate after merge to enforce allowlist and defaults.
  return safeParsePublicRuntimeUiConfig(next);
}

export function resolvePublicRuntimeUiConfig(input: {
  tenantMetadata?: unknown;
  tenantBranding?: { borderRadiusScale?: number | string | null } | null;
}): PublicRuntimeUiConfig {
  let config = safeParsePublicRuntimeUiConfig({});

  // 1) Apply branding-derived tokens (if present)
  const rawRadius = input.tenantBranding?.borderRadiusScale;
  const radius =
    typeof rawRadius === "number"
      ? rawRadius
      : typeof rawRadius === "string"
        ? Number(rawRadius)
        : null;
  if (typeof radius === "number" && Number.isFinite(radius)) {
    config = mergeConfig(config, { tokens: { radiusScale: radius } });
  }

  // 2) Apply tenant metadata overrides (global + env-specific)
  const envKey = getRuntimeEnvKey();
  const md = input.tenantMetadata;
  if (isPlainObject(md)) {
    const globalPatch = md.uiConfig;
    const byEnv = md.uiConfigByEnv;
    config = mergeConfig(config, globalPatch);
    if (isPlainObject(byEnv)) {
      config = mergeConfig(config, byEnv[envKey]);
    }
  }

  return safeParsePublicRuntimeUiConfig(config);
}

