/**
 * Console Layout Component
 *
 * Provides sidebar navigation for the Developer Console.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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
  Sparkles,
  Activity,
  Webhook,
  Code,
  Zap,
  Shield,
  Search,
  Database,
  FileText,
  Building2,
  ShieldCheck,
  RotateCcw,
  ClipboardCheck,
  Scale,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BackendHealthBadge } from "./BackendHealthBadge";

const consoleNavItems = [
  { href: "/console", label: "Dashboard", icon: LayoutDashboard },
  { href: "/console/reconciliations", label: "Reconciliations", icon: Scale },
  { href: "/console/audits", label: "Audits", icon: ClipboardCheck },
  { href: "/console/proof-explorer", label: "Proof Explorer", icon: ShieldCheck },
  { href: "/console/replay-lab", label: "Replay Lab", icon: RotateCcw },
  { href: "/console/policies", label: "Policies", icon: Shield },
  { href: "/console/organizations", label: "Organizations", icon: Building2 },
  { href: "/console/api-keys", label: "API Keys", icon: Key },
  { href: "/console/settings", label: "Settings", icon: Settings },
  { href: "/console/api-test", label: "API Test Console", icon: Code },
  { href: "/console/api-playground", label: "API Playground", icon: Code },
  { href: "/console/tables", label: "API Service Tables", icon: Database },
  { href: "/console/api-logs", label: "API Call Logs", icon: FileText },
  { href: "/console/activity", label: "Activity Feed", icon: Activity },
  { href: "/console/workflows", label: "Workflows", icon: Zap },
  { href: "/console/control-plane", label: "Control Plane", icon: Shield },
  { href: "/console/inspector", label: "Inspector", icon: Search },
  { href: "/console/usage", label: "Usage & Metrics", icon: BarChart3 },
  { href: "/console/performance", label: "Performance", icon: Activity },
  { href: "/console/insights", label: "AI Insights", icon: Sparkles },
  { href: "/console/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/console/billing", label: "Billing & Plan", icon: CreditCard },
  { href: "/console/receipts", label: "Receipts", icon: Receipt },
  { href: "/console/feature-flags", label: "Feature Flags", icon: ToggleLeft },
  { href: "/console/site", label: "Site Designer", icon: Palette },
  { href: "/console/docs", label: "Docs & Examples", icon: BookOpen },
];

const adminNavItems = [
  {
    href: "/console/admin/tenants",
    label: "Tenant Observability",
    icon: Building2,
    adminOnly: true,
  },
];

interface ConsoleLayoutProps {
  children: React.ReactNode;
}

export function ConsoleLayout({ children }: ConsoleLayoutProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Check if user is super admin
    fetch("/api/console/user-role")
      .then((res) => res.json())
      .then((data) => {
        setIsSuperAdmin(data.role === "SUPER_ADMIN" || data.isSuperAdmin === true);
      })
      .catch(() => {
        setIsSuperAdmin(false);
      });
  }, []);

  const NavContent = () => (
    <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-8rem)] scrollbar-thin">
      <div className="px-3 py-2 mb-2">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Console
        </h3>
      </div>
      {consoleNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-electric-cyan/10 text-electric-cyan dark:bg-electric-cyan/20 dark:text-electric-cyan shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:translate-x-0.5"
            )}
          >
            <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
            {item.label}
            {isActive && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-electric-cyan animate-pulse" />
            )}
          </Link>
        );
      })}

      {/* Admin Section */}
      {isSuperAdmin && (
        <>
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="px-3 py-2 mt-2 mb-1">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Administration
              </h3>
            </div>
          </div>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-electric-cyan/10 text-electric-cyan dark:bg-electric-cyan/20 dark:text-electric-cyan shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:translate-x-0.5"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-electric-cyan animate-pulse" />
                )}
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      {/* Mobile Trigger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shadow-md bg-background/80 backdrop-blur-sm border-2"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Console Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 pt-12">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-electric-cyan/5 to-transparent">
              <BackendHealthBadge />
            </div>
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 min-h-screen bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-700 fixed left-0 top-0 pt-16 shadow-lg z-30 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-electric-cyan/5 to-transparent">
              <BackendHealthBadge />
            </div>
            <div className="flex-1 overflow-hidden">
              <NavContent />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
