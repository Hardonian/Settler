import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://settler.dev";

/**
 * Route priority tiers:
 * - 1.0: Homepage
 * - 0.9: Core conversion pages (product, pricing, signup)
 * - 0.8: Key marketing pages (platform, capabilities, enterprise, about)
 * - 0.7: Supporting pages (docs, security, architecture, changelog)
 * - 0.6: Secondary pages (blog, faq, support, contact, legal)
 * - 0.5: Utility pages (login, verify, vendor-portal)
 */
const STATIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
}> = [
  // Core
  { path: "", priority: 1.0, changeFrequency: "weekly" },

  // Conversion pages
  { path: "/product", priority: 0.9, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/signup", priority: 0.9, changeFrequency: "monthly" },

  // Key marketing pages
  { path: "/platform", priority: 0.8, changeFrequency: "monthly" },
  { path: "/capabilities", priority: 0.8, changeFrequency: "monthly" },
  { path: "/enterprise", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },

  // Supporting pages
  { path: "/docs", priority: 0.7, changeFrequency: "weekly" },
  { path: "/security-and-audit", priority: 0.7, changeFrequency: "monthly" },
  { path: "/architecture", priority: 0.7, changeFrequency: "monthly" },
  { path: "/open-source", priority: 0.7, changeFrequency: "monthly" },
  { path: "/changelog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/cookbook", priority: 0.7, changeFrequency: "monthly" },

  // Secondary pages
  { path: "/blog", priority: 0.6, changeFrequency: "weekly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/support", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/community", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.6, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.6, changeFrequency: "yearly" },

  // Utility pages
  { path: "/login", priority: 0.5, changeFrequency: "monthly" },
  { path: "/verify", priority: 0.5, changeFrequency: "monthly" },
  { path: "/vendor-portal", priority: 0.5, changeFrequency: "monthly" },
  { path: "/managed", priority: 0.5, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
