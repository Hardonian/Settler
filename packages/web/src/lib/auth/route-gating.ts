export const APP_AUTH_PREFIXES = ['/app'] as const;

export function isAppAuthRequiredRoute(pathname: string): boolean {
  return APP_AUTH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
