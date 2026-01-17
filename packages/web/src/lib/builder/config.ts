/**
 * Builder.io (Fusion Builder) Configuration
 * Enables visual page building for marketing pages
 */

import { builder } from '@builder.io/react';

// Initialize Builder with API key
const BUILDER_API_KEY = process.env.NEXT_PUBLIC_BUILDER_API_KEY || process.env.BUILDER_API_KEY || '';

if (!BUILDER_API_KEY && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ Builder.io API key not found. Visual editor will not work.');
}

// Initialize Builder
builder.init(BUILDER_API_KEY);

// Configure Builder for Next.js
export const builderConfig = {
  apiKey: BUILDER_API_KEY,
  // Use custom fields for better content management
  customFields: {
    page: [
      {
        name: 'title',
        type: 'string',
        required: true,
        helperText: 'Page title for SEO',
      },
      {
        name: 'description',
        type: 'longText',
        helperText: 'Page description for SEO',
      },
      {
        name: 'keywords',
        type: 'string',
        helperText: 'SEO keywords (comma-separated)',
      },
      {
        name: 'ogImage',
        type: 'file',
        helperText: 'Open Graph image for social sharing',
      },
    ],
  },
};

// Dev server configuration
export const builderDevConfig = {
  // Local dev server URL for Builder.io preview
  previewUrl: process.env.NEXT_PUBLIC_BUILDER_PREVIEW_URL || 'http://localhost:3000',

  // Production URL for Builder.io
  productionUrl: process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : 'https://settler.dev',
};

// Models configuration for different content types
export const builderModels = {
  page: 'page',            // General marketing pages
  landingPage: 'landing-page',  // Landing pages with conversion focus
  blogPost: 'blog-post',   // Blog content
  documentation: 'docs',   // Documentation pages
  announcement: 'announcement', // Announcement banners
};

// Export configured builder instance
export { builder };
export default builder;
