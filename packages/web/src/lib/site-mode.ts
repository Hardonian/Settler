export type SiteMode = "oss" | "enterprise";

// Vercel redirects the apex hostname to www. Emit the final canonical origin in
// metadata, robots, and sitemap entries so crawlers do not spend crawl budget on
// redirect-only URLs.
const DEFAULT_OSS_HOST = "https://www.settler.dev";
const DEFAULT_ENTERPRISE_HOST = "https://enterprise.settler.dev";

export function getSiteMode(env: NodeJS.ProcessEnv = process.env): SiteMode {
  return env.SITE_MODE === "enterprise" ? "enterprise" : "oss";
}

export function getSiteHost(
  mode: SiteMode = getSiteMode(),
  env: NodeJS.ProcessEnv = process.env
): string {
  if (mode === "enterprise") {
    return (
      env.ENTERPRISE_SITE_URL || env.NEXT_PUBLIC_ENTERPRISE_SITE_URL || DEFAULT_ENTERPRISE_HOST
    );
  }
  return env.OSS_SITE_URL || env.NEXT_PUBLIC_SITE_URL || DEFAULT_OSS_HOST;
}

export function isEnterpriseEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return getSiteMode(env) === "enterprise";
}
