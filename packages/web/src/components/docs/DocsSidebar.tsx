'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Rocket,
  Code,
  Webhook,
  Shield,
  AlertCircle,
  BarChart3,
  FileText,
  Zap,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: typeof BookOpen;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
    icon: Rocket,
  },
  {
    title: 'Quickstart',
    href: '/docs/quickstart',
    icon: Zap,
  },
  {
    title: 'API Reference',
    href: '/docs/api',
    icon: Code,
  },
  {
    title: 'SDKs',
    href: '/docs/sdk',
    icon: FileText,
    children: [
      { title: 'Node.js/TypeScript', href: '/docs/sdk/nodejs', icon: Code },
      { title: 'Python', href: '/docs/sdk/python', icon: Code },
      { title: 'Go', href: '/docs/sdk/go', icon: Code },
      { title: 'Ruby', href: '/docs/sdk/ruby', icon: Code },
    ],
  },
  {
    title: 'Integrations',
    href: '/docs/integrations',
    icon: Zap,
  },
  {
    title: 'Auth & Security',
    href: '/docs/auth',
    icon: Shield,
  },
  {
    title: 'Webhooks',
    href: '/docs/webhooks',
    icon: Webhook,
  },
  {
    title: 'Status & Limits',
    href: '/docs/status',
    icon: BarChart3,
  },
  {
    title: 'Common Errors',
    href: '/docs/errors',
    icon: AlertCircle,
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-y-auto">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <Link href="/docs" className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white">
          <BookOpen className="w-6 h-6" />
          <span>Documentation</span>
        </Link>
      </div>
      
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.title}
              </Link>
              {item.children && isActive && (
                <div className="ml-7 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                          isChildActive
                            ? 'text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
                        )}
                      >
                        <ChildIcon className="w-3 h-3" />
                        {child.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
