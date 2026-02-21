
import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { name: 'Overview', href: '/app' },
    { name: 'Connections', href: '/app/connections' },
    { name: 'Pipelines', href: '/app/pipelines' },
    { name: 'Runs', href: '/app/runs' },
    { name: 'Results', href: '/app/results' },
    { name: 'Review Queue', href: '/app/review' },
    { name: 'Rules', href: '/app/rules' },
    { name: 'Governance', href: '/app/governance' },
    { name: 'Integrations', href: '/app/integrations' },
    { name: 'Artifacts', href: '/app/artifacts' },
    { name: 'Alerts', href: '/app/alerts' },
    { name: 'Traces', href: '/app/traces' },
    { name: 'Settings', href: '/app/settings' },
  ];

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark">
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-surface-darker border-r border-slate-200 dark:border-slate-800">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 border-b border-slate-200 dark:border-slate-800">
            <h1 className="text-xl font-bold">Settler</h1>
          </div>
          <nav className="flex-1 overflow-y-auto">
            <ul className="p-4 space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
