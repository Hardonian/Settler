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
  Menu,
  Sparkles,
  ScanSearch,
  Webhook,
  Zap,
  Shield,
  Scale,
  Settings,
  Building2,
  ShieldCheck,
  ClipboardCheck,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BackendHealthBadge } from "./BackendHealthBadge";
import { CONSOLE_ROUTE_REGISTRY, type ConsoleRouteEntry } from "@/lib/console/route-maturity";
import { OperationalRouteNotice } from "@/components/shared/OperationalRouteNotice";

const navSectionOrder = [
  "Operations",
  "Intelligence",
  "Developer",
  "Settings",
  "Enterprise",
  "Administration",
] as const;

const labelToIcon: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Reconciliations: Scale,
  Audits: ClipboardCheck,
  "Proof Explorer": ShieldCheck,
  Policies: Shield,
  "Control Plane": Shield,
  Analytics: BarChart3,
  "AI Insights": Sparkles,
  Diagnostics: ScanSearch,
  "API Keys": Key,
  Webhooks: Webhook,
  Workflows: Zap,
  "Billing & Plan": CreditCard,
  Settings,
  "Site Designer": Building2,
  "Replay Lab": ScanSearch,
  "Audit Trail": ShieldCheck,
  "Operator Console": Bot,
  "Tenant Observability": Building2,
};

function maturityBadge(entry: ConsoleRouteEntry) {
  if (entry.maturity === "thin") return <Badge variant="outline">Thin</Badge>;
  if (entry.maturity === "admin-only") return <Badge variant="secondary">Admin</Badge>;
  if (entry.maturity.startsWith("runtime-degraded"))
    return <Badge variant="outline">Partial</Badge>;
  return null;
}

interface ConsoleLayoutProps {
  children: React.ReactNode;
}

export function ConsoleLayout({ children }: ConsoleLayoutProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/console/user-role")
      .then((res) => res.json())
      .then((data) => {
        setIsSuperAdmin(data.role === "SUPER_ADMIN" || data.isSuperAdmin === true);
      })
      .catch(() => {
        setIsSuperAdmin(false);
      });
  }, []);

  const navSections = navSectionOrder
    .map((section) => {
      const items = CONSOLE_ROUTE_REGISTRY.filter((item) => item.section === section).filter(
        (item) => {
          if (item.roleRestriction === "super-admin") {
            return isSuperAdmin;
          }
          return true;
        }
      );

      return { section, items };
    })
    .filter((section) => section.items.length > 0);

  const NavLink = ({ item }: { item: ConsoleRouteEntry }) => {
    const Icon = labelToIcon[item.label] ?? LayoutDashboard;
    const isActive =
      pathname === item.href || (item.href !== "/console" && pathname?.startsWith(item.href + "/"));

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center justify-between gap-3 px-3 py-2 rounded-[var(--sidebar-item-radius)] text-sm font-medium",
          "transition-colors duration-150",
          "motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          isActive
            ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{item.label}</span>
        </span>
        {maturityBadge(item)}
      </Link>
    );
  };

  const NavContent = () => (
    <nav
      className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]"
      aria-label="Console navigation"
    >
      {navSections.map(({ section, items }, idx) => (
        <div key={section} className={cn(idx > 0 && "pt-4 mt-3 border-t border-border")}>
          <h3 className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {section}
          </h3>
          <div className="space-y-0.5">
            {items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="md:hidden fixed top-20 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shadow-md bg-background/90 backdrop-blur-sm"
              aria-label="Open console menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 pt-12">
            <div className="p-4 border-b border-border">
              <BackendHealthBadge />
            </div>
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex">
        <aside className="hidden md:flex w-[var(--sidebar-width)] min-h-screen bg-card border-r border-border fixed left-0 top-0 pt-16 z-30 flex-col">
          <div className="p-4 border-b border-border">
            <BackendHealthBadge />
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavContent />
          </div>
        </aside>

        <main className="flex-1 md:ml-[var(--sidebar-width)] pt-16" id="main-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <OperationalRouteNotice />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
