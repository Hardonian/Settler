/**
 * Social Share API
 * Generates optimized social sharing metadata and handles share tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const shareSchema = z.object({
  url: z.string().url(),
  platform: z.enum(['twitter', 'linkedin', 'facebook', 'reddit', 'hackernews']),
  title: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = shareSchema.parse(body);

    // Generate platform-specific share URLs
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(validated.url)}&text=${encodeURIComponent(validated.title || '')}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(validated.url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(validated.url)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(validated.url)}&title=${encodeURIComponent(validated.title || '')}`,
      hackernews: `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(validated.url)}&t=${encodeURIComponent(validated.title || '')}`,
    };

    // TODO: Track share event in analytics
    console.log('Social share:', {
      url: validated.url,
      platform: validated.platform,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      shareUrl: shareUrls[validated.platform],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid share data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Social share error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate share URL',
      },
      { status: 500 }
    );
  }
}
