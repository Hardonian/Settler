/**
 * Builder.io Page Component
 * Renders content from Builder.io visual editor
 */

'use client';

import { BuilderComponent, builder, useIsPreviewing } from '@builder.io/react';
import { builderModels } from '@/lib/builder/config';
import '@/lib/builder/component-registry'; // Auto-register components
import { useEffect, useState } from 'react';

interface BuilderPageProps {
  model?: string;
  content?: any;
  apiKey?: string;
}

export default function BuilderPage({
  model = builderModels.page,
  content: initialContent,
  apiKey,
}: BuilderPageProps) {
  const isPreviewing = useIsPreviewing();
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(!initialContent);
  const [error, setError] = useState<string | null>(null);

  // Initialize Builder if API key is provided
  useEffect(() => {
    if (apiKey && apiKey !== builder.apiKey) {
      builder.init(apiKey);
    }
  }, [apiKey]);

  // Fetch content if not provided
  useEffect(() => {
    if (!initialContent && typeof window !== 'undefined') {
      setLoading(true);
      builder
        .get(model, {
          url: window.location.pathname,
          userAttributes: {
            urlPath: window.location.pathname,
          },
        })
        .promise()
        .then((fetchedContent) => {
          setContent(fetchedContent);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching Builder content:', err);
          setError('Failed to load page content');
          setLoading(false);
        });
    }
  }, [model, initialContent]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading page content...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !isPreviewing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold">Content Not Found</h2>
          <p className="text-muted-foreground">{error}</p>
          <a
            href="/"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  // Show 404 if no content and not previewing
  if (!content && !isPreviewing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="text-6xl">404</div>
          <h2 className="text-2xl font-bold">Page Not Found</h2>
          <p className="text-muted-foreground">
            This page hasn't been created in Builder.io yet.
          </p>
          <a
            href="/"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  // Render Builder content
  return (
    <div className="builder-page">
      <BuilderComponent model={model} content={content} />
    </div>
  );
}

// SEO helper component for Builder pages - DEPRECATED in App Router
// SEO is now handled via generateMetadata in the page.tsx file
export function BuilderPageWithSEO({ content, model, apiKey }: BuilderPageProps) {
  return <BuilderPage content={content} model={model} apiKey={apiKey} />;
}
