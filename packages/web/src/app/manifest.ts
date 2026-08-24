import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://settler.dev";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Settler — Deterministic Reconciliation",
    short_name: "Settler",
    description:
      "Open source reconciliation engine that runs deterministic workflows, explains mismatches, and exports verifiable evidence.",
    start_url: SITE_URL,
    display: "standalone",
    background_color: "#0a0e14",
    theme_color: "#0a0e14",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
