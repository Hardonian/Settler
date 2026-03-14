/**
 * Admin Layout
 *
 * CRITICAL: All admin routes require super admin authentication.
 * Unauthenticated users are redirected to sign-in.
 * Non-admin users are shown access denied.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Flag,
  Palette,
  FlaskConical,
  BarChart3,
  Activity,
  AlertTriangle,
  PlayCircle,
  FileSearch,
  Workflow,
} from "lucide-react";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { redirect } from "next/navigation";
import { AdminErrorBoundary } from "@/components/admin/error-boundary";
import { MobileMenu } from "@/components/admin/mobile-menu";
import { SkipLinks } from "@/components/admin/accessibility-skip-links";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const adminNavSections = [
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
      { href: "/admin/branding", label: "Branding", icon: Palette },
      { href: "/admin/flags", label: "Feature Flags", icon: Flag },
      { href: "/admin/pages", label: "Pages", icon: FileText },
      { href: "/admin/experiments", label: "Experiments", icon: FlaskConical },
      { href: "/admin/webhooks", label: "Webhooks", icon: FlaskConical },
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

function AdminNavContent() {
  return (
    <>
      {adminNavSections.map((section, idx) => (
        <div key={section.label} className={idx > 0 ? "mt-4 pt-4 border-t border-border" : ""}>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
            {section.label}
          </div>
          {section.items.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                aria-label={item.label}
              >
                <item.icon size={16} aria-hidden="true" />
                {item.label}
              </Button>
            </Link>
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
      redirect("/signup?next=" + encodeURIComponent("/admin"));
    }
  } catch {
    // Log error but don't expose internal details
    // Error handling is done in isSuperAdmin function
    // Redirect to sign-in on error - fail secure
    redirect("/signup?next=" + encodeURIComponent("/admin"));
  }

  return (
    <AdminErrorBoundary>
      <SkipLinks />
      <div className="flex h-screen bg-background-light dark:bg-background">
        {/* Mobile Menu */}
        <MobileMenu>
          <AdminNavContent />
        </MobileMenu>

        {/* Sidebar - Desktop Only */}
        <aside className="hidden lg:flex w-64 border-r border-border bg-card dark:bg-card flex-col fixed h-full z-10">
          <div className="p-5 border-b border-border">
            <Link href="/admin" className="flex items-center gap-2.5 font-bold text-lg text-foreground">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-sm font-bold">
                S
              </div>
              Settler Admin
            </Link>
          </div>

          <nav
            id="admin-navigation"
            className="flex-1 p-3 space-y-1 overflow-y-auto"
            aria-label="Admin navigation"
          >
            <AdminNavContent />
          </nav>

          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground font-medium">Tenant: default</div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 overflow-auto" role="main" id="main-content">
          {children}
        </main>
      </div>
    </AdminErrorBoundary>
  );
}
