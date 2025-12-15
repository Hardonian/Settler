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

    // Fetch image
    const imageResponse = imageUrl.startsWith('http')
      ? await fetch(imageUrl)
      : await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://settler.dev'}${imageUrl}`);
    
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: 404 }
      );
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Optimize with Sharp
    try {
      const { optimizeImage } = await import('@/lib/images/sharp-optimizer');
      const optimizedBuffer = await optimizeImage(imageBuffer, {
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        quality: parseInt(quality),
        format: 'webp',
      });

      return new NextResponse(optimizedBuffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'image/webp',
          ...getCacheHeaders('STATIC'),
        },
      });
    } catch (error) {
      // Fallback to original if optimization fails
      console.error('Image optimization error:', error);
      return new NextResponse(imageBuffer as unknown as BodyInit, {
        headers: {
          'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
          ...getCacheHeaders('STATIC'),
        },
      });
    }
  } catch (error) {
    console.error('Image optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize image' },
      { status: 500 }
    );
  }
}
