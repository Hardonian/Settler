import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Database,
  Lock,
  SearchX,
  ShieldX,
  Users,
  Wallet,
  ActivityOff,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type RouteStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
};

interface RouteStateProps {
  title: string;
  description: string;
  detail?: string;
  icon?: LucideIcon;
  actions?: RouteStateAction[];
  className?: string;
}

export type RouteStateVariant =
  | "auth-required"
  | "no-organization"
  | "membership-missing"
  | "forbidden"
  | "backend-unreachable"
  | "env-missing"
  | "billing-disabled"
  | "no-data"
  | "not-found";

const ROUTE_STATE_VARIANTS: Record<
  RouteStateVariant,
  Pick<RouteStateProps, "title" | "description" | "detail" | "icon"> & {
    actions: RouteStateAction[];
  }
> = {
  "auth-required": {
    title: "Authentication required",
    description: "Sign in to continue to this authenticated route.",
    detail: "Your session was missing or expired. Re-authenticate to load tenant-scoped data.",
    icon: Lock,
    actions: [
      { label: "Sign In", href: "/login" },
      { label: "Go Home", href: "/", variant: "outline" },
    ],
  },
  "no-organization": {
    title: "Organization required",
    description: "Your account is signed in but not attached to an organization.",
    detail: "Create or join an organization before using tenant-scoped console routes.",
    icon: Users,
    actions: [
      { label: "View Organizations", href: "/console/organizations" },
      { label: "Go Home", href: "/", variant: "outline" },
    ],
  },
  "membership-missing": {
    title: "Membership required",
    description: "You are signed in, but do not have membership for this workspace.",
    detail:
      "Request access from an organization admin or switch to a workspace where you have membership.",
    icon: ShieldX,
    actions: [
      { label: "Switch Workspace", href: "/console/organizations" },
      { label: "Go Home", href: "/", variant: "outline" },
    ],
  },
  forbidden: {
    title: "Access forbidden",
    description: "Your account does not have permission for this route.",
    detail: "This was blocked by policy or role checks, not by missing data.",
    icon: ShieldX,
    actions: [
      { label: "Back to Console", href: "/console" },
      { label: "Go Home", href: "/", variant: "outline" },
    ],
  },
  "backend-unreachable": {
    title: "Backend temporarily unreachable",
    description: "This route depends on backend services that are not currently reachable.",
    detail: "Retry once connectivity is restored. Do not treat this as an empty-state success.",
    icon: Database,
    actions: [{ label: "Retry", href: "", variant: "outline" }],
  },
  "env-missing": {
    title: "Environment configuration missing",
    description: "Required runtime variables are missing for this authenticated surface.",
    detail:
      "Set required Supabase and backend environment variables before validating auth and tenant flows.",
    icon: AlertTriangle,
    actions: [{ label: "Open Setup Check", href: "/console/setup-check" }],
  },
  "billing-disabled": {
    title: "Billing disabled in this environment",
    description: "Stripe is not configured, so billing actions are intentionally unavailable.",
    detail:
      "Plan display remains informational until STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are configured.",
    icon: Wallet,
    actions: [{ label: "Open Diagnostics", href: "/console/diagnostics" }],
  },
  "no-data": {
    title: "No data yet",
    description: "This route is healthy but no records exist yet for the current tenant context.",
    detail: "Create or import data to validate this flow end-to-end.",
    icon: Database,
    actions: [{ label: "Back to Console", href: "/console" }],
  },
  "not-found": {
    title: "Route not found",
    description: "The route you requested does not exist.",
    detail: "Check the URL or navigate back to a known console route.",
    icon: SearchX,
    actions: [
      { label: "Back to Console", href: "/console" },
      { label: "Go Home", href: "/", variant: "outline" },
    ],
  },
};

export function routeStateFromVariant(
  variant: RouteStateVariant,
  overrides: Partial<RouteStateProps> = {}
): RouteStateProps {
  const base = ROUTE_STATE_VARIANTS[variant];
  const actions = overrides.actions ?? base.actions.filter((action) => action.href !== "");

  return {
    title: overrides.title ?? base.title,
    description: overrides.description ?? base.description,
    detail: overrides.detail ?? base.detail,
    icon: overrides.icon ?? base.icon,
    actions,
    className: overrides.className,
  };
}

export function RouteStateCard({
  title,
  description,
  detail,
  icon: Icon = AlertTriangle,
  actions = [],
  className,
}: RouteStateProps) {
  return (
    <div className={className ?? "flex min-h-[60vh] items-center justify-center px-4 py-8"}>
      <Card className="w-full max-w-xl border-border/80 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-foreground">
            <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {(detail || actions.length > 0) && (
          <CardContent className="space-y-4">
            {detail ? <p className="text-sm text-muted-foreground">{detail}</p> : null}
            {actions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => {
                  const variant = action.variant ?? "default";
                  if (action.href) {
                    return (
                      <Button key={`${action.label}-${action.href}`} asChild variant={variant}>
                        <Link href={action.href}>{action.label}</Link>
                      </Button>
                    );
                  }

                  if (action.onClick) {
                    return (
                      <Button key={action.label} onClick={action.onClick} variant={variant}>
                        {action.label}
                      </Button>
                    );
                  }

                  return null;
                })}
              </div>
            ) : null}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
