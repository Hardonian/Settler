/**
 * Admin Layout
 *
 * CRITICAL: All admin routes require super admin authentication.
 * Unauthenticated users are redirected to sign-in.
 * Non-admin users are shown access denied.
 */

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Flag,
  Palette,
  Paintbrush,
  FlaskConical,
  BarChart3,
  Activity,
  AlertTriangle,
  PlayCircle,
  FileSearch,
  Workflow,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { redirect } from "next/navigation";
import { AdminErrorBoundary } from "@/components/admin/error-boundary";
import { MobileMenu } from "@/components/admin/mobile-menu";
import { SkipLinks } from "@/components/admin/accessibility-skip-links";
import { OperationalRouteNotice } from "@/components/shared/OperationalRouteNotice";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  [key: string]: unknown;
}

const adminNavSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/ops", label: "Ops Console", icon: Activity },
      { href: "/admin/exceptions", label: "Exceptions", icon: AlertTriangle },
      { href: "/admin/runs", label: "Runs", icon: PlayCircle },
      { href: "/admin/jobforge", label: "JobForge", icon: Workflow },
      { href: "/admin/audit", label: "Audit Trail", icon: FileSearch },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/operator-customization", label: "Customization", icon: Paintbrush },
      { href: "/admin/branding", label: "Branding", icon: Palette },
      { href: "/admin/flags", label: "Feature Flags", icon: Flag },
      { href: "/admin/pages", label: "Pages", icon: FileText },
      { href: "/admin/experiments", label: "Experiments", icon: FlaskConical },
      { href: "/admin/webhooks", label: "Webhooks", icon: Webhook },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { href: "/admin/monitoring", label: "Monitoring", icon: Activity },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];

function AdminNavItem({ href, label, icon: Icon }: NavItem) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
        "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      aria-label={label}
    >
      <Icon size={15} className="shrink-0 text-muted-foreground/70" aria-hidden="true" />
      {label}
    </Link>
  );
}

function AdminNavContent() {
  return (
    <>
      {adminNavSections.map((section, idx) => (
        <div key={section.label} className={cn("space-y-0.5", idx > 0 && "mt-5 pt-5 border-t border-border/60")}>
          <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            {section.label}
          </p>
          {section.items.map((item) => (
            <AdminNavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </div>
      ))}
    </>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // CRITICAL: Server-side super admin gate with error handling
  try {
    const isAdmin = await isSuperAdmin();

    if (!isAdmin) {
      // Redirect to sign-in if not authenticated, or show access denied
      redirect("/login?next=" + encodeURIComponent("/admin"));
    }
  } catch {
    // Redirect to sign-in on error - fail secure
    redirect("/login?next=" + encodeURIComponent("/admin"));
  }

  return (
    <AdminErrorBoundary>
      <SkipLinks />
      <div className="flex h-screen bg-background">
        {/* Mobile Menu */}
        <MobileMenu>
          <AdminNavContent />
        </MobileMenu>

        {/* Sidebar - Desktop Only */}
        <aside className="hidden lg:flex w-60 border-r border-border bg-card/80 backdrop-blur-sm flex-col fixed h-full z-10">
          {/* Sidebar header */}
          <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
              S
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Settler Admin</p>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">
                Control Plane
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav
            id="admin-navigation"
            className="flex-1 overflow-y-auto p-3"
            aria-label="Admin navigation"
          >
            <AdminNavContent />
          </nav>

          {/* Footer */}
          <div className="border-t border-border/60 p-3">
            <div className="flex items-center gap-2 rounded-md px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success flex-shrink-0" aria-hidden="true" />
              <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide">
                Tenant: default
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-60 overflow-auto" role="main" id="main-content">
          <div className="p-4">
            <OperationalRouteNotice />
          </div>
          {children}
        </main>
      </div>
    </AdminErrorBoundary>
  );
}
