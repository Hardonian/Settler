# Settler Brand Images

This directory contains all Settler brand images organized by category.

## Directory Structure

```
public/assets/images/
├── favicons/          # Favicon images
├── logos/            # Logo images
├── social/           # Social media images (OG, Twitter cards)
└── thumbnails/       # Thumbnail images
```

## Image Files

### Favicons
- `settler-favicon-512.jpg` (512x279) - Main favicon

### Logos
- `settler-logo-main.jpg` (1408x768) - Main Settler logo

### Social Media
- `settler-og-image.jpg` (2816x1536) - Open Graph image for social sharing
- `settler-twitter-card.png` (1408x768) - Twitter card image

### Thumbnails
- `settler-thumbnail.jpg` (1408x768) - General purpose thumbnail

## Usage

All images are configured in `src/lib/images/image-config.ts` and can be accessed via:

```typescript
import { SettlerImage, getImageUrl } from '@/lib/images';

// In React components
<SettlerImage imageKey="logoMain" className="h-12" />

// For URLs (metadata, etc.)
const ogImageUrl = getImageUrl('ogImage');
```

## Image Keys

- `favicon` - Main favicon
- `favicon192` - 192x192 icon (SVG)
- `favicon512` - 512x512 icon (SVG)
- `ogImage` - Open Graph image
- `twitterCard` - Twitter card image
- `logoMain` - Main logo
- `thumbnail` - Thumbnail image

All images are automatically referenced in:
- `app/layout.tsx` - Favicon and metadata
- `public/manifest.json` - PWA icons
- `lib/metadata.ts` - Page metadata
- `components/SEOHead.tsx` - SEO meta tags
- `components/StructuredData.tsx` - Schema.org structured data
