import { APP_ROUTE_PREFIXES } from "@/lib/routing/route-groups";

export const APP_AUTH_PREFIXES = APP_ROUTE_PREFIXES;

export function isAppAuthRequiredRoute(pathname: string): boolean {
  return APP_AUTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
