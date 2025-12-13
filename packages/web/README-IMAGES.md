# Image Optimization Guide

## Overview

All brand images are stored in `/public/brand/` and optimized for WebP format for better performance. Next.js automatically optimizes images at build time, but pre-converted WebP files provide immediate benefits.

## Image Files

- `logo.webp` / `logo.png` - Settler logo (512x512)
- `hero.webp` / `hero.jpg` - Hero image (2816x1536)
- `architecture.webp` / `architecture.png` - Architecture diagram (1408x768)
- `workflow.webp` / `workflow.jpg` - Workflow diagram (1408x768)
- `before-after.webp` / `before-after.png` - Before/After comparison (1408x768)

## Usage

### Type-Safe Image Imports

Use the centralized image utilities for type-safe image paths:

```tsx
import { getBrandImage, getBrandImageAlt, getBrandImageDimensions } from '@/lib/images';

// Get optimized image path (WebP preferred)
const imageSrc = getBrandImage('hero');

// Get alt text
const altText = getBrandImageAlt('hero');

// Get dimensions (prevents layout shift)
const { width, height } = getBrandImageDimensions('hero');
```

### SafeImage Component

All images use the `SafeImage` component which:
- Automatically falls back to original format if WebP fails
- Shows graceful error state if image completely fails
- Prevents layout shift with proper dimensions
- Optimizes loading with Next.js Image component

```tsx
import { SafeImage } from '@/components/marketing/SafeImage';
import { getBrandImage, brandImages } from '@/lib/images';

<SafeImage
  src={getBrandImage('hero')}
  fallbackSrc={brandImages.hero.fallback}
  alt={getBrandImageAlt('hero')}
  width={2816}
  height={1536}
  priority
/>
```

## Converting Images to WebP

### Option 1: Using the Conversion Script (Recommended)

```bash
cd packages/web
pnpm add -D sharp  # Install sharp if not already installed
node scripts/convert-images-to-webp.mjs
```

### Option 2: Manual Conversion

Use any image conversion tool:
- Online: [Squoosh](https://squoosh.app/)
- CLI: `cwebp` from WebP tools
- Node.js: Use `sharp` library

### Option 3: Next.js Automatic Optimization

Next.js will automatically convert images to WebP/AVIF at build time if WebP files don't exist. The `next/image` component handles this transparently.

## Vercel Build Optimization

Vercel automatically optimizes images during build. The configuration in `next.config.js` ensures:
- WebP and AVIF formats are preferred
- Proper device sizes for responsive images
- Optimal caching headers

## Performance Benefits

- **WebP**: ~30-50% smaller file sizes vs PNG/JPG
- **Next.js Optimization**: Automatic format conversion and resizing
- **Lazy Loading**: Images load only when needed (except priority images)
- **Responsive Images**: Proper sizes for different screen sizes

## Type Safety

All image paths are type-safe through the `brandImages` constant. TypeScript will catch:
- Invalid image keys
- Missing alt text
- Incorrect dimensions

## Best Practices

1. Always use `getBrandImage()` instead of hardcoded paths
2. Always provide `fallbackSrc` for critical images
3. Use `priority` prop only for above-the-fold images
4. Provide proper `sizes` prop for responsive images
5. Include meaningful `alt` text for accessibility
