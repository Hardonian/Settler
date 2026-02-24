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
          <Link href="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">
            Sign in
          </Link>
          <Link href="/" className="rounded-md border border-border-light px-4 py-2 text-sm font-medium">
            Back to marketing site
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const env = getAppEnvStatus();

  if (!env.ok) {
    return <EnvErrorPanel missingVars={env.missing} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <SignedOutScreen />;
  }

  const navItems = [
    { name: "Overview", href: "/app" },
    { name: "Connections", href: "/app/connections" },
    { name: "Pipelines", href: "/app/pipelines" },
    { name: "Runs", href: "/app/runs" },
    { name: "Results", href: "/app/results" },
    { name: "Review Queue", href: "/app/review" },
    { name: "Rules", href: "/app/rules" },
    { name: "Governance", href: "/app/governance" },
    { name: "Integrations", href: "/app/integrations" },
    { name: "Artifacts", href: "/app/artifacts" },
    { name: "Alerts", href: "/app/alerts" },
    { name: "Traces", href: "/app/traces" },
    { name: "Settings", href: "/app/settings" },
  ];

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark">
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-surface-darker">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-center border-b border-slate-200 dark:border-slate-800">
            <h1 className="text-xl font-bold">Settler</h1>
          </div>
          <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-2 p-4">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
