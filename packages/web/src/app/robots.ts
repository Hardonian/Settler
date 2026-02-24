import { MetadataRoute } from "next";
import { getSiteHost, getSiteMode } from "@/lib/site-mode";

export default function robots(): MetadataRoute.Robots {
  const mode = getSiteMode();
  const baseUrl = getSiteHost(mode);
  const enterpriseStub = process.env.ENTERPRISE_INDEXING_POLICY === "noindex";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/console/",
          "/dashboard/",
          "/app/",
          "/review/",
          "/_next/",
          "/static/",
        ],
      },
      ...(mode === "enterprise" && enterpriseStub ? [{ userAgent: "*", disallow: "/" }] : []),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
