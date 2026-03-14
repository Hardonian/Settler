import Link from "next/link";
import { EnvErrorPanel } from "@/components/env/EnvErrorPanel";
import { getAppEnvStatus } from "@/lib/env/runtime-access";
import { createClient } from "@/lib/supabase/server";
import { SettlerLogo } from "@/components/brand/SettlerLogo";

function SignedOutScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-xl border border-border-light bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-text-main">You&apos;re signed out</h2>
        <p className="mt-2 text-sm text-text-secondary">
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
            className="rounded-md border border-border-light px-4 py-2 text-sm font-medium"
          >
            Back to marketing site
          </Link>
        </div>
      </div>
    </div>
  );
}

const navSections = [
  {
    label: "Execution Infrastructure",
    items: [
      { name: "Control Plane", href: "/app" },
      { name: "Run Explorer", href: "/app/runs" },
      { name: "Truth Explorer", href: "/app/proofs" },
      { name: "Replay Lab", href: "/app/replay" },
      { name: "Policy Lab", href: "/app/policies" },
    ],
  },
  {
    label: "Operator Intelligence",
    items: [
      { name: "Live Alerts", href: "/app/alerts" },
      { name: "Runtime Event Signals", href: "/app/metrics" },
      { name: "System Telemetry", href: "/app/system-health" },
      { name: "Evidence Query Surface", href: "/app/evidence" },
      { name: "Integrations", href: "/app/integrations" },
    ],
  },
  {
    label: "Governance",
    items: [
      { name: "Audit Surfaces", href: "/app/audit" },
      { name: "Tenant Isolation Controls", href: "/app/settings" },
    ],
  },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const env = getAppEnvStatus();
  if (!env.ok) return <EnvErrorPanel missingVars={env.missing} />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <SignedOutScreen />;

  return (
    <div className="flex h-screen bg-background-light dark:bg-background">
      <aside className="hidden md:flex w-72 flex-col border-r border-border bg-card dark:bg-card">
        <Link href="/" className="flex border-b border-border p-4">
          <SettlerLogo variant="horizontal" className="h-8 w-auto" priority />
        </Link>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label="App navigation">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-[var(--sidebar-item-radius)] px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card dark:bg-card px-4">
          <div className="text-sm text-muted-foreground">
            Tenant: {user.user_metadata?.tenant_id ?? "default"}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-[var(--ui-radius-sm)] bg-muted/30 px-2 py-1 text-muted-foreground font-mono">
              {process.env.NODE_ENV ?? "dev"}
            </span>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-4 md:p-6" id="main-content">{children}</main>
      </div>
    </div>
  );
}
