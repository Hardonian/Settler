import Link from "next/link";
import { EnvErrorPanel } from "@/components/env/EnvErrorPanel";
import { getAppEnvStatus } from "@/lib/env/runtime-access";
import { createClient } from "@/lib/supabase/server";

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

const navItems = [
  { name: "Overview", href: "/app" },
  { name: "Runs", href: "/app/runs" },
  { name: "Evidence", href: "/app/evidence" },
  { name: "Policies", href: "/app/policies" },
  { name: "Metrics", href: "/app/metrics" },
  { name: "Settings", href: "/app/settings" },
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
    <div className="flex h-screen bg-background-light">
      <aside className="w-64 border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4 text-xl font-bold">Settler Console</div>
        <nav className="p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mb-1 block rounded px-3 py-2 text-sm hover:bg-slate-100"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
          <div className="text-sm text-slate-600">
            Tenant: {user.user_metadata?.tenant_id ?? "default"}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded bg-slate-100 px-2 py-1">
              ENV: {process.env.NODE_ENV ?? "dev"}
            </span>
            <details>
              <summary className="cursor-pointer rounded bg-slate-100 px-2 py-1">
                request-id debug
              </summary>
              <div className="mt-1 rounded border border-slate-200 bg-white p-2 text-slate-600">
                request-id is returned in x-request-id response header.
              </div>
            </details>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}
