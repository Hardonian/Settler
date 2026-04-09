/**
 * Internal Review / Polish Route (non-public)
 *
 * - Disabled in production
 * - Requires authenticated, authorized user
 * - Noindex / nofollow
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPrimaryTenant } from "@/lib/supabase/tenant-helpers";
import { getUserRole, UserRole } from "@/shared/auth/roles";
import { prisma } from "@/shared/db/prismaClient";
import { resolvePublicRuntimeUiConfig } from "@/lib/runtime-ui-config/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PolishControlPanel } from "@/components/polish/PolishControlPanel";
import { PolishStateGallery } from "@/components/polish/PolishStateGallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Polish Review",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      nocache: true,
    },
  },
};

function isProductionRuntime(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export default async function PolishReviewPage() {
  // Hard-disable in production.
  if (isProductionRuntime()) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const tenantId = await getPrimaryTenant();
  if (!tenantId) notFound();

  const role = await getUserRole(user.id, tenantId);
  if (![UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.TENANT_EDITOR].includes(role)) {
    notFound();
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      slug: true,
      metadata: true,
      branding: { select: { borderRadiusScale: true } },
    },
  });

  const resolvedConfig = resolvePublicRuntimeUiConfig({
    tenantMetadata: tenant?.metadata ?? undefined,
    tenantBranding: tenant?.branding
      ? {
          borderRadiusScale: tenant.branding.borderRadiusScale
            ? Number(tenant.branding.borderRadiusScale)
            : null,
        }
      : null,
  });

  const criticalLinks: Array<{ href: string; label: string }> = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/signup", label: "Signup" },
    { href: "/playground", label: "Playground" },
    { href: "/console", label: "Console" },
    { href: "/console/site", label: "Site Designer" },
    { href: "/console/site/branding", label: "Branding" },
    { href: "/console/site/navigation", label: "Navigation" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Internal Polish Review</CardTitle>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Tenant: <span className="font-mono">{tenant?.slug || "default"}</span> • Role:{" "}
            <span className="font-mono">{role}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {criticalLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="border rounded-[var(--ui-radius-lg)] px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                {l.label}
                <div className="text-xs text-slate-500 font-mono">{l.href}</div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <PolishControlPanel />
      <PolishStateGallery />

      <Card>
        <CardHeader>
          <CardTitle>Resolved Public Runtime UI Config</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto p-4 bg-slate-50 dark:bg-slate-900 rounded-[var(--ui-radius-lg)]">
            {JSON.stringify(resolvedConfig, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
