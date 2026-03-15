import Link from "next/link";
import { EnvErrorPanel } from "@/components/env/EnvErrorPanel";
import { getAppEnvStatus } from "@/lib/env/runtime-access";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar, MobileNav } from "@/components/app/AppNav";
import { OperationalRouteNotice } from "@/components/shared/OperationalRouteNotice";

function SignedOutScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">You&apos;re signed out</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The Settler app shell requires an authenticated session. Sign in to continue.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/login"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Sign in
          </Link>
          <Link
            href="/"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground"
          >
            Back to marketing site
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const env = getAppEnvStatus();
  if (!env.ok) return <EnvErrorPanel missingVars={env.missing} />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <SignedOutScreen />;

  const tenantId = user.user_metadata?.tenant_id ?? "—";
  const envLabel = process.env.NODE_ENV === "production" ? "prod" : (process.env.NODE_ENV ?? "dev");

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-3">
            <MobileNav />
            <span className="text-sm text-muted-foreground">
              Tenant: <span className="font-medium text-foreground">{tenantId}</span>
            </span>
          </div>
          <span className="rounded bg-muted/40 px-2 py-1 font-mono text-xs text-muted-foreground">
            {envLabel}
          </span>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-4 md:p-6" id="main-content">
          <OperationalRouteNotice />
          {children}
        </main>
      </div>
    </div>
  );
}
