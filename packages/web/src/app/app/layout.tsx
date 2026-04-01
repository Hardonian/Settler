import Link from "next/link";
import { EnvErrorPanel } from "@/components/env/EnvErrorPanel";
import { getAppEnvStatus } from "@/lib/env/runtime-access";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar, MobileNav } from "@/components/app/AppNav";
import { OperationalRouteNotice } from "@/components/shared/OperationalRouteNotice";
import { ShieldCheck } from "lucide-react";

// All /app/* routes require authenticated session state via cookies.
// Force dynamic rendering to prevent Next.js from attempting static prerender
// during build, which causes "[Supabase] Failed to get cookies" errors.
export const dynamic = "force-dynamic";

function SignedOutScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-xl border border-border bg-card p-8 shadow-md">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/40 border border-border/60">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Session required</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          The Settler operator console requires an authenticated session. Sign in to access your workspace.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign in
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Homepage
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
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/40 border border-border/60">
          <ShieldCheck className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">No workspace assigned</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Your account has not been assigned to a Settler workspace. Complete setup to access the operational control plane.
        </p>

        {isLocalDev && (
          <div className="mt-4 mb-2 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-left">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Running locally? Create a workspace to get started.
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          <Link
            href="/console/onboarding"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isLocalDev ? "Create your workspace" : "Complete workspace setup"}
          </Link>
          <Link
            href="/docs/getting-started"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

  // Abbreviate long tenant IDs for display
  const tenantDisplay = tenantId.length > 16
    ? `${tenantId.slice(0, 8)}…${tenantId.slice(-4)}`
    : tenantId;

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <MobileNav />
            {/* Tenant context pill */}
            <div
              className="hidden sm:flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs"
              title={`Workspace: ${tenantId}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success flex-shrink-0" aria-hidden="true" />
              <span className="font-mono text-muted-foreground truncate max-w-[180px]">
                {tenantDisplay}
              </span>
            </div>
          </div>
          {/* Right-side header actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/app/alerts"
              className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="View live alerts"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </Link>
            <Link
              href="/app/settings"
              className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </Link>
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
