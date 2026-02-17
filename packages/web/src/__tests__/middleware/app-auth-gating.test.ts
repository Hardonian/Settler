/** @jest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { APP_AUTH_PREFIXES, isAppAuthRequiredRoute } from '@/lib/auth/route-gating';

describe('middleware /app-only auth gating', () => {
  it('locks auth-required prefixes to /app only', () => {
    expect(APP_AUTH_PREFIXES).toEqual(['/app']);
    expect(isAppAuthRequiredRoute('/app')).toBe(true);
    expect(isAppAuthRequiredRoute('/app/workflows')).toBe(true);
    expect(isAppAuthRequiredRoute('/')).toBe(false);
    expect(isAppAuthRequiredRoute('/platform')).toBe(false);
    expect(isAppAuthRequiredRoute('/console')).toBe(false);
    expect(isAppAuthRequiredRoute('/dashboard')).toBe(false);
  });


  it('keeps middleware matcher scoped to /app and /api only', () => {
    const middlewareSource = readFileSync(resolve(process.cwd(), 'middleware.ts'), 'utf-8');

    expect(middlewareSource).toContain('"/app/:path*"');
    expect(middlewareSource).toContain('"/api/:path*"');
  });

  it('keeps /app unauthenticated redirects targeting /login with next param', () => {
    const middlewareSource = readFileSync(resolve(process.cwd(), 'middleware.ts'), 'utf-8');

    expect(middlewareSource).toContain("const isAuthRequiredRoute = !isApiRoute && isAppAuthRequiredRoute(pathname);");
    expect(middlewareSource).toContain("const redirectUrl = new URL('/login', request.url);");
    expect(middlewareSource).toContain("redirectUrl.searchParams.set('next', pathname);");
  });
});
