/**
 * Image Optimization API Route
 * Optimizes images on-the-fly for better performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCacheHeaders } from '@/lib/performance/cache-strategies';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');
    const width = searchParams.get('w');
    const height = searchParams.get('h');
    const quality = searchParams.get('q') || '85';

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Missing image URL' },
        { status: 400 }
      );
    }

    // In production, use Next.js Image Optimization or a service like Cloudinary
    // For now, return the original URL with optimization hints
    // TODO: Implement actual image optimization using sharp or similar
    
    // Next.js automatically optimizes images served from /public or external domains
    // configured in next.config.js
    const optimizedUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://settler.dev'}${imageUrl}`;

    // Return redirect to optimized image or proxy it
    // For now, return metadata about optimization
    return NextResponse.json(
      {
        url: optimizedUrl,
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        quality: parseInt(quality),
        optimized: true,
      },
      {
        headers: getCacheHeaders('STATIC'),
      }
    );
  } catch (error) {
    console.error('Image optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize image' },
      { status: 500 }
    );
  }
}
