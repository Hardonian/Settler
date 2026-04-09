/**
 * Enhanced Sitemap Generator
 *
 * Generates comprehensive sitemap.xml for SEO with all routes.
 */

import { MetadataRoute } from "next";
import { generateSitemap } from "@/lib/seo/sitemap-generator";

export default function sitemap(): MetadataRoute.Sitemap {
  return generateSitemap();
}
