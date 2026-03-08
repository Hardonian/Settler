import { MetadataRoute } from "next";
import { getSiteHost, getSiteMode } from "@/lib/site-mode";

const OSS_ONLY_ROUTES = ["/open-source", "/oss", "/oss/stats"] as const;
const ENTERPRISE_ONLY_ROUTES = ["/enterprise"] as const;

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

function getStaticPaths(): Array<{
  path: string;
  priority: number;
  changeFrequency: SitemapEntry["changeFrequency"];
}> {
  return [
    { path: "", priority: 1, changeFrequency: "daily" },
    { path: "/platform", priority: 0.9, changeFrequency: "weekly" },
    { path: "/pricing", priority: 0.8, changeFrequency: "weekly" },
    { path: "/docs", priority: 0.9, changeFrequency: "daily" },
    { path: "/docs/quickstart", priority: 0.8, changeFrequency: "weekly" },
    { path: "/docs/api", priority: 0.7, changeFrequency: "weekly" },
    { path: "/docs/sdk", priority: 0.7, changeFrequency: "weekly" },
    { path: "/security-and-audit", priority: 0.8, changeFrequency: "monthly" },
    { path: "/about", priority: 0.6, changeFrequency: "yearly" },
    { path: "/support", priority: 0.6, changeFrequency: "weekly" },
    { path: "/legal/privacy", priority: 0.5, changeFrequency: "yearly" },
    { path: "/legal/terms", priority: 0.5, changeFrequency: "yearly" },
    { path: "/roadmap", priority: 0.6, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
    { path: "/changelog", priority: 0.7, changeFrequency: "weekly" },
    { path: "/comparison", priority: 0.7, changeFrequency: "monthly" },
    { path: "/benchmarks", priority: 0.6, changeFrequency: "monthly" },
    { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
    { path: "/demo", priority: 0.7, changeFrequency: "monthly" },
    { path: "/proof", priority: 0.7, changeFrequency: "monthly" },
    { path: "/proof-explorer", priority: 0.6, changeFrequency: "monthly" },
    { path: "/replay-lab", priority: 0.6, changeFrequency: "monthly" },
    { path: "/engine", priority: 0.7, changeFrequency: "monthly" },
    { path: "/why-settler", priority: 0.7, changeFrequency: "monthly" },
    { path: "/enterprise", priority: 0.7, changeFrequency: "monthly" },
    { path: "/trust", priority: 0.6, changeFrequency: "monthly" },
    { path: "/status", priority: 0.5, changeFrequency: "hourly" },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  ];
}

export function generateSitemap(): MetadataRoute.Sitemap {
  const mode = getSiteMode();
  const baseUrl = getSiteHost(mode);
  const modePaths = mode === "oss" ? OSS_ONLY_ROUTES : ENTERPRISE_ONLY_ROUTES;

  const entries = [
    ...getStaticPaths(),
    ...modePaths.map((path) => ({ path, priority: 0.7, changeFrequency: "monthly" as const })),
  ];
  return entries.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
