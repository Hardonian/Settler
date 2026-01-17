/**
 * Builder.io Webhook Handler
 * Revalidates pages when content is published in Builder.io
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.BUILDER_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('x-builder-signature');
      // TODO: Implement signature verification
      // For now, we'll trust the webhook
    }

    // Extract the model and URL from the webhook payload
    const { model, url, data } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'Missing URL in webhook payload' },
        { status: 400 }
      );
    }

    // Revalidate the specific path
    console.log(`🔄 Revalidating path: ${url} (model: ${model})`);
    revalidatePath(url);

    // If it's a homepage update, also revalidate the root
    if (url === '/') {
      revalidatePath('/');
    }

    return NextResponse.json(
      {
        revalidated: true,
        url,
        model,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing Builder.io webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Builder.io webhook endpoint is running',
    timestamp: new Date().toISOString(),
  });
}
