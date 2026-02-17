/** @jest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('stripe webhook runtime invariants', () => {
  it('keeps node runtime and raw body verification path', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/app/api/stripe/webhook/route.ts'),
      'utf-8'
    );

    expect(source).toContain('export const runtime = "nodejs"');
    expect(source).toContain('const body = await request.text();');
    expect(source).toContain('stripe.webhooks.constructEvent(body, signature, webhookSecret)');
  });
});
