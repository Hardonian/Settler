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
  ScanSearch,
  Database,
  FileText,
  Building2,
  ShieldCheck,
  ClipboardCheck,
  Scale,
  Settings,
  Gavel,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BackendHealthBadge } from "./BackendHealthBadge";

const consoleNavSections = [
  {
    label: "Operations",
    items: [
      { href: "/console", label: "Dashboard", icon: LayoutDashboard },
      { href: "/console/reconciliations", label: "Reconciliations", icon: Scale },
      { href: "/console/audits", label: "Audits", icon: ClipboardCheck },
      { href: "/console/proof-explorer", label: "Proof Explorer", icon: ShieldCheck },
      { href: "/console/policies", label: "Policies", icon: Shield },
      { href: "/console/control-plane", label: "Control Plane", icon: Shield },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/console/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/console/insights", label: "AI Insights", icon: Sparkles },
      { href: "/console/activity", label: "Activity Feed", icon: Activity },
      { href: "/console/usage", label: "Usage & Metrics", icon: BarChart3 },
      { href: "/console/performance", label: "Performance", icon: Zap },
      { href: "/console/diagnostics", label: "Diagnostics", icon: ScanSearch },
    ],
  },
  {
    label: "Developer",
    items: [
      { href: "/console/api-keys", label: "API Keys", icon: Key },
      { href: "/console/api-playground", label: "API Playground", icon: Code },
      { href: "/console/api-test", label: "API Test Console", icon: Code },
      { href: "/console/api-logs", label: "API Call Logs", icon: FileText },
      { href: "/console/tables", label: "Service Tables", icon: Database },
      { href: "/console/webhooks", label: "Webhooks", icon: Webhook },
      { href: "/console/workflows", label: "Workflows", icon: Zap },
      { href: "/console/docs", label: "Docs & Examples", icon: BookOpen },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/console/organizations", label: "Organizations", icon: Building2 },
      { href: "/console/billing", label: "Billing & Plan", icon: CreditCard },
      { href: "/console/receipts", label: "Receipts", icon: Receipt },
      { href: "/console/feature-flags", label: "Feature Flags", icon: ToggleLeft },
      { href: "/console/settings", label: "Settings", icon: Settings },
      { href: "/console/inspector", label: "Inspector", icon: Search },
      { href: "/console/setup-check", label: "Setup Check", icon: ClipboardCheck },
      { href: "/console/site", label: "Site Designer", icon: Palette },
    ],
  },
];

const enterpriseNavItems = [
  { href: "/console/replay", label: "Replay Lab", icon: ScanSearch },
  { href: "/console/audit-trail", label: "Audit Trail", icon: ShieldCheck },
  { href: "/console/bulk-operations", label: "Bulk Operations", icon: ClipboardCheck },
  { href: "/console/approvals", label: "Approvals", icon: Gavel },
  { href: "/console/rules-engine", label: "Rules Engine", icon: Shield },
  { href: "/console/operator", label: "Operator Console", icon: Bot },
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

  const NavLink = ({
    item,
  }: {
    item: { href: string; label: string; icon: typeof LayoutDashboard };
  }) => {
    const Icon = item.icon;
    const isActive =
      pathname === item.href || (item.href !== "/console" && pathname?.startsWith(item.href + "/"));

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-[var(--sidebar-item-radius)] text-sm font-medium",
          "transition-colors duration-150",
          "motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          isActive
            ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const NavContent = () => (
    <nav
      className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]"
      aria-label="Console navigation"
    >
      {consoleNavSections.map((section, idx) => (
        <div key={section.label} className={cn(idx > 0 && "pt-4 mt-3 border-t border-border")}>
          <h3 className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {section.label}
          </h3>
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>
      ))}

      {/* Enterprise section */}
      <div className="pt-4 mt-3 border-t border-border">
        <div className="px-3 py-1.5 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Enterprise
          </h3>
          <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary-light text-primary">
            Premium
          </span>
        </div>
        <div className="space-y-0.5">
          {enterpriseNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </div>

      {/* Admin Section */}
      {isSuperAdmin && (
        <div className="pt-4 mt-3 border-t border-border">
          <h3 className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Administration
          </h3>
          <div className="space-y-0.5">
            {adminNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Trigger */}
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
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-[var(--sidebar-width)] min-h-screen bg-card border-r border-border fixed left-0 top-0 pt-16 z-30 flex-col">
          <div className="p-4 border-b border-border">
            <BackendHealthBadge />
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavContent />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-[var(--sidebar-width)] pt-16" id="main-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
