/**
 * Console Layout Component
 * 
 * Provides sidebar navigation for the Developer Console.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Key,
  BarChart3,
  CreditCard,
  Receipt,
  ToggleLeft,
  BookOpen,
  Palette,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'; // Assuming Sheet is standard

import {
  Sparkles,
  Activity,
  Webhook,
  Code,
  Zap,
  Shield,
  Search,
  Database,
} from 'lucide-react';
import { BackendHealthBadge } from './BackendHealthBadge';

const consoleNavItems = [
    { href: '/console', label: 'Overview', icon: LayoutDashboard },
    { href: '/console/api-test', label: 'API Test Console', icon: Code },
    { href: '/console/api-playground', label: 'API Playground', icon: Code },
    { href: '/console/tables', label: 'API Service Tables', icon: Database },
    { href: '/console/activity', label: 'Activity Feed', icon: Activity },
    { href: '/console/workflows', label: 'Workflows', icon: Zap },
    { href: '/console/control-plane', label: 'Control Plane', icon: Shield },
    { href: '/console/inspector', label: 'Inspector', icon: Search },
    { href: '/console/api-keys', label: 'API Keys', icon: Key },
    { href: '/console/usage', label: 'Usage & Metrics', icon: BarChart3 },
    { href: '/console/performance', label: 'Performance', icon: Activity },
    { href: '/console/insights', label: 'AI Insights', icon: Sparkles },
    { href: '/console/webhooks', label: 'Webhooks', icon: Webhook },
    { href: '/console/billing', label: 'Billing & Plan', icon: CreditCard },
    { href: '/console/receipts', label: 'Receipts', icon: Receipt },
    { href: '/console/feature-flags', label: 'Feature Flags', icon: ToggleLeft },
    { href: '/console/site', label: 'Site Designer', icon: Palette },
    { href: '/console/docs', label: 'Docs & Examples', icon: BookOpen },
  ];

interface ConsoleLayoutProps {
  children: React.ReactNode;
}

export function ConsoleLayout({ children }: ConsoleLayoutProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <nav className="p-4 space-y-1">
      {consoleNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
        
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-electric-cyan/10 text-electric-cyan dark:bg-electric-cyan/20 dark:text-electric-cyan'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            )}
          >
            <Icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      {/* Mobile Trigger */}
      <div className="md:hidden fixed top-20 left-4 z-40">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-md bg-background/50 backdrop-blur-sm">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Console Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 pt-10">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <BackendHealthBadge />
            </div>
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 min-h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed left-0 top-0 pt-16">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <BackendHealthBadge />
          </div>
          <NavContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
