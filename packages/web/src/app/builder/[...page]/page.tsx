/**
 * Builder.io Catch-All Page Route
 * Renders pages created in Builder.io visual editor
 *
 * Usage: Any page under /builder/* will be rendered from Builder.io
 * Example: /builder/landing/product-launch
 */

import { notFound } from "next/navigation";

// Use dynamic rendering to avoid React context issues during static generation
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    page: string[];
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  try {
    const { builder } = await import("@builder.io/sdk");
    const { builderModels } = await import("@/lib/builder/config");
    const apiKey = process.env.NEXT_PUBLIC_BUILDER_API_KEY || process.env.BUILDER_API_KEY;

    if (!apiKey) {
      return { title: "Page Not Found" };
    }

    builder.init(apiKey);

    const resolvedParams = await params;
    const url = `/builder/${resolvedParams.page.join("/")}`;
    const content = await builder
      .get(builderModels.page, {
        url,
        userAttributes: { urlPath: url },
      })
      .promise();

    if (!content) {
      return { title: "Page Not Found" };
    }

    return {
      title: content.data?.title || "Settler",
      description: content.data?.description || "",
      keywords: content.data?.keywords || "",
      openGraph: {
        title: content.data?.title || "Settler",
        description: content.data?.description || "",
        images: [content.data?.ogImage || "/opengraph-image"],
      },
      twitter: {
        card: "summary_large_image" as const,
        title: content.data?.title || "Settler",
        description: content.data?.description || "",
        images: [content.data?.ogImage || "/opengraph-image"],
      },
    };
  } catch {
    return { title: "Page Not Found" };
  }
}

// Page component
export default async function BuilderCatchAllPage({ params }: PageProps) {
  try {
    const { builder } = await import("@builder.io/sdk");
    const { builderModels } = await import("@/lib/builder/config");
    const apiKey = process.env.NEXT_PUBLIC_BUILDER_API_KEY || process.env.BUILDER_API_KEY;

    if (!apiKey) {
      notFound();
    }

    builder.init(apiKey);

    const resolvedParams = await params;
    const url = `/builder/${resolvedParams.page.join("/")}`;

    // Fetch content from Builder.io
    const content = await builder
      .get(builderModels.page, {
        url,
        userAttributes: { urlPath: url },
      })
      .promise();

    // Return 404 if no content found
    if (!content) {
      notFound();
    }

    // Render the Builder.io content
    const { BuilderComponent } = await import("@builder.io/react");
    return <BuilderComponent content={content} model={builderModels.page} apiKey={apiKey} />;
  } catch {
    notFound();
  }
}
