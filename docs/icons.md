# PWA Icons

This directory should contain the following icon files for the Progressive Web App:

- `icon-192x192.png` - 192x192 pixel icon
- `icon-512x512.png` - 512x512 pixel icon

## Generating Icons

You can generate these icons from a source image using ImageMagick or online tools:

```bash
# Using ImageMagick
convert source-image.png -resize 192x192 icon-192x192.png
convert source-image.png -resize 512x512 icon-512x512.png
```

Or use an online tool like:

- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

## Icon Requirements

- **Format**: PNG
- **Sizes**: 192x192 and 512x512 pixels
- **Purpose**: "any maskable" (works on all platforms)
- **Design**: Should work well at small sizes, simple and recognizable

## Temporary Placeholder

Until proper icons are created, the PWA will still function but may show default browser icons.
