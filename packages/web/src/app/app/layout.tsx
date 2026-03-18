import Link from "next/link";
import { EnvErrorPanel } from "@/components/env/EnvErrorPanel";
import { getAppEnvStatus } from "@/lib/env/runtime-access";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar, MobileNav } from "@/components/app/AppNav";
import { OperationalRouteNotice } from "@/components/shared/OperationalRouteNotice";

// All /app/* routes require authenticated session state via cookies.
// Force dynamic rendering to prevent Next.js from attempting static prerender
// during build, which causes "[Supabase] Failed to get cookies" errors.
export const dynamic = "force-dynamic";

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

function NoTenantScreen() {
  const isLocalDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-2">No workspace assigned</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Your account has not been assigned to a Settler workspace. Complete setup to access the operational control plane.
        </p>
        
        {isLocalDev && (
          <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-left">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
              💡 Running locally? Create a workspace to get started:
            </p>
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          <Link
            href="/console/onboarding"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {isLocalDev ? "Create your workspace" : "Complete workspace setup"}
          </Link>
          <Link
            href="/docs/getting-started"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Read setup documentation
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Return to homepage
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

  const tenantId = user.user_metadata?.tenant_id;
  if (!tenantId) return <NoTenantScreen />;

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
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-4 md:p-6" id="main-content">
          <OperationalRouteNotice />
          {children}
        </main>
      </div>
    </div>
  );
}
