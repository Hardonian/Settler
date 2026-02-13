import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('offline page prerender compatibility', () => {
  it('does not pass server-side event handlers to client components', () => {
    const offlinePagePath = resolve(process.cwd(), 'src/app/offline/page.tsx');
    const source = readFileSync(offlinePagePath, 'utf-8');

    expect(source).not.toContain('onClick=');
    expect(source).toContain('<Link href="/offline">Try Again</Link>');
  });
});
