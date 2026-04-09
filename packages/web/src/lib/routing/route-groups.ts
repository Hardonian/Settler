export const ROUTE_GROUPS = {
  marketing: "(marketing)",
  app: "app",
} as const;

// Routes that REQUIRE authentication at the middleware layer (redirect to /login if not authed).
// /console is intentionally excluded — pages handle their own gating for free-view support.
export const APP_ROUTE_PREFIXES = ["/app", "/admin"] as const;

export const MARKETING_ROUTE_GROUP_ROOTS = ["packages/web/src/app/(marketing)"] as const;
