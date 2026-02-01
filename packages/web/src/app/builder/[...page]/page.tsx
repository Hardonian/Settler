/**
 * Builder.io Catch-All Page Route
 * Renders pages created in Builder.io visual editor
 *
 * Usage: Any page under /builder/* will be rendered from Builder.io
 * Example: /builder/landing/product-launch
 */

import { builder } from "@builder.io/sdk";
import BuilderPage from "@/components/BuilderPage";
import { builderModels } from "@/lib/builder/config";
import { notFound } from "next/navigation";

// Use dynamic rendering to avoid React context issues during static generation
export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    page: string[];
  };
}

// Generate static params for known Builder pages
export async function generateStaticParams() {
  const apiKey = process.env.NEXT_PUBLIC_BUILDER_API_KEY || process.env.BUILDER_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ Builder API key not found, skipping static page generation");
    return [];
  }

  builder.init(apiKey);

  try {
    // Fetch all published pages from Builder.io
    const pages = await builder.getAll(builderModels.page, {
      limit: 100,
      options: {
        noTraverse: true,
      },
      omit: "data.blocks",
    });

    // Generate params for each page
    return pages.map((page) => {
      const url = page.data?.url || "";
      // Remove leading /builder/ if present
      const path = url.replace(/^\/builder\//, "");
      return {
        page: path.split("/").filter(Boolean),
      };
    });
  } catch (_error) {
    console.error("Error fetching Builder pages:", error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const apiKey = process.env.NEXT_PUBLIC_BUILDER_API_KEY || process.env.BUILDER_API_KEY;

  if (!apiKey) {
    return {
      title: "Page Not Found",
    };
  }

  builder.init(apiKey);

  const url = `/builder/${params.page.join("/")}`;
  const content = await builder
    .get(builderModels.page, {
      url,
      userAttributes: {
        urlPath: url,
      },
    })
    .promise();

  if (!content) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: content.data?.title || "Settler",
    description: content.data?.description || "",
    keywords: content.data?.keywords || "",
    openGraph: {
      title: content.data?.title || "Settler",
      description: content.data?.description || "",
      images: [content.data?.ogImage || "/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: content.data?.title || "Settler",
      description: content.data?.description || "",
      images: [content.data?.ogImage || "/og-image.png"],
    },
  };
}

// Page component
export default async function BuilderCatchAllPage({ params }: PageProps) {
  const apiKey = process.env.NEXT_PUBLIC_BUILDER_API_KEY || process.env.BUILDER_API_KEY;

  if (!apiKey) {
    console.error("⚠️ Builder API key not configured");
    notFound();
  }

  builder.init(apiKey);

  const url = `/builder/${params.page.join("/")}`;

  // Fetch content from Builder.io
  const content = await builder
    .get(builderModels.page, {
      url,
      userAttributes: {
        urlPath: url,
      },
    })
    .promise();

  // Return 404 if no content found
  if (!content) {
    notFound();
  }

  // Render the page
  return <BuilderPage content={content} model={builderModels.page} apiKey={apiKey} />;
}
