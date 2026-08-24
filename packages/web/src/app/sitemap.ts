import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://settler.dev";

const STATIC_ROUTES = [
  "",
  "/pricing",
  "/enterprise",
  "/demo",
  "/signup",
  "/support",
  "/docs",
  "/verify",
  "/vendor-portal",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.7,
  }));
}
