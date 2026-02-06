/**
 * Builder.io Webhook Handler
 * Revalidates pages when content is published in Builder.io
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

function normalizeSignature(signature: string): string {
  return signature.startsWith('sha256=') ? signature.slice('sha256='.length) : signature;
}

function isValidSignature(secret: string, payload: string, signature: string): boolean {
  const expected = createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
  const provided = normalizeSignature(signature);

  if (expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.BUILDER_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('x-builder-signature');
      if (!signature || !isValidSignature(webhookSecret, rawBody, signature)) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    const body = JSON.parse(rawBody);

    // Extract the model and URL from the webhook payload
    const { model, url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'Missing URL in webhook payload' },
        { status: 400 }
      );
    }

    // Revalidate the specific path
    // eslint-disable-next-line no-console
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
